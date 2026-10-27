import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getBrands, queryProducts } from "@/lib/catalog";
import { getCategory } from "@/data/categories";
import { PageHeader } from "@/components/content/PageHeader";
import { Notice } from "@/components/content/Notice";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductFilters, SortSelect } from "@/components/shop/ProductFilters";
import { countActiveFilters, parseProductQuery, type RawSearchParams } from "@/components/shop/productQuery";
import { ConsultCta } from "@/components/content/ConsultCta";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Alle Produkte",
  description: "Balkonkraftwerke, Speicher, Solarmodule, Wechselrichter und Zubehör im Überblick. Mit Filtern nach Montageort, Leistung und Preis.",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const query = parseProductQuery(await searchParams);
  const products = queryProducts(query);
  const category = query.category && query.category !== "alle" ? getCategory(query.category) : undefined;
  const active = countActiveFilters(query);

  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title={category ? category.name : query.q ? `Ergebnisse für „${query.q}“` : "Alle Produkte"}
        lead={
          category
            ? category.description
            : "Balkonkraftwerke, Speicher, Solarmodule, Wechselrichter und Zubehör. Filtere nach Montageort, Leistung und Budget."
        }
        crumbs={[{ label: "Produkte", href: "/produkte" }, ...(category ? [{ label: category.name }] : [])]}
      />

      <section className="container-x py-10 md:py-14">
        {site.previewMode && (
          <Notice tone="preview" title="Vorschau des Sortiments" className="mb-10">
            Produkte mit dem Hinweis „Vorschau“ stammen aus dem Katalog unseres Lieferanten. Preise sind Richtpreise und noch nicht bestätigt.
            „Demo-Produkte“ sind Platzhalter ohne Preis. Bestellungen sind noch nicht möglich.
          </Notice>
        )}

        <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
          <aside aria-label="Filter" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <Suspense fallback={null}>
              <ProductFilters brands={getBrands()} resultCount={products.length} />
            </Suspense>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
              <p className="text-sm text-muted">
                <span className="font-semibold text-ink tabular">{products.length}</span> {products.length === 1 ? "Produkt" : "Produkte"}
                {active > 0 && ` · ${active} ${active === 1 ? "Filter" : "Filter"} aktiv`}
              </p>
              <Suspense fallback={null}>
                <SortSelect />
              </Suspense>
            </div>

            {products.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-white px-6 py-16 text-center">
                <p className="display-md m-0 text-2xl">Keine passenden Produkte</p>
                <p className="mx-auto mt-3 max-w-[46ch] text-muted">
                  Lockere einen Filter oder versuch einen anderen Suchbegriff. Der Produktfinder hilft dir auch ohne Fachbegriffe weiter.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/produkte" className="font-semibold underline decoration-lime decoration-2 underline-offset-4">
                    Filter zurücksetzen
                  </Link>
                  <Link href="/konfigurator" className="font-semibold underline decoration-lime decoration-2 underline-offset-4">
                    Zum Produktfinder
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p, i) => (
                  <li key={p.id} className="min-w-0">
                    <Reveal delay={(i % 3) * 70} className="h-full">
                      <ProductCard product={p} />
                    </Reveal>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <ConsultCta />
    </>
  );
}
