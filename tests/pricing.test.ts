import { describe, expect, it } from "vitest";
import { computeSellPrice, roundPriceCents, type PriceRule } from "@/lib/suppliers/pricing";

const rule: PriceRule = { marginPct: 25, fixedMarkupEUR: 0, rounding: "90", minMarginEUR: 10, capAtRrp: true };

describe("roundPriceCents", () => {
  it("rundet nie nach unten", () => {
    expect(roundPriceCents(30625, "90")).toBe(30690);
    expect(roundPriceCents(30695, "90")).toBe(30790);
    expect(roundPriceCents(30690, "90")).toBe(30690);
    expect(roundPriceCents(12001, "99")).toBe(12099);
    expect(roundPriceCents(12001, "euro")).toBe(12100);
    expect(roundPriceCents(12000, "euro")).toBe(12000);
    expect(roundPriceCents(12345, "none")).toBe(12345);
  });
});

describe("computeSellPrice", () => {
  it("rechnet Marge auf netto und rundet auf ,90", () => {
    const r = computeSellPrice({ costPriceNet: 245, rrpGross: 329, vatRate: 0, rule });
    expect(r.price).toBe(306.9);
    expect(r.marginEUR).toBe(61.9);
    expect(r.flags).toEqual([]);
  });

  it("berücksichtigt 19 % MwSt.", () => {
    // 61 * 1,25 = 76,25 netto -> 90,74 brutto -> 90,90
    const r = computeSellPrice({ costPriceNet: 61, rrpGross: 99, vatRate: 19, rule });
    expect(r.price).toBe(90.9);
    expect(r.marginEUR).toBeCloseTo(15.39, 2);
  });

  it("hebt auf Mindestmarge an", () => {
    const r = computeSellPrice({ costPriceNet: 20, rrpGross: null, vatRate: 0, rule });
    // 20 * 1,25 = 25 < 20 + 10 -> 30 -> 30,90
    expect(r.price).toBe(30.9);
    expect(r.flags).toContain("raised_to_min_margin");
  });

  it("deckelt bei der UVP und markiert zu geringe Marge", () => {
    const r = computeSellPrice({ costPriceNet: 315, rrpGross: 320, vatRate: 0, rule });
    expect(r.price).toBe(319.9);
    expect(r.flags).toContain("capped_at_rrp");
    expect(r.flags).toContain("below_min_margin");
  });

  it("übernimmt ohne Einkaufspreis die UVP", () => {
    const r = computeSellPrice({ costPriceNet: undefined, rrpGross: 399, vatRate: 0, rule });
    expect(r.price).toBe(399);
    expect(r.flags).toEqual(["no_cost_price", "rrp_only"]);
    expect(r.marginEUR).toBeNull();
  });

  it("liefert 0 ohne Preisangaben", () => {
    expect(computeSellPrice({ vatRate: 0, rule }).price).toBe(0);
  });

  it("Fixaufschlag wird netto addiert", () => {
    const r = computeSellPrice({ costPriceNet: 100, vatRate: 0, rule: { ...rule, marginPct: 10, fixedMarkupEUR: 5, rounding: "none" } });
    expect(r.price).toBe(115);
  });
});
