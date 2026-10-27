import { getAllProducts } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";
import type { Store } from "./types";

/**
 * Katalog aus Seed-Daten und importierten Produkten zusammenführen.
 * Importierte Produkte (gleiche ID) ersetzen Seed-Einträge.
 */
export async function getMergedProducts(store: Store): Promise<Product[]> {
  const imported = await store.products.list();
  const byId = new Map<string, Product>(getAllProducts().map((p) => [p.id, p]));
  for (const p of imported) byId.set(p.id, p);
  return [...byId.values()];
}

export async function findProduct(store: Store, id: string): Promise<Product | undefined> {
  return (await store.products.get(id)) ?? getAllProducts().find((p) => p.id === id);
}
