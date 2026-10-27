import type { InstallLocation, Product } from "@/lib/catalog/types";
import { getAllProducts, hasPrice } from "@/lib/catalog";
import { solarAssumptions, type MountingKey } from "@/config/solar-assumptions";
import { formatEUR, formatKWh, formatWp } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Antworten des Konfigurators                                          */
/* ------------------------------------------------------------------ */

/** Ort der Anlage (Schritt 1). „Hausdach“ entspricht der Montageart Schrägdach. */
export type Place = "balkon" | "hausdach" | "flachdach" | "garten";
/** Wunsch nach Unabhängigkeit (Schritt 2) */
export type Independence = "ohne" | "speicher" | "unsicher";
/** Was besonders wichtig ist (Schritt 3) */
export type Priority = "preis" | "leistung" | "eigenversorgung" | "installation";

export interface FinderAnswers {
  place: Place;
  independence: Independence;
  priority: Priority;
}

export const placeToLocation: Record<Place, InstallLocation> = {
  balkon: "balkon",
  hausdach: "schraegdach",
  flachdach: "flachdach",
  garten: "garten",
};

export const placeToMounting: Record<Place, MountingKey> = {
  balkon: "balkon",
  hausdach: "schraegdach",
  flachdach: "flachdach",
  garten: "garten",
};

export const placeLabels: Record<Place, string> = {
  balkon: "Balkon",
  hausdach: "Hausdach",
  flachdach: "Flachdach",
  garten: "Garten",
};

export const independenceLabels: Record<Independence, string> = {
  ohne: "Ohne Speicher",
  speicher: "Mit Batteriespeicher",
  unsicher: "Noch unsicher",
};

export const priorityLabels: Record<Priority, string> = {
  preis: "Niedriger Einstiegspreis",
  leistung: "Hohe Leistung",
  eigenversorgung: "Maximale Eigenversorgung",
  installation: "Einfache Installation",
};

/* ------------------------------------------------------------------ */
/* Empfehlungen                                                         */
/* ------------------------------------------------------------------ */

export interface Recommendation {
  product: Product;
  score: number;
  /** Gründe, warum das Produkt zu den Antworten passt */
  reasons: string[];
  /** Ehrliche Einschränkungen */
  caveats: string[];
}

const SET_CATEGORIES = new Set(["balkonkraftwerke", "balkonkraftwerke-mit-speicher"]);
const { inverterMaxW, moduleMaxWp } = solarAssumptions.plugInLimits;

const placeReason: Record<Place, string> = {
  balkon: "Für die Montage am Balkongeländer geeignet",
  hausdach: "Für die Montage auf dem Hausdach geeignet",
  flachdach: "Mit Aufständerung für Flachdächer geeignet",
  garten: "Für die Aufstellung im Garten geeignet",
};

/** Normiert einen Wert auf 0–1 innerhalb eines Bereichs (gleich große Werte ergeben 1) */
function norm(value: number, min: number, max: number) {
  if (max <= min) return 1;
  return (value - min) / (max - min);
}

const storageOf = (p: Product) => p.specs.storageKWh ?? 0;
const wpOf = (p: Product) => p.specs.totalWp ?? 0;

/** Komplettsets, die am gewählten Ort montiert werden können */
export function candidatesFor(place: Place, products: Product[] = getAllProducts()): Product[] {
  const location = placeToLocation[place];
  return products.filter((p) => SET_CATEGORIES.has(p.category) && p.suitableFor.includes(location));
}

/**
 * Bewertet Komplettsets nach Ort, Unabhängigkeit und Priorität.
 * Reine Funktion: gleiche Eingaben ergeben immer dasselbe Ergebnis.
 */
export function recommend(answers: FinderAnswers, products: Product[] = getAllProducts()): Recommendation[] {
  const pool = candidatesFor(answers.place, products);
  if (!pool.length) return [];

  const priced = pool.filter(hasPrice);
  const prices = priced.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const wps = pool.map(wpOf);
  const minWp = Math.min(...wps);
  const maxWp = Math.max(...wps);
  const maxStorage = Math.max(0, ...pool.map(storageOf));

  const scored = pool.map((p): Recommendation => {
    const reasons: string[] = [placeReason[answers.place]];
    const caveats: string[] = [];
    let score = 0;
    const storage = storageOf(p);
    const wp = wpOf(p);

    // Unabhängigkeit
    if (answers.independence === "speicher") {
      if (storage > 0) {
        score += 6;
        reasons.push(`Mit ${formatKWh(storage)} Speicher für den Abend`);
      } else {
        score -= 8;
        caveats.push("Ohne Speicher – lässt sich später nachrüsten");
      }
    } else if (answers.independence === "ohne") {
      if (storage > 0) {
        score -= 6;
        caveats.push(`Enthält einen Speicher (${formatKWh(storage)}), das kostet mehr`);
      } else {
        score += 4;
        reasons.push("Ohne Speicher: einfacher und günstiger Einstieg");
      }
    } else {
      reasons.push(storage > 0 ? `Mit ${formatKWh(storage)} Speicher für den Abend` : "Ohne Speicher – lässt sich später nachrüsten");
    }

    // Priorität
    switch (answers.priority) {
      case "preis":
        if (hasPrice(p)) {
          score += 6 * (1 - norm(p.price, minPrice, maxPrice));
          if (p.price === minPrice) reasons.push(`Günstigster Einstieg in dieser Auswahl (${formatEUR(p.price, { round: true })})`);
        }
        break;
      case "leistung":
        score += 6 * norm(wp, minWp, maxWp);
        if (wp === maxWp && wp > 0) reasons.push(`${formatWp(wp)} Modulleistung – die höchste in dieser Auswahl`);
        break;
      case "eigenversorgung":
        score += maxStorage > 0 ? 6 * (storage / maxStorage) : 0;
        score += storage > 0 ? 2 : 0;
        if (storage > 0 && storage === maxStorage) reasons.push(`Größter Speicher in dieser Auswahl (${formatKWh(storage)})`);
        if (storage === 0) caveats.push("Ohne Speicher deckst du vor allem den Verbrauch am Tag");
        break;
      case "installation":
        if ((p.specs.moduleCount ?? 0) <= 2) {
          score += 4;
          reasons.push("Nur zwei Module – schnell montiert");
        } else {
          score += 1;
          caveats.push(`${p.specs.moduleCount} Module brauchen mehr Platz und Montagezeit`);
        }
        score += 2;
        reasons.push("Komplettset mit Wechselrichter und Kabel, steckerfertig");
        if (answers.place === "hausdach") caveats.push("Auf dem Dach sollte ein Fachbetrieb montieren");
        break;
    }

    // Rechtlicher Rahmen für Steckersolargeräte (aus den Produktdaten abgeleitet)
    const inverter = p.specs.inverterW ?? 0;
    if (inverter > 0 && inverter <= inverterMaxW && wp > 0 && wp <= moduleMaxWp) {
      reasons.push(`Im Rahmen für Steckersolar: ${inverter} W Einspeisung, ${formatWp(wp)}`);
    }

    // Datenlage
    if (p.dataStatus === "live") score += 1;
    if (p.dataStatus === "demo" || !hasPrice(p)) {
      score -= 2;
      caveats.push("Demo-Produkt: Preis und Verfügbarkeit folgen");
    }

    return { product: p, score, reasons: unique(reasons), caveats: unique(caveats) };
  });

  scored.sort((a, b) => b.score - a.score || compareByPrice(a.product, b.product));

  // Wer unsicher ist, sieht immer beide Wege: mit und ohne Speicher
  if (answers.independence === "unsicher") {
    const best = scored[0]!;
    const other = scored.find((r) => (storageOf(r.product) > 0) !== (storageOf(best.product) > 0));
    const rest = scored.filter((r) => r !== best && r !== other);
    return [best, ...(other ? [other] : []), ...rest].slice(0, 3);
  }
  return scored.slice(0, 3);
}

function compareByPrice(a: Product, b: Product) {
  const pa = hasPrice(a) ? a.price : Infinity;
  const pb = hasPrice(b) ? b.price : Infinity;
  return pa - pb;
}

function unique(list: string[]) {
  return [...new Set(list)];
}

/* ------------------------------------------------------------------ */
/* Zubehör und Nachrüstung                                              */
/* ------------------------------------------------------------------ */

export interface AccessoryHint {
  product: Product;
  /** Warum das Zubehör passt */
  note: string;
  kind: "montage" | "nachruesten";
}

/** Anzahl Module je Halterung aus dem Produktnamen („für 2 Module“) */
function modulesPerMount(p: Product): number | null {
  const m = p.name.match(/für\s+(\d+)\s+Module/i);
  return m ? Number(m[1]) : null;
}

/**
 * Passendes Zubehör zum empfohlenen Set:
 * - Halterungen für Flachdach und Garten (Menge aus der Modulanzahl)
 * - AC-gekoppelte Speicher zum späteren Nachrüsten, wenn das Set keinen Speicher hat
 */
export function accessoriesFor(answers: FinderAnswers, set: Product, products: Product[] = getAllProducts()): AccessoryHint[] {
  const out: AccessoryHint[] = [];
  const location = placeToLocation[answers.place];
  const modules = set.specs.moduleCount ?? 0;

  if (answers.place === "flachdach" || answers.place === "garten") {
    for (const mount of products.filter((p) => p.category === "montage-zubehoer" && p.specs.tiltRange && p.suitableFor.includes(location))) {
      const per = modulesPerMount(mount);
      const qty = per && modules ? Math.ceil(modules / per) : null;
      out.push({
        product: mount,
        kind: "montage",
        note: qty ? `Für ${modules} Module brauchst du ${qty} ${qty === 1 ? "Halterung" : "Halterungen"}` : "Aufständerung für bessere Neigung",
      });
    }
  }

  if (storageOf(set) === 0 && answers.independence !== "ohne") {
    for (const storage of products.filter((p) => p.category === "batteriespeicher" && p.tags.includes("ac-gekoppelt") && hasPrice(p))) {
      out.push({
        product: storage,
        kind: "nachruesten",
        note: `AC-gekoppelt: lässt sich an ein bestehendes Balkonkraftwerk anschließen (${formatKWh(storageOf(storage))})`,
      });
    }
  }
  return out;
}

/** Hinweise, die unabhängig vom Produkt zum Ort gehören */
export function placeNotes(place: Place): string[] {
  if (place === "hausdach")
    return [
      "Arbeiten auf dem Dach sind gefährlich: Lass die Module von einem Fachbetrieb montieren.",
      `Steckerfertige Anlagen sind auf ${inverterMaxW} W Einspeisung und ${formatWp(moduleMaxWp)} Modulleistung begrenzt. Für größere Dachanlagen beraten wir dich persönlich.`,
    ];
  if (place === "balkon") return ["Prüfe vor dem Kauf, ob dein Geländer die Module tragen kann, und sprich mit Vermieter oder Eigentümergemeinschaft."];
  return [];
}
