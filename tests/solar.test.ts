import { describe, expect, it } from "vitest";
import { clippingLossFor, simulate } from "@/lib/solar/calc";
import { accessoriesFor, candidatesFor, placeNotes, recommend, type FinderAnswers } from "@/lib/solar/recommend";
import { selfUseShare, simulateDay } from "@/lib/solar/dayCurve";
import { getAllProducts, hasPrice } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";

describe("simulate", () => {
  it("berechnet den Jahresertrag aus Leistung, Ausrichtung und Montage", () => {
    // 800 Wp liegen genau an der Wechselrichtergrenze, also ohne Begrenzungsverlust
    const r = simulate({ totalWp: 800, orientation: "sued", mounting: "schraegdach", withStorage: false, systemCostEUR: null });
    expect(r.annualKWh).toBeCloseTo(760, 5);
    expect(r.monthlyKWh.reduce((a, b) => a + b, 0)).toBeCloseTo(760, 5);
    expect(r.coverage).toBeNull();
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

  it("begrenzt den Eigenverbrauch auf den Haushaltsverbrauch", () => {
    const base = { totalWp: 2000, orientation: "sued", mounting: "schraegdach", withStorage: true, systemCostEUR: 1000 } as const;
    const unbegrenzt = simulate(base);
    const klein = simulate({ ...base, householdKWh: 500 });
    expect(unbegrenzt.selfUsedKWh).toBeGreaterThan(500);
    expect(klein.selfUsedKWh).toBeCloseTo(500, 6);
    expect(klein.feedInKWh).toBeCloseTo(klein.annualKWh - 500, 6);
    expect(klein.coverage).toBeCloseTo(1, 6);
    expect(klein.firstYearSavingsEUR).toBeLessThan(unbegrenzt.firstYearSavingsEUR);
  });

  it("startet die Bilanz ohne Preis bei 0 und nicht bei -0", () => {
    const r = simulate({ totalWp: 880, orientation: "sued", mounting: "balkon", withStorage: false, systemCostEUR: null });
    expect(Object.is(r.cashflow[0]!.cumulativeEUR, 0)).toBe(true);
    expect(r.paybackYears).toBeNull();
  });

  it("ändert ohne Haushaltsangabe nichts an der bisherigen Rechnung", () => {
    const a = simulate({ totalWp: 880, orientation: "ost_west", mounting: "garten", withStorage: false, systemCostEUR: 329 });
    const b = simulate({ totalWp: 880, orientation: "ost_west", mounting: "garten", withStorage: false, systemCostEUR: 329, householdKWh: 100000 });
    expect(b.firstYearSavingsEUR).toBeCloseTo(a.firstYearSavingsEUR, 6);
  });
});

describe("recommend", () => {
  const products = getAllProducts();
  const storageOf = (p: Product) => p.specs.storageKWh ?? 0;
  const ask = (a: Partial<FinderAnswers>): FinderAnswers => ({ place: "balkon", independence: "unsicher", priority: "preis", ...a });

  it("schlägt nur Sets vor, die zum Ort passen", () => {
    for (const place of ["balkon", "hausdach", "flachdach", "garten"] as const) {
      const r = recommend(ask({ place }), products);
      expect(r.length).toBeGreaterThan(0);
      const loc = place === "hausdach" ? "schraegdach" : place;
      expect(r.every((x) => x.product.suitableFor.includes(loc))).toBe(true);
      expect(r.every((x) => x.product.category.startsWith("balkonkraftwerke"))).toBe(true);
    }
  });

  it("stellt bei Speicherwunsch ein Set mit Speicher an den Anfang", () => {
    const r = recommend(ask({ independence: "speicher", priority: "preis" }), products);
    expect(storageOf(r[0]!.product)).toBeGreaterThan(0);
  });

  it("stellt ohne Speicherwunsch ein Set ohne Speicher an den Anfang", () => {
    const r = recommend(ask({ independence: "ohne", priority: "eigenversorgung" }), products);
    expect(storageOf(r[0]!.product)).toBe(0);
  });

  it("zeigt Unentschlossenen beide Wege", () => {
    const r = recommend(ask({ place: "garten", independence: "unsicher", priority: "leistung" }), products);
    expect(r.some((x) => storageOf(x.product) > 0)).toBe(true);
    expect(r.some((x) => storageOf(x.product) === 0)).toBe(true);
  });

  it("bevorzugt beim Preis das günstigste Set mit Preis", () => {
    const r = recommend(ask({ place: "balkon", independence: "unsicher", priority: "preis" }), products);
    const priced = candidatesFor("balkon", products).filter(hasPrice);
    const cheapest = Math.min(...priced.map((p) => p.price));
    expect(r[0]!.product.price).toBe(cheapest);
  });

  it("bevorzugt bei Leistung die höchste Modulleistung", () => {
    const r = recommend(ask({ place: "garten", independence: "ohne", priority: "leistung" }), products);
    const maxWp = Math.max(...candidatesFor("garten", products).filter((p) => !p.specs.storageKWh).map((p) => p.specs.totalWp ?? 0));
    expect(r[0]!.product.specs.totalWp).toBe(maxWp);
  });

  it("bevorzugt bei maximaler Eigenversorgung den größten Speicher", () => {
    const r = recommend(ask({ place: "flachdach", independence: "speicher", priority: "eigenversorgung" }), products);
    const maxStorage = Math.max(...candidatesFor("flachdach", products).map(storageOf));
    expect(storageOf(r[0]!.product)).toBe(maxStorage);
  });

  it("weist auf dem Hausdach auf Fachbetrieb und Grenzen hin", () => {
    const notes = placeNotes("hausdach").join(" ");
    expect(notes).toMatch(/Fachbetrieb/);
    expect(notes).toMatch(/800 W/);
    const r = recommend(ask({ place: "hausdach", priority: "installation" }), products);
    expect(r[0]!.caveats.join(" ")).toMatch(/Fachbetrieb/);
  });

  it("kennzeichnet Demo-Produkte als Einschränkung", () => {
    const r = recommend(ask({ place: "hausdach" }), products);
    const demo = r.find((x) => x.product.dataStatus === "demo");
    expect(demo?.caveats.join(" ")).toMatch(/Demo-Produkt/);
  });

  it("liefert für leere Sortimente keine Empfehlung", () => {
    expect(recommend(ask({}), [])).toEqual([]);
  });

  it("kommt mit einem einzigen passenden Set aus", () => {
    const only = products.filter((p) => p.id === "p-eforu-set-880");
    for (const priority of ["preis", "leistung", "eigenversorgung", "installation"] as const) {
      const r = recommend(ask({ priority }), only);
      expect(r).toHaveLength(1);
      expect(Number.isFinite(r[0]!.score)).toBe(true);
    }
  });

  it("vergibt ohne Preise keinen Preisvorteil", () => {
    const demos = candidatesFor("balkon", products).map((p) => ({ ...p, dataStatus: "demo" as const }));
    const r = recommend(ask({ priority: "preis" }), demos);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => Number.isFinite(x.score))).toBe(true);
    expect(r.some((x) => x.reasons.some((t) => /Günstigster Einstieg/.test(t)))).toBe(false);
    expect(r.every((x) => x.caveats.some((t) => /Demo-Produkt/.test(t)))).toBe(true);
  });

  it("ist deterministisch", () => {
    const a = recommend(ask({ place: "garten", independence: "speicher", priority: "leistung" }), products).map((x) => x.product.id);
    const b = recommend(ask({ place: "garten", independence: "speicher", priority: "leistung" }), products).map((x) => x.product.id);
    expect(a).toEqual(b);
  });
});

describe("accessoriesFor", () => {
  const products = getAllProducts();
  const set880 = products.find((p) => p.id === "p-eforu-set-880")!;
  const setWithStorage = products.find((p) => p.id === "p-eforu-set-880-e1600")!;

  it("empfiehlt im Garten Halterungen in passender Menge", () => {
    const hints = accessoriesFor({ place: "garten", independence: "ohne", priority: "preis" }, set880, products);
    const mount = hints.find((h) => h.kind === "montage");
    expect(mount).toBeDefined();
    expect(mount!.note).toMatch(/1 Halterung/);
  });

  it("empfiehlt auf dem Balkon keine Flachdach-Halterung", () => {
    const hints = accessoriesFor({ place: "balkon", independence: "ohne", priority: "preis" }, set880, products);
    expect(hints.some((h) => h.kind === "montage")).toBe(false);
  });

  it("schlägt AC-gekoppelte Speicher zum Nachrüsten nur vor, wenn das Set keinen hat", () => {
    const ohne = accessoriesFor({ place: "balkon", independence: "unsicher", priority: "preis" }, set880, products);
    expect(ohne.some((h) => h.kind === "nachruesten" && h.product.tags.includes("ac-gekoppelt"))).toBe(true);
    const mit = accessoriesFor({ place: "balkon", independence: "unsicher", priority: "preis" }, setWithStorage, products);
    expect(mit.some((h) => h.kind === "nachruesten")).toBe(false);
    const nein = accessoriesFor({ place: "balkon", independence: "ohne", priority: "preis" }, set880, products);
    expect(nein.some((h) => h.kind === "nachruesten")).toBe(false);
  });
});

describe("dayCurve", () => {
  it("ein Speicher erhöht den genutzten Anteil des Solarstroms", () => {
    expect(selfUseShare(simulateDay(1.15, 2.6))).toBeGreaterThan(selfUseShare(simulateDay(1.15, 0)));
  });

  it("nachts gibt es keinen Solarstrom", () => {
    const day = simulateDay();
    expect(day.find((p) => p.h === 2)!.pv).toBe(0);
    expect(day.find((p) => p.h === 23)!.pv).toBe(0);
  });
});
