import { randomUUID } from "node:crypto";
import type { Product } from "@/lib/catalog/types";
import type { Store, SyncLogEntry } from "@/lib/store/types";
import { errorMessage } from "./errors";
import { mapRecords } from "./mapping";
import { detectFormat, parseFeed } from "./parsers";
import type { PriceResult } from "./pricing";
import { buildProduct, productIdFor } from "./to-product";
import type { FeedFormat, RawRecord, RowIssue, SupplierAdapter, SupplierConfig } from "./types";

export type ChangeKind = "new" | "changed" | "unchanged" | "removed";

export interface PreviewRow {
  row: number;
  supplierSku?: string;
  name?: string;
  status: "ok" | "warning" | "error";
  change?: ChangeKind;
  /** Felder, die sich gegenüber dem Store ändern */
  changedFields?: string[];
  product?: Product;
  price?: PriceResult;
  issues: RowIssue[];
}

export interface SyncResult {
  supplierId: string;
  dryRun: boolean;
  source: string;
  rows: PreviewRow[];
  removed: Product[];
  counts: SyncLogEntry["counts"];
  errors: string[];
  log: SyncLogEntry;
}

/** Felder, deren Änderung als "geändert" zählt */
const trackedFields = ["name", "price", "vatRate", "category", "specs", "stock", "supplier.costPrice", "images", "brand"] as const;

function valueAt(p: Product, field: (typeof trackedFields)[number]): unknown {
  if (field === "supplier.costPrice") return p.supplier.costPrice;
  if (field === "stock") return { status: p.stock.status, quantity: p.stock.quantity };
  return p[field];
}

export function diffProduct(before: Product | undefined, after: Product): { change: ChangeKind; fields: string[] } {
  if (!before) return { change: "new", fields: [] };
  const fields = trackedFields.filter((f) => JSON.stringify(valueAt(before, f)) !== JSON.stringify(valueAt(after, f)));
  return { change: fields.length ? "changed" : "unchanged", fields: [...fields] };
}

export interface SyncOptions {
  dryRun: boolean;
  /** Produkte des Lieferanten, die nicht mehr im Feed stehen, aus dem Store entfernen */
  removeMissing?: boolean;
  now?: string;
}

/**
 * Kern der Synchronisierung: Datensätze → Shop-Produkte → Vergleich → (optional) speichern.
 * Rein bis auf den Store-Zugriff; Datenquelle wird übergeben.
 */
export async function syncRecords(
  records: RawRecord[],
  config: SupplierConfig,
  store: Store,
  opts: SyncOptions & { source: string; parseErrors?: string[] },
): Promise<SyncResult> {
  const startedAt = opts.now ?? new Date().toISOString();
  const existing = await store.products.listBySupplier(config.id);
  const byId = new Map(existing.map((p) => [p.id, p]));

  const rows: PreviewRow[] = [];
  const incoming: Product[] = [];
  const seen = new Set<string>();

  for (const mapped of mapRecords(records, config, startedAt)) {
    const base: PreviewRow = {
      row: mapped.row,
      supplierSku: mapped.item?.supplierSku,
      name: mapped.item?.name,
      status: "ok",
      issues: [...mapped.issues],
    };
    if (!mapped.item) {
      rows.push({ ...base, status: "error" });
      continue;
    }
    const id = productIdFor(config.id, mapped.item.supplierSku);
    if (seen.has(id)) {
      rows.push({ ...base, status: "error", issues: [...base.issues, { row: mapped.row, field: "supplierSku", message: "Artikelnummer doppelt im Feed" }] });
      continue;
    }
    seen.add(id);
    const built = buildProduct(mapped.item, config, mapped.row, byId.get(id));
    const issues = [...base.issues, ...built.issues];
    if (!built.product) {
      rows.push({ ...base, status: "error", price: built.price, issues });
      continue;
    }
    const diff = diffProduct(byId.get(id), built.product);
    incoming.push(built.product);
    rows.push({
      ...base,
      status: issues.length ? "warning" : "ok",
      change: diff.change,
      changedFields: diff.fields,
      product: built.product,
      price: built.price,
      issues,
    });
  }

  const removed = existing.filter((p) => !seen.has(p.id));
  const counts = {
    received: records.length,
    valid: incoming.length,
    invalid: rows.filter((r) => r.status === "error").length,
    created: rows.filter((r) => r.change === "new").length,
    updated: rows.filter((r) => r.change === "changed").length,
    unchanged: rows.filter((r) => r.change === "unchanged").length,
    removed: opts.removeMissing ? removed.length : 0,
  };

  const errors = [
    ...(opts.parseErrors ?? []),
    ...rows.flatMap((r) => r.issues.map((i) => `Zeile ${i.row}${i.field ? ` (${i.field})` : ""}: ${i.message}`)),
  ];

  if (!opts.dryRun) {
    const toWrite = incoming.filter((p) => {
      const r = rows.find((x) => x.product?.id === p.id);
      return r?.change === "new" || r?.change === "changed";
    });
    if (toWrite.length) await store.products.upsertMany(toWrite);
    if (opts.removeMissing && removed.length) await store.products.removeMany(removed.map((p) => p.id));
  }

  const status: SyncLogEntry["status"] =
    counts.valid === 0 && records.length > 0 ? "failed" : counts.invalid > 0 || (opts.parseErrors?.length ?? 0) > 0 ? "partial" : "success";
  const log: SyncLogEntry = {
    id: randomUUID(),
    supplierId: config.id,
    startedAt,
    finishedAt: new Date().toISOString(),
    dryRun: opts.dryRun,
    source: opts.source,
    status,
    counts,
    errors: errors.slice(0, 50),
    message: opts.dryRun
      ? `Vorschau: ${counts.valid} von ${counts.received} Datensätzen gültig.`
      : `${counts.created} neu, ${counts.updated} aktualisiert, ${counts.removed} entfernt.`,
  };
  await store.syncLog.add(log);

  return { supplierId: config.id, dryRun: opts.dryRun, source: opts.source, rows, removed, counts, errors, log };
}

/** Sync über den Adapter des Lieferanten (Feed-URL, API oder Datei) */
export async function runSupplierSync(adapter: SupplierAdapter, store: Store, opts: SyncOptions): Promise<SyncResult> {
  try {
    const fetched = await adapter.fetchCatalog();
    return await syncRecords(fetched.records, adapter.config, store, { ...opts, source: fetched.source });
  } catch (err) {
    return failedResult(adapter.config, store, opts, errorMessage(err), "Lieferanten-Abruf");
  }
}

/** Import aus hochgeladenem oder eingefügtem Text (Admin-Import und CLI) */
export async function importFeedText(
  text: string,
  config: SupplierConfig,
  store: Store,
  opts: SyncOptions & { format?: FeedFormat; recordPath?: string; source?: string },
): Promise<SyncResult> {
  const format = opts.format ?? detectFormat(text);
  let parsed: ReturnType<typeof parseFeed>;
  try {
    parsed = parseFeed(text, format, opts.recordPath);
  } catch (err) {
    return failedResult(config, store, opts, errorMessage(err), opts.source ?? `Upload (${format.toUpperCase()})`);
  }
  if (!parsed.records.length) {
    return failedResult(config, store, opts, parsed.errors.join(" ") || "Keine Datensätze gefunden.", opts.source ?? `Upload (${format.toUpperCase()})`);
  }
  return syncRecords(parsed.records, config, store, {
    ...opts,
    source: opts.source ?? `Upload (${format.toUpperCase()})`,
    parseErrors: parsed.errors,
  });
}

async function failedResult(config: SupplierConfig, store: Store, opts: SyncOptions, message: string, source: string): Promise<SyncResult> {
  const now = new Date().toISOString();
  const counts = { received: 0, valid: 0, invalid: 0, created: 0, updated: 0, unchanged: 0, removed: 0 };
  const log: SyncLogEntry = {
    id: randomUUID(),
    supplierId: config.id,
    startedAt: opts.now ?? now,
    finishedAt: now,
    dryRun: opts.dryRun,
    source,
    status: "failed",
    counts,
    errors: [message],
    message,
  };
  await store.syncLog.add(log);
  return { supplierId: config.id, dryRun: opts.dryRun, source, rows: [], removed: [], counts, errors: [message], log };
}
