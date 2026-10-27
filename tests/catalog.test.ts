import { describe, expect, it } from "vitest";
import {
  compatibleNames,
  getAccessories,
  getAllProducts,
  getFamily,
  getProductById,
  getSimilarProducts,
  isCompatibleAccessory,
  mountCapacity,
} from "@/lib/catalog";
import { productSchema, visualKeys, type Product } from "@/lib/catalog/types";
import { seedProducts } from "@/data/products";
import { complianceNotes, gpsrRows, hotspotsFor, includeIcon, keyFigures } from "@/lib/catalog/facts";
import { priceStatus, uvpText, vatLine } from "@/components/shop/pricing";
import { isUnfiltered, parseProductQuery } from "@/components/shop/productQuery";
import { keySpecs, specGroups, variantSpecs } from "@/components/shop/specRows";
import { nb } from "@/components/shop/typo";
import { getSchematicAnchors } from "@/components/shop/ProductSchematic";

const byId = (id: string): Product => {
  const p = getProductById(id);
  if (!p) throw new Error(`Produkt ${id} fehlt`);
  return p;
};

describe("Katalogdaten", () => {
  it("alle Seed-Produkte sind gültig, Slugs und IDs eindeutig", () => {
    for (const p of seedProducts) expect(() => productSchema.parse(p)).not.toThrow();
    const all = getAllProducts();
    expect(new Set(all.map((p) => p.slug)).size).toBe(all.length);
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
  });

  it("keine Streichpreise in den Daten (§ 11 PAngV)", () => {
    for (const p of getAllProducts()) expect(p.compareAtPrice).toBeUndefined();
  });

  it("verweist nur auf vorhandenes Zubehör", () => {
    const ids = new Set(getAllProducts().map((p) => p.id));
    for (const p of getAllProducts()) for (const a of p.accessoryIds) expect(ids.has(a)).toBe(true);
  });

  it("Familien haben Variantennamen", () => {
    for (const p of getAllProducts().filter((x) => x.family)) {
      expect(p.variantLabel, p.id).toBeTruthy();
      expect(getFamily(p).length).toBeGreaterThan(1);
    }
  });
});

describe("getFamily", () => {
  it("liefert alle Varianten in Katalog-Reihenfolge", () => {
    const fam = getFamily(byId("p-eforu-set-880-e1600")).map((p) => p.id);
    expect(fam).toEqual(["p-eforu-set-880", "p-eforu-set-880-e1600"]);
  });
  it("ohne Familie nur das Produkt selbst", () => {
    expect(getFamily(byId("p-apsystems-ez1m")).map((p) => p.id)).toEqual(["p-apsystems-ez1m"]);
  });
});

describe("Kompatibilität", () => {
  it("zerlegt Angaben wie „… Pro / Plus“ in vollständige Namen", () => {
    expect(compatibleNames("Anker SOLIX Solarbank 2 E1600 Pro / Plus")).toEqual([
      "Anker SOLIX Solarbank 2 E1600 Pro",
      "Anker SOLIX Solarbank 2 E1600 Plus",
    ]);
    expect(compatibleNames(undefined)).toEqual([]);
  });

  it("Smart Meter passt zur Solarbank 2 Pro, nicht zur AC-Version oder zu Sets", () => {
    const meter = byId("p-anker-smart-meter");
    expect(isCompatibleAccessory(meter, byId("p-anker-sb2-e1600pro"))).toBe(true);
    expect(isCompatibleAccessory(meter, byId("p-anker-sb2-e1600ac"))).toBe(false);
    expect(isCompatibleAccessory(meter, byId("p-eforu-set-880-e1600"))).toBe(false);
  });

  it("liest die Modulanzahl einer Halterung aus dem Namen", () => {
    expect(mountCapacity(byId("p-eforu-mount-2"))).toBe(2);
    expect(mountCapacity(byId("p-anker-smart-plug"))).toBeUndefined();
  });
});

describe("getAccessories", () => {
  it("Set für Flachdach/Garten: Halterung und nachrüstbare AC-Speicher", () => {
    const hints = getAccessories(byId("p-eforu-set-880"), 6);
    const ids = hints.map((h) => h.product.id);
    expect(ids[0]).toBe("p-eforu-mount-2");
    expect(ids).toContain("p-anker-sb2-e1600ac");
    expect(ids).toContain("p-anker-sbmax-ac-7000");
    // keine Varianten der eigenen Familie, keine Demo-Produkte ohne Preis
    expect(ids).not.toContain("p-eforu-set-880-e1600");
    for (const h of hints) expect(h.product.dataStatus).not.toBe("demo");
    // 2 Module, Halterung für 2 Module: keine Mengenempfehlung nötig
    expect(hints[0]!.quantity).toBeUndefined();
  });

  it("Demo-Set mit 4 Modulen: zwei Halterungen", () => {
    const mount = getAccessories(byId("p-demo-set-1760")).find((h) => h.product.id === "p-eforu-mount-2");
    expect(mount?.quantity).toBe(2);
    expect(mount?.reason).toContain("2 Stück");
  });

  it("Solarbank 2 Pro: Smart Meter und Smart Plug laut Lieferant kompatibel", () => {
    const hints = getAccessories(byId("p-anker-sb2-e1600pro"));
    const ids = hints.map((h) => h.product.id);
    expect(ids).toContain("p-anker-smart-meter");
    expect(ids).toContain("p-anker-smart-plug");
    expect(hints.find((h) => h.product.id === "p-anker-smart-meter")?.reason).toBe("Laut Lieferant kompatibel");
  });

  it("AC-Speicher: Sets ohne Speicher liefern den Solarstrom", () => {
    const ids = getAccessories(byId("p-anker-sbmax-ac-7000")).map((h) => h.product.id);
    expect(ids).toContain("p-eforu-set-880");
  });

  it("Wechselrichter ohne Regeln: keine erfundenen Empfehlungen", () => {
    expect(getAccessories(byId("p-apsystems-ez1m"))).toEqual([]);
  });
});

describe("getSimilarProducts", () => {
  it("gleiche und verwandte Kategorie zuerst, ohne Familie und Ausschlüsse", () => {
    const p = byId("p-eforu-set-880");
    const similar = getSimilarProducts(p, 4, ["p-eforu-mount-2"]).map((x) => x.id);
    expect(similar).not.toContain("p-eforu-set-880");
    expect(similar).not.toContain("p-eforu-set-880-e1600");
    expect(similar).not.toContain("p-eforu-mount-2");
    expect(similar[0]).toBe("p-demo-set-1760");
    for (const id of similar) expect(["balkonkraftwerke", "balkonkraftwerke-mit-speicher"]).toContain(byId(id).category);
  });

  it("echte Daten vor Demo-Produkten innerhalb einer Stufe", () => {
    const similar = getSimilarProducts(byId("p-anker-sb2-e1600pro"), 5);
    expect(similar.every((x) => x.category === "batteriespeicher" || x.category === "balkonkraftwerke-mit-speicher")).toBe(true);
    expect(similar[0]!.category).toBe("batteriespeicher");
    expect(similar[0]!.dataStatus).not.toBe("demo");
  });
});

describe("Preisangaben", () => {
  it("Umsatzsteuer-Zeile nach Steuersatz", () => {
    expect(vatLine(byId("p-eforu-set-880"))).toBe("inkl. 0 % USt.");
    expect(vatLine(byId("p-anker-smart-plug"))).toBe("inkl. 19 % USt.");
  });
  it("Richtpreis-Status nur für unbestätigte Lieferantenpreise", () => {
    expect(priceStatus(byId("p-eforu-set-880"))).toBe("Richtpreis");
    expect(priceStatus(byId("p-demo-set-1760"))).toBeNull();
  });
  it("UVP nur, wenn ausdrücklich verifiziert", () => {
    const p = byId("p-eforu-set-880");
    expect(uvpText(p)).toBeNull();
    expect(uvpText({ ...p, uvp: { amount: 399, verified: false } })).toBeNull();
    expect(uvpText({ ...p, uvp: { amount: 399, verified: true } })).toBe("UVP des Herstellers: 399,00 €");
  });
});

describe("Produktfakten", () => {
  it("drei Kennzahlen für ein Set, nur aus echten Daten", () => {
    const f = keyFigures(byId("p-eforu-set-880"));
    expect(f.map((x) => `${x.value} ${x.unit}`)).toEqual(["880 Wp", "800 W", "2 × 440 Wp"]);
    const s = keyFigures(byId("p-eforu-set-880-e1600"));
    expect(s.map((x) => x.unit)).toEqual(["Wp", "kWh", "W"]);
    expect(s[1]!.value).toBe("1,6");
  });

  it("keine Kennzahlen, wenn nur Textwerte vorliegen", () => {
    expect(keyFigures(byId("p-ecoflow-stream-ultrax"))).toEqual([]);
    expect(keyFigures(byId("p-anker-smart-meter"))).toEqual([]);
  });

  it("Halterung: Aufnahme, Neigung, Modulbreite", () => {
    const f = keyFigures(byId("p-eforu-mount-2"));
    expect(f.map((x) => x.label)).toEqual(["Aufnahme", "Neigungswinkel", "Max. Modulbreite"]);
    expect(f[1]!.value).toBe("0–90");
  });

  it("Hotspots nur aus Produktdaten, jeder Anker höchstens einmal", () => {
    const spots = hotspotsFor(byId("p-eforu-set-880"));
    expect(spots.map((s) => s.anchor)).toEqual(["modules", "inverter", "cable"]);
    expect(spots[0]!.text).toBe("2 × 440 Wp · Glas-Glas, bifazial");
    expect(spots[1]!.text).toBe("Mikrowechselrichter APsystems · 800 W Ausgangsleistung");
    const storage = hotspotsFor(byId("p-eforu-set-880-e1600"));
    expect(storage.find((s) => s.anchor === "storage")?.text).toContain("1,6 kWh");
    for (const p of getAllProducts()) {
      const list = hotspotsFor(p);
      expect(new Set(list.map((s) => s.anchor)).size).toBe(list.length);
      for (const s of list) expect(s.text.trim()).not.toBe("");
    }
  });

  it("jede Zeichnung hat Ankerpunkte innerhalb der Fläche", () => {
    for (const v of visualKeys) {
      const anchors = Object.values(getSchematicAnchors(v));
      expect(anchors.length, v).toBeGreaterThan(0);
      for (const a of anchors) {
        expect(a!.left).toBeGreaterThan(0);
        expect(a!.left).toBeLessThan(100);
        expect(a!.top).toBeGreaterThan(0);
        expect(a!.top).toBeLessThan(100);
      }
    }
  });

  it("Symbole für den Lieferumfang", () => {
    expect(includeIcon("2 Solarmodule à 440 Wp")).toBe("panel");
    expect(includeIcon("Mikrowechselrichter APsystems")).toBe("inverter");
    expect(includeIcon("Anker SOLIX Solarbank E1600")).toBe("battery");
    expect(includeIcon("Speicher mit Wechselrichter")).toBe("battery");
    expect(includeIcon("Halterung für 2 Module")).toBe("tool");
    expect(includeIcon("Smart Meter")).toBe("chart");
    expect(includeIcon("Anschlusskabel")).toBe("bolt");
  });

  it("Hinweise zu Batterien und Elektrogeräten passend zum Produkt", () => {
    expect(complianceNotes(byId("p-anker-sb2-e1600pro")).map((n) => n.id)).toEqual(["battdg", "elektrog"]);
    expect(complianceNotes(byId("p-eforu-set-880")).map((n) => n.id)).toEqual(["elektrog"]);
    expect(complianceNotes(byId("p-eforu-mount-2"))).toEqual([]);
    // Datenlöschung nur bei vernetzten Geräten
    const ez = complianceNotes(byId("p-apsystems-ez1m")).find((n) => n.id === "elektrog")!;
    expect(ez.paragraphs.some((t) => t.includes("persönliche Daten"))).toBe(true);
  });

  it("GPSR: fehlende Herstellerangaben bleiben leer statt erfunden", () => {
    const rows = gpsrRows(byId("p-eforu-set-880"));
    expect(rows.find((r) => r.label === "Hersteller")?.value).toBe("E.FOR.U GmbH");
    expect(rows.find((r) => r.label === "Postanschrift")?.value).toBeNull();
    expect(rows.find((r) => r.label === "Produktkennung")?.value).toContain("SS-BKW-880");
  });
});

describe("Filter und Darstellung", () => {
  it("liest Filter aus der URL und erkennt die ungefilterte Liste", () => {
    expect(isUnfiltered(parseProductQuery({}))).toBe(true);
    expect(isUnfiltered(parseProductQuery({ sortierung: "preis-auf" }))).toBe(false);
    expect(isUnfiltered(parseProductQuery({ ort: "garten" }))).toBe(false);
    expect(isUnfiltered(parseProductQuery({ ort: "mond" }))).toBe(true);
    expect(parseProductQuery({ hersteller: "Anker SOLIX,EcoFlow" }).brand).toEqual(["Anker SOLIX", "EcoFlow"]);
  });

  it("Kurzdaten und Variantenunterschiede", () => {
    expect(keySpecs(byId("p-eforu-set-880"))).toEqual(["2 × 440 Wp", "800 W"]);
    const lines = variantSpecs(getFamily(byId("p-eforu-set-880")));
    expect(lines.get("p-eforu-set-880")).toBe("2 × 440 Wp · 800 W");
    expect(lines.get("p-eforu-set-880-e1600")).toBe("2 × 440 Wp · 1,6 kWh");
  });

  it("technische Daten gruppiert, leere Gruppen entfallen", () => {
    const groups = specGroups(byId("p-anker-sb2-e1600pro")).map((g) => g.title);
    expect(groups).toEqual(["Speicher", "Anschluss & Steuerung", "Allgemein"]);
  });

  it("geschützte Leerzeichen zwischen Zahl und Einheit", () => {
    expect(nb("2 × 440 Wp")).toBe("2 × 440 Wp");
    expect(nb("Neigung 0–90° einstellbar")).toBe("Neigung 0–⁠90° einstellbar");
    expect(nb("1,6 kWh Speicher")).toBe("1,6 kWh Speicher");
    expect(nb("Solarbank 2 E1600")).toBe("Solarbank 2 E1600");
  });
});

describe("Katalog ohne zod im Browser", () => {
  it("getAllProducts entspricht dem Ergebnis von productSchema (Standardwerte, ohne Einkaufspreis)", async () => {
    const { seedProducts } = await import("@/data/products");
    const { productSchema } = await import("@/lib/catalog/types");
    const { getAllProducts } = await import("@/lib/catalog");
    const { assertCatalogValid } = await import("@/lib/catalog/validate");
    expect(() => assertCatalogValid()).not.toThrow();
    const fast = getAllProducts();
    seedProducts.forEach((input, i) => {
      const parsed = productSchema.parse(input);
      const { costPrice: _c, ...supplier } = parsed.supplier;
      expect(fast[i]).toEqual({ ...parsed, supplier });
    });
  });
});
