import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAccessories, getAllProducts, getFamily, getProductBySlug, getSimilarProducts, hasPrice } from "@/lib/catalog";
import { getCategory } from "@/data/categories";
import { ConsultCta } from "@/components/content/ConsultCta";
import { ProductDetail, type VariantBundle } from "@/components/shop/pdp/ProductDetail";
import { site } from "@/config/site";
import { brand } from "@/config/brand";

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.shortDescription,
    alternates: { canonical: `/produkt/${p.slug}` },
    // Demo-Produkte nicht in Suchmaschinen aufnehmen
    // Vorschau: nichts indexieren (Preise und Daten noch nicht final); sonst Demo-Produkte ausnehmen
    robots: site.previewMode ? { index: false, follow: false } : p.dataStatus === "demo" ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  // Alle Varianten der Familie mit Zubehör und ähnlichen Produkten, damit der Wechsel ohne Neuladen klappt
  const bundles: VariantBundle[] = getFamily(product).map((p) => {
    const accessories = getAccessories(p, 4);
    return { product: p, accessories, similar: getSimilarProducts(p, 4, accessories.map((a) => a.product.id)) };
  });

  // Strukturierte Daten nur mit gesicherten Angaben. Ein Angebot (offers) erst, wenn der Preis bestätigt ist.
  const category = getCategory(product.category);
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    category: category?.name,
    url: new URL(`/produkt/${product.slug}`, site.url).toString(),
    ...(product.images[0] ? { image: new URL(product.images[0].src, site.url).toString() } : {}),
    ...(product.dataStatus === "live" && hasPrice(product)
      ? {
          offers: {
            "@type": "Offer",
            price: product.price.toFixed(2),
            priceCurrency: "EUR",
            seller: { "@type": "Organization", name: brand.name },
          },
        }
      : {}),
  };

  return (
    <>
      <ProductDetail bundles={bundles} initialId={product.id} siteName={brand.name} />
      <ConsultCta
        title="Fragen zu diesem Produkt?"
        text="Wir helfen dir bei Montageort, Leistung und Speichergröße. Der Produktfinder rechnet deine Ersparnis mit offenen Annahmen durch."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
