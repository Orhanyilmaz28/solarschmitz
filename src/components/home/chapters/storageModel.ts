/**
 * Kapitel 3 – gemeinsames Modell für Server (Ausgangszustand) und Bühne (Scroll).
 * Reine Funktionen ohne Browser-Abhängigkeiten.
 */
import type { FlowKey } from "./storageScene";

/** Leistungen in W je 15-Minuten-Schritt (Mittelwert), Ladestand in % */
export interface StageSeries {
  pv: number[];
  load: number[];
  direct: number[];
  charge: number[];
  discharge: number[];
  imp: number[];
  exp: number[];
  soc: number[];
}

export interface StageData {
  stepMin: number;
  series: StageSeries;
  /** Minuten seit Mitternacht */
  sunrise: number;
  sunset: number;
  /** Untere Entladegrenze in % */
  minSoc: number;
  pvMax: number;
  /** Scroll-Fortschritt → Minute (über Mitternacht hinaus fortlaufend) */
  timeline: [number, number][];
  /** Fortschrittsbereiche der drei Abschnitte */
  beatRanges: [number, number][];
}

export interface Sample {
  pv: number;
  load: number;
  direct: number;
  charge: number;
  discharge: number;
  imp: number;
  exp: number;
  soc: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function minuteAt(data: StageData, p: number): number {
  const tl = data.timeline;
  if (p <= tl[0]![0]) return tl[0]![1];
  for (let i = 1; i < tl.length; i++) {
    const [p1, m1] = tl[i]!;
    const [p0, m0] = tl[i - 1]!;
    if (p <= p1) return m0 + ((p - p0) / (p1 - p0)) * (m1 - m0);
  }
  return tl[tl.length - 1]![1];
}

export function beatAt(data: StageData, p: number): number {
  for (let i = data.beatRanges.length - 1; i >= 0; i--) if (p >= data.beatRanges[i]![0]) return i;
  return 0;
}

/** Werte zur Minute, linear zwischen den Schritten (Schrittmitte als Stützstelle) */
export function sampleAt(data: StageData, minute: number): Sample {
  const s = data.series;
  const n = s.pv.length;
  const m = ((minute % 1440) + 1440) % 1440;
  const pos = m / data.stepMin - 0.5;
  const i0 = Math.floor(pos);
  const t = pos - i0;
  const a = ((i0 % n) + n) % n;
  const b = (a + 1) % n;
  const lerp = (arr: number[]) => arr[a]! + (arr[b]! - arr[a]!) * t;
  return {
    pv: lerp(s.pv),
    load: lerp(s.load),
    direct: lerp(s.direct),
    charge: lerp(s.charge),
    discharge: lerp(s.discharge),
    imp: lerp(s.imp),
    exp: lerp(s.exp),
    soc: lerp(s.soc),
  };
}

// ---------- Formatierung (deutsch, geschütztes Leerzeichen vor Einheiten) ----------

const NB = " ";
const n0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const n2 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtW = (w: number) => `${n0.format(Math.max(0, Math.round(w)))}${NB}W`;
export const fmtKWh = (kwh: number) => `${n2.format(Math.max(0, kwh))}${NB}kWh`;
export const fmtPct = (pct: number) => `${n0.format(Math.round(pct))}${NB}%`;
export function fmtClock(minute: number): string {
  const m = ((Math.round(minute) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// ---------- Sonnenbogen (Koordinaten im Bildraum 1000 × 760) ----------

export const ARC = { x0: 420, x1: 920, yBase: 150, yTop: 26 } as const;

export function arcPoint(f: number): { x: number; y: number } {
  return { x: ARC.x0 + (ARC.x1 - ARC.x0) * f, y: ARC.yBase - (ARC.yBase - ARC.yTop) * Math.sin(Math.PI * f) };
}

export function arcPath(): string {
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const { x, y } = arcPoint(i / 48);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${pts.join("L")}`;
}

// ---------- Darstellung zu einer Minute ----------

export interface Visuals {
  flows: Record<FlowKey, { opacity: number; width: number }>;
  soc: number;
  window: number;
  glint: number;
  hub: number;
  sky: { day: number; dusk: number; night: number };
  sun: { x: number; y: number; opacity: number };
  moon: number;
  text: {
    clock: string;
    phase: string;
    pv: string;
    load: string;
    soc: string;
    socSub: string;
    grid: string;
    gridSub: string;
  };
}

function flow(power: number) {
  const k = clamp01(power / 30);
  return { opacity: +Math.pow(k, 0.7).toFixed(3), width: +(2.2 + 4 * clamp01(power / 400)).toFixed(2) };
}

export function visualsAt(data: StageData, minute: number): Visuals {
  const s = sampleAt(data, minute);
  const m = ((minute % 1440) + 1440) % 1440;
  const f = (m - data.sunrise) / (data.sunset - data.sunrise);
  let elev: number;
  if (f >= 0 && f <= 1) elev = Math.sin(Math.PI * f);
  else {
    const hoursOut = f < 0 ? (data.sunrise - m) / 60 : (m - data.sunset) / 60;
    elev = -Math.min(1, hoursOut / 2.5);
  }
  const day = clamp01((elev - 0.05) / 0.4);
  const dusk = clamp01(1 - Math.abs(elev - 0.02) / 0.3);
  const night = clamp01(-elev / 0.35);
  const sunF = Math.min(1, Math.max(0, f));
  const sunPt = arcPoint(sunF);
  const sunOpacity = f > 0 && f < 1 ? clamp01(Math.min(f, 1 - f) / 0.03) : 0;

  const hour = m / 60;
  const phase = hour >= 5 && hour < 10 ? "Morgen" : hour >= 10 && hour < 17 ? "Tag" : hour >= 17 && hour < 22 ? "Abend" : "Nacht";
  const reserve = s.soc <= data.minSoc + 0.6;
  const socSub = s.charge > 4 ? `lädt · ${fmtW(s.charge)}` : s.discharge > 4 ? `gibt ab · ${fmtW(s.discharge)}` : reserve ? "Reserve erreicht" : "wartet";
  const grid = s.imp > 4 ? fmtW(s.imp) : s.exp > 4 ? fmtW(s.exp) : fmtW(0);
  const gridSub = s.imp > 4 ? "Bezug" : s.exp > 4 ? "Einspeisung" : "kein Bezug";

  return {
    flows: {
      pvHouse: flow(s.direct),
      pvBattery: flow(s.charge),
      batteryHouse: flow(s.discharge),
      gridHouse: flow(s.imp),
      houseGrid: flow(s.exp),
    },
    soc: +(clamp01(s.soc / 100)).toFixed(3),
    window: +(0.14 + 0.86 * (1 - day) * clamp01(s.load / 380)).toFixed(3),
    glint: +(0.08 + 0.8 * clamp01(s.pv / Math.max(1, data.pvMax))).toFixed(3),
    hub: +(0.25 + 0.75 * clamp01(s.load / 450)).toFixed(3),
    sky: { day: +day.toFixed(3), dusk: +dusk.toFixed(3), night: +night.toFixed(3) },
    sun: { x: +sunPt.x.toFixed(1), y: +sunPt.y.toFixed(1), opacity: +sunOpacity.toFixed(3) },
    moon: +night.toFixed(3),
    text: {
      clock: fmtClock(minute),
      phase,
      pv: fmtW(s.pv),
      load: fmtW(s.load),
      soc: fmtPct(s.soc),
      socSub,
      grid,
      gridSub,
    },
  };
}
