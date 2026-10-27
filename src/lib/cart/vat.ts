/**
 * Nullsteuersatz für Photovoltaik (§ 12 Abs. 3 Nr. 1 UStG).
 * Texte und Rechenhilfen an einer Stelle, damit Warenkorb, Kasse und FAQ dasselbe sagen.
 * Entwurf: vor Livegang steuerlich prüfen lassen.
 */

export const STANDARD_VAT_RATE = 19 as const;
export const ZERO_VAT_RATE = 0 as const;
export type VatRate = typeof ZERO_VAT_RATE | typeof STANDARD_VAT_RATE;

/** Kurzform für Preisangaben */
export const zeroRateLabel = "0 % USt. nach § 12 Abs. 3 UStG";

/** Voraussetzungen in Alltagssprache */
export const zeroRateConditions: string[] = [
  "Du kaufst die Komponenten als Betreiberin oder Betreiber der Anlage.",
  "Die Anlage wird auf oder in der Nähe eines Wohngebäudes betrieben, zum Beispiel am Balkon, auf dem Dach, im Garten oder auf Garage und Carport am Wohnhaus. Öffentliche und gemeinnützig genutzte Gebäude zählen ebenfalls.",
  "Bei Anlagen bis 30 kWp laut Marktstammdatenregister gilt die Voraussetzung zum Standort als erfüllt. Ein Balkonkraftwerk liegt weit darunter.",
];

export const zeroRateFallback = "Trifft das nicht zu, etwa bei einer Anlage auf einem rein gewerblich genutzten Gebäude, gilt der Regelsteuersatz von 19 %.";

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Bruttopreis mit Regelsteuersatz aus einem Nettopreis (Katalogpreise der begünstigten Artikel sind netto = brutto bei 0 %) */
export function withStandardVat(net: number): number {
  return round2(net * (1 + STANDARD_VAT_RATE / 100));
}

/** Enthaltene Umsatzsteuer in einem Bruttobetrag */
export function includedVat(gross: number, rate: VatRate): number {
  if (rate === 0) return 0;
  return round2(gross - gross / (1 + rate / 100));
}
