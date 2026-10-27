import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, getCategory } from "@/data/categories";
import { getProductsByCategory, hasPrice, queryProducts } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { ConsultCta } from "@/components/content/ConsultCta";
import { LineReveal } from "@/components/motion/LineReveal";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";
import { FilterBar } from "@/components/shop/FilterBar";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { PreviewNote } from "@/components/shop/PreviewNote";
import { VatFootnote } from "@/components/shop/VatFootnote";
import { EmptyResults } from "@/components/shop/EmptyResults";
import { ProductSchematic } from "@/components/shop/ProductSchematic";
import { SchematicCaption } from "@/components/shop/ProductMedia";
import { TiltMedia } from "@/components/shop/TiltMedia";
import { isUnfiltered, parseProductQuery, type RawSearchParams } from "@/components/shop/productQuery";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) return {};
  return { title: c.name, description: c.description, alternates: { canonical: `/kategorie/${c.slug}` } };
}

const nn = (i: number) => String(i + 1).padStart(2, "0");

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const query = { ...parseProductQuery(await searchParams), category: category.slug };
  const all = getProductsByCategory(category.slug);
  const products = queryProducts(query);
  const position = categories.findIndex((c) => c.slug === category.slug);
  const brands = [...new Set(all.filter((p) => p.dataStatus !== "demo").map((p) => p.brand))].sort();
  const others = categories.filter((c) => c.slug !== category.slug);
  const unfiltered = isUnfiltered({ ...query, category: "alle" });
  const withStorage = all.filter((p) => p.specs.storageKWh).length;
  const facets = {
    wp: all.some((p) => p.specs.totalWp),
    storage: category.slug !== "batteriespeicher" && withStorage > 0 && withStorage < all.length,
    price: all.some(hasPrice),
  };

  return (
    <>
      <header className="bg-paper">
        <div className="container-x pb-14 pt-8 md:pb-20 md:pt-10">
          <Breadcrumbs items={[{ label: "Produkte", href: "/produkte" }, { label: category.name }]} />
          <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-12 lg:items-end lg:gap-x-[var(--grid-gap)]">
            <div className="min-w-0 lg:col-span-7">
              <Reveal as="p" className="t-label" y={12}>
                Kategorie {nn(position)} / {nn(categories.length - 1)}
              </Reveal>
              <LineReveal as="h1" lines={[category.name]} immediate className="t-display mt-5 !text-[clamp(2.1rem,8.4vw,5.75rem)]" />
              <Reveal delay={120} y={16}>
                <p className="t-h3 mt-6 text-muted">{category.tagline}</p>
                <p className="t-lead mt-4 max-w-[56ch]">{category.description}</p>
              </Reveal>
              <Reveal delay={200} y={16}>
                <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6 border-t border-line pt-6">
                  <div>
                    <dt className="t-label">Produkte</dt>
                    <dd className="t-num mt-2 text-[2.25rem] tabular">{all.length}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="t-label">Hersteller</dt>
                    <dd className="mt-3 max-w-[40ch] text-[15px] leading-snug">{brands.length ? brands.join(", ") : "Folgen mit der Lieferantenanbindung"}</dd>
                  </div>
                </dl>
              </Reveal>
            </div>
            <Reveal className="min-w-0 lg:col-span-5" delay={150} y={28}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-media)] bg-stone">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_62%_at_30%_22%,rgb(255_255_255/0.95),transparent_72%)]" />
                <TiltMedia className="absolute inset-0" max={3} shift={8}>
                  <ProductSchematic visual={category.visual} title={category.name} label="none" className="h-full w-full" />
                </TiltMedia>
                <SchematicCaption label="full" />
              </div>
            </Reveal>
          </div>
        </div>
      </header>

      <Suspense fallback={<div className="h-[60px] border-y border-line md:h-16" />}>
        <FilterBar brands={brands} resultCount={products.length} lockedCategory facets={facets} />
      </Suspense>

      <div className="container-x pb-24 pt-6 md:pb-32 md:pt-10">
        <PreviewNote className="mb-12 max-w-[78ch] md:mb-16" />
        {products.length ? (
          <ProductGrid products={products} features={unfiltered} footnote />
        ) : (
          <EmptyResults resetHref={`/kategorie/${category.slug}`} text="Für diese Auswahl gibt es in der Kategorie gerade keine Produkte. Lockere einen Filter oder lass dich vom Produktfinder beraten." />
        )}
      </div>

      <section aria-labelledby="tipps-titel" className="container-x">
        <div className="grid gap-10 border-t border-line py-16 md:py-24 lg:grid-cols-12 lg:gap-x-[var(--grid-gap)]">
          <div className="lg:col-span-4">
            <p className="t-label">Kaufberatung</p>
            <h2 id="tipps-titel" className="t-h2 mt-4">
              Worauf es ankommt
            </h2>
          </div>
          <ol className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
            {category.buyingTips.map((tip, i) => (
              <Reveal as="li" key={tip} delay={i * 90} className="border-t border-ink pt-5">
                <span className="font-mono text-[12px] tabular text-muted">{nn(i)}</span>
                <p className="mt-4 text-[17px] leading-relaxed">{tip}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="weitere-titel" className="container-x pb-20 md:pb-28">
        <h2 id="weitere-titel" className="t-label mb-6">
          Weitere Kategorien
        </h2>
        <ul className="border-t border-line">
          {others.map((c) => {
            const count = getProductsByCategory(c.slug).length;
            return (
              <li key={c.slug} className="border-b border-line">
                <Link href={`/kategorie/${c.slug}`} className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 py-5 md:grid-cols-12 md:gap-x-[var(--grid-gap)] md:py-6">
                  <span className="font-mono text-[12px] tabular text-muted md:col-span-1">{nn(categories.indexOf(c))}</span>
                  <span className="t-h3 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5 md:col-span-5">{c.name}</span>
                  <span className="hidden text-[15px] text-muted md:col-span-3 md:block">{c.tagline}</span>
                  <span className="flex items-center justify-end gap-4 md:col-span-3">
                    <span className="hidden font-mono text-[12px] tabular text-muted sm:inline">
                      {count} {count === 1 ? "Produkt" : "Produkte"}
                    </span>
                    <span aria-hidden className="relative hidden h-14 w-[74px] overflow-hidden rounded-xl bg-stone md:block">
                      <ProductSchematic visual={c.visual} title={c.name} label="none" grid={false} className="h-full w-full transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110" />
                    </span>
                    <Icon name="arrow-right" size={18} className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <VatFootnote className="mt-20 md:mt-28" />
      </section>

      <ConsultCta />
    </>
  );
}
