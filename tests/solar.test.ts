import { describe, expect, it } from "vitest";
import { clippingLossFor, simulate } from "@/lib/solar/calc";
import { recommend, targetWp } from "@/lib/solar/recommend";
import { getAllProducts } from "@/lib/catalog";

describe("simulate", () => {
  it("berechnet den Jahresertrag aus Leistung, Ausrichtung und Montage", () => {
    // 800 Wp liegen genau an der Wechselrichtergrenze, also ohne Begrenzungsverlust
    const r = simulate({ totalWp: 800, orientation: "sued", mounting: "schraegdach", withStorage: false, systemCostEUR: null });
    expect(r.annualKWh).toBeCloseTo(760, 5);
    expect(r.monthlyKWh.reduce((a, b) => a + b, 0)).toBeCloseTo(760, 5);
  });

  it("senkrechte Balkonmontage bringt weniger als ein Schrägdach", () => {
    const balkon = simulate({ totalWp: 880, orientation: "sued", mounting: "balkon", withStorage: false, systemCostEUR: 329 });
    const dach = simulate({ totalWp: 880, orientation: "sued", mounting: "schraegdach", withStorage: false, systemCostEUR: 329 });
    expect(balkon.annualKWh).toBeLessThan(dach.annualKWh);
  });

  it("Speicher erhöht die Ersparnis bei gleichem Ertrag", () => {
    const a = simulate({ totalWp: 880, orientation: "sued", mounting: "balkon", withStorage: false, systemCostEUR: 1000 });
    const b = simulate({ totalWp: 880, orientation: "sued", mounting: "balkon", withStorage: true, systemCostEUR: 1000 });
    expect(b.annualKWh).toBeCloseTo(a.annualKWh, 6);
    expect(b.firstYearSavingsEUR).toBeGreaterThan(a.firstYearSavingsEUR);
  });

  it("findet die Amortisation zwischen zwei Jahren", () => {
    const r = simulate({
      totalWp: 800,
      orientation: "sued",
      mounting: "schraegdach",
      withStorage: false,
      systemCostEUR: 500,
      assumptions: { electricityPriceCt: 40, selfConsumptionWithout: 0.5, priceIncreasePct: 0, degradationPct: 0 },
    });
    // 760 kWh * 0,5 * 0,40 € = 152 € pro Jahr -> 500 / 152 = 3,29 Jahre
    expect(r.firstYearSavingsEUR).toBeCloseTo(152, 5);
    expect(r.paybackYears).toBeCloseTo(500 / 152, 5);
  });

  it("gibt keine Amortisation an, wenn der Preis unbekannt ist", () => {
    const r = simulate({ totalWp: 880, orientation: "sued", mounting: "balkon", withStorage: false, systemCostEUR: null });
    expect(r.paybackYears).toBeNull();
  });

  it("rechnet mit Verlust durch die 800-W-Begrenzung erst bei deutlicher Überbelegung", () => {
    expect(clippingLossFor(880)).toBe(0);
    expect(clippingLossFor(2000)).toBeGreaterThan(0);
    expect(clippingLossFor(10000)).toBe(0.12);
  });
});

describe("recommend", () => {
  const products = getAllProducts();

  it("empfiehlt mit Speicherwunsch zuerst ein Set mit Speicher", () => {
    const r = recommend({ location: "balkon", storage: "ja", modules: 2, power: "klein", budget: null }, products);
    expect(r[0]?.product.specs.storageKWh).toBeGreaterThan(0);
  });

  it("filtert Sets, die nicht zum Einsatzort passen", () => {
    const r = recommend({ location: "balkon", storage: "offen", modules: 4, power: "gross", budget: null }, products);
    expect(r.every((x) => x.product.suitableFor.includes("balkon"))).toBe(true);
  });

  it("bevorzugt Sets im Budget", () => {
    const r = recommend({ location: "garten", storage: "offen", modules: 2, power: "klein", budget: 400 }, products);
    expect(r[0]?.product.price).toBeLessThanOrEqual(400);
  });

  it("begrenzt die Zielleistung auf 2.000 Wp", () => {
    expect(targetWp({ location: "garten", storage: "nein", modules: 4, power: "gross", budget: null })).toBeLessThanOrEqual(2000);
  });
});
