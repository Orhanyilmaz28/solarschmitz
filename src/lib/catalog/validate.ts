import { seedProducts } from "@/data/products";
import { productSchema } from "./types";

let checked = false;

/** Prüft den Katalog gegen das Schema. Wirft beim Build, wenn ein Produkt ungültig ist. */
export function assertCatalogValid(): void {
  if (checked) return;
  for (const p of seedProducts) {
    const r = productSchema.safeParse(p);
    if (!r.success) {
      const id = (p as { id?: string }).id ?? "?";
      throw new Error(`Ungültiges Produkt ${id}: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    }
  }
  checked = true;
}
