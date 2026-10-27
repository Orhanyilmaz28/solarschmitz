import { categories, getCategory } from "@/data/categories";
import { seedProducts } from "@/data/products";
import type { CategorySlug, InstallLocation, Product } from "./types";

/**
 * Katalog-Zugriff. Liest aktuell den validierten Seed-Katalog.
 * Der Lieferanten-Import (src/lib/suppliers) schreibt später in den
 * Produkt-Store; dann wird hier aus dem Store gelesen.
 */
let cache: Product[] | null = null;

export function getAllProducts(): Product[] {
  // Die Prüfung gegen productSchema läuft beim Build auf dem Server (validate.ts, aufgerufen im Layout)
  // und in den Tests. Im Browser wird nicht erneut geprüft, das spart zod im Bundle.
  if (!cache)
    cache = seedProducts.map((input) => {
      // Standardwerte wie in productSchema (.default(...)), ohne zod im Browser
      const p = {
        ...input,
        highlights: input.highlights ?? [],
        specs: input.specs ?? {},
        includes: input.includes ?? [],
        suitableFor: input.suitableFor ?? [],
        images: input.images ?? [],
        stock: input.stock ?? { status: "unknown" as const },
        tags: input.tags ?? [],
        manufacturer: input.manufacturer ?? {},
        safetyNotes: input.safetyNotes ?? [],
        accessoryIds: input.accessoryIds ?? [],
      } as Product;
      // Einkaufspreise gehören nie in den öffentlichen Katalog
      const { costPrice: _cost, ...supplier } = p.supplier;
      return { ...p, supplier };
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

// ---------- Varianten, Zubehör, ähnliche Produkte ----------

/** Alle Varianten einer Produktfamilie in Katalog-Reihenfolge (mindestens das Produkt selbst). */
export function getFamily(product: Product): Product[] {
  if (!product.family) return [product];
  const members = getAllProducts().filter((p) => p.family === product.family);
  return members.length ? members : [product];
}

export interface AccessoryHint {
  product: Product;
  /** Warum das Zubehör passt (aus Produktdaten abgeleitet) */
  reason: string;
  /** Empfohlene Stückzahl, falls sie sich aus den Daten ergibt */
  quantity?: number;
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

/**
 * Zerlegt Kompatibilitätsangaben wie „Anker SOLIX Solarbank 2 E1600 Pro / Plus“
 * in vollständige Namen: [„… E1600 Pro“, „… E1600 Plus“].
 */
export function compatibleNames(compatibleWith: string | undefined): string[] {
  if (!compatibleWith) return [];
  const parts = compatibleWith.split("/").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return [];
  const first = parts[0]!;
  const base = first.split(" ").slice(0, -1).join(" ");
  return [first, ...parts.slice(1).map((p) => (p.includes(" ") ? p : `${base} ${p}`))];
}

/** Ist `accessory` laut seiner Kompatibilitätsangabe für `product` gedacht? */
export function isCompatibleAccessory(accessory: Product, product: Product): boolean {
  const target = normalizeName(product.name);
  return compatibleNames(accessory.specs.compatibleWith).some((n) => target.includes(normalizeName(n)));
}

/** Liest „für 2 Module“ aus Name oder Lieferumfang einer Halterung. */
export function mountCapacity(mount: Product): number | undefined {
  const text = [mount.name, ...mount.includes].join(" ");
  const m = text.match(/für\s+(\d+)\s+Module/i);
  return m ? Number(m[1]) : undefined;
}

const isSet = (p: Product) => p.category === "balkonkraftwerke" || p.category === "balkonkraftwerke-mit-speicher";
const isAcStorage = (p: Product) => p.category === "batteriespeicher" && p.tags.some((t) => t === "ac-gekoppelt" || t === "nachruesten");

/**
 * Zubehör nach Kompatibilitätsregeln. Empfohlen wird nur, was einen Preis hat
 * und sich aus den Produktdaten begründen lässt.
 */
export function getAccessories(product: Product, limit = 4): AccessoryHint[] {
  const all = getAllProducts().filter((p) => p.id !== product.id && hasPrice(p) && p.family !== product.family);
  const out: AccessoryHint[] = [];
  const push = (p: Product | undefined, reason: string, quantity?: number) => {
    if (!p || out.some((o) => o.product.id === p.id)) return;
    out.push({ product: p, reason, ...(quantity && quantity > 1 ? { quantity } : {}) });
  };

  for (const id of product.accessoryIds) push(all.find((p) => p.id === id), "Empfohlenes Zubehör");

  // Aufständerung für Sets, die auf Flachdach oder im Garten stehen können
  if (isSet(product) && product.suitableFor.some((s) => s === "flachdach" || s === "garten")) {
    for (const m of all.filter((p) => p.category === "montage-zubehoer" && p.specs.tiltRange)) {
      const cap = mountCapacity(m);
      const modules = product.specs.moduleCount;
      const qty = cap && modules ? Math.ceil(modules / cap) : undefined;
      push(m, qty && qty > 1 ? `Aufständerung für Flachdach und Garten, ${qty} Stück für ${modules} Module` : "Aufständerung für Flachdach und Garten", qty);
    }
  }

  // Zubehör, das laut Lieferant genau für dieses Gerät gedacht ist (z. B. Smart Meter)
  for (const a of all) if (isCompatibleAccessory(a, product)) push(a, "Laut Lieferant kompatibel");

  // Sets ohne Speicher: AC-gekoppelte Speicher lassen sich nachrüsten
  if (isSet(product) && !product.specs.storageKWh) {
    for (const s of all.filter(isAcStorage)) push(s, "Speicher zum Nachrüsten (AC-gekoppelt)");
  }

  // AC-Speicher: ein Set ohne Speicher liefert den Solarstrom
  if (isAcStorage(product)) {
    for (const s of all.filter((p) => isSet(p) && !p.specs.storageKWh)) push(s, "Liefert den Solarstrom für den Speicher");
  }

  return out.slice(0, limit);
}

/** Kategorien, die inhaltlich zusammengehören (Sets mit und ohne Speicher) */
const relatedCategories: Partial<Record<CategorySlug, CategorySlug[]>> = {
  balkonkraftwerke: ["balkonkraftwerke-mit-speicher"],
  "balkonkraftwerke-mit-speicher": ["balkonkraftwerke", "batteriespeicher"],
  batteriespeicher: ["balkonkraftwerke-mit-speicher"],
};

/**
 * Ähnliche Produkte: gleiche Kategorie, dann verwandte Kategorien, ohne Varianten
 * und ohne bereits empfohlenes Zubehör. Innerhalb einer Stufe echte Daten vor Demo-Produkten.
 * Nur wenn es gar nichts Verwandtes gibt, kommen andere Produkte für denselben Montageort.
 */
export function getSimilarProducts(product: Product, limit = 4, exclude: string[] = []): Product[] {
  const skip = new Set([product.id, ...exclude, ...getFamily(product).map((p) => p.id)]);
  const pool = getAllProducts().filter((p) => !skip.has(p.id));
  const related = relatedCategories[product.category] ?? [];
  const rank = (p: Product) => (p.category === product.category ? 0 : related.includes(p.category) ? 1 : 2);
  const demo = (p: Product) => Number(p.dataStatus === "demo");
  const close = pool.filter((p) => rank(p) < 2);
  const ranked = close.length
    ? close
    : pool.filter((p) => p.suitableFor.some((s) => product.suitableFor.includes(s)));
  // stabile Sortierung: Stufe, dann echte Daten vor Demo-Produkten, sonst Katalog-Reihenfolge
  return [...ranked].sort((a, b) => rank(a) - rank(b) || demo(a) - demo(b)).slice(0, limit);
}

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
