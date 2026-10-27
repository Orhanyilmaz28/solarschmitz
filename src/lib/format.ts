const eurFmt = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const eurRound = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const numFmt = new Intl.NumberFormat("de-DE");

export function formatEUR(value: number, opts: { round?: boolean } = {}): string {
  return (opts.round ? eurRound : eurFmt).format(value);
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

export function formatInt(value: number): string {
  return numFmt.format(Math.round(value));
}

/** 1.6 -> "1,6 kWh" */
export function formatKWh(value: number): string {
  return `${formatNumber(value, value % 1 === 0 ? 0 : 1)} kWh`;
}

/** 880 -> "880 Wp", 1760 -> "1.760 Wp" */
export function formatWp(value: number): string {
  return `${formatInt(value)} Wp`;
}

export function vatLabel(rate: 0 | 19): string {
  return rate === 0 ? "inkl. 0 % MwSt." : "inkl. 19 % MwSt.";
}
