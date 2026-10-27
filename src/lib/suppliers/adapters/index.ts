import { brand } from "@/config/brand";
import { mapRecords } from "../mapping";
import type { ConnectionStatus, PriceStockUpdate, SupplierAdapter, SupplierConfig } from "../types";
import { fetchCatalogFrom, testCatalogSource } from "./catalog";
import { fetchShipmentsVia, submitOrderVia } from "./orders";

/**
 * Baut aus der Konfiguration einen Adapter.
 * Katalogquelle (Datei, Feed-URL, REST) und Bestellweg (E-Mail/CSV, REST, manuell)
 * sind unabhängig kombinierbar, damit neue Lieferanten meist nur Konfiguration brauchen.
 * Für Sonderfälle kann ein eigener Adapter das Interface direkt umsetzen.
 */
export function createSupplierAdapter(config: SupplierConfig): SupplierAdapter {
  return {
    config,

    async testConnection(): Promise<ConnectionStatus> {
      const catalog = await testCatalogSource(config.catalog, config.id);
      if (catalog.state !== "connected") return catalog;
      if (config.orders.kind === "manual") {
        return { ...catalog, state: "manual", message: `${catalog.message} Bestellungen werden manuell übermittelt.` };
      }
      return catalog;
    },

    fetchCatalog() {
      return fetchCatalogFrom(config.catalog, config.id);
    },

    async fetchPricesAndStock(): Promise<PriceStockUpdate[]> {
      // Ohne eigenen Preis-Endpunkt: vollständigen Katalog laden und nur Preis/Bestand übernehmen
      const { records } = await fetchCatalogFrom(config.catalog, config.id);
      return mapRecords(records, config).flatMap((r) =>
        r.item ? [{ supplierSku: r.item.supplierSku, costPrice: r.item.costPrice, rrp: r.item.rrp, stock: r.item.stock }] : [],
      );
    },

    submitOrder(payload) {
      return submitOrderVia(config.orders, payload, { supplierId: config.id, shopName: brand.name });
    },

    fetchShipments(since) {
      return fetchShipmentsVia(config.orders, since, config.id);
    },
  };
}
