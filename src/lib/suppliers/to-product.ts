import { productSchema, type CategorySlug, type Product, type VisualKey } from "@/lib/catalog/types";
import { computeSellPrice, type PriceResult } from "./pricing";
import type { RowIssue, SupplierConfig, SupplierItem } from "./types";

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Passende Grafik wählen, solange keine Produktfotos vorliegen */
export function inferVisual(category: CategorySlug, item: Pick<SupplierItem, "name" | "specs">): VisualKey {
  const n = item.name.toLowerCase();
  const modules = item.specs.moduleCount ?? 2;
  const storage = item.specs.storageKWh ?? 0;
  switch (category) {
    case "balkonkraftwerke":
      return modules >= 3 ? "kit-4" : "kit-2";
    case "balkonkraftwerke-mit-speicher":
      return modules >= 3 ? "kit-4-storage" : "kit-2-storage";
    case "solarmodule":
      return /black|schwarz/.test(n) ? "module-black" : "module";
    case "batteriespeicher":
      return storage >= 5 ? "battery-tower" : storage >= 2.5 ? "battery-large" : "battery";
    case "wechselrichter":
      return "inverter";
    case "montage-zubehoer":
      if (/zähler|zaehler|meter/.test(n)) return "meter";
      if (/plug|steckdose/.test(n)) return "plug";
      if (/geländer|gelaender|balkon/.test(n)) return "mount-rail";
      return "mount-flat";
  }
}

export function productIdFor(supplierId: string, supplierSku: string): string {
  return `${supplierId}-${slugify(supplierSku)}`;
}

export interface BuildResult {
  product?: Product;
  price?: PriceResult;
  issues: RowIssue[];
}

/**
 * Aus einem Lieferanten-Produkt ein validiertes Shop-Produkt machen.
 * Ein vorhandenes Produkt behält ID, Slug und manuell gepflegte Texte und Bilder.
 */
export function buildProduct(item: SupplierItem, config: SupplierConfig, row: number, existing?: Product): BuildResult {
  const issues: RowIssue[] = [];
  if (!item.category) return { issues: [{ row, field: "category", message: "Ohne Kategorie kein Import" }] };

  const vatRate = item.vatRate ?? config.defaultVatRate;
  const price = computeSellPrice({ costPriceNet: item.costPrice, rrpGross: item.rrp, vatRate, rule: config.pricing });
  // Fehlende Preise meldet schon das Mapping; hier nur unbrauchbare Werte (z. B. 0 €)
  const hasPriceInput = item.costPrice !== undefined || item.rrp !== undefined;
  if (price.price <= 0 && hasPriceInput) issues.push({ row, field: "costPrice", message: "Kein Verkaufspreis berechenbar" });
  if (price.flags.includes("below_min_margin")) {
    issues.push({ row, field: "costPrice", message: `Marge unter Mindestmarge (${price.marginEUR?.toFixed(2)} €), wegen UVP-Grenze` });
  }

  const id = existing?.id ?? productIdFor(config.id, item.supplierSku);
  const slug = existing?.slug ?? `${slugify(item.name)}-${slugify(item.supplierSku)}`.slice(0, 120).replace(/-+$/g, "");
  const description = existing?.description || item.description || "";
  const shortDescription =
    existing?.shortDescription || item.shortDescription || firstSentence(item.description) || item.name;

  const candidate = {
    id,
    slug,
    sku: existing?.sku ?? `${config.skuPrefix}-${item.supplierSku}`.toUpperCase().replace(/[^A-Z0-9-]/g, "-"),
    name: item.name,
    brand: item.brand ?? existing?.brand ?? config.name,
    category: item.category,
    shortDescription,
    description,
    highlights: existing?.highlights ?? [],
    specs: { ...existing?.specs, ...item.specs },
    includes: existing?.includes ?? [],
    price: price.price,
    // Streichpreise nur bewusst setzen (Preisangabenverordnung), nicht automatisch aus der UVP
    compareAtPrice: existing?.compareAtPrice,
    vatRate,
    suitableFor: existing?.suitableFor?.length ? existing.suitableFor : ["balkon", "flachdach", "schraegdach", "garten"],
    visual: existing?.visual ?? inferVisual(item.category, item),
    images: existing?.images?.length ? existing.images : item.imageUrl ? [{ src: item.imageUrl, alt: item.name, credit: config.name }] : [],
    supplier: {
      id: config.id,
      supplierSku: item.supplierSku,
      sourceUrl: item.productUrl ?? existing?.supplier.sourceUrl,
      costPrice: item.costPrice,
    },
    stock: item.stock,
    dataStatus: config.importAs,
    dataNote: existing?.dataNote,
    tags: existing?.tags ?? [],
  };

  const parsed = productSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({ row, field: issue.path.join("."), message: issue.message });
    }
    return { issues, price };
  }
  if (price.price <= 0) return { issues, price };
  return { product: parsed.data, price, issues };
}

function firstSentence(text?: string): string | undefined {
  if (!text) return undefined;
  const m = text.match(/^(.{20,200}?[.!?])(\s|$)/);
  return (m?.[1] ?? text.slice(0, 160)).trim();
}
