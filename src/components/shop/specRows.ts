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
