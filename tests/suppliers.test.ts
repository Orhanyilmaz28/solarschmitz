import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/store/memory";
import { supplierConfigs } from "@/lib/suppliers/config";
import { mapCategory, mapRecord, readField } from "@/lib/suppliers/mapping";
import { detectFormat, parseCsv, parseXml } from "@/lib/suppliers/parsers";
import { normalizeStock } from "@/lib/suppliers/stock";
import { importFeedText, syncRecords } from "@/lib/suppliers/sync";
import { slugify } from "@/lib/suppliers/to-product";
import { parseGermanNumber, parseModuleSpec, parsePrice, parseQuantity, parseVatRate } from "@/lib/suppliers/units";

const demo = supplierConfigs.find((c) => c.id === "demo-feed")!;
const feed = (f: string) => readFileSync(path.join(process.cwd(), "data", "supplier-feeds", f), "utf8");

describe("Einheiten-Parser", () => {
  it("liest deutsche und englische Zahlenformate", () => {
    expect(parseGermanNumber("1.209,00")).toBe(1209);
    expect(parseGermanNumber("1,6")).toBe(1.6);
    expect(parseGermanNumber("1,209.50")).toBe(1209.5);
    expect(parseGermanNumber("1.209")).toBe(1209);
    expect(parseGermanNumber("0.88")).toBe(0.88);
    expect(parseGermanNumber("ca. 440Wp")).toBe(440);
    expect(parseGermanNumber("")).toBeNull();
    expect(parseGermanNumber("abc")).toBeNull();
  });

  it("liest Preise mit Währungszeichen", () => {
    expect(parsePrice("1.209,00 €")).toBe(1209);
    expect(parsePrice("EUR 329")).toBe(329);
    expect(parsePrice("329,-")).toBe(329);
  });

  it("rechnet Einheiten um", () => {
    expect(parseQuantity("1,6 kWh", "kWh")).toBe(1.6);
    expect(parseQuantity("1600 Wh", "kWh")).toBe(1.6);
    expect(parseQuantity("440 Wp", "W")).toBe(440);
    expect(parseQuantity("0,88 kWp", "W")).toBe(880);
    expect(parseQuantity("800", "W")).toBe(800);
    expect(parseQuantity("1,2 m", "mm")).toBe(1200);
    expect(parseQuantity("5 Liter", "W")).toBeNull();
  });

  it("liest Modulangaben und Steuersätze", () => {
    expect(parseModuleSpec("2 x 440 W")).toEqual({ count: 2, each: 440 });
    expect(parseModuleSpec("4×0,5 kWp")).toEqual({ count: 4, each: 500 });
    expect(parseVatRate("0 %")).toBe(0);
    expect(parseVatRate("19%")).toBe(19);
    expect(parseVatRate("7")).toBeNull();
  });
});

describe("Bestand", () => {
  const at = "2026-10-27T10:00:00.000Z";
  it("übernimmt nur echte Werte", () => {
    expect(normalizeStock("42", 5, at)).toEqual({ status: "in_stock", quantity: 42, updatedAt: at });
    expect(normalizeStock(3, 5, at)).toEqual({ status: "low", quantity: 3, updatedAt: at });
    expect(normalizeStock("0", 5, at).status).toBe("out_of_stock");
    expect(normalizeStock("nicht verfügbar", 5, at).status).toBe("out_of_stock");
    expect(normalizeStock("auf Lager", 5, at)).toEqual({ status: "in_stock", updatedAt: at });
  });
  it("erfindet keinen Bestand", () => {
    expect(normalizeStock(undefined, 5)).toEqual({ status: "unknown" });
    expect(normalizeStock("", 5)).toEqual({ status: "unknown" });
    expect(normalizeStock("verfügbar ab 12.11.", 5)).toEqual({ status: "unknown" });
    expect(normalizeStock("noch 3 Stück", 5)).toEqual({ status: "unknown" });
  });
});

describe("Mapping", () => {
  it("findet Spalten unabhängig von Schreibweise", () => {
    const rec = { "einkaufspreis_netto": "10", "Art.-Nr.": "A1" };
    expect(readField(rec, demo.mapping, "costPrice")).toBe("10");
    expect(readField(rec, demo.mapping, "supplierSku")).toBe("A1");
  });

  it("ordnet Kategorien zu", () => {
    expect(mapCategory("Balkonkraftwerk mit Speicher", "Set", demo.categoryMap)).toBe("balkonkraftwerke-mit-speicher");
    expect(mapCategory("Speicher", "X", demo.categoryMap)).toBe("batteriespeicher");
    expect(mapCategory(undefined, "APsystems Wechselrichter EZ1-M", demo.categoryMap)).toBe("wechselrichter");
    expect(mapCategory("Sonstiges", "Unbekannt", demo.categoryMap)).toBeUndefined();
  });

  it("baut ein normalisiertes Produkt mit Fehlerliste", () => {
    const row = mapRecord(
      { Artikelnummer: "X1", Bezeichnung: "Set", Kategorie: "Balkonkraftwerk", "Einkaufspreis netto": "100,50", "Anzahl Module": "2", Modulleistung: "440 Wp", Bestand: "abc" },
      demo,
      1,
    );
    expect(row.issues).toEqual([]);
    expect(row.item?.costPrice).toBe(100.5);
    expect(row.item?.specs).toEqual({ moduleCount: 2, moduleWp: 440, totalWp: 880 });
    expect(row.item?.stock).toEqual({ status: "unknown" });

    const bad = mapRecord({ Bezeichnung: "Ohne Nummer", "Einkaufspreis netto": "x" }, demo, 7);
    expect(bad.item).toBeUndefined();
    expect(bad.issues.map((i) => i.field)).toEqual(expect.arrayContaining(["supplierSku", "costPrice"]));
    expect(bad.issues.every((i) => i.row === 7)).toBe(true);
  });

  it("verwirft unsichere Bild-URLs", () => {
    const row = mapRecord({ Artikelnummer: "X", Bezeichnung: "Modul", Kategorie: "Modul", UVP: "100", "Bild-URL": "javascript:alert(1)" }, demo, 1);
    expect(row.item?.imageUrl).toBeUndefined();
  });

  it("erzeugt saubere Slugs", () => {
    expect(slugify("Solarbank 2 E1600 Pro – Größe 1,6 kWh")).toBe("solarbank-2-e1600-pro-groesse-1-6-kwh");
  });
});

describe("Parser", () => {
  it("erkennt das Format", () => {
    expect(detectFormat("﻿<?xml version")).toBe("xml");
    expect(detectFormat("[{}]")).toBe("json");
    expect(detectFormat("a;b\n1;2")).toBe("csv");
  });

  it("liest den CSV-Demo-Feed mit Semikolon", () => {
    const { records, errors } = parseCsv(feed("demo-feed.csv"));
    expect(errors).toEqual([]);
    expect(records).toHaveLength(7);
    expect(records[0]?.Artikelnummer).toBe("DF-BKW-880");
  });

  it("liest den XML-Demo-Feed mit verschachtelten Feldern", () => {
    const { records, errors } = parseXml(feed("demo-feed.xml"));
    expect(errors).toEqual([]);
    expect(records).toHaveLength(2);
    expect(records[0]?.["preise.Einkaufspreis_netto"]).toBe("79,00");
    expect(records[0]?.Beschreibung).toContain("&");
  });

  it("lehnt XML mit DOCTYPE ab", () => {
    const evil = `<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "aaaa">]><r><p><Artikelnummer>&a;</Artikelnummer></p></r>`;
    const { records, errors } = parseXml(evil);
    expect(records).toEqual([]);
    expect(errors[0]).toMatch(/DOCTYPE/);
  });
});

describe("Sync-Pipeline", () => {
  it("Dry-Run zeigt Vorschau und schreibt nichts", async () => {
    const store = createMemoryStore();
    const res = await importFeedText(feed("demo-feed.csv"), demo, store, { dryRun: true });
    expect(res.counts).toMatchObject({ received: 7, valid: 6, invalid: 1, created: 6, updated: 0 });
    expect(res.log.status).toBe("partial");
    expect(await store.products.list()).toHaveLength(0);
    expect(await store.syncLog.list()).toHaveLength(1);

    const set = res.rows.find((r) => r.supplierSku === "DF-BKWS-880-16")!;
    expect(set.product?.category).toBe("balkonkraftwerke-mit-speicher");
    expect(set.product?.specs.storageKWh).toBe(1.6);
    expect(set.product?.dataStatus).toBe("demo");
    expect(set.product?.visual).toBe("kit-2-storage");

    const failed = res.rows.find((r) => r.supplierSku === "DF-FEHLER-1")!;
    expect(failed.status).toBe("error");
  });

  it("Commit schreibt, zweiter Lauf erkennt unverändert und Preisänderung", async () => {
    const store = createMemoryStore();
    await importFeedText(feed("demo-feed.csv"), demo, store, { dryRun: false });
    const stored = await store.products.list();
    expect(stored).toHaveLength(6);
    const bkw = stored.find((p) => p.supplier.supplierSku === "DF-BKW-880")!;
    expect(bkw.price).toBe(306.9);
    expect(bkw.supplier.costPrice).toBe(245);
    expect(bkw.stock.status).toBe("in_stock");

    const changed = feed("demo-feed.csv").replace("DF-BKW-880;;Demo-Feed Balkonkraftwerk 880 Wp;Demo-Feed;Balkonkraftwerk;245,00", "DF-BKW-880;;Demo-Feed Balkonkraftwerk 880 Wp;Demo-Feed;Balkonkraftwerk;250,00");
    const second = await importFeedText(changed, demo, store, { dryRun: false });
    expect(second.counts).toMatchObject({ created: 0, updated: 1, unchanged: 5 });
    const row = second.rows.find((r) => r.supplierSku === "DF-BKW-880")!;
    expect(row.changedFields).toEqual(expect.arrayContaining(["price", "supplier.costPrice"]));
    // ID und Slug bleiben stabil
    expect(row.product?.slug).toBe(bkw.slug);
  });

  it("entfernt fehlende Produkte nur auf Wunsch", async () => {
    const store = createMemoryStore();
    await importFeedText(feed("demo-feed.csv"), demo, store, { dryRun: false });
    const one = [{ Artikelnummer: "DF-WR-800", Bezeichnung: "Demo-Feed Mikrowechselrichter 800 W", Kategorie: "Wechselrichter", "Einkaufspreis netto": "98" }];
    const keep = await syncRecords(one, demo, store, { dryRun: false, source: "test" });
    expect(keep.removed).toHaveLength(5);
    expect(await store.products.list()).toHaveLength(6);
    const drop = await syncRecords(one, demo, store, { dryRun: false, removeMissing: true, source: "test" });
    expect(drop.counts.removed).toBe(5);
    expect(await store.products.list()).toHaveLength(1);
  });

  it("meldet doppelte Artikelnummern", async () => {
    const store = createMemoryStore();
    const rec = { Artikelnummer: "D1", Bezeichnung: "Demo Modul", Kategorie: "Modul", UVP: "100" };
    const res = await syncRecords([rec, rec], demo, store, { dryRun: true, source: "test" });
    expect(res.counts.valid).toBe(1);
    expect(res.rows[1]?.issues[0]?.message).toMatch(/doppelt/);
  });

  it("importiert XML", async () => {
    const store = createMemoryStore();
    const res = await importFeedText(feed("demo-feed.xml"), demo, store, { dryRun: true });
    expect(res.counts.valid).toBe(2);
    const mod = res.rows[0]!.product!;
    expect(mod.category).toBe("solarmodule");
    expect(mod.specs.moduleWp).toBe(440);
    expect(mod.supplier.costPrice).toBe(79);
  });
});
