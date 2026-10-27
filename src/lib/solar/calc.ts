import { monthlyShare, solarAssumptions, type MountingKey, type OrientationKey } from "@/config/solar-assumptions";

/** Vom Kunden änderbare Annahmen */
export interface Assumptions {
  specificYieldKWhPerKWp: number;
  selfConsumptionWithout: number;
  selfConsumptionWith: number;
  electricityPriceCt: number;
  priceIncreasePct: number;
  degradationPct: number;
  feedInTariffCt: number;
  years: number;
}

export const defaultAssumptions: Assumptions = {
  specificYieldKWhPerKWp: solarAssumptions.specificYieldKWhPerKWp,
  selfConsumptionWithout: solarAssumptions.selfConsumption.withoutStorage,
  selfConsumptionWith: solarAssumptions.selfConsumption.withStorage,
  electricityPriceCt: solarAssumptions.electricityPriceCt,
  priceIncreasePct: solarAssumptions.priceIncreasePct,
  degradationPct: solarAssumptions.degradationPct,
  feedInTariffCt: solarAssumptions.feedInTariffCt,
  years: solarAssumptions.years,
};

export interface SimulationInput {
  totalWp: number;
  orientation: OrientationKey;
  mounting: MountingKey;
  withStorage: boolean;
  /** Anschaffungskosten in Euro; null = unbekannt (dann keine Amortisation) */
  systemCostEUR: number | null;
  assumptions?: Partial<Assumptions>;
  /**
   * Jahresstromverbrauch des Haushalts in kWh (optional).
   * Ist er gesetzt, kann der selbst genutzte Solarstrom ihn nicht übersteigen.
   */
  householdKWh?: number;
}

export interface SimulationResult {
  /** Ertrag im ersten Jahr (kWh) */
  annualKWh: number;
  selfUsedKWh: number;
  feedInKWh: number;
  /** Ersparnis im ersten Jahr (EUR) */
  firstYearSavingsEUR: number;
  /** Summe der Ersparnis über den Betrachtungszeitraum */
  totalSavingsEUR: number;
  /** Jahre bis zur Amortisation; null = nicht im Zeitraum oder Kosten unbekannt */
  paybackYears: number | null;
  monthlyKWh: number[];
  /** Kumulierte Bilanz je Jahr (Ersparnis minus Anschaffung) */
  cashflow: { year: number; cumulativeEUR: number }[];
  /** Anteil, der durch die 800-W-Begrenzung verloren geht */
  clippingLoss: number;
  factors: { orientation: number; mounting: number };
  /** Anteil des Haushaltsverbrauchs, der im ersten Jahr mit Solarstrom gedeckt wird (null ohne Verbrauchsangabe) */
  coverage: number | null;
}

/**
 * Verlust durch die Begrenzung des Wechselrichters auf 800 W.
 * Grobe, vorsichtige Näherung: bis 10 % Überbelegung kein Verlust,
 * danach 6 % je 100 % Überbelegung, höchstens 12 %.
 */
export function clippingLossFor(totalWp: number, inverterMaxW: number = solarAssumptions.plugInLimits.inverterMaxW): number {
  const ratio = totalWp / inverterMaxW;
  if (ratio <= 1.1) return 0;
  return Math.min(0.12, (ratio - 1.1) * 0.06);
}

export function simulate(input: SimulationInput): SimulationResult {
  const a: Assumptions = { ...defaultAssumptions, ...input.assumptions };
  const orientation = solarAssumptions.orientation[input.orientation].factor;
  const mounting = solarAssumptions.mounting[input.mounting].factor;
  const clippingLoss = clippingLossFor(input.totalWp);

  const annualKWh = (input.totalWp / 1000) * a.specificYieldKWhPerKWp * orientation * mounting * (1 - clippingLoss);
  const share = clamp01(input.withStorage ? a.selfConsumptionWith : a.selfConsumptionWithout);

  const household = input.householdKWh && input.householdKWh > 0 ? input.householdKWh : null;
  /** Selbst genutzter Anteil, höchstens so viel wie der Haushalt verbraucht */
  const selfUseOf = (production: number) => (household === null ? production * share : Math.min(production * share, household));

  const yearSavings = (year: number) => {
    const production = annualKWh * Math.pow(1 - a.degradationPct / 100, year - 1);
    const price = (a.electricityPriceCt / 100) * Math.pow(1 + a.priceIncreasePct / 100, year - 1);
    const used = selfUseOf(production);
    return used * price + (production - used) * (a.feedInTariffCt / 100);
  };

  const cost = input.systemCostEUR ?? 0;
  // ohne Preis bei 0 starten (nicht bei -0, das würde als „-0 €" angezeigt)
  const start = cost > 0 ? -cost : 0;
  const cashflow: SimulationResult["cashflow"] = [{ year: 0, cumulativeEUR: start }];
  let cumulative = start;
  let paybackYears: number | null = null;
  let total = 0;
  for (let y = 1; y <= a.years; y++) {
    const s = yearSavings(y);
    total += s;
    const before = cumulative;
    cumulative += s;
    if (paybackYears === null && input.systemCostEUR !== null && cost > 0 && before < 0 && cumulative >= 0) {
      paybackYears = y - 1 + -before / s;
    }
    cashflow.push({ year: y, cumulativeEUR: cumulative });
  }

  const usedFirstYear = selfUseOf(annualKWh);
  return {
    annualKWh,
    selfUsedKWh: usedFirstYear,
    feedInKWh: annualKWh - usedFirstYear,
    firstYearSavingsEUR: yearSavings(1),
    totalSavingsEUR: total,
    paybackYears,
    monthlyKWh: monthlyShare.map((m) => annualKWh * m),
    cashflow,
    clippingLoss,
    factors: { orientation, mounting },
    coverage: household === null ? null : usedFirstYear / household,
  };
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}
