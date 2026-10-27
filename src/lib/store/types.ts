import type { Product } from "@/lib/catalog/types";
import type { Order, ShipmentEventRecord } from "@/lib/orders/types";

/**
 * Repository-Schnittstellen.
 * Die mitgelieferten Implementierungen (Datei, Arbeitsspeicher) sind nur für
 * Entwicklung und Tests gedacht. Für den Live-Betrieb eine Datenbank-Implementierung
 * (z. B. Postgres) mit denselben Schnittstellen schreiben und in store/index.ts eintragen.
 */
export interface ProductRepository {
  list(): Promise<Product[]>;
  listBySupplier(supplierId: string): Promise<Product[]>;
  get(id: string): Promise<Product | undefined>;
  upsertMany(products: Product[]): Promise<void>;
  removeMany(ids: string[]): Promise<void>;
}

export interface OrderRepository {
  list(): Promise<Order[]>;
  get(id: string): Promise<Order | undefined>;
  getByNumber(number: string): Promise<Order | undefined>;
  save(order: Order): Promise<void>;
}

export type SyncStatus = "success" | "partial" | "failed";

export interface SyncLogEntry {
  id: string;
  supplierId: string;
  startedAt: string;
  finishedAt: string;
  dryRun: boolean;
  source: string;
  status: SyncStatus;
  counts: {
    received: number;
    valid: number;
    invalid: number;
    created: number;
    updated: number;
    unchanged: number;
    removed: number;
  };
  /** Erste Fehler zur Anzeige im Admin */
  errors: string[];
  message: string;
}

export interface SyncLogRepository {
  list(limit?: number): Promise<SyncLogEntry[]>;
  add(entry: SyncLogEntry): Promise<void>;
}

export interface ShipmentRepository {
  list(limit?: number): Promise<ShipmentEventRecord[]>;
  has(supplierId: string, eventId: string): Promise<boolean>;
  add(record: ShipmentEventRecord): Promise<void>;
}

export interface Store {
  readonly driver: "file" | "memory" | string;
  products: ProductRepository;
  orders: OrderRepository;
  syncLog: SyncLogRepository;
  shipments: ShipmentRepository;
}
