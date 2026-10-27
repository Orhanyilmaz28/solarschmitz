import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllProducts, getBrands, queryProducts } from "@/lib/catalog";
import { categories, getCategory } from "@/data/categories";
import { PageHeader } from "@/components/content/PageHeader";
import { ConsultCta } from "@/components/content/ConsultCta";
import { FilterBar } from "@/components/shop/FilterBar";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { PreviewNote } from "@/components/shop/PreviewNote";
import { VatFootnote } from "@/components/shop/VatFootnote";
import { EmptyResults } from "@/components/shop/EmptyResults";
import { isUnfiltered, parseProductQuery, type RawSearchParams } from "@/components/shop/productQuery";

export const metadata: Metadata = {
  title: "Alle Produkte",
  description: "Balkonkraftwerke, Speicher, Solarmodule, Wechselrichter und Zubehör im Überblick. Mit Filtern nach Montageort, Leistung und Preis.",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const query = parseProductQuery(await searchParams);
  const products = queryProducts(query);
  const category = query.category && query.category !== "alle" ? getCategory(query.category) : undefined;
  const grouped = isUnfiltered(query);
  const all = getAllProducts();
  const counts = Object.fromEntries(categories.map((c) => [c.slug, all.filter((p) => p.category === c.slug).length]));

  return (
    <>
      <PageHeader
        eyebrow={category ? "Produkte · Kategorie" : "Produkte"}
        title={category ? category.name : query.q ? `Ergebnisse für „${query.q}“` : "Alle Produkte"}
        lead={
          category
            ? category.description
            : "Balkonkraftwerke, Speicher, Module, Wechselrichter und Zubehör. Filtere nach Montageort, Leistung und Budget oder stöbere nach Kategorie."
        }
        crumbs={[{ label: "Produkte", href: "/produkte" }, ...(category ? [{ label: category.name }] : [])]}
        flush
      />

      <Suspense fallback={<div className="h-[60px] border-b border-line md:h-16" />}>
        <FilterBar brands={getBrands()} resultCount={products.length} categoryCounts={counts} />
      </Suspense>

      <div className="container-x pb-24 pt-6 md:pb-32 md:pt-10">
        <PreviewNote className="mb-12 max-w-[78ch] md:mb-16" />

        {products.length === 0 ? (
          <EmptyResults />
        ) : (
          <ProductGrid products={products} grouped={grouped} features={grouped} tips={grouped} footnote />
        )}

        <VatFootnote className="mt-24 md:mt-32" />
      </div>

      <ConsultCta />
    </>
  );
}
