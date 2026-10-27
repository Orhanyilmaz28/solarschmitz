import type { CategorySlug, DataStatus, Product } from "@/lib/catalog/types";
import type { PriceRule } from "./pricing";

/** Eine Zeile aus einem Feed oder einer API-Antwort, noch ohne Bedeutung */
export type RawRecord = Record<string, unknown>;

/** Produktfelder, die aus einem Lieferanten-Feed gelesen werden können */
export const mappableFields = [
  "supplierSku",
  "ean",
  "name",
  "brand",
  "category",
  "shortDescription",
  "description",
  "costPrice",
  "rrp",
  "vatRate",
  "stock",
  "moduleCount",
  "moduleWp",
  "modules",
  "totalWp",
  "inverterW",
  "storageKWh",
  "storageMaxKWh",
  "imageUrl",
  "productUrl",
] as const;
export type MappableField = (typeof mappableFields)[number];

/** Spaltenname (oder mehrere mögliche Namen) je Produktfeld. Groß-/Kleinschreibung egal. */
export type FieldMapping = Partial<Record<MappableField, string | string[]>>;

/** Normalisiertes Lieferanten-Produkt, bevor daraus ein Shop-Produkt wird */
export interface SupplierItem {
  supplierSku: string;
  ean?: string;
  name: string;
  brand?: string;
  category?: CategorySlug;
  categoryRaw?: string;
  shortDescription?: string;
  description?: string;
  /** Einkaufspreis netto in Euro */
  costPrice?: number;
  /** Unverbindliche Preisempfehlung brutto in Euro */
  rrp?: number;
  vatRate?: 0 | 19;
  stock: Product["stock"];
  specs: Product["specs"];
  imageUrl?: string;
  productUrl?: string;
}

export interface RowIssue {
  /** Zeilennummer im Feed (1 = erste Datenzeile) */
  row: number;
  field?: string;
  message: string;
}

export interface MappedRow {
  row: number;
  item?: SupplierItem;
  issues: RowIssue[];
}

export type FeedFormat = "csv" | "xml" | "json";

/** Woher ein Katalog kommt */
export type CatalogSource =
  | { kind: "file"; format: FeedFormat; path: string; recordPath?: string }
  | { kind: "url"; format: FeedFormat; urlEnv: string; recordPath?: string; authEnv?: string }
  | { kind: "rest"; baseUrlEnv: string; apiKeyEnv: string; productsPath: string; recordPath?: string }
  | { kind: "none" };

/** Wie Bestellungen beim Lieferanten ankommen */
export type OrderChannel =
  | { kind: "email-csv"; toEnv: string }
  | { kind: "rest"; baseUrlEnv: string; apiKeyEnv: string; ordersPath: string; shipmentsPath?: string }
  | { kind: "manual" };

export interface SupplierConfig {
  id: string;
  name: string;
  website?: string;
  description: string;
  catalog: CatalogSource;
  orders: OrderChannel;
  /** Spalten-Zuordnung für Feeds */
  mapping: FieldMapping;
  /** Lieferanten-Kategorie (Teilstring, klein) -> Shop-Kategorie */
  categoryMap: Record<string, CategorySlug>;
  pricing: PriceRule;
  /** Welcher Datenstatus importierte Produkte bekommen */
  importAs: DataStatus;
  /** Präfix für unsere Artikelnummer */
  skuPrefix: string;
  /** Ab dieser Menge gilt Bestand als knapp */
  lowStockThreshold: number;
  /** Standard-Steuersatz, wenn der Feed keinen liefert */
  defaultVatRate: 0 | 19;
}

export type ConnectionState = "connected" | "not_configured" | "error" | "manual";

export interface ConnectionStatus {
  state: ConnectionState;
  message: string;
  missing?: string[];
  checkedAt: string;
}

/** Was ein Katalog-Abruf liefert */
export interface CatalogFetchResult {
  records: RawRecord[];
  format: FeedFormat;
  source: string;
}

/** Preis- und Bestandsupdate ohne kompletten Katalog */
export interface PriceStockUpdate {
  supplierSku: string;
  costPrice?: number;
  rrp?: number;
  stock: Product["stock"];
}

export interface SupplierOrderPayload {
  /** Unsere Bestellnummer */
  orderNumber: string;
  supplierOrderId: string;
  createdAt: string;
  shippingAddress: {
    name: string;
    company?: string;
    street: string;
    zip: string;
    city: string;
    country: string;
    phone?: string;
    email: string;
  };
  lines: { supplierSku: string; name: string; quantity: number }[];
  note?: string;
}

export interface SupplierOrderResult {
  accepted: boolean;
  /** Referenz des Lieferanten, falls vorhanden */
  supplierReference?: string;
  message: string;
}

export const shipmentStatuses = ["in_transit", "shipped", "delivered", "cancelled", "exception"] as const;
export type ShipmentStatus = (typeof shipmentStatuses)[number];

export interface ShipmentUpdate {
  /** Eindeutige Ereignis-ID für Idempotenz */
  eventId: string;
  supplierId: string;
  orderNumber?: string;
  supplierOrderId?: string;
  supplierReference?: string;
  status: ShipmentStatus;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  occurredAt: string;
}

/**
 * Einheitliche Schnittstelle je Lieferant.
 * Methoden, die ein Lieferant nicht unterstützt, werfen NotConfiguredError.
 */
export interface SupplierAdapter {
  readonly config: SupplierConfig;
  testConnection(): Promise<ConnectionStatus>;
  fetchCatalog(): Promise<CatalogFetchResult>;
  fetchPricesAndStock(): Promise<PriceStockUpdate[]>;
  submitOrder(payload: SupplierOrderPayload): Promise<SupplierOrderResult>;
  fetchShipments(since?: string): Promise<ShipmentUpdate[]>;
}
