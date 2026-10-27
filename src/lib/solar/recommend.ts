import type { InstallLocation, Product } from "@/lib/catalog/types";
import { getAllProducts, hasPrice } from "@/lib/catalog";
import { formatEUR, formatKWh, formatWp } from "@/lib/format";

export type StorageWish = "ja" | "nein" | "offen";
export type ModuleCount = 1 | 2 | 4;
export type PowerWish = "klein" | "mittel" | "gross";

export interface FinderAnswers {
  location: InstallLocation;
  storage: StorageWish;
  modules: ModuleCount;
  power: PowerWish;
  /** Höchstbudget in Euro; null = egal */
  budget: number | null;
}

export const powerRanges: Record<PowerWish, { label: string; min: number; max: number; hint: string }> = {
  klein: { label: "bis 900 Wp", min: 0, max: 900, hint: "Für einen Balkon mit zwei Modulen" },
  mittel: { label: "900–1.500 Wp", min: 900, max: 1500, hint: "Mehr Ertrag morgens und abends" },
  gross: { label: "1.500–2.000 Wp", min: 1500, max: 2000, hint: "Die erlaubten 2.000 Wp ausnutzen" },
};

export interface Recommendation {
  product: Product;
  score: number;
  reasons: string[];
  caveats: string[];
}

const setCategories = new Set(["balkonkraftwerke", "balkonkraftwerke-mit-speicher"]);

/** Bewertet Sets nach den Antworten. Reine Funktion, damit sie testbar bleibt. */
export function recommend(answers: FinderAnswers, products: Product[] = getAllProducts()): Recommendation[] {
  const range = powerRanges[answers.power];
  const scored: Recommendation[] = [];

  for (const p of products) {
    if (!setCategories.has(p.category)) continue;
    if (!p.suitableFor.includes(answers.location)) continue;
    const reasons: string[] = [];
    const caveats: string[] = [];
    let score = 0;
    const wp = p.specs.totalWp ?? 0;
    const storage = p.specs.storageKWh ?? 0;

    // Speicher
    if (answers.storage === "ja") {
      if (storage > 0) {
        score += 4;
        reasons.push(`Mit ${formatKWh(storage)} Speicher für den Abend`);
      } else score -= 6;
    } else if (answers.storage === "nein") {
      if (storage > 0) score -= 3;
      else score += 2;
    } else if (storage > 0) {
      reasons.push(`Optional mit ${formatKWh(storage)} Speicher`);
    }

    // Modulanzahl
    const count = p.specs.moduleCount ?? 0;
    if (count === answers.modules) {
      score += 3;
      reasons.push(`${count} Module, passend zu deinem Platz`);
    } else if (count > answers.modules) {
      score -= 4;
      caveats.push(`Braucht Platz für ${count} Module`);
    } else score += 0.5;

    // Leistung
    if (wp >= range.min && wp <= range.max) {
      score += 2;
      reasons.push(`${formatWp(wp)} im gewünschten Bereich`);
    } else if (wp > 0) score -= 1;

    // Budget
    if (hasPrice(p)) {
      if (answers.budget === null || p.price <= answers.budget) {
        score += answers.budget === null ? 0 : 2;
        if (answers.budget !== null) reasons.push(`Im Budget (${formatEUR(p.price, { round: true })})`);
      } else {
        score -= 3;
        caveats.push(`Über deinem Budget (${formatEUR(p.price, { round: true })})`);
      }
    } else {
      caveats.push("Demo-Produkt: Preis und Verfügbarkeit folgen");
      score -= 1.5;
    }

    if (p.dataStatus === "live") score += 1;
    if (answers.location === "balkon") reasons.unshift("Geeignet für die Balkonmontage");

    scored.push({ product: p, score, reasons, caveats });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

/** Passendes Zubehör zu den Antworten */
export function recommendAccessories(answers: FinderAnswers, products: Product[] = getAllProducts()): Product[] {
  const out: Product[] = [];
  const mount = products.find((p) => p.category === "montage-zubehoer" && p.specs.tiltRange && p.suitableFor.includes(answers.location));
  if (mount && (answers.location === "flachdach" || answers.location === "garten")) out.push(mount);
  if (answers.storage !== "nein") {
    const meter = products.find((p) => p.visual === "meter");
    if (meter) out.push(meter);
  }
  return out;
}

/** Sinnvolle Modulleistung für die Simulation aus den Antworten */
export function targetWp(answers: FinderAnswers): number {
  const byModules = answers.modules * 440;
  const range = powerRanges[answers.power];
  return Math.min(2000, Math.max(range.min || 440, Math.min(range.max, byModules)));
}
