import { isCheckoutEnabled, site } from "@/config/site";
import { getPaymentStatus } from "@/lib/payments";

export interface CheckoutBlocker {
  key: "flag" | "payment" | "shipping" | "catalog";
  message: string;
}

/**
 * Was dem Live-Checkout noch fehlt. Nur auf dem Server aufrufen (liest Umgebungsvariablen).
 * Die Kasse zeigt diese Punkte nicht im Detail, der Admin schon.
 */
export function getCheckoutStatus(): { enabled: boolean; blockers: CheckoutBlocker[] } {
  const blockers: CheckoutBlocker[] = [];
  if (!isCheckoutEnabled()) blockers.push({ key: "flag", message: "CHECKOUT_ENABLED ist nicht auf true gesetzt." });
  const payment = getPaymentStatus();
  if (!payment.ready) blockers.push({ key: "payment", message: payment.message });
  if (site.shipping.status !== "configured" || site.shipping.flatRateEUR === null) {
    blockers.push({ key: "shipping", message: "Versandkosten und Lieferzeit sind noch nicht festgelegt (src/config/site.ts)." });
  }
  blockers.push({
    key: "catalog",
    message: "Bestellbar sind nur Produkte mit Datenstatus „live“ aus einem Lieferanten-Import.",
  });
  // Der Katalog-Hinweis allein blockiert nicht, er erklärt nur
  const hard = blockers.filter((b) => b.key !== "catalog");
  return { enabled: hard.length === 0, blockers };
}
