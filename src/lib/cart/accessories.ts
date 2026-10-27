import { hasPrice } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";

/**
 * Zubehör-Vorschläge für den Warenkorb – nur aus Angaben, die in den Produktdaten stehen:
 *  1. Ein Produkt im Warenkorb nennt das Zubehör ausdrücklich (`accessoryIds`).
 *  2. `specs.compatibleWith` eines Zubehörs nennt ein Produkt im Warenkorb (Herstellerangabe).
 *  3. Halterungen „für 2 Module“ zu Sets mit genau zwei Modulen, wenn beide denselben Einsatzort
 *     (Flachdach oder Garten) nennen. Modulmaße fehlen in den Daten, daher immer mit Prüfhinweis.
 * Nichts wird geschätzt oder erfunden.
 */
export interface AccessorySuggestion {
  product: Product;
  /** Für welches Produkt im Warenkorb */
  forProduct: Product;
  reason: string;
  /** Zusätzlicher Prüfhinweis, falls die Daten nicht alles abdecken */
  caveat?: string;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * „Anker SOLIX Solarbank 2 E1600 Pro / Plus“ → ["anker solix solarbank 2 e1600 pro", "anker solix solarbank 2 e1600 plus"]
 * Ein einzelnes Wort nach dem Schrägstrich ersetzt das letzte Wort der ersten Angabe.
 */
export function expandCompatibility(value: string): string[] {
  const parts = value
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return [];
  const first = parts[0]!;
  const stem = first.split(" ").slice(0, -1).join(" ");
  return parts.map((p, i) => normalize(i === 0 || p.includes(" ") || !stem ? p : `${stem} ${p}`));
}

function isAccessory(p: Product): boolean {
  return p.category === "montage-zubehoer";
}

const MOUNT_LOCATIONS = ["flachdach", "garten"] as const;

export function suggestAccessories(cart: Product[], catalog: Product[], limit = 3): AccessorySuggestion[] {
  const inCart = new Set(cart.map((p) => p.id));
  const out: AccessorySuggestion[] = [];
  const add = (s: AccessorySuggestion) => {
    if (out.some((o) => o.product.id === s.product.id)) return;
    out.push(s);
  };

  const offerable = (p: Product | undefined): p is Product => Boolean(p && hasPrice(p) && !inCart.has(p.id));

  // 1. Im Produkt hinterlegtes Zubehör
  for (const host of cart) {
    for (const id of host.accessoryIds ?? []) {
      const acc = catalog.find((p) => p.id === id);
      if (offerable(acc)) add({ product: acc, forProduct: host, reason: `Als Zubehör zu ${host.name} hinterlegt` });
    }
  }

  const candidates = catalog.filter((p) => isAccessory(p) && offerable(p));

  for (const acc of candidates) {
    // 2. Ausdrückliche Kompatibilitätsangabe
    if (acc.specs.compatibleWith) {
      const targets = expandCompatibility(acc.specs.compatibleWith);
      const match = cart.find((p) => !isAccessory(p) && targets.some((t) => normalize(p.name).includes(t)));
      if (match) {
        add({ product: acc, forProduct: match, reason: `Laut Hersteller passend zu: ${acc.specs.compatibleWith}` });
        continue;
      }
    }
    // 3. Halterung für zwei Module zu einem Zwei-Modul-Set mit gleichem Einsatzort
    const isTwoModuleMount = Boolean(acc.specs.tiltRange) && /2 module/i.test(`${acc.name} ${acc.highlights.join(" ")}`);
    if (isTwoModuleMount) {
      const set = cart.find(
        (p) =>
          p.specs.moduleCount === 2 &&
          MOUNT_LOCATIONS.some((loc) => p.suitableFor.includes(loc) && acc.suitableFor.includes(loc)),
      );
      if (set) {
        add({
          product: acc,
          forProduct: set,
          reason: "Aufständerung für die zwei Module deines Sets auf Flachdach oder im Garten",
          caveat: acc.specs.maxLengthMm
            ? `Laut Hersteller für Module bis ${acc.specs.maxLengthMm.toLocaleString("de-DE")} mm Breite. Bitte die Maße deiner Module prüfen.`
            : "Bitte vor dem Kauf prüfen, ob die Maße deiner Module zur Halterung passen.",
        });
      }
    }
  }
  return out.slice(0, limit);
}
