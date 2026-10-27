import { getProductById, hasPrice } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";
import { site } from "@/config/site";
import type { CartLine } from "./store";

export interface ResolvedLine {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface CartTotals {
  lines: ResolvedLine[];
  subtotal: number;
  /** null = Versandkosten stehen noch nicht fest */
  shipping: number | null;
  total: number;
  /** Enthaltene MwSt. (nur 19-%-Positionen) */
  vatIncluded: number;
  hasUnverified: boolean;
}

/** Berechnet den Warenkorb immer aus dem aktuellen Katalog (Preise nie aus dem Browser übernehmen). */
export function resolveCart(lines: CartLine[]): CartTotals {
  const resolved: ResolvedLine[] = [];
  for (const l of lines) {
    const product = getProductById(l.productId);
    if (!product || !hasPrice(product)) continue;
    resolved.push({ product, quantity: l.quantity, lineTotal: product.price * l.quantity });
  }
  const subtotal = round2(resolved.reduce((s, l) => s + l.lineTotal, 0));
  const vatIncluded = round2(resolved.filter((l) => l.product.vatRate === 19).reduce((s, l) => s + l.lineTotal - l.lineTotal / 1.19, 0));
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
    vatIncluded,
    hasUnverified: resolved.some((l) => l.product.dataStatus !== "live"),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
