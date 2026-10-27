import type { Product } from "@/lib/catalog/types";

/** Produktdaten ohne interne Lieferantenangaben (Einkaufspreis, Lieferanten-Artikelnummer) */
export type PublicProduct = Omit<Product, "supplier"> & { supplier: { id: string } };

export function toPublicProduct(p: Product): PublicProduct {
  const { supplier, ...rest } = p;
  return { ...rest, supplier: { id: supplier.id } };
}
