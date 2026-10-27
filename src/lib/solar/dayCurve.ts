/**
 * Schematischer Tagesverlauf für die Erklärung „mit oder ohne Speicher“.
 * Das ist eine Veranschaulichung (sonniger Sommertag, typischer Haushalt),
 * keine Messung und keine Ertragsprognose. Werte sind relativ (0–1).
 */
export interface DayPoint {
  /** Stunde 0–24 */
  h: number;
  /** Solarertrag (relativ) */
  pv: number;
  /** Verbrauch (relativ) */
  load: number;
  /** Direkt genutzter Solarstrom */
  direct: number;
  /** Strom aus dem Speicher */
  fromBattery: number;
  /** Überschuss, der in den Speicher geht */
  toBattery: number;
  /** Überschuss, der ins Netz fließt */
  toGrid: number;
  /** Ladezustand 0–1 */
  soc: number;
}

const SUNRISE = 5.5;
const SUNSET = 21;

/** Glockenförmiger Solarertrag zwischen Sonnenauf- und -untergang */
export function pvShape(h: number): number {
  if (h <= SUNRISE || h >= SUNSET) return 0;
  const x = (h - SUNRISE) / (SUNSET - SUNRISE);
  return Math.pow(Math.sin(Math.PI * x), 1.6);
}

/** Typischer Haushalt: Grundlast, Morgen- und Abendspitze */
export function loadShape(h: number): number {
  const bump = (center: number, width: number, height: number) => height * Math.exp(-((h - center) ** 2) / (2 * width ** 2));
  return 0.2 + bump(7.5, 1.1, 0.28) + bump(13, 1.4, 0.1) + bump(19.5, 1.8, 0.45);
}

/**
 * Simuliert einen Tag in 15-Minuten-Schritten.
 * @param pvScale Höhe der Solarkurve relativ zur Last (Anlagengröße)
 * @param capacity Speichergröße relativ (0 = ohne Speicher)
 */
export function simulateDay(pvScale = 1.15, capacity = 0): DayPoint[] {
  const steps = 96;
  const dt = 24 / steps;
  let soc = 0;
  const out: DayPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const h = i * dt;
    const pv = pvShape(h) * pvScale;
    const load = loadShape(h);
    const direct = Math.min(pv, load);
    const surplus = pv - direct;
    const deficit = load - direct;
    let toBattery = 0;
    let fromBattery = 0;
    if (capacity > 0) {
      toBattery = Math.min(surplus, (capacity - soc) / dt);
      soc += toBattery * dt;
      fromBattery = Math.min(deficit, soc / dt);
      soc -= fromBattery * dt;
    }
    out.push({ h, pv, load, direct, fromBattery, toBattery, toGrid: surplus - toBattery, soc: capacity > 0 ? soc / capacity : 0 });
  }
  return out;
}

/** Anteil des Solarstroms, der im Haushalt genutzt wird (für den Vergleich in der Grafik) */
export function selfUseShare(points: DayPoint[]): number {
  const pv = points.reduce((s, p) => s + p.pv, 0);
  const used = points.reduce((s, p) => s + p.direct + p.toBattery, 0);
  return pv > 0 ? used / pv : 0;
}
