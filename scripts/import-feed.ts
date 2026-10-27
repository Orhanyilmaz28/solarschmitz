/**
 * Lieferanten-Feed importieren.
 *
 *   npm run import:feed -- --supplier demo-feed --file data/supplier-feeds/demo-feed.csv
 *   npm run import:feed -- --supplier demo-feed --file data/supplier-feeds/demo-feed.xml --commit
 *   npm run import:feed -- --supplier eforu --fetch            (Katalog direkt beim Lieferanten abrufen)
 *
 * Optionen: --format csv|xml|json, --record-path katalog.artikel, --commit, --remove-missing
 * Ohne --commit wird nur eine Vorschau angezeigt. Gespeichert wird im aktiven Store
 * (Standard: data/runtime/, siehe src/lib/store).
 *
 * Läuft mit `node --experimental-strip-types`. Ein kleiner Lade-Hook löst die
 * "@/"-Pfade und Importe ohne Dateiendung auf, wie es Next.js und Vitest tun.
 */
import { readFile } from "node:fs/promises";
import { register } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const hook = `
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
let root;
export function initialize(data) { root = data.root; }
const candidates = [".ts", ".tsx", "/index.ts", "/index.tsx"];
export async function resolve(specifier, context, next) {
  let target = null;
  if (specifier.startsWith("@/")) target = new URL("src/" + specifier.slice(2), root);
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL && context.parentURL.startsWith("file:") && !/\\.(c|m)?(j|t)sx?$|\\.json$/.test(specifier)) {
    target = new URL(specifier, context.parentURL);
  }
  if (target) {
    for (const ext of candidates) {
      const url = new URL(target.href + ext);
      if (existsSync(fileURLToPath(url))) return { url: url.href, shortCircuit: true };
    }
  }
  return next(specifier, context);
}
`;

const root = pathToFileURL(path.resolve(import.meta.dirname, "..") + path.sep).href;
register(`data:text/javascript,${encodeURIComponent(hook)}`, { data: { root } });

const { values } = parseArgs({
  options: {
    supplier: { type: "string", default: "demo-feed" },
    file: { type: "string" },
    fetch: { type: "boolean", default: false },
    format: { type: "string" },
    "record-path": { type: "string" },
    commit: { type: "boolean", default: false },
    "remove-missing": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (values.help || (!values.file && !values.fetch)) {
  console.log("Aufruf: npm run import:feed -- --supplier <id> (--file <pfad> | --fetch) [--format csv|xml|json] [--record-path a.b] [--commit] [--remove-missing]");
  process.exit(values.help ? 0 : 1);
}

const { getSupplierAdapter, getSupplierConfig } = await import("../src/lib/suppliers/registry");
const { importFeedText, runSupplierSync } = await import("../src/lib/suppliers/sync");
const { getStore } = await import("../src/lib/store");

const config = getSupplierConfig(values.supplier!);
if (!config) {
  console.error(`Unbekannter Lieferant: ${values.supplier}`);
  process.exit(1);
}

const opts = { dryRun: !values.commit, removeMissing: values["remove-missing"] };
const store = getStore();
const result = values.fetch
  ? await runSupplierSync(getSupplierAdapter(config.id)!, store, opts)
  : await importFeedText(await readFile(path.resolve(values.file!), "utf8"), config, store, {
      ...opts,
      format: values.format as "csv" | "xml" | "json" | undefined,
      recordPath: values["record-path"],
      source: `CLI: ${path.basename(values.file!)}`,
    });

const eur = (n?: number | null) => (typeof n === "number" ? n.toLocaleString("de-DE", { style: "currency", currency: "EUR" }) : "–");
console.log(`\n${config.name} · ${result.source} · ${result.dryRun ? "VORSCHAU (nichts gespeichert)" : "ÜBERNOMMEN"}`);
console.table(
  result.rows.map((r) => ({
    Zeile: r.row,
    Artikel: r.supplierSku ?? "–",
    Name: (r.name ?? "–").slice(0, 40),
    Kategorie: r.product?.category ?? "–",
    EK: eur(r.product?.supplier.costPrice),
    VK: eur(r.product?.price),
    Bestand: r.product?.stock.status ?? "–",
    Änderung: r.change ?? "FEHLER",
  })),
);
const c = result.counts;
console.log(`Datensätze ${c.received} · gültig ${c.valid} · fehlerhaft ${c.invalid} · neu ${c.created} · geändert ${c.updated} · unverändert ${c.unchanged} · entfernt ${c.removed}`);
if (result.errors.length) {
  console.log("\nHinweise:");
  for (const e of result.errors.slice(0, 30)) console.log(`  - ${e}`);
}
if (result.dryRun) console.log("\nMit --commit übernehmen.");
process.exit(result.log.status === "failed" ? 1 : 0);
