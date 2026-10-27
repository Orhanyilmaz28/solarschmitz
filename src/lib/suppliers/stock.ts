import type { Product } from "@/lib/catalog/types";
import { parseInteger } from "./units";

type Stock = Product["stock"];

const inStockWords = ["auf lager", "lagernd", "verfügbar", "verfuegbar", "lieferbar", "in stock", "available", "ja", "yes"];
const outOfStockWords = ["nicht verfügbar", "nicht verfuegbar", "ausverkauft", "nicht lieferbar", "out of stock", "unavailable", "nein", "no"];

/**
 * Übersetzt den Bestandswert eines Lieferanten.
 * Fehlt der Wert oder ist er unklar, bleibt der Bestand "unknown".
 * Es wird nie ein Bestand angenommen oder geschätzt.
 */
export function normalizeStock(raw: unknown, lowThreshold: number, updatedAt = new Date().toISOString()): Stock {
  if (raw === null || raw === undefined) return { status: "unknown" };
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (!s) return { status: "unknown" };
    // "verfügbar ab 12.11." oder Vorbestellung: nicht sofort lieferbar, also unbekannt
    if (/\bab\b|vorbestell|pre-?order/.test(s)) return { status: "unknown" };
    // Zuerst die verneinten Formen prüfen ("nicht verfügbar" enthält "verfügbar")
    if (outOfStockWords.some((w) => matches(s, w))) return { status: "out_of_stock", quantity: 0, updatedAt };
    if (/^[-+]?\d[\d.,]*$/.test(s)) return fromQuantity(parseInteger(s), lowThreshold, updatedAt);
    if (inStockWords.some((w) => matches(s, w))) return { status: "in_stock", updatedAt };
    return { status: "unknown" };
  }
  if (typeof raw === "number") return fromQuantity(Math.trunc(raw), lowThreshold, updatedAt);
  if (typeof raw === "boolean") return raw ? { status: "in_stock", updatedAt } : { status: "out_of_stock", quantity: 0, updatedAt };
  return { status: "unknown" };
}

/** Kurze Wörter ("ja", "no") nur exakt, längere Formulierungen auch als Satzanfang */
function matches(s: string, word: string): boolean {
  return s === word || (word.length > 3 && s.startsWith(word));
}

function fromQuantity(q: number | null, lowThreshold: number, updatedAt: string): Stock {
  if (q === null || !Number.isFinite(q)) return { status: "unknown" };
  if (q <= 0) return { status: "out_of_stock", quantity: 0, updatedAt };
  if (q <= lowThreshold) return { status: "low", quantity: q, updatedAt };
  return { status: "in_stock", quantity: q, updatedAt };
}
