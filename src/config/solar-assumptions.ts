/**
 * Annahmen für Ertragsrechner und Konfigurator.
 * Alle Werte sind bewusst vorsichtig gewählt und im Konfigurator für
 * Kunden sichtbar und änderbar.
 */
export const solarAssumptions = {
  /** Spezifischer Jahresertrag in Deutschland bei optimaler Ausrichtung (kWh je kWp) */
  specificYieldKWhPerKWp: 950,

  /** Faktor je Ausrichtung, bezogen auf Süd = 1 */
  orientation: {
    sued: { label: "Süd", factor: 1 },
    suedost_suedwest: { label: "Südost / Südwest", factor: 0.94 },
    ost_west: { label: "Ost / West", factor: 0.82 },
    nord: { label: "Nord", factor: 0.58 },
  },

  /** Faktor je Montageart (Neigung), bezogen auf ca. 30° = 1 */
  mounting: {
    balkon: { label: "Balkongeländer, senkrecht", factor: 0.72 },
    flachdach: { label: "Flachdach, aufgeständert", factor: 0.95 },
    schraegdach: { label: "Schrägdach", factor: 1 },
    garten: { label: "Garten, aufgeständert", factor: 0.95 },
  },

  /** Anteil des Solarstroms, den der Haushalt selbst nutzt */
  selfConsumption: { withoutStorage: 0.6, withStorage: 0.85 },

  /** Strompreis in Cent je kWh */
  electricityPriceCt: 37,
  /** Jährliche Strompreissteigerung in Prozent */
  priceIncreasePct: 2,
  /** Jährlicher Leistungsverlust der Module in Prozent */
  degradationPct: 0.5,
  /** Einspeisevergütung in Cent je kWh (bei Balkonkraftwerken meist 0) */
  feedInTariffCt: 0,
  /** Betrachtungszeitraum in Jahren */
  years: 20,

  /** Rechtlicher Rahmen für Steckersolargeräte (Solarpaket I, 2024) */
  plugInLimits: { inverterMaxW: 800, moduleMaxWp: 2000 },
} as const;

/** Grobe monatliche Verteilung des Jahresertrags in Deutschland (Summe = 1) */
export const monthlyShare = [
  0.025, 0.045, 0.08, 0.115, 0.13, 0.135, 0.135, 0.12, 0.09, 0.06, 0.035, 0.03,
] as const;

export const monthLabels = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"] as const;

export type OrientationKey = keyof typeof solarAssumptions.orientation;
export type MountingKey = keyof typeof solarAssumptions.mounting;
