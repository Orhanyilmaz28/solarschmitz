import type { Product } from "@/lib/catalog/types";
import { formatInt, formatKWh } from "@/lib/format";

/**
 * Wesentliche Merkmale eines Artikels für die Bestellübersicht (§ 312j Abs. 2 BGB),
 * ausschließlich aus den Produktdaten. Fehlende Angaben werden weggelassen, nicht geschätzt.
 */
export function essentialFeatures(p: Product): string[] {
  const s = p.specs;
  const out: string[] = [];
  if (s.moduleCount && s.moduleWp) out.push(`${formatInt(s.moduleCount)} × ${formatInt(s.moduleWp)} Wp${s.moduleType ? `, ${s.moduleType}` : ""}`);
  else if (s.totalWp) out.push(`${formatInt(s.totalWp)} Wp Modulleistung`);
  else if (s.moduleType) out.push(s.moduleType);
  if (s.inverterW) out.push(`Wechselrichter ${formatInt(s.inverterW)} W`);
  if (s.storageKWh) out.push(`Speicher ${formatKWh(s.storageKWh)}${s.storageMaxKWh ? `, erweiterbar bis ${formatKWh(s.storageMaxKWh)}` : ""}`);
  else if (s.storageMaxKWh) out.push(`erweiterbar bis ${formatKWh(s.storageMaxKWh)}`);
  if (s.cellType) out.push(s.cellType);
  if (s.mppt) out.push(`${formatInt(s.mppt)} MPP-Tracker`);
  if (s.tiltRange) out.push(`Neigung ${s.tiltRange}`);
  if (s.maxLengthMm) out.push(`Modulbreite bis ${formatInt(s.maxLengthMm)} mm`);
  if (s.compatibleWith) out.push(`kompatibel mit ${s.compatibleWith}`);
  if (s.connectivity) out.push(s.connectivity);
  return out;
}

/** Lieferumfang als kurzer Satz, z. B. „2 Solarmodule à 440 Wp, Mikrowechselrichter, Anschlusskabel“ */
export function scopeOfDelivery(p: Product): string | null {
  return p.includes.length ? p.includes.join(", ") : null;
}
