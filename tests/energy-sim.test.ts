import { describe, expect, it } from "vitest";
import {
  annualPvKWh,
  exampleConfig,
  formatClock,
  loadShapeAt,
  simulateDay,
  simulateSeason,
  simulateYear,
  stepAt,
  totalsUntil,
  type SimConfig,
} from "@/lib/energy-sim";
import { monthlyShare } from "@/config/solar-assumptions";

const EPS = 1e-6;

describe("Energie-Simulation: Tagesbilanz", () => {
  for (const season of ["sommer", "uebergang", "winter"] as const) {
    for (const storage of [true, false]) {
      it(`geht für ${season} ${storage ? "mit" : "ohne"} Speicher in jedem Schritt auf`, () => {
        const day = simulateSeason(season, storage);
        for (const s of day.steps) {
          // Erzeugung = direkt genutzt + geladen + eingespeist + abgeregelt
          expect(s.directW + s.chargeW + s.exportW + s.curtailedW).toBeCloseTo(s.pvW, 6);
          // Verbrauch = direkt + aus dem Speicher + aus dem Netz
          expect(s.directW + s.dischargeW + s.importW).toBeCloseTo(s.loadW, 6);
          for (const v of [s.pvW, s.loadW, s.directW, s.chargeW, s.dischargeW, s.exportW, s.importW, s.curtailedW]) {
            expect(v).toBeGreaterThanOrEqual(-EPS);
          }
          // Nie gleichzeitig laden und entladen
          expect(Math.min(s.chargeW, s.dischargeW)).toBeLessThan(EPS);
        }
      });
    }
  }

  it("verteilt den Jahresertrag korrekt auf den Monatstag", () => {
    const june = simulateDay(5);
    const expected = (annualPvKWh(exampleConfig) * monthlyShare[5]) / 30;
    expect(june.totals.pvKWh).toBeCloseTo(expected, 6);
    expect(june.pvDailyKWh).toBeCloseTo(expected, 6);
  });

  it("erzeugt nachts nichts und mittags am meisten", () => {
    const day = simulateSeason("sommer", false);
    expect(stepAt(day, 2 * 60).pvW).toBe(0);
    expect(stepAt(day, 23 * 60).pvW).toBe(0);
    const peak = day.steps.reduce((a, b) => (b.pvW > a.pvW ? b : a));
    expect(peak.minute).toBeGreaterThan(12 * 60);
    expect(peak.minute).toBeLessThan(15 * 60);
  });

  it("hat ein normiertes Lastprofil mit Spitzen am Abend", () => {
    let sum = 0;
    for (let h = 0; h < 24; h += 0.25) sum += loadShapeAt(h) * 0.25;
    expect(sum / 24).toBeCloseTo(1, 2);
    expect(loadShapeAt(19.5)).toBeGreaterThan(loadShapeAt(3.5) * 3);
  });

  it("ergibt übers Jahr den eingestellten Haushaltsverbrauch", () => {
    const y = simulateYear(false);
    expect(y.loadKWh).toBeCloseTo(exampleConfig.householdKWhPerYear, 0);
    expect(y.pvKWh).toBeCloseTo(annualPvKWh(exampleConfig), 0);
  });
});

describe("Energie-Simulation: Speicher", () => {
  it("hält den Ladestand zwischen Untergrenze und 100 %", () => {
    for (const season of ["sommer", "uebergang", "winter"] as const) {
      const day = simulateSeason(season, true);
      for (const s of day.steps) {
        expect(s.socPct).not.toBeNull();
        expect(s.socPct!).toBeGreaterThanOrEqual(exampleConfig.storage!.minSocPct - EPS);
        expect(s.socPct!).toBeLessThanOrEqual(100 + EPS);
      }
    }
  });

  it("ist eingeschwungen: Ladestand am Tagesende ≈ Tagesbeginn", () => {
    const day = simulateSeason("sommer", true);
    const last = day.steps[day.steps.length - 1]!;
    expect(Math.abs(last.socPct! - day.startSocPct!)).toBeLessThan(1);
  });

  it("verliert Energie beim Speichern (Wirkungsgrad) statt sie zu erzeugen", () => {
    const day = simulateSeason("sommer", true);
    // Was entladen wird, kann über einen Tag nicht mehr sein als das Geladene abzüglich Verlusten
    const eta = exampleConfig.storage!.efficiency;
    expect(day.totals.dischargeKWh).toBeLessThanOrEqual(day.totals.chargeKWh * eta * eta + 0.02);
  });

  it("hat ohne Speicher keinen Ladestand und keine Speicherflüsse", () => {
    const day = simulateSeason("sommer", false);
    expect(day.startSocPct).toBeNull();
    for (const s of day.steps) {
      expect(s.socPct).toBeNull();
      expect(s.chargeW).toBe(0);
      expect(s.dischargeW).toBe(0);
    }
  });

  it("erhöht mit Speicher Eigenverbrauch und Ersparnis, senkt den Netzbezug", () => {
    const without = simulateYear(false);
    const withS = simulateYear(true);
    expect(withS.selfUseKWh).toBeGreaterThan(without.selfUseKWh);
    expect(withS.savingsEUR).toBeGreaterThan(without.savingsEUR);
    expect(withS.importKWh).toBeLessThan(without.importKWh);
  });

  it("speist bei einem vollen Speicher höchstens bis zur Wechselrichtergrenze ein", () => {
    const big: SimConfig = { ...exampleConfig, peakWp: 2000, storage: { ...exampleConfig.storage!, capacityKWh: 0.2 } };
    const day = simulateDay(5, big);
    for (const s of day.steps) expect(s.directW + s.dischargeW + s.exportW).toBeLessThanOrEqual(big.inverterMaxW + EPS);
  });
});

describe("Energie-Simulation: Einsparung und Zwischenstände", () => {
  it("rechnet die Einsparung aus genutztem Solarstrom und Strompreis", () => {
    const day = simulateSeason("uebergang", true);
    expect(day.totals.savingsEUR).toBeCloseTo(day.totals.selfUseKWh * (exampleConfig.electricityPriceCt / 100), 6);
    expect(day.totals.savingsEUR).toBeGreaterThan(0);
    // Nie mehr sparen, als der gesamte Verbrauch kosten würde
    expect(day.totals.savingsEUR).toBeLessThanOrEqual(day.totals.loadKWh * (exampleConfig.electricityPriceCt / 100));
  });

  it("liefert plausible Jahreswerte für die Beispielanlage", () => {
    const y = simulateYear(true);
    expect(y.savingsEUR).toBeGreaterThan(100);
    expect(y.savingsEUR).toBeLessThan(400);
    expect(y.autarkyRate).toBeGreaterThan(0.1);
    expect(y.autarkyRate).toBeLessThan(0.5);
  });

  it("baut Zwischenstände monoton bis zum Tageswert auf", () => {
    const day = simulateSeason("sommer", true);
    expect(totalsUntil(day, 0).pvKWh).toBe(0);
    let prev = 0;
    for (let m = 0; m <= 1440; m += 60) {
      const t = totalsUntil(day, m);
      expect(t.pvKWh).toBeGreaterThanOrEqual(prev - EPS);
      prev = t.pvKWh;
    }
    expect(totalsUntil(day, 1440).pvKWh).toBeCloseTo(day.totals.pvKWh, 9);
  });

  it("formatiert Uhrzeiten", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(13 * 60 + 5)).toBe("13:05");
    expect(formatClock(1440)).toBe("00:00");
  });
});
