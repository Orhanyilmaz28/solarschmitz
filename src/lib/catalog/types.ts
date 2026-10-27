import { z } from "zod";

export const categorySlugs = [
  "balkonkraftwerke",
  "balkonkraftwerke-mit-speicher",
  "solarmodule",
  "batteriespeicher",
  "wechselrichter",
  "montage-zubehoer",
] as const;
export type CategorySlug = (typeof categorySlugs)[number];

export const installLocations = ["balkon", "flachdach", "schraegdach", "garten"] as const;
export type InstallLocation = (typeof installLocations)[number];

/** Schlüssel der gezeichneten Produktgrafik, solange keine Fotos vorliegen */
export const visualKeys = [
  "kit-2",
  "kit-4",
  "kit-2-storage",
  "kit-4-storage",
  "module",
  "module-black",
  "battery",
  "battery-large",
  "battery-tower",
  "inverter",
  "mount-flat",
  "mount-rail",
  "meter",
  "plug",
] as const;
export type VisualKey = (typeof visualKeys)[number];

/**
 * Herkunft der Produktdaten.
 * - demo: Platzhalter, kein echtes Angebot
 * - supplier-unverified: aus öffentlichem Lieferantenkatalog übernommen, noch nicht bestätigt
 * - live: per Lieferanten-Import bestätigt (Preis und Bestand aktuell)
 */
export const dataStatuses = ["demo", "supplier-unverified", "live"] as const;
export type DataStatus = (typeof dataStatuses)[number];

export const specSchema = z.object({
  moduleCount: z.number().int().positive().optional(),
  moduleWp: z.number().positive().optional(),
  totalWp: z.number().positive().optional(),
  inverterW: z.number().positive().optional(),
  storageKWh: z.number().positive().optional(),
  storageMaxKWh: z.number().positive().optional(),
  cellType: z.string().optional(),
  moduleType: z.string().optional(),
  mppt: z.number().int().positive().optional(),
  connectivity: z.string().optional(),
  tiltRange: z.string().optional(),
  maxLengthMm: z.number().positive().optional(),
  compatibleWith: z.string().optional(),
});
export type ProductSpecs = z.infer<typeof specSchema>;

export const productSchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  sku: z.string(),
  name: z.string(),
  brand: z.string(),
  category: z.enum(categorySlugs),
  shortDescription: z.string(),
  description: z.string(),
  highlights: z.array(z.string()).default([]),
  specs: specSchema.default({}),
  includes: z.array(z.string()).default([]),
  /** Bruttopreis in Euro */
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional(),
  /** 0 = Nullsteuersatz nach § 12 Abs. 3 UStG, 19 = Regelsteuersatz */
  vatRate: z.union([z.literal(0), z.literal(19)]),
  suitableFor: z.array(z.enum(installLocations)).default([]),
  visual: z.enum(visualKeys),
  images: z.array(z.object({ src: z.string(), alt: z.string(), credit: z.string().optional() })).default([]),
  supplier: z.object({
    id: z.string(),
    supplierSku: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    /** Einkaufspreis netto, wird erst durch den Import gesetzt */
    costPrice: z.number().nonnegative().optional(),
  }),
  /** Bestand nur aus Lieferanten-Import, niemals geschätzt */
  stock: z
    .object({
      status: z.enum(["unknown", "in_stock", "low", "out_of_stock"]),
      quantity: z.number().int().nonnegative().optional(),
      updatedAt: z.string().optional(),
    })
    .default({ status: "unknown" }),
  dataStatus: z.enum(dataStatuses),
  dataNote: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type Product = z.infer<typeof productSchema>;
export type ProductInput = z.input<typeof productSchema>;

export interface Category {
  slug: CategorySlug;
  name: string;
  /** Kurzer Satz für Karten */
  tagline: string;
  description: string;
  visual: VisualKey;
  /** Hilfreiche Punkte zur Kaufberatung */
  buyingTips: string[];
}
