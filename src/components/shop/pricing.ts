import type { Product } from "@/lib/catalog/types";
import { formatEUR } from "@/lib/format";
import { hasPrice } from "@/lib/catalog";

/** Anker-ID der Fußnote zum Nullsteuersatz (wird von <VatFootnote /> gesetzt) */
export const VAT_FOOTNOTE_ID = "ust-hinweis";

/** Pflichtangabe am Preis (PAngV): Umsatzsteuer und Hinweis auf Versandkosten. */
export function vatLine(p: Product): string {
  return p.vatRate === 0 ? "inkl. 0 % USt." : "inkl. 19 % USt.";
}

/** Kurzer Status des Preises für die Kachel */
export function priceStatus(p: Product): string | null {
  if (!hasPrice(p)) return null;
  if (p.dataStatus === "supplier-unverified") return "Richtpreis";
  return null;
}

/** UVP nur, wenn ausdrücklich als verifiziert markiert (kein Streichpreis, kein Rabatt-Badge). */
export function uvpText(p: Product): string | null {
  if (!p.uvp?.verified || p.uvp.amount <= 0) return null;
  return `UVP des Herstellers: ${formatEUR(p.uvp.amount)}`;
}
