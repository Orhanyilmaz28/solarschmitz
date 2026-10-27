import { getProductById, hasPrice } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";
import { site } from "@/config/site";
import type { CartLine } from "./store";
import { includedVat, round2, STANDARD_VAT_RATE, withStandardVat, type VatRate } from "./vat";

export interface CartOptions {
  /**
   * Die Kundin oder der Kunde hat bestätigt, dass die Voraussetzungen für den
   * Nullsteuersatz (§ 12 Abs. 3 UStG) erfüllt sind. Ohne Bestätigung werden
   * begünstigte Artikel mit 19 % berechnet.
   */
  zeroRateConfirmed?: boolean;
  /** Produktsuche, für Tests austauschbar. Standard: aktueller Katalog */
  lookup?: (id: string) => Product | undefined;
}

export interface ResolvedLine {
  product: Product;
  quantity: number;
  /** Bruttopreis je Stück mit dem angewendeten Steuersatz */
  unitPrice: number;
  /** Bruttopreis der Position */
  lineTotal: number;
  /** Angewendeter Steuersatz */
  vatRate: VatRate;
  /** Laut Katalog für den Nullsteuersatz begünstigt (Photovoltaik-Komponente) */
  zeroRateEligible: boolean;
}

export interface VatBreakdownLine {
  rate: VatRate;
  /** Summe brutto der Positionen mit diesem Satz */
  gross: number;
  net: number;
  vat: number;
}

export interface CartTotals {
  lines: ResolvedLine[];
  /** Summe der Positionen, brutto */
  subtotal: number;
  /** null = Versandkosten stehen noch nicht fest */
  shipping: number | null;
  total: number;
  /** Enthaltene Umsatzsteuer gesamt (nur Positionen mit 19 %) */
  vatIncluded: number;
  vatBreakdown: VatBreakdownLine[];
  /** Mindestens eine Position wird mit 0 % berechnet */
  zeroRateApplied: boolean;
  /** Der Warenkorb enthält begünstigte Photovoltaik-Komponenten */
  hasZeroRateEligible: boolean;
  /** Preise sind noch nicht vom Lieferanten bestätigt */
  hasUnverified: boolean;
  /** Anzahl Artikel (Summe der Mengen) */
  itemCount: number;
}

/**
 * Berechnet den Warenkorb immer aus dem aktuellen Katalog (Preise nie aus dem Browser übernehmen).
 * Katalogpreise begünstigter Artikel sind Preise bei 0 % USt. Ohne Bestätigung der
 * Voraussetzungen werden sie mit 19 % berechnet (Preis × 1,19).
 */
export function resolveCart(lines: CartLine[], options: CartOptions = {}): CartTotals {
  const { zeroRateConfirmed = false, lookup = getProductById } = options;
  const resolved: ResolvedLine[] = [];
  for (const l of lines) {
    const product = lookup(l.productId);
    if (!product || !hasPrice(product) || l.quantity <= 0) continue;
    const eligible = product.vatRate === 0;
    const vatRate: VatRate = eligible && zeroRateConfirmed ? 0 : STANDARD_VAT_RATE;
    // Artikel mit Regelsteuersatz im Katalog sind bereits brutto inkl. 19 %
    const unitPrice = eligible && !zeroRateConfirmed ? withStandardVat(product.price) : round2(product.price);
    resolved.push({ product, quantity: l.quantity, unitPrice, lineTotal: round2(unitPrice * l.quantity), vatRate, zeroRateEligible: eligible });
  }

  const subtotal = round2(resolved.reduce((s, l) => s + l.lineTotal, 0));
  const vatBreakdown = ([0, STANDARD_VAT_RATE] as const)
    .map((rate) => {
      const gross = round2(resolved.filter((l) => l.vatRate === rate).reduce((s, l) => s + l.lineTotal, 0));
      const vat = includedVat(gross, rate);
      return { rate, gross, vat, net: round2(gross - vat) };
    })
    .filter((b) => b.gross > 0);

  let shipping: number | null = null;
  if (site.shipping.status === "configured" && site.shipping.flatRateEUR !== null) {
    const free = site.shipping.freeShippingFromEUR;
    shipping = free !== null && subtotal >= free ? 0 : site.shipping.flatRateEUR;
  }

  return {
    lines: resolved,
    subtotal,
    shipping,
    total: round2(subtotal + (shipping ?? 0)),
    vatIncluded: round2(vatBreakdown.reduce((s, b) => s + b.vat, 0)),
    vatBreakdown,
    zeroRateApplied: resolved.some((l) => l.vatRate === 0),
    hasZeroRateEligible: resolved.some((l) => l.zeroRateEligible),
    hasUnverified: resolved.some((l) => l.product.dataStatus !== "live"),
    itemCount: resolved.reduce((n, l) => n + l.quantity, 0),
  };
}
