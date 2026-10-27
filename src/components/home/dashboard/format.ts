const nf = (d: number) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const n0 = nf(0);
const n1 = nf(1);
const n2 = nf(2);

/** 392 W, 1,2 kW */
export function fmtW(w: number): string {
  const v = Math.max(0, w);
  if (v < 1000) return `${n0.format(Math.round(v))} W`;
  return `${n1.format(v / 1000)} kW`;
}

/** 2,93 kWh, 12,4 kWh */
export function fmtKWh(kwh: number): string {
  const v = Math.max(0, kwh);
  return `${v < 10 ? n2.format(v) : n1.format(v)} kWh`;
}

export function fmtEUR(eur: number, digits = 2): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(eur);
}

export function fmtPct(rate: number): string {
  return `${n0.format(Math.round(rate * 100))} %`;
}

export function fmtNum(v: number, digits = 0): string {
  return nf(digits).format(v);
}
