import { monthlyShare, solarAssumptions } from "@/config/solar-assumptions";

/**
 * Tagessimulation für das Energie-Dashboard (Kapitel 4 der Startseite).
 *
 * Alles hier sind BEISPIELDATEN aus einem vereinfachten Modell, keine Messwerte:
 * - Erzeugung: Jahresertrag aus den Annahmen des Ertragsrechners, verteilt nach
 *   Monatsanteilen; der Tagesverlauf ist eine idealisierte Kurve zwischen
 *   Sonnenauf- und -untergang (Durchschnittstag ohne Wetterschwankungen).
 * - Verbrauch: vereinfachtes Haushaltslastprofil (Grundlast nachts, Spitzen
 *   morgens, mittags und abends), saisonal skaliert.
 * - Speicher: DC-gekoppelt mit Regelung auf Nulleinspeisung: Der Haushalt
 *   wird zuerst versorgt, Überschuss lädt den Speicher, Bedarf entlädt ihn.
 */

export type Season = "sommer" | "uebergang" | "winter";

export interface StorageConfig {
  capacityKWh: number;
  /** Untere Entladegrenze in Prozent */
  minSocPct: number;
  maxChargeW: number;
  maxDischargeW: number;
  /** Wirkungsgrad je Richtung (Laden bzw. Entladen) */
  efficiency: number;
}

export interface SimConfig {
  peakWp: number;
  inverterMaxW: number;
  specificYieldKWhPerKWp: number;
  orientationFactor: number;
  mountingFactor: number;
  householdKWhPerYear: number;
  electricityPriceCt: number;
  feedInTariffCt: number;
  storage: StorageConfig | null;
  /** Zeitschritt in Minuten (muss 1440 teilen) */
  stepMinutes: number;
}

export const exampleStorage: StorageConfig = {
  capacityKWh: 1.6,
  minSocPct: 10,
  maxChargeW: 1000,
  maxDischargeW: 800,
  efficiency: 0.95,
};

/** Beispielanlage des Dashboards (bewusst generisch, kein bestimmtes Produkt) */
export const exampleConfig: SimConfig = {
  peakWp: 880,
  inverterMaxW: solarAssumptions.plugInLimits.inverterMaxW,
  specificYieldKWhPerKWp: solarAssumptions.specificYieldKWhPerKWp,
  orientationFactor: solarAssumptions.orientation.sued.factor,
  mountingFactor: solarAssumptions.mounting.flachdach.factor,
  householdKWhPerYear: 2500,
  electricityPriceCt: solarAssumptions.electricityPriceCt,
  feedInTariffCt: solarAssumptions.feedInTariffCt,
  storage: exampleStorage,
  stepMinutes: 5,
};

// ---------- Kalender und Sonnenstand (ca. 51° N, gesetzliche Uhrzeit) ----------

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
/** Tageslänge in Stunden je Monat (Mitte Deutschland, gerundet) */
export const DAY_LENGTH_H = [8.3, 9.9, 11.8, 13.7, 15.4, 16.4, 15.9, 14.4, 12.5, 10.6, 8.9, 7.9] as const;
/** Sonnenhöchststand in Uhrzeit (MEZ bzw. MESZ) */
export const SOLAR_NOON_H = [12.4, 12.45, 12.4, 13.35, 13.3, 13.35, 13.45, 13.4, 13.2, 13.05, 12.05, 12.2] as const;
/** Saisonaler Mehr- oder Minderverbrauch des Haushalts (Licht, Heizungspumpe …) */
export const LOAD_FACTOR = [1.18, 1.12, 1.04, 0.98, 0.92, 0.88, 0.88, 0.9, 0.96, 1.04, 1.12, 1.18] as const;

export const SEASONS: Record<Season, { label: string; monthIndex: number; monthLabel: string }> = {
  sommer: { label: "Sommer", monthIndex: 5, monthLabel: "Juni" },
  uebergang: { label: "Übergang", monthIndex: 3, monthLabel: "April" },
  winter: { label: "Winter", monthIndex: 11, monthLabel: "Dezember" },
};

/**
 * Vereinfachtes Haushaltslastprofil: relative Leistung je volle Stunde (0–23 Uhr).
 * Grundlast nachts (Kühlschrank, Router, Standby), Spitzen morgens, mittags und abends.
 */
export const LOAD_SHAPE = [
  0.55, 0.48, 0.45, 0.44, 0.45, 0.52, 0.8, 1.15, 1.1, 0.95, 0.92, 1.05, 1.25, 1.1, 0.92, 0.88, 0.95, 1.2, 1.55, 1.7, 1.6, 1.4, 1.05, 0.75,
] as const;
const LOAD_SHAPE_MEAN = LOAD_SHAPE.reduce((a, b) => a + b, 0) / LOAD_SHAPE.length;

/** Exponent der Erzeugungskurve: > 1 macht den Mittag ausgeprägter */
const PV_SHAPE_EXP = 1.5;

// ---------- Profile ----------

/** Relative Last zur Uhrzeit (Stunden, 0–24), weich zwischen den vollen Stunden interpoliert */
export function loadShapeAt(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  // Werte gelten jeweils zur halben Stunde; dazwischen Kosinus-Interpolation
  const pos = h - 0.5;
  const i0 = Math.floor(pos);
  const t = pos - i0;
  const a = LOAD_SHAPE[(i0 + 24) % 24]!;
  const b = LOAD_SHAPE[(i0 + 1 + 24) % 24]!;
  const w = (1 - Math.cos(Math.PI * t)) / 2;
  return (a + (b - a) * w) / LOAD_SHAPE_MEAN;
}

/** Normierungsfaktor, damit der Jahresverbrauch exakt `householdKWhPerYear` ergibt */
function loadNormalization(): number {
  let weighted = 0;
  for (let m = 0; m < 12; m++) weighted += LOAD_FACTOR[m]! * DAYS_IN_MONTH[m]!;
  return 365 / weighted;
}

export function annualPvKWh(cfg: SimConfig): number {
  return (cfg.peakWp / 1000) * cfg.specificYieldKWhPerKWp * cfg.orientationFactor * cfg.mountingFactor;
}

/** Form der Erzeugungskurve zwischen Sonnenauf- und -untergang */
function pvShape(hour: number, sunrise: number, sunset: number): number {
  if (hour <= sunrise || hour >= sunset) return 0;
  return Math.pow(Math.sin((Math.PI * (hour - sunrise)) / (sunset - sunrise)), PV_SHAPE_EXP);
}

// ---------- Simulation eines Tages ----------

export interface SimStep {
  /** Minute des Tages (Beginn des Schritts) */
  minute: number;
  pvW: number;
  loadW: number;
  /** Solarstrom, der direkt im Haushalt genutzt wird */
  directW: number;
  /** Leistung in den Speicher (vor Ladeverlust) */
  chargeW: number;
  /** Leistung aus dem Speicher in den Haushalt (nach Entladeverlust) */
  dischargeW: number;
  exportW: number;
  importW: number;
  /** Abgeregelt, weil Wechselrichtergrenze erreicht und Speicher voll */
  curtailedW: number;
  /** Ladestand am Ende des Schritts in Prozent, null ohne Speicher */
  socPct: number | null;
}

export interface DayTotals {
  pvKWh: number;
  loadKWh: number;
  directKWh: number;
  chargeKWh: number;
  dischargeKWh: number;
  exportKWh: number;
  importKWh: number;
  curtailedKWh: number;
  /** Im Haushalt genutzter Solarstrom (direkt + aus dem Speicher) */
  selfUseKWh: number;
  savingsEUR: number;
  /** Anteil des Solarstroms, der nicht ins Netz geht (Eigenverbrauchsquote) */
  selfConsumptionRate: number;
  /** Anteil des Verbrauchs, der aus eigenem Solarstrom kommt (Autarkiegrad) */
  autarkyRate: number;
}

export interface DayResult {
  monthIndex: number;
  stepMinutes: number;
  sunrise: number;
  sunset: number;
  pvDailyKWh: number;
  loadDailyKWh: number;
  steps: SimStep[];
  totals: DayTotals;
  /** Laufende Summen je Schritt (Ende des Schritts), für schnelle Zwischenstände */
  cumulative: DayTotals[];
  /** Ladestand zu Tagesbeginn (eingeschwungen) */
  startSocPct: number | null;
}

const ZERO_TOTALS: DayTotals = {
  pvKWh: 0,
  loadKWh: 0,
  directKWh: 0,
  chargeKWh: 0,
  dischargeKWh: 0,
  exportKWh: 0,
  importKWh: 0,
  curtailedKWh: 0,
  selfUseKWh: 0,
  savingsEUR: 0,
  selfConsumptionRate: 0,
  autarkyRate: 0,
};

function finishTotals(t: DayTotals, cfg: SimConfig): DayTotals {
  const selfUseKWh = t.directKWh + t.dischargeKWh;
  return {
    ...t,
    selfUseKWh,
    savingsEUR: selfUseKWh * (cfg.electricityPriceCt / 100) + t.exportKWh * (cfg.feedInTariffCt / 100),
    selfConsumptionRate: t.pvKWh > 0 ? (t.pvKWh - t.exportKWh - t.curtailedKWh) / t.pvKWh : 0,
    autarkyRate: t.loadKWh > 0 ? selfUseKWh / t.loadKWh : 0,
  };
}

function runDay(monthIndex: number, cfg: SimConfig, startSocKWh: number) {
  const step = cfg.stepMinutes;
  if (1440 % step !== 0) throw new Error("stepMinutes muss 1440 teilen");
  const n = 1440 / step;
  const dtH = step / 60;
  const sunrise = SOLAR_NOON_H[monthIndex]! - DAY_LENGTH_H[monthIndex]! / 2;
  const sunset = SOLAR_NOON_H[monthIndex]! + DAY_LENGTH_H[monthIndex]! / 2;

  // Tagesenergie der Erzeugung und Normierung der Kurve
  const pvDailyKWh = (annualPvKWh(cfg) * monthlyShare[monthIndex]!) / DAYS_IN_MONTH[monthIndex]!;
  let shapeSum = 0;
  for (let i = 0; i < n; i++) shapeSum += pvShape((i + 0.5) * dtH, sunrise, sunset) * dtH;
  const pvScaleW = shapeSum > 0 ? (pvDailyKWh * 1000) / shapeSum : 0;

  const loadDailyKWh = (cfg.householdKWhPerYear / 365) * LOAD_FACTOR[monthIndex]! * loadNormalization();
  const loadScaleW = (loadDailyKWh * 1000) / 24;

  const st = cfg.storage;
  const capKWh = st ? st.capacityKWh : 0;
  const minKWh = st ? (st.capacityKWh * st.minSocPct) / 100 : 0;
  let soc = st ? Math.min(capKWh, Math.max(minKWh, startSocKWh)) : 0;

  const steps: SimStep[] = [];
  const cumulative: DayTotals[] = [];
  const acc = { ...ZERO_TOTALS };
  const limit = cfg.inverterMaxW;

  for (let i = 0; i < n; i++) {
    const hour = (i + 0.5) * dtH;
    const pvW = pvShape(hour, sunrise, sunset) * pvScaleW;
    const loadW = loadShapeAt(hour) * loadScaleW;
    let directW = 0;
    let chargeW = 0;
    let dischargeW = 0;
    let exportW = 0;
    let curtailedW = 0;

    if (!st) {
      const ac = Math.min(pvW, limit);
      curtailedW = pvW - ac;
      directW = Math.min(ac, loadW);
      exportW = ac - directW;
    } else {
      // Ausgang folgt dem Bedarf (Nulleinspeisung), höchstens bis zur Wechselrichtergrenze
      const target = Math.min(loadW, limit);
      if (pvW >= target) {
        directW = target;
        const surplus = pvW - target;
        const roomW = Math.max(0, ((capKWh - soc) / st.efficiency / dtH) * 1000);
        chargeW = Math.min(surplus, st.maxChargeW, roomW);
        soc += (chargeW * dtH * st.efficiency) / 1000;
        const rest = surplus - chargeW;
        exportW = Math.min(rest, Math.max(0, limit - directW));
        curtailedW = rest - exportW;
      } else {
        directW = pvW;
        const deficit = target - pvW;
        const availW = Math.max(0, ((soc - minKWh) * st.efficiency / dtH) * 1000);
        dischargeW = Math.min(deficit, st.maxDischargeW, availW, Math.max(0, limit - directW));
        soc -= (dischargeW * dtH) / 1000 / st.efficiency;
      }
      soc = Math.min(capKWh, Math.max(minKWh, soc));
    }

    const importW = Math.max(0, loadW - directW - dischargeW);
    steps.push({
      minute: i * step,
      pvW,
      loadW,
      directW,
      chargeW,
      dischargeW,
      exportW,
      importW,
      curtailedW,
      socPct: st ? (soc / capKWh) * 100 : null,
    });

    acc.pvKWh += (pvW * dtH) / 1000;
    acc.loadKWh += (loadW * dtH) / 1000;
    acc.directKWh += (directW * dtH) / 1000;
    acc.chargeKWh += (chargeW * dtH) / 1000;
    acc.dischargeKWh += (dischargeW * dtH) / 1000;
    acc.exportKWh += (exportW * dtH) / 1000;
    acc.importKWh += (importW * dtH) / 1000;
    acc.curtailedKWh += (curtailedW * dtH) / 1000;
    cumulative.push(finishTotals({ ...acc }, cfg));
  }

  return { steps, cumulative, totals: finishTotals({ ...acc }, cfg), endSocKWh: soc, sunrise, sunset, pvDailyKWh, loadDailyKWh };
}

/**
 * Simuliert einen eingeschwungenen Beispieltag: Der Speicher startet mit dem
 * Ladestand, mit dem er den Vortag beendet hat.
 */
export function simulateDay(monthIndex: number, cfg: SimConfig = exampleConfig): DayResult {
  let startSoc = cfg.storage ? (cfg.storage.capacityKWh * cfg.storage.minSocPct) / 100 : 0;
  let run = runDay(monthIndex, cfg, startSoc);
  if (cfg.storage) {
    for (let k = 0; k < 4; k++) {
      startSoc = run.endSocKWh;
      run = runDay(monthIndex, cfg, startSoc);
    }
  }
  return {
    monthIndex,
    stepMinutes: cfg.stepMinutes,
    sunrise: run.sunrise,
    sunset: run.sunset,
    pvDailyKWh: run.pvDailyKWh,
    loadDailyKWh: run.loadDailyKWh,
    steps: run.steps,
    totals: run.totals,
    cumulative: run.cumulative,
    startSocPct: cfg.storage ? (startSoc / cfg.storage.capacityKWh) * 100 : null,
  };
}

export function simulateSeason(season: Season, withStorage: boolean, base: SimConfig = exampleConfig): DayResult {
  return simulateDay(SEASONS[season].monthIndex, { ...base, storage: withStorage ? base.storage ?? exampleStorage : null });
}

/** Schritt zur Minute (abgerundet auf den Zeitschritt) */
export function stepAt(day: DayResult, minute: number): SimStep {
  const i = Math.min(day.steps.length - 1, Math.max(0, Math.floor(minute / day.stepMinutes)));
  return day.steps[i]!;
}

/** Zwischenstand von 0 Uhr bis zur angegebenen Minute */
export function totalsUntil(day: DayResult, minute: number): DayTotals {
  if (minute <= 0) return { ...ZERO_TOTALS };
  const i = Math.min(day.cumulative.length - 1, Math.floor(minute / day.stepMinutes) - 1);
  return i < 0 ? { ...ZERO_TOTALS } : day.cumulative[i]!;
}

export interface YearTotals {
  pvKWh: number;
  loadKWh: number;
  selfUseKWh: number;
  importKWh: number;
  exportKWh: number;
  savingsEUR: number;
  autarkyRate: number;
  selfConsumptionRate: number;
}

/** Hochrechnung aufs Jahr: je Monat ein eingeschwungener Durchschnittstag */
export function simulateYear(withStorage: boolean, base: SimConfig = exampleConfig): YearTotals {
  const cfg = { ...base, storage: withStorage ? base.storage ?? exampleStorage : null };
  const y = { pvKWh: 0, loadKWh: 0, selfUseKWh: 0, importKWh: 0, exportKWh: 0, curtailedKWh: 0, savingsEUR: 0 };
  for (let m = 0; m < 12; m++) {
    const d = simulateDay(m, cfg).totals;
    const days = DAYS_IN_MONTH[m]!;
    y.pvKWh += d.pvKWh * days;
    y.loadKWh += d.loadKWh * days;
    y.selfUseKWh += d.selfUseKWh * days;
    y.importKWh += d.importKWh * days;
    y.exportKWh += d.exportKWh * days;
    y.curtailedKWh += d.curtailedKWh * days;
    y.savingsEUR += d.savingsEUR * days;
  }
  return {
    pvKWh: y.pvKWh,
    loadKWh: y.loadKWh,
    selfUseKWh: y.selfUseKWh,
    importKWh: y.importKWh,
    exportKWh: y.exportKWh,
    savingsEUR: y.savingsEUR,
    autarkyRate: y.loadKWh > 0 ? y.selfUseKWh / y.loadKWh : 0,
    selfConsumptionRate: y.pvKWh > 0 ? (y.pvKWh - y.exportKWh - y.curtailedKWh) / y.pvKWh : 0,
  };
}

/** "14:35" */
export function formatClock(minute: number): string {
  const m = ((Math.round(minute) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
