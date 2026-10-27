import type { Product, ProductSpecs } from "@/lib/catalog/types";
import { formatInt, formatKWh, formatWp } from "@/lib/format";
import { getCategory } from "@/data/categories";

export interface SpecRow {
  key: string;
  label: string;
  /** Wert als Text oder null, wenn nicht angegeben */
  value: (p: Product) => string | null;
  /** Zahlenwert für "besser"-Vergleich (höher = besser) */
  numeric?: (p: Product) => number | undefined;
}

const spec = <K extends keyof ProductSpecs>(k: K) => (p: Product) => p.specs[k];

const locationLabels: Record<string, string> = {
  balkon: "Balkon",
  flachdach: "Flachdach",
  schraegdach: "Schrägdach",
  garten: "Garten",
};

/** Technische Daten in fester Reihenfolge, mit Einheiten */
export const specRows: SpecRow[] = [
  { key: "moduleCount", label: "Anzahl Module", value: (p) => (p.specs.moduleCount ? formatInt(p.specs.moduleCount) : null) },
  { key: "moduleWp", label: "Leistung je Modul", value: (p) => (p.specs.moduleWp ? formatWp(p.specs.moduleWp) : null), numeric: spec("moduleWp") },
  { key: "totalWp", label: "Modulleistung gesamt", value: (p) => (p.specs.totalWp ? formatWp(p.specs.totalWp) : null), numeric: spec("totalWp") },
  { key: "inverterW", label: "Wechselrichter / Ausgang", value: (p) => (p.specs.inverterW ? `${formatInt(p.specs.inverterW)} W` : null) },
  { key: "storageKWh", label: "Speicherkapazität", value: (p) => (p.specs.storageKWh ? formatKWh(p.specs.storageKWh) : null), numeric: spec("storageKWh") },
  { key: "storageMaxKWh", label: "Erweiterbar bis", value: (p) => (p.specs.storageMaxKWh ? formatKWh(p.specs.storageMaxKWh) : null), numeric: spec("storageMaxKWh") },
  { key: "moduleType", label: "Modultyp", value: (p) => p.specs.moduleType ?? null },
  { key: "cellType", label: "Zelltyp", value: (p) => p.specs.cellType ?? null },
  { key: "mppt", label: "MPP-Tracker", value: (p) => (p.specs.mppt ? formatInt(p.specs.mppt) : null), numeric: spec("mppt") },
  { key: "connectivity", label: "Verbindung", value: (p) => p.specs.connectivity ?? null },
  { key: "tiltRange", label: "Neigungswinkel", value: (p) => p.specs.tiltRange ?? null },
  { key: "maxLengthMm", label: "Max. Modulbreite", value: (p) => (p.specs.maxLengthMm ? `${formatInt(p.specs.maxLengthMm)} mm` : null) },
  { key: "compatibleWith", label: "Kompatibel mit", value: (p) => p.specs.compatibleWith ?? null },
];

/** Allgemeine Zeilen, die für jedes Produkt existieren */
export const baseRows: SpecRow[] = [
  { key: "brand", label: "Hersteller", value: (p) => p.brand },
  { key: "category", label: "Kategorie", value: (p) => getCategory(p.category)?.name ?? null },
  {
    key: "suitableFor",
    label: "Geeignet für",
    value: (p) => (p.suitableFor.length ? p.suitableFor.map((s) => locationLabels[s] ?? s).join(", ") : null),
  },
  { key: "vatRate", label: "Mehrwertsteuer", value: (p) => `${p.vatRate} %` },
];

export function rowsFor(p: Product): { label: string; value: string }[] {
  return [...specRows, ...baseRows]
    .map((r) => ({ label: r.label, value: r.value(p) }))
    .filter((r): r is { label: string; value: string } => r.value !== null);
}

export { locationLabels };

// ---------- Gruppierte technische Daten (Produktseite) ----------

export interface SpecGroup {
  title: string;
  rows: { label: string; value: string }[];
}

const groupDefs: { title: string; keys: string[] }[] = [
  { title: "Leistung", keys: ["moduleCount", "moduleWp", "totalWp", "inverterW", "mppt"] },
  { title: "Speicher", keys: ["storageKWh", "storageMaxKWh"] },
  { title: "Module & Montage", keys: ["moduleType", "cellType", "tiltRange", "maxLengthMm"] },
  { title: "Anschluss & Steuerung", keys: ["connectivity", "compatibleWith"] },
];

/** Technische Daten in Gruppen, nur mit vorhandenen Werten, plus allgemeine Angaben */
export function specGroups(p: Product): SpecGroup[] {
  const byKey = new Map(specRows.map((r) => [r.key, r]));
  const groups: SpecGroup[] = groupDefs
    .map((g) => ({
      title: g.title,
      rows: g.keys
        .map((k) => byKey.get(k))
        .filter((r): r is SpecRow => r !== undefined)
        .map((r) => ({ label: r.label, value: r.value(p) }))
        .filter((r): r is { label: string; value: string } => r.value !== null),
    }))
    .filter((g) => g.rows.length > 0);
  const general = [
    { label: "Hersteller / Marke", value: p.brand },
    { label: "Kategorie", value: getCategory(p.category)?.name ?? null },
    { label: "Geeignet für", value: p.suitableFor.length ? p.suitableFor.map((s) => locationLabels[s] ?? s).join(", ") : null },
    { label: "Umsatzsteuer", value: p.vatRate === 0 ? "0\u00a0% (Nullsteuersatz, §\u00a012 Abs.\u00a03\u00a0UStG)" : "19\u00a0%" },
    { label: "Artikelnummer", value: p.sku },
  ].filter((r): r is { label: string; value: string } => r.value !== null);
  return [...groups, { title: "Allgemein", rows: general }];
}

// ---------- Kurzdaten ----------

/** Wichtigste technische Werte, kurz und mit Einheit (für Kacheln und Variantenwahl) */
export function keySpecs(p: Product, limit = 3): string[] {
  const s = p.specs;
  const out: string[] = [];
  if (s.moduleCount && s.moduleWp && s.moduleCount > 1) out.push(`${s.moduleCount} × ${formatInt(s.moduleWp)} Wp`);
  else if (s.totalWp) out.push(formatWp(s.totalWp));
  if (s.inverterW) out.push(`${formatInt(s.inverterW)} W`);
  if (s.storageKWh) out.push(formatKWh(s.storageKWh));
  if (s.storageMaxKWh) out.push(`bis ${formatKWh(s.storageMaxKWh)}`);
  if (s.mppt) out.push(`${s.mppt} MPPT`);
  if (s.tiltRange) out.push(s.tiltRange);
  if (!out.length && s.connectivity) out.push(s.connectivity);
  return out.slice(0, limit);
}

/** Kurzdaten je Variante: was alle gemeinsam haben, plus was sie unterscheidet */
export function variantSpecs(variants: Product[]): Map<string, string> {
  const all = variants.map((v) => ({ id: v.id, specs: keySpecs(v, 5) }));
  const shared = all[0]?.specs.filter((s) => all.every((o) => o.specs.includes(s))) ?? [];
  return new Map(
    all.map(({ id, specs }) => {
      const diff = specs.filter((s) => !shared.includes(s));
      const line = (diff.length ? [shared[0], ...diff] : specs).filter((s): s is string => Boolean(s)).slice(0, 2);
      return [id, line.join(" · ")];
    }),
  );
}
