import type { Product } from "@/lib/catalog/types";
import type { Order, ShipmentEventRecord } from "@/lib/orders/types";
import type { Store, SyncLogEntry } from "./types";

/** Flüchtiger Speicher für Tests und Vorschau. Daten gehen beim Neustart verloren. */
export function createMemoryStore(): Store {
  const products = new Map<string, Product>();
  const orders = new Map<string, Order>();
  const syncLog: SyncLogEntry[] = [];
  const shipments: ShipmentEventRecord[] = [];
  const clone = <T>(x: T): T => structuredClone(x);

  return {
    driver: "memory",
    products: {
      async list() {
        return [...products.values()].map(clone);
      },
      async listBySupplier(supplierId) {
        return [...products.values()].filter((p) => p.supplier.id === supplierId).map(clone);
      },
      async get(id) {
        const p = products.get(id);
        return p ? clone(p) : undefined;
      },
      async upsertMany(list) {
        for (const p of list) products.set(p.id, clone(p));
      },
      async removeMany(ids) {
        for (const id of ids) products.delete(id);
      },
    },
    orders: {
      async list() {
        return [...orders.values()].map(clone).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },
      async get(id) {
        const o = orders.get(id);
        return o ? clone(o) : undefined;
      },
      async getByNumber(number) {
        const o = [...orders.values()].find((x) => x.number === number);
        return o ? clone(o) : undefined;
      },
      async save(order) {
        orders.set(order.id, clone(order));
      },
    },
    syncLog: {
      async list(limit = 50) {
        return syncLog.slice(-limit).reverse().map(clone);
      },
      async add(entry) {
        syncLog.push(clone(entry));
      },
    },
    shipments: {
      async list(limit = 100) {
        return shipments.slice(-limit).reverse().map(clone);
      },
      async has(supplierId, eventId) {
        return shipments.some((s) => s.supplierId === supplierId && s.eventId === eventId);
      },
      async add(record) {
        shipments.push(clone(record));
      },
    },
  };
}
