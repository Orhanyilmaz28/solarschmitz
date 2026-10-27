import { createFileStore } from "./file";
import { createMemoryStore } from "./memory";
import type { Store } from "./types";

export type { Store, SyncLogEntry, SyncStatus } from "./types";
export { createMemoryStore } from "./memory";
export { createFileStore } from "./file";

let store: Store | null = null;

/**
 * Aktiver Store. STORE_DRIVER=memory für flüchtige Vorschau, sonst Dateien unter data/runtime.
 * Für den Live-Betrieb hier eine Datenbank-Implementierung einsetzen.
 */
export function getStore(): Store {
  if (!store) {
    store = process.env.STORE_DRIVER === "memory" ? createMemoryStore() : createFileStore();
  }
  return store;
}

/** Für Tests: eigenen Store setzen */
export function setStore(s: Store | null) {
  store = s;
}
