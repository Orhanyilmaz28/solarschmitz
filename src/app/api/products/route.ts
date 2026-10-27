import { queryProducts, type ProductQuery } from "@/lib/catalog";
import { categorySlugs, installLocations, type CategorySlug, type InstallLocation } from "@/lib/catalog/types";
import { getStore } from "@/lib/store";
import { getMergedProducts } from "@/lib/store/catalog";
import { toPublicProduct } from "@/lib/store/public";
import { json } from "../_lib/http";

export const dynamic = "force-dynamic";

const sorts = ["relevanz", "preis-auf", "preis-ab", "leistung", "speicher"] as const;

function positive(v: string | null): number | undefined {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** GET /api/products?q=&category=&location=&withStorage=1&minWp=&maxPrice=&brand=a,b&sort= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const p = url.searchParams;
  const category = p.get("category");
  const location = p.get("location");
  const sort = p.get("sort");

  const query: ProductQuery = {
    q: p.get("q")?.slice(0, 100) || undefined,
    category: category && (categorySlugs as readonly string[]).includes(category) ? (category as CategorySlug) : undefined,
    location: location && (installLocations as readonly string[]).includes(location) ? (location as InstallLocation) : undefined,
    withStorage: p.get("withStorage") === "1" || undefined,
    minWp: positive(p.get("minWp")),
    maxPrice: positive(p.get("maxPrice")),
    brand: p.get("brand")?.split(",").map((b) => b.trim()).filter(Boolean).slice(0, 20),
    sort: sort && (sorts as readonly string[]).includes(sort) ? (sort as ProductQuery["sort"]) : undefined,
  };

  const products = queryProducts(query, await getMergedProducts(getStore())).map(toPublicProduct);
  return json({ count: products.length, products });
}
