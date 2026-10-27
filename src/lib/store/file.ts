import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Product } from "@/lib/catalog/types";
import type { Order, ShipmentEventRecord } from "@/lib/orders/types";
import type { Store, SyncLogEntry } from "./types";

/**
 * Speichert JSON-Dateien unter data/runtime/ (gitignored).
 * NUR für lokale Entwicklung: keine Transaktionen, kein Mehrbenutzerbetrieb,
 * und auf Serverless-Plattformen ist das Dateisystem flüchtig oder schreibgeschützt.
 * Für den Live-Betrieb durch eine Datenbank ersetzen (z. B. Postgres).
 */
export function createFileStore(dir = path.join(process.cwd(), "data", "runtime")): Store {
  const locks = new Map<string, Promise<unknown>>();

  /** Schreibzugriffe je Datei nacheinander ausführen */
  function withLock<T>(file: string, fn: () => Promise<T>): Promise<T> {
    const prev = locks.get(file) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    locks.set(
      file,
      next.catch(() => undefined),
    );
    return next;
  }

  async function read<T>(name: string, fallback: T): Promise<T> {
    try {
      return JSON.parse(await readFile(path.join(dir, name), "utf8")) as T;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
      throw err;
    }
  }

  async function write(name: string, data: unknown) {
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, name);
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await rename(tmp, file);
  }

  function update<T>(name: string, fallback: T, fn: (current: T) => T): Promise<void> {
    return withLock(name, async () => {
      const current = await read(name, fallback);
      await write(name, fn(current));
    });
  }

  const P = "products.json";
  const O = "orders.json";
  const L = "sync-log.json";
  const S = "shipments.json";

  return {
    driver: "file",
    products: {
      list: () => read<Product[]>(P, []),
      async listBySupplier(supplierId) {
        return (await read<Product[]>(P, [])).filter((p) => p.supplier.id === supplierId);
      },
      async get(id) {
        return (await read<Product[]>(P, [])).find((p) => p.id === id);
      },
      upsertMany: (list) =>
        update<Product[]>(P, [], (cur) => {
          const map = new Map(cur.map((p) => [p.id, p]));
          for (const p of list) map.set(p.id, p);
          return [...map.values()];
        }),
      removeMany: (ids) => update<Product[]>(P, [], (cur) => cur.filter((p) => !ids.includes(p.id))),
    },
    orders: {
      async list() {
        return (await read<Order[]>(O, [])).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },
      async get(id) {
        return (await read<Order[]>(O, [])).find((o) => o.id === id);
      },
      async getByNumber(number) {
        return (await read<Order[]>(O, [])).find((o) => o.number === number);
      },
      save: (order) => update<Order[]>(O, [], (cur) => [...cur.filter((o) => o.id !== order.id), order]),
    },
    syncLog: {
      async list(limit = 50) {
        return (await read<SyncLogEntry[]>(L, [])).slice(-limit).reverse();
      },
      // Protokoll auf 500 Einträge begrenzen
      add: (entry) => update<SyncLogEntry[]>(L, [], (cur) => [...cur, entry].slice(-500)),
    },
    shipments: {
      async list(limit = 100) {
        return (await read<ShipmentEventRecord[]>(S, [])).slice(-limit).reverse();
      },
      async has(supplierId, eventId) {
        return (await read<ShipmentEventRecord[]>(S, [])).some((s) => s.supplierId === supplierId && s.eventId === eventId);
      },
      add: (record) => update<ShipmentEventRecord[]>(S, [], (cur) => [...cur, record].slice(-5000)),
    },
  };
}
