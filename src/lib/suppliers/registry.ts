import { createSupplierAdapter } from "./adapters";
import { supplierConfigs } from "./config";
import { readEnv } from "./http";
import type { CatalogSource, OrderChannel, SupplierAdapter, SupplierConfig } from "./types";

const overrides = new Map<string, SupplierAdapter>();

/** Für Tests oder Sonder-Adapter: einen Adapter für eine Lieferanten-ID hinterlegen */
export function registerSupplierAdapter(adapter: SupplierAdapter) {
  overrides.set(adapter.config.id, adapter);
}

export function clearSupplierAdapterOverrides() {
  overrides.clear();
}

export function getSupplierConfigs(): SupplierConfig[] {
  const ids = new Set(supplierConfigs.map((c) => c.id));
  const extra = [...overrides.values()].map((a) => a.config).filter((c) => !ids.has(c.id));
  return [...supplierConfigs, ...extra];
}

export function getSupplierConfig(id: string): SupplierConfig | undefined {
  return overrides.get(id)?.config ?? supplierConfigs.find((c) => c.id === id);
}

export function getSupplierAdapter(id: string): SupplierAdapter | undefined {
  const o = overrides.get(id);
  if (o) return o;
  const config = supplierConfigs.find((c) => c.id === id);
  return config ? createSupplierAdapter(config) : undefined;
}

function envOfCatalog(src: CatalogSource): string[] {
  if (src.kind === "url") return [src.urlEnv];
  if (src.kind === "rest") return [src.baseUrlEnv, src.apiKeyEnv];
  return [];
}

function envOfOrders(ch: OrderChannel): string[] {
  if (ch.kind === "email-csv") return [ch.toEnv];
  if (ch.kind === "rest") return [ch.baseUrlEnv, ch.apiKeyEnv];
  return [];
}

export interface SupplierSetupStatus {
  catalog: { ready: boolean; missing: string[]; label: string };
  orders: { ready: boolean; missing: string[]; label: string };
}

/** Statische Prüfung ohne Netzwerk: Welche Zugangsdaten fehlen noch? */
export function getSetupStatus(config: SupplierConfig): SupplierSetupStatus {
  const cMissing = readEnv(envOfCatalog(config.catalog)).missing;
  const oMissing = readEnv(envOfOrders(config.orders)).missing;
  const catalogLabel = {
    file: "Datei",
    url: "Feed per URL",
    rest: "REST-API",
    none: "keine Quelle",
  }[config.catalog.kind];
  const ordersLabel = { "email-csv": "E-Mail mit CSV", rest: "REST-API", manual: "manuell" }[config.orders.kind];
  return {
    catalog: { ready: config.catalog.kind !== "none" && cMissing.length === 0, missing: cMissing, label: catalogLabel },
    orders: { ready: config.orders.kind !== "manual" && oMissing.length === 0, missing: oMissing, label: ordersLabel },
  };
}
