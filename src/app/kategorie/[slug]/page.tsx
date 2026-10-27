import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, getCategory } from "@/data/categories";
import { getProductsByCategory } from "@/lib/catalog";
import type { CategorySlug } from "@/lib/catalog/types";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { ProductCard } from "@/components/shop/ProductCard";
import { ConsultCta } from "@/components/content/ConsultCta";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) return {};
  return { title: c.name, description: c.description };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const products = getProductsByCategory(category.slug as CategorySlug);
  const others = categories.filter((c) => c.slug !== category.slug);

  return (
    <>
      <header className="relative overflow-hidden border-b border-line bg-[radial-gradient(90%_120%_at_85%_20%,#ffffff_0%,#e9eef0_55%,#f8faf7_100%)]">
        <div className="container-x pb-14 pt-8 md:pb-20 md:pt-10">
          <Breadcrumbs items={[{ label: "Produkte", href: "/produkte" }, { label: category.name }]} />
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <p className="eyebrow mb-4">Kategorie</p>
              <h1 className="display-lg m-0 text-[clamp(2.5rem,6vw,4.75rem)]">{category.name}</h1>
              <p className="mt-3 font-display text-xl font-semibold text-lime-deep" style={{ fontStretch: "108%" }}>
                {category.tagline}
              </p>
              <p className="mt-5 max-w-[56ch] text-lg text-muted">{category.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="#produkte" variant="dark" arrow>
                  {products.length} {products.length === 1 ? "Produkt" : "Produkte"} ansehen
                </ButtonLink>
                <ButtonLink href="/konfigurator" variant="outline">
                  Passende Lösung finden
                </ButtonLink>
              </div>
            </div>
            <Reveal className="relative mx-auto w-full max-w-[560px]" y={40}>
              <div aria-hidden className="absolute inset-[12%] rounded-full bg-sun/25 blur-3xl" />
              <ProductVisual visual={category.visual} title={category.name} className="relative h-auto w-full drop-shadow-[0_30px_40px_rgb(16_24_32/0.12)]" />
            </Reveal>
          </div>
        </div>
      </header>

      <section aria-labelledby="tipps" className="container-x py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="eyebrow mb-3">Kaufberatung</p>
            <h2 id="tipps" className="display-md m-0 text-[clamp(1.75rem,3vw,2.5rem)]">
              Darauf solltest du achten
            </h2>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {category.buyingTips.map((tip, i) => (
              <Reveal as="li" key={tip} delay={i * 80} className="rounded-[var(--radius-card)] border border-line bg-white p-6">
                <span className="font-mono text-sm text-lime-deep">Tipp {i + 1}</span>
                <p className="mt-3 text-[15px] leading-relaxed">{tip}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="produkte" aria-labelledby="produkte-titel" className="scroll-mt-28 container-x pb-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-14">
          <h2 id="produkte-titel" className="display-md m-0 text-[clamp(1.75rem,3vw,2.5rem)]">
            {category.name} im Shop
          </h2>
          <Link
            href={`/produkte?kategorie=${category.slug}`}
            className="text-sm font-semibold underline decoration-lime decoration-2 underline-offset-4 hover:text-lime-deep"
          >
            Mit Filtern durchsuchen
          </Link>
        </div>
        {products.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <li key={p.id} className="min-w-0">
                <Reveal delay={(i % 4) * 70} className="h-full">
                  <ProductCard product={p} />
                </Reveal>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">In dieser Kategorie sind noch keine Produkte gelistet.</p>
        )}
      </section>

      <section aria-labelledby="weitere" className="border-t border-line bg-white">
        <div className="container-x py-14">
          <h2 id="weitere" className="eyebrow mb-6">
            Weitere Kategorien
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {others.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/kategorie/${c.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-line p-3 transition-colors hover:border-ink"
                >
                  <span className="h-14 w-14 shrink-0 rounded-xl bg-mist p-1.5">
                    <ProductVisual visual={c.visual} className="h-full w-full transition-transform duration-500 group-hover:scale-110" title={c.name} />
                  </span>
                  <span className="text-sm font-semibold leading-tight">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ConsultCta />
    </>
  );
}
