import { defaultPriceRule } from "./pricing";
import type { FieldMapping, SupplierConfig } from "./types";

/**
 * Typische Spaltennamen deutscher Händler-Feeds.
 * Für einen echten Feed die Namen an dessen Kopfzeile anpassen.
 */
export const germanFeedMapping: FieldMapping = {
  supplierSku: ["Artikelnummer", "Art.-Nr.", "Artikel-Nr", "SKU", "id"],
  ean: ["EAN", "GTIN"],
  name: ["Bezeichnung", "Produktname", "Name", "title"],
  brand: ["Hersteller", "Marke", "brand"],
  category: ["Kategorie", "Warengruppe", "category"],
  shortDescription: ["Kurzbeschreibung", "short_description"],
  description: ["Beschreibung", "Langtext", "description"],
  costPrice: ["Einkaufspreis netto", "EK netto", "Händlerpreis netto", "dealer_price"],
  rrp: ["UVP brutto", "UVP", "rrp"],
  vatRate: ["MwSt", "Steuersatz", "vat"],
  stock: ["Bestand", "Lagerbestand", "Verfügbarkeit", "stock"],
  moduleCount: ["Anzahl Module", "Module"],
  moduleWp: ["Modulleistung"],
  modules: ["Modulkonfiguration"],
  totalWp: ["Gesamtleistung", "Leistung", "Wp"],
  inverterW: ["Wechselrichterleistung", "Wechselrichter"],
  storageKWh: ["Speicherkapazität", "Kapazität", "Speicher"],
  storageMaxKWh: ["Erweiterbar bis", "max. Kapazität"],
  imageUrl: ["Bild-URL", "Bild", "image"],
  productUrl: ["Produkt-URL", "URL", "link"],
};

const commonCategoryMap: SupplierConfig["categoryMap"] = {
  "balkonkraftwerk mit speicher": "balkonkraftwerke-mit-speicher",
  "set mit speicher": "balkonkraftwerke-mit-speicher",
  balkonkraftwerk: "balkonkraftwerke",
  komplettset: "balkonkraftwerke",
  speicher: "batteriespeicher",
  batterie: "batteriespeicher",
  wechselrichter: "wechselrichter",
  halterung: "montage-zubehoer",
  zubehör: "montage-zubehoer",
  zubehoer: "montage-zubehoer",
  modul: "solarmodule",
};

export const supplierConfigs: SupplierConfig[] = [
  {
    id: "eforu",
    name: "E.FOR.U",
    website: "https://eforu.solar",
    description:
      "Dropshipping-Partner für Balkonkraftwerke, Speicher und Zubehör. Feed- bzw. API-Zugang und Händlerkonditionen werden beim Lieferanten angefragt.",
    // Bis die Schnittstelle von eforu bekannt ist: CSV-Feed per URL.
    // Liefert eforu eine REST-API, auf { kind: "rest", ... } umstellen.
    catalog: { kind: "url", format: "csv", urlEnv: "SUPPLIER_EFORU_FEED_URL", authEnv: "SUPPLIER_EFORU_API_KEY" },
    orders: { kind: "email-csv", toEnv: "SUPPLIER_EFORU_ORDER_EMAIL" },
    mapping: germanFeedMapping,
    categoryMap: commonCategoryMap,
    pricing: { ...defaultPriceRule },
    importAs: "live",
    skuPrefix: "SS-EFU",
    lowStockThreshold: 5,
    defaultVatRate: 0,
  },
  {
    id: "demo-feed",
    name: "Demo-Feed",
    description:
      "Beispiel-Feed zum Testen von Import, Mapping und Preisregeln. Importierte Produkte werden als Demo gekennzeichnet.",
    catalog: { kind: "file", format: "csv", path: "data/supplier-feeds/demo-feed.csv" },
    orders: { kind: "manual" },
    mapping: germanFeedMapping,
    categoryMap: commonCategoryMap,
    pricing: { marginPct: 25, fixedMarkupEUR: 0, rounding: "90", minMarginEUR: 10, capAtRrp: true },
    importAs: "demo",
    skuPrefix: "DEMO-FEED",
    lowStockThreshold: 5,
    defaultVatRate: 0,
  },
];
