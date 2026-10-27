/**
 * Preisregeln für Verkaufspreise aus Einkaufspreisen.
 * Alle Berechnungen in Cent, damit keine Rundungsfehler entstehen.
 */

export type RoundingMode = "none" | "euro" | "90" | "99";

export interface PriceRule {
  /** Aufschlag auf den Netto-Einkaufspreis in Prozent */
  marginPct: number;
  /** Fester Aufschlag netto in Euro (z. B. für Versand- oder Zahlungskosten) */
  fixedMarkupEUR: number;
  rounding: RoundingMode;
  /** Mindest-Rohertrag netto je Stück in Euro */
  minMarginEUR: number;
  /** Verkaufspreis nie über der UVP des Lieferanten */
  capAtRrp: boolean;
}

export const defaultPriceRule: PriceRule = {
  marginPct: 20,
  fixedMarkupEUR: 0,
  rounding: "90",
  minMarginEUR: 10,
  capAtRrp: true,
};

export type PriceFlag = "capped_at_rrp" | "below_min_margin" | "raised_to_min_margin" | "no_cost_price" | "rrp_only";

export interface PriceResult {
  /** Verkaufspreis brutto in Euro */
  price: number;
  /** Rohertrag netto je Stück in Euro (null ohne Einkaufspreis) */
  marginEUR: number | null;
  /** Rohertrag in Prozent vom Netto-Verkaufspreis */
  marginPctOfNet: number | null;
  flags: PriceFlag[];
}

const toCents = (eur: number) => Math.round(eur * 100);
const fromCents = (cents: number) => cents / 100;

/** Rundet nach oben auf die gewünschte Preisendung, nie nach unten. */
export function roundPriceCents(cents: number, mode: RoundingMode): number {
  if (cents <= 0) return 0;
  switch (mode) {
    case "none":
      return cents;
    case "euro":
      return Math.ceil(cents / 100) * 100;
    case "90":
    case "99": {
      const ending = mode === "90" ? 90 : 99;
      const euros = Math.floor(cents / 100);
      const candidate = euros * 100 + ending;
      return candidate >= cents ? candidate : candidate + 100;
    }
  }
}

/** Rundet nach unten auf die Preisendung (für die UVP-Grenze). */
function roundDownCents(cents: number, mode: RoundingMode): number {
  if (mode === "none") return cents;
  if (mode === "euro") return Math.floor(cents / 100) * 100;
  const ending = mode === "90" ? 90 : 99;
  const euros = Math.floor(cents / 100);
  const candidate = euros * 100 + ending;
  return candidate <= cents ? candidate : candidate - 100;
}

function grossFromNet(netCents: number, vatRate: number): number {
  return Math.round(netCents * (1 + vatRate / 100));
}

function netFromGross(grossCents: number, vatRate: number): number {
  return Math.round(grossCents / (1 + vatRate / 100));
}

/**
 * Berechnet den Verkaufspreis brutto.
 * - Ohne Einkaufspreis wird die UVP übernommen (Flag "rrp_only").
 * - Die Mindestmarge hebt den Preis an; die UVP-Grenze senkt ihn wieder.
 *   Liegt der Preis dann unter der Mindestmarge, wird das markiert statt versteckt.
 */
export function computeSellPrice(input: {
  costPriceNet?: number | null;
  rrpGross?: number | null;
  vatRate: 0 | 19;
  rule: PriceRule;
}): PriceResult {
  const { rule, vatRate } = input;
  const flags: PriceFlag[] = [];
  const cost = input.costPriceNet ?? null;
  const rrp = input.rrpGross ?? null;

  if (cost === null || cost <= 0) {
    flags.push("no_cost_price");
    if (rrp && rrp > 0) {
      flags.push("rrp_only");
      return { price: fromCents(toCents(rrp)), marginEUR: null, marginPctOfNet: null, flags };
    }
    return { price: 0, marginEUR: null, marginPctOfNet: null, flags };
  }

  const costCents = toCents(cost);
  let netCents = Math.round(costCents * (1 + rule.marginPct / 100)) + toCents(rule.fixedMarkupEUR);
  const minNetCents = costCents + toCents(rule.minMarginEUR);
  if (netCents < minNetCents) {
    netCents = minNetCents;
    flags.push("raised_to_min_margin");
  }

  let grossCents = roundPriceCents(grossFromNet(netCents, vatRate), rule.rounding);

  if (rule.capAtRrp && rrp && rrp > 0 && grossCents > toCents(rrp)) {
    grossCents = roundDownCents(toCents(rrp), rule.rounding);
    flags.push("capped_at_rrp");
  }

  const marginCents = netFromGross(grossCents, vatRate) - costCents;
  if (marginCents < toCents(rule.minMarginEUR)) flags.push("below_min_margin");

  const net = netFromGross(grossCents, vatRate);
  return {
    price: fromCents(grossCents),
    marginEUR: fromCents(marginCents),
    marginPctOfNet: net > 0 ? Math.round((marginCents / net) * 1000) / 10 : null,
    flags,
  };
}
