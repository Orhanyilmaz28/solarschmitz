import type { DataStatus, Product } from "@/lib/catalog/types";
import type { SyncStatus } from "@/lib/store/types";
import type { Tone } from "./ui";

export const dataStatusLabel: Record<DataStatus, string> = {
  live: "Live",
  "supplier-unverified": "Ungeprüft",
  demo: "Demo",
};

export const dataStatusTone: Record<DataStatus, Tone> = {
  live: "ok",
  "supplier-unverified": "warn",
  demo: "neutral",
};

export const stockLabel: Record<Product["stock"]["status"], string> = {
  unknown: "unbekannt",
  in_stock: "verfügbar",
  low: "knapp",
  out_of_stock: "nicht verfügbar",
};

export const stockTone: Record<Product["stock"]["status"], Tone> = {
  unknown: "neutral",
  in_stock: "ok",
  low: "warn",
  out_of_stock: "error",
};

export const syncStatusLabel: Record<SyncStatus, string> = {
  success: "Erfolgreich",
  partial: "Mit Fehlern",
  failed: "Fehlgeschlagen",
};

export function syncTone(s: SyncStatus): Tone {
  return s === "success" ? "ok" : s === "partial" ? "warn" : "error";
}

export function setupTone(ready: boolean): Tone {
  return ready ? "ok" : "neutral";
}

export const priceFlagLabel: Record<string, string> = {
  capped_at_rrp: "auf UVP gedeckelt",
  below_min_margin: "unter Mindestmarge",
  raised_to_min_margin: "auf Mindestmarge angehoben",
  no_cost_price: "kein Einkaufspreis",
  rrp_only: "UVP übernommen",
};
