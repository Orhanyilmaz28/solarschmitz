import { categorySlugs, type CategorySlug, type ProductSpecs } from "@/lib/catalog/types";
import { normalizeStock } from "./stock";
import type { FieldMapping, MappableField, MappedRow, RawRecord, RowIssue, SupplierConfig, SupplierItem } from "./types";
import { parseInteger, parseModuleSpec, parsePrice, parseQuantity, parseVatRate } from "./units";

/** Spaltennamen vergleichbar machen: klein, ohne Leer- und Sonderzeichen */
function keyOf(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}

/** Wert einer Spalte lesen; mehrere mögliche Spaltennamen werden der Reihe nach probiert. */
export function readField(record: RawRecord, mapping: FieldMapping, field: MappableField): unknown {
  const names = mapping[field];
  if (!names) return undefined;
  const wanted = (Array.isArray(names) ? names : [names]).map(keyOf);
  for (const [col, value] of Object.entries(record)) {
    if (wanted.includes(keyOf(col)) && value !== "" && value !== null && value !== undefined) return value;
  }
  return undefined;
}

function str(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}

const categoryKeywords: [RegExp, CategorySlug][] = [
  [/balkon.*speicher|speicher.*balkon|set.*speicher|komplettset.*speicher/, "balkonkraftwerke-mit-speicher"],
  [/balkonkraftwerk|komplettset|steckersolar|mini.?pv/, "balkonkraftwerke"],
  [/speicher|batterie|akku|solarbank/, "batteriespeicher"],
  [/wechselrichter|inverter/, "wechselrichter"],
  [/halterung|montage|aufstaenderung|aufständerung|zubehoer|zubehör|kabel|zaehler|zähler|meter|stecker|plug/, "montage-zubehoer"],
  [/modul|panel/, "solarmodule"],
];

/**
 * Lieferanten-Kategorie auf Shop-Kategorie abbilden.
 * Zuerst die Tabelle aus der Konfiguration, dann Schlüsselwörter in Kategorie und Name.
 */
export function mapCategory(raw: string | undefined, name: string, map: SupplierConfig["categoryMap"]): CategorySlug | undefined {
  const cat = (raw ?? "").toLowerCase();
  if ((categorySlugs as readonly string[]).includes(cat)) return cat as CategorySlug;
  for (const [needle, slug] of Object.entries(map)) {
    if (cat && cat.includes(needle.toLowerCase())) return slug;
  }
  const text = `${cat} ${name.toLowerCase()}`;
  for (const [re, slug] of categoryKeywords) if (re.test(text)) return slug;
  return undefined;
}

/** Eine Feed-Zeile in ein normalisiertes Lieferanten-Produkt übersetzen. */
export function mapRecord(record: RawRecord, config: SupplierConfig, row: number, now = new Date().toISOString()): MappedRow {
  const m = config.mapping;
  const issues: RowIssue[] = [];
  const read = (f: MappableField) => readField(record, m, f);

  const supplierSku = str(read("supplierSku"));
  const name = str(read("name"));
  if (!supplierSku) issues.push({ row, field: "supplierSku", message: "Artikelnummer fehlt" });
  if (!name) issues.push({ row, field: "name", message: "Produktname fehlt" });

  const numberField = (f: MappableField, parse: (v: unknown) => number | null, label: string) => {
    const raw = read(f);
    if (raw === undefined) return undefined;
    const v = parse(raw);
    if (v === null || v < 0) {
      issues.push({ row, field: f, message: `${label} nicht lesbar: "${String(raw)}"` });
      return undefined;
    }
    return v;
  };

  const costPrice = numberField("costPrice", parsePrice, "Einkaufspreis");
  const rrp = numberField("rrp", parsePrice, "UVP");
  if (costPrice === undefined && rrp === undefined) {
    issues.push({ row, field: "costPrice", message: "Weder Einkaufspreis noch UVP vorhanden" });
  }

  const vatRaw = read("vatRate");
  let vatRate: 0 | 19 | undefined;
  if (vatRaw !== undefined) {
    const v = parseVatRate(vatRaw);
    if (v === null) issues.push({ row, field: "vatRate", message: `Steuersatz nicht lesbar: "${String(vatRaw)}"` });
    else vatRate = v;
  }

  const specs: ProductSpecs = {};
  const modules = parseModuleSpec(read("modules"));
  const moduleCount = numberField("moduleCount", parseInteger, "Modulanzahl") ?? modules?.count;
  const moduleWp = numberField("moduleWp", (v) => parseQuantity(v, "W"), "Modulleistung") ?? modules?.each;
  const totalWp = numberField("totalWp", (v) => parseQuantity(v, "W"), "Gesamtleistung");
  const inverterW = numberField("inverterW", (v) => parseQuantity(v, "W"), "Wechselrichterleistung");
  const storageKWh = numberField("storageKWh", (v) => parseQuantity(v, "kWh"), "Speicherkapazität");
  const storageMaxKWh = numberField("storageMaxKWh", (v) => parseQuantity(v, "kWh"), "max. Speicherkapazität");
  if (moduleCount) specs.moduleCount = Math.trunc(moduleCount);
  if (moduleWp) specs.moduleWp = moduleWp;
  if (totalWp) specs.totalWp = totalWp;
  else if (moduleCount && moduleWp) specs.totalWp = Math.trunc(moduleCount) * moduleWp;
  if (inverterW) specs.inverterW = inverterW;
  if (storageKWh) specs.storageKWh = storageKWh;
  if (storageMaxKWh) specs.storageMaxKWh = storageMaxKWh;

  const categoryRaw = str(read("category"));
  const category = name ? mapCategory(categoryRaw, name, config.categoryMap) : undefined;
  if (name && !category) issues.push({ row, field: "category", message: `Kategorie nicht zuordenbar: "${categoryRaw ?? ""}"` });

  if (!supplierSku || !name) return { row, issues };

  const item: SupplierItem = {
    supplierSku,
    name,
    ean: str(read("ean")),
    brand: str(read("brand")),
    category,
    categoryRaw,
    shortDescription: str(read("shortDescription")),
    description: str(read("description")),
    costPrice,
    rrp,
    vatRate,
    stock: normalizeStock(read("stock"), config.lowStockThreshold, now),
    specs,
    imageUrl: safeUrl(str(read("imageUrl"))),
    productUrl: safeUrl(str(read("productUrl"))),
  };
  return { row, item, issues };
}

export function mapRecords(records: RawRecord[], config: SupplierConfig, now?: string): MappedRow[] {
  return records.map((r, i) => mapRecord(r, config, i + 1, now));
}

/** Nur http(s)-Adressen übernehmen */
function safeUrl(v: string | undefined): string | undefined {
  if (!v) return undefined;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}
