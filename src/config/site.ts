/**
 * Shop-Einstellungen und Feature-Schalter.
 * Alles, was rechtlich oder kaufmännisch noch offen ist, steht hier als
 * "pending", damit die Oberfläche nichts verspricht, was nicht feststeht.
 */
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "de-DE",
  currency: "EUR",

  /** Vorschau-Modus: zeigt Hinweise, dass Produkte und Preise noch nicht final sind */
  previewMode: true,

  shipping: {
    /** "pending" = Versandkosten mit Lieferant noch nicht abgestimmt */
    status: "pending" as "pending" | "configured",
    flatRateEUR: null as number | null,
    freeShippingFromEUR: null as number | null,
    deliveryTime: null as string | null,
    carrierNote: "Versand direkt durch den jeweiligen Lieferanten, mit Sendungsverfolgung per E-Mail.",
    countries: ["DE"],
  },

  /** Gesetzliches Widerrufsrecht für Verbraucher in Tagen */
  withdrawalDays: 14,

  compareLimit: 4,
} as const;

/** Checkout darf nur mit konfigurierter Zahlung und Backend live gehen. */
export function isCheckoutEnabled(): boolean {
  return process.env.CHECKOUT_ENABLED === "true" && Boolean(process.env.PAYMENT_PROVIDER);
}
