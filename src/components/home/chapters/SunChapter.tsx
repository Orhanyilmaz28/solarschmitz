import { solarAssumptions } from "@/config/solar-assumptions";
import { exampleConfig, formatClock, SEASONS, simulateDay, simulateYear, stepAt, totalsUntil, type SimConfig } from "@/lib/energy-sim";
import { SIEDLUNG_LAYOUT, type SiedlungVariant } from "./sun/siedlung";
import { SunStage, type SunData, type SunGeometry } from "./SunStage";

/**
 * Kapitel 1 – „Die Sonne liefert. Du profitierst.“
 * Ein Junitag mit Balkonkraftwerk als Scroll-Szene: Die Sonne zieht über die
 * Siedlung, die Ertragskurve wächst mit, Fenster gehen aus und wieder an.
 * Alle Zahlen stammen aus derselben Beispielrechnung wie das Energie-Dashboard.
 */

/** Beispielanlage: 880 Wp am Südbalkon, senkrecht montiert, ohne Speicher */
const CONFIG: SimConfig = {
  ...exampleConfig,
  mountingFactor: solarAssumptions.mounting.balkon.factor,
  orientationFactor: solarAssumptions.orientation.sued.factor,
  storage: null,
};

const START = 4 * 60 + 30; // 04:30
const END = 22 * 60 + 30; // 22:30
const STEP = 10;

const r1 = (n: number) => Math.round(n * 10) / 10;

function geometry(v: SiedlungVariant, sunrise: number, sunset: number, pvAt: (m: number) => number, pvMax: number): SunGeometry {
  const L = SIEDLUNG_LAYOUT[v];
  const xs: number[] = [];
  const ys: number[] = [];
  const arc: string[] = [];
  const N = 72;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const x = L.x0 + (L.x1 - L.x0) * s;
    const m = sunrise + (sunset - sunrise) * s;
    xs.push(r1(x));
    ys.push(r1(L.base - (L.curve * pvAt(m)) / pvMax));
    arc.push(`${r1(x)} ${r1(L.base - L.arc * Math.sin(Math.PI * s))}`);
  }
  return { ...L, xs, ys, arcPath: "M" + arc.join("L") };
}

export function SunChapter({ id = "kapitel-sonne", label = "Kapitel 1" }: { id?: string; label?: string }) {
  const day = simulateDay(SEASONS.sommer.monthIndex, CONFIG);
  const year = simulateYear(false, CONFIG);
  const sunrise = Math.round(day.sunrise * 60);
  const sunset = Math.round(day.sunset * 60);

  const pvAt = (m: number) => stepAt(day, m).pvW;
  let pvMax = 1;
  for (const s of day.steps) pvMax = Math.max(pvMax, s.pvW);

  const pv: number[] = [];
  const kwh: number[] = [];
  for (let m = START; m <= END; m += STEP) {
    pv.push(Math.round(pvAt(m)));
    kwh.push(Math.round(totalsUntil(day, m).pvKWh * 1000) / 1000);
  }

  const data: SunData = {
    start: START,
    end: END,
    step: STEP,
    sunrise,
    sunset,
    noon: Math.round((sunrise + sunset) / 2),
    pv,
    kwh,
    dayKWh: day.totals.pvKWh,
    selfUseKWh: day.totals.selfUseKWh,
    yearKWh: year.pvKWh,
    priceCt: CONFIG.electricityPriceCt,
    peakW: Math.round(pvMax),
    geo: {
      d: geometry("d", sunrise, sunset, pvAt, pvMax),
      m: geometry("m", sunrise, sunset, pvAt, pvMax),
    },
    clock: { sunrise: formatClock(sunrise), noon: formatClock((sunrise + sunset) / 2), sunset: formatClock(sunset) },
  };

  return <SunStage id={id} label={label} data={data} />;
}
