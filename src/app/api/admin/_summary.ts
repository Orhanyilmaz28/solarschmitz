import type { SyncResult } from "@/lib/suppliers/sync";

/** Antwort für Import und Sync: Zusammenfassung plus begrenzte Vorschau-Zeilen */
export function summarizeSync(result: SyncResult, maxRows = 500) {
  return {
    supplierId: result.supplierId,
    dryRun: result.dryRun,
    source: result.source,
    status: result.log.status,
    message: result.log.message,
    counts: result.counts,
    errors: result.errors.slice(0, 100),
    removed: result.removed.map((p) => ({ id: p.id, name: p.name })),
    rows: result.rows.slice(0, maxRows).map((r) => ({
      row: r.row,
      supplierSku: r.supplierSku,
      name: r.name,
      status: r.status,
      change: r.change,
      changedFields: r.changedFields,
      category: r.product?.category,
      costPrice: r.product?.supplier.costPrice,
      price: r.product?.price ?? r.price?.price,
      marginEUR: r.price?.marginEUR ?? null,
      priceFlags: r.price?.flags ?? [],
      vatRate: r.product?.vatRate,
      stock: r.product?.stock,
      specs: r.product?.specs,
      issues: r.issues,
    })),
    truncated: result.rows.length > maxRows,
    logId: result.log.id,
  };
}

export type SyncSummary = ReturnType<typeof summarizeSync>;
