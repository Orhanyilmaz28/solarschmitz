import { categorySlugs, installLocations, type CategorySlug, type InstallLocation } from "@/lib/catalog/types";
import type { ProductQuery } from "@/lib/catalog";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const sorts = ["relevanz", "preis-auf", "preis-ab", "leistung", "speicher"] as const;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function positiveInt(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Liest Filter aus der URL. Unbekannte Werte werden ignoriert. */
export function parseProductQuery(sp: RawSearchParams): ProductQuery {
  const category = first(sp.kategorie);
  const location = first(sp.ort);
  const sort = first(sp.sortierung);
  const brandRaw = sp.hersteller;
  const brands = (Array.isArray(brandRaw) ? brandRaw : brandRaw ? brandRaw.split(",") : []).map((b) => b.trim()).filter(Boolean);
  const q = first(sp.q)?.trim().slice(0, 100);
  return {
    q: q || undefined,
    category: category && (categorySlugs as readonly string[]).includes(category) ? (category as CategorySlug) : "alle",
    location: location && (installLocations as readonly string[]).includes(location) ? (location as InstallLocation) : undefined,
    brand: brands.length ? brands : undefined,
    withStorage: first(sp.speicher) === "1" || undefined,
    minWp: positiveInt(first(sp.minwp)),
    maxPrice: positiveInt(first(sp.maxpreis)),
    sort: sort && (sorts as readonly string[]).includes(sort) ? (sort as ProductQuery["sort"]) : "relevanz",
  };
}

export const sortLabels: Record<NonNullable<ProductQuery["sort"]>, string> = {
  relevanz: "Empfohlen",
  "preis-auf": "Preis aufsteigend",
  "preis-ab": "Preis absteigend",
  leistung: "Modulleistung",
  speicher: "Speicherkapazität",
};

export const wpOptions = [
  { value: "", label: "Beliebig" },
  { value: "800", label: "ab 800 Wp" },
  { value: "1500", label: "ab 1.500 Wp" },
];

export const priceOptions = [
  { value: "", label: "Beliebig" },
  { value: "300", label: "bis 300 €" },
  { value: "1000", label: "bis 1.000 €" },
  { value: "1500", label: "bis 1.500 €" },
];

export function countActiveFilters(q: ProductQuery): number {
  return [
    q.category && q.category !== "alle",
    q.location,
    q.brand?.length,
    q.withStorage,
    q.minWp,
    q.maxPrice,
  ].filter(Boolean).length;
}

/** Keine Filter, keine Suche, Standard-Sortierung: Dann zeigt die Liste alle Kategorien gegliedert. */
export function isUnfiltered(q: ProductQuery): boolean {
  return countActiveFilters(q) === 0 && !q.q && (q.sort ?? "relevanz") === "relevanz";
}
