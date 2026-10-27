import { categories, getCategory } from "@/data/categories";
import { seedProducts } from "@/data/products";
import { productSchema, type CategorySlug, type InstallLocation, type Product } from "./types";

/**
 * Katalog-Zugriff. Liest aktuell den validierten Seed-Katalog.
 * Der Lieferanten-Import (src/lib/suppliers) schreibt später in den
 * Produkt-Store; dann wird hier aus dem Store gelesen.
 */
let cache: Product[] | null = null;

export function getAllProducts(): Product[] {
  if (!cache)
    cache = seedProducts.map((p) => {
      const parsed = productSchema.parse(p);
      // Einkaufspreise gehören nie in den öffentlichen Katalog
      const { costPrice: _cost, ...supplier } = parsed.supplier;
      return { ...parsed, supplier };
    });
  return cache;
}

export function getProductBySlug(slug: string): Product | undefined {
  return getAllProducts().find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return getAllProducts().find((p) => p.id === id);
}

export function getProductsByCategory(slug: CategorySlug): Product[] {
  return getAllProducts().filter((p) => p.category === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const same = getAllProducts().filter((p) => p.id !== product.id && p.category === product.category);
  const other = getAllProducts().filter((p) => p.id !== product.id && p.category !== product.category && p.suitableFor.some((s) => product.suitableFor.includes(s)));
  return [...same, ...other].slice(0, limit);
}

export { categories, getCategory };

/** Ist der Preis ein echtes (wenn auch unbestätigtes) Angebot? Demo-Produkte haben keinen Preis. */
export function hasPrice(p: Product): boolean {
  return p.dataStatus !== "demo" && p.price > 0;
}

export function isPurchasable(p: Product): boolean {
  return p.dataStatus === "live" && p.price > 0 && p.stock.status !== "out_of_stock";
}

// ---------- Suche und Filter ----------

export interface ProductQuery {
  q?: string;
  category?: CategorySlug | "alle";
  brand?: string[];
  location?: InstallLocation;
  withStorage?: boolean;
  minWp?: number;
  maxPrice?: number;
  sort?: "relevanz" | "preis-auf" | "preis-ab" | "leistung" | "speicher";
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s.,]/gu, " ");
}

function haystack(p: Product): string {
  const cat = getCategory(p.category)?.name ?? "";
  return normalize([p.name, p.brand, p.shortDescription, cat, ...p.highlights, ...p.tags].join(" "));
}

export function scoreMatch(p: Product, q: string): number {
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  const hay = haystack(p);
  const name = normalize(p.name);
  let score = 0;
  for (const t of terms) {
    if (!hay.includes(t)) return 0;
    score += name.includes(t) ? 3 : 1;
  }
  return score;
}

export function queryProducts(query: ProductQuery, source: Product[] = getAllProducts()): Product[] {
  let list = source.map((p) => ({ p, s: query.q ? scoreMatch(p, query.q) : 1 })).filter((x) => x.s > 0);
  if (query.category && query.category !== "alle") list = list.filter((x) => x.p.category === query.category);
  if (query.brand?.length) list = list.filter((x) => query.brand!.includes(x.p.brand));
  if (query.location) list = list.filter((x) => x.p.suitableFor.includes(query.location!));
  if (query.withStorage) list = list.filter((x) => Boolean(x.p.specs.storageKWh));
  if (query.minWp) list = list.filter((x) => (x.p.specs.totalWp ?? 0) >= query.minWp!);
  if (query.maxPrice) list = list.filter((x) => hasPrice(x.p) && x.p.price <= query.maxPrice!);

  // Produkte ohne Preis (Demo) landen bei Preissortierung immer am Ende.
  const priceOf = (p: Product, missing: number) => (hasPrice(p) ? p.price : missing);
  switch (query.sort) {
    case "preis-auf":
      list.sort((a, b) => priceOf(a.p, Infinity) - priceOf(b.p, Infinity));
      break;
    case "preis-ab":
      list.sort((a, b) => priceOf(b.p, -1) - priceOf(a.p, -1));
      break;
    case "leistung":
      list.sort((a, b) => (b.p.specs.totalWp ?? 0) - (a.p.specs.totalWp ?? 0));
      break;
    case "speicher":
      list.sort((a, b) => (b.p.specs.storageKWh ?? 0) - (a.p.specs.storageKWh ?? 0));
      break;
    default:
      list.sort((a, b) => b.s - a.s || dataRank(a.p) - dataRank(b.p));
  }
  return list.map((x) => x.p);
}

/** Echte Lieferantendaten vor Demo-Produkten anzeigen */
function dataRank(p: Product): number {
  return p.dataStatus === "live" ? 0 : p.dataStatus === "supplier-unverified" ? 1 : 2;
}

export function getBrands(): string[] {
  return [...new Set(getAllProducts().filter((p) => p.dataStatus !== "demo").map((p) => p.brand))].sort();
}
