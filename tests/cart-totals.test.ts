import { describe, expect, it } from "vitest";
import { resolveCart } from "@/lib/cart/totals";
import { expandCompatibility, suggestAccessories } from "@/lib/cart/accessories";
import { includedVat, withStandardVat } from "@/lib/cart/vat";
import { essentialFeatures, scopeOfDelivery } from "@/lib/cart/features";
import { getAllProducts, hasPrice } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";

// Feste Testprodukte auf Basis echter Katalogeinträge (robust gegen Datenänderungen)
const catalog = getAllProducts();
const base = catalog.find((p) => hasPrice(p))!;
const pv: Product = { ...base, id: "t-pv", name: "Test-Set 880 W", price: 100, vatRate: 0, dataStatus: "supplier-unverified" };
const plug: Product = { ...base, id: "t-plug", name: "Test-Steckdose", price: 29.75, vatRate: 19, dataStatus: "live" };
const demo: Product = { ...base, id: "t-demo", price: 0, vatRate: 0, dataStatus: "demo" };
const fixtures = new Map([pv, plug, demo].map((p) => [p.id, p]));
const lookup = (id: string) => fixtures.get(id);

describe("resolveCart – Nullsteuersatz", () => {
  it("berechnet begünstigte Artikel ohne Bestätigung mit 19 %", () => {
    const t = resolveCart([{ productId: "t-pv", quantity: 2 }], { lookup });
    expect(t.lines[0]?.vatRate).toBe(19);
    expect(t.lines[0]?.unitPrice).toBe(119);
    expect(t.subtotal).toBe(238);
    expect(t.vatIncluded).toBe(38);
    expect(t.zeroRateApplied).toBe(false);
    expect(t.hasZeroRateEligible).toBe(true);
  });

  it("wendet 0 % nur mit Bestätigung an", () => {
    const t = resolveCart([{ productId: "t-pv", quantity: 2 }], { lookup, zeroRateConfirmed: true });
    expect(t.lines[0]?.vatRate).toBe(0);
    expect(t.subtotal).toBe(200);
    expect(t.vatIncluded).toBe(0);
    expect(t.zeroRateApplied).toBe(true);
  });

  it("lässt Artikel mit Regelsteuersatz unverändert", () => {
    const yes = resolveCart([{ productId: "t-plug", quantity: 1 }], { lookup, zeroRateConfirmed: true });
    const no = resolveCart([{ productId: "t-plug", quantity: 1 }], { lookup, zeroRateConfirmed: false });
    expect(yes.subtotal).toBe(29.75);
    expect(no.subtotal).toBe(29.75);
    expect(yes.vatIncluded).toBe(4.75);
    expect(yes.hasZeroRateEligible).toBe(false);
  });

  it("schlüsselt gemischte Warenkörbe nach Steuersätzen auf", () => {
    const t = resolveCart(
      [
        { productId: "t-pv", quantity: 1 },
        { productId: "t-plug", quantity: 2 },
      ],
      { lookup, zeroRateConfirmed: true },
    );
    expect(t.vatBreakdown).toEqual([
      { rate: 0, gross: 100, vat: 0, net: 100 },
      { rate: 19, gross: 59.5, vat: 9.5, net: 50 },
    ]);
    expect(t.total).toBe(159.5);
    expect(t.itemCount).toBe(3);
  });

  it("ignoriert Demo-Produkte, unbekannte Artikel und Mengen ≤ 0", () => {
    const t = resolveCart(
      [
        { productId: "t-demo", quantity: 1 },
        { productId: "gibt-es-nicht", quantity: 1 },
        { productId: "t-pv", quantity: 0 },
      ],
      { lookup },
    );
    expect(t.lines).toHaveLength(0);
    expect(t.total).toBe(0);
  });

  it("lässt Versandkosten offen, solange sie nicht festgelegt sind", () => {
    const t = resolveCart([{ productId: "t-pv", quantity: 1 }], { lookup, zeroRateConfirmed: true });
    expect(t.shipping).toBeNull();
    expect(t.total).toBe(t.subtotal);
  });

  it("rundet auf Cent", () => {
    expect(withStandardVat(329)).toBe(391.51);
    expect(includedVat(391.51, 19)).toBe(62.51);
    expect(includedVat(100, 0)).toBe(0);
  });

  it("rechnet mit dem echten Katalog", () => {
    const eligible = catalog.find((p) => hasPrice(p) && p.vatRate === 0)!;
    const t0 = resolveCart([{ productId: eligible.id, quantity: 1 }], { zeroRateConfirmed: true });
    const t19 = resolveCart([{ productId: eligible.id, quantity: 1 }]);
    expect(t0.total).toBe(eligible.price);
    expect(t19.total).toBe(withStandardVat(eligible.price));
  });
});

describe("Zubehör-Vorschläge", () => {
  it("zerlegt Kompatibilitätsangaben mit Schrägstrich", () => {
    expect(expandCompatibility("Anker SOLIX Solarbank 2 E1600 Pro / Plus")).toEqual([
      "anker solix solarbank 2 e1600 pro",
      "anker solix solarbank 2 e1600 plus",
    ]);
    expect(expandCompatibility("Anker SOLIX")).toEqual(["anker solix"]);
  });

  it("schlägt nur Zubehör mit Herstellerangabe oder belegbarer Passung vor", () => {
    const accessories = catalog.filter((p) => p.category === "montage-zubehoer");
    for (const host of catalog.filter((p) => p.category !== "montage-zubehoer" && hasPrice(p))) {
      for (const s of suggestAccessories([host], catalog)) {
        const linked = host.accessoryIds.includes(s.product.id);
        if (!linked) expect(accessories.map((a) => a.id)).toContain(s.product.id);
        const byCompat = s.product.specs.compatibleWith
          ? expandCompatibility(s.product.specs.compatibleWith).some((t) => host.name.toLowerCase().includes(t))
          : false;
        const byMount = Boolean(s.product.specs.tiltRange) && host.specs.moduleCount === 2;
        expect(linked || byCompat || byMount).toBe(true);
        if (byMount && !byCompat && !linked) expect(s.caveat).toBeTruthy();
      }
    }
  });

  it("übernimmt ausdrücklich hinterlegtes Zubehör, aber nur mit Preis", () => {
    const acc: Product = { ...plug, id: "t-acc", name: "Test-Zubehör", category: "montage-zubehoer" };
    const accDemo: Product = { ...demo, id: "t-acc-demo", category: "montage-zubehoer" };
    const host: Product = { ...pv, accessoryIds: ["t-acc", "t-acc-demo", "gibt-es-nicht"] };
    const out = suggestAccessories([host], [host, acc, accDemo]);
    expect(out.map((s) => s.product.id)).toEqual(["t-acc"]);
    expect(out[0]?.forProduct.id).toBe(host.id);
  });

  it("schlägt nichts vor, was schon im Warenkorb liegt", () => {
    const meter = catalog.find((p) => p.specs.compatibleWith?.includes("E1600 Pro"));
    const pro = catalog.find((p) => /Solarbank 2 E1600 Pro/i.test(p.name));
    if (!meter || !pro) return; // Daten können sich ändern
    expect(suggestAccessories([pro], catalog).some((s) => s.product.id === meter.id)).toBe(true);
    expect(suggestAccessories([pro, meter], catalog).some((s) => s.product.id === meter.id)).toBe(false);
  });
});

describe("Wesentliche Merkmale", () => {
  it("leitet Merkmale nur aus vorhandenen Produktdaten ab", () => {
    const set: Product = { ...pv, specs: { moduleCount: 2, moduleWp: 440, moduleType: "Glas-Glas, bifazial", inverterW: 800 }, includes: ["2 Module", "Wechselrichter"] };
    expect(essentialFeatures(set)).toEqual(["2 × 440 Wp, Glas-Glas, bifazial", "Wechselrichter 800 W"]);
    expect(scopeOfDelivery(set)).toBe("2 Module, Wechselrichter");
    const bare: Product = { ...pv, specs: {}, includes: [] };
    expect(essentialFeatures(bare)).toEqual([]);
    expect(scopeOfDelivery(bare)).toBeNull();
  });

  it("liefert für jedes bestellbare Katalogprodukt mindestens ein Merkmal oder einen Lieferumfang", () => {
    for (const p of catalog.filter(hasPrice)) {
      expect(essentialFeatures(p).length + (scopeOfDelivery(p) ? 1 : 0)).toBeGreaterThan(0);
    }
  });
});
