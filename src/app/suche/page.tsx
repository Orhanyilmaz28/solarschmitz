import type { Metadata } from "next";
import Link from "next/link";
import { getProductsByCategory, queryProducts } from "@/lib/catalog";
import { categories } from "@/data/categories";
import { guides } from "@/data/guides";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { ConsultCta } from "@/components/content/ConsultCta";
import { Icon } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ProductSchematic } from "@/components/shop/ProductSchematic";
import { PreviewNote } from "@/components/shop/PreviewNote";
import { VatFootnote } from "@/components/shop/VatFootnote";
import type { RawSearchParams } from "@/components/shop/productQuery";

export const metadata: Metadata = {
  title: "Suche",
  description: "Durchsuche Produkte, Kategorien und Ratgeber.",
  robots: { index: false, follow: true },
};

const suggestions = ["Balkonkraftwerk", "Speicher", "Anker SOLIX", "Wechselrichter", "Halterung", "bifazial"];

function norm(s: string) {
  return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (raw ?? "").trim().slice(0, 100);
  const products = q ? queryProducts({ q }) : [];
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const matches = (text: string) => terms.length > 0 && terms.every((t) => norm(text).includes(t));
  const cats = q ? categories.filter((c) => matches(`${c.name} ${c.tagline} ${c.description}`)) : [];
  const articles = q ? guides.filter((g) => matches(`${g.title} ${g.excerpt} ${g.category}`)) : [];
  const total = products.length + cats.length + articles.length;

  return (
    <>
      <header className="bg-paper">
        <div className="container-x pb-12 pt-8 md:pb-16 md:pt-10">
          <Breadcrumbs items={[{ label: "Suche" }]} />
          <p className="t-label mt-12 md:mt-16">Suche</p>
          <h1 className="t-h1 mt-5 max-w-5xl break-words">{q ? <>„{q}“</> : "Was suchst du?"}</h1>

          <form action="/suche" method="get" role="search" className="mt-10 max-w-3xl md:mt-12">
            <label htmlFor="suche-q" className="sr-only">
              Suchbegriff
            </label>
            <div className="flex items-center gap-3 border-b-2 border-ink pb-3 transition-shadow focus-within:shadow-[0_2px_0_0_var(--color-ink)] md:gap-4">
              <Icon name="search" size={24} className="shrink-0" />
              <input
                id="suche-q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="z. B. Balkonkraftwerk mit Speicher"
                autoComplete="off"
                enterKeyHint="search"
                className="min-w-0 flex-1 bg-transparent font-display text-[clamp(1.2rem,2.4vw,1.75rem)] tracking-[-0.02em] placeholder:text-muted/60 focus:outline-none"
              />
              <button type="submit" className={buttonClass("dark", "sm", "shrink-0")}>
                Suchen
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="t-label mr-2">Beliebt</span>
            {suggestions.map((s) => (
              <Link
                key={s}
                href={`/suche?q=${encodeURIComponent(s)}`}
                className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13.5px] font-medium transition-colors ${
                  norm(s) === norm(q) ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40"
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div className="container-x pb-24 md:pb-32">
        {q && (
          <p className="border-t border-line pt-5 font-mono text-[12px] tabular text-muted" aria-live="polite">
            {total} {total === 1 ? "Treffer" : "Treffer"} für „{q}“
          </p>
        )}

        {!q && (
          <div className="border-t border-line pt-10">
            <p className="t-label mb-6">Kategorien</p>
            <CategoryList items={categories} />
          </div>
        )}

        {q && total === 0 && (
          <div className="grid gap-8 pt-10 md:grid-cols-12 md:pt-14">
            <p className="t-h2 m-0 md:col-span-6">Keine Treffer</p>
            <div className="md:col-span-5 md:col-start-8">
              <p className="m-0 text-[16px] leading-relaxed text-muted">
                Prüfe die Schreibweise oder versuch einen allgemeineren Begriff. Du kannst auch alle Produkte ansehen oder den Produktfinder nutzen.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-[15px] font-semibold">
                <Link href="/produkte" className="underline decoration-ink/20 underline-offset-[6px] hover:decoration-ink">
                  Alle Produkte
                </Link>
                <Link href="/konfigurator" className="group inline-flex items-center gap-2">
                  <span className="underline decoration-ink/20 underline-offset-[6px] group-hover:decoration-ink">Zum Produktfinder</span>
                  <Icon name="arrow-right" size={16} className="transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {cats.length > 0 && (
          <section aria-labelledby="treffer-kategorien" className="pt-12 md:pt-16">
            <h2 id="treffer-kategorien" className="t-label mb-6">
              Kategorien · {cats.length}
            </h2>
            <CategoryList items={cats} />
          </section>
        )}

        {products.length > 0 && (
          <section aria-labelledby="treffer-produkte" className="pt-14 md:pt-20">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 id="treffer-produkte" className="t-label m-0">
                Produkte · {products.length}
              </h2>
              <Link href={`/produkte?q=${encodeURIComponent(q)}`} className="group inline-flex items-center gap-2 text-[14px] font-semibold">
                <span className="underline decoration-ink/20 underline-offset-[6px] group-hover:decoration-ink">Mit Filtern verfeinern</span>
                <Icon name="arrow-right" size={16} className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </div>
            <PreviewNote className="mb-12 max-w-[78ch]" />
            <ProductGrid products={products} footnote />
          </section>
        )}

        {articles.length > 0 && (
          <section aria-labelledby="treffer-ratgeber" className="pt-16 md:pt-24">
            <h2 id="treffer-ratgeber" className="t-label mb-6">
              Ratgeber · {articles.length}
            </h2>
            <ul className="border-t border-line">
              {articles.map((g) => (
                <li key={g.slug} className="border-b border-line">
                  <Link href={`/ratgeber/${g.slug}`} className="group grid gap-2 py-6 md:grid-cols-12 md:items-baseline md:gap-x-[var(--grid-gap)]">
                    <span className="t-label md:col-span-3">{g.category}</span>
                    <span className="t-h3 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5 md:col-span-7">{g.title}</span>
                    <span className="font-mono text-[12px] tabular text-muted md:col-span-2 md:text-right">{g.readingMinutes} Min.</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {products.length > 0 && <VatFootnote className="mt-20 md:mt-28" />}
      </div>

      <ConsultCta />
    </>
  );
}

function CategoryList({ items }: { items: typeof categories }) {
  return (
    <ul className="border-t border-line">
      {items.map((c) => {
        const count = getProductsByCategory(c.slug).length;
        return (
          <li key={c.slug} className="border-b border-line">
            <Link href={`/kategorie/${c.slug}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-5 md:grid-cols-12 md:gap-x-[var(--grid-gap)]">
              <span className="t-h3 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5 md:col-span-5">{c.name}</span>
              <span className="hidden text-[15px] text-muted md:col-span-4 md:block">{c.tagline}</span>
              <span className="flex items-center justify-end gap-4 md:col-span-3">
                <span className="hidden font-mono text-[12px] tabular text-muted sm:inline">
                  {count} {count === 1 ? "Produkt" : "Produkte"}
                </span>
                <span aria-hidden className="relative hidden h-12 w-16 overflow-hidden rounded-xl bg-stone md:block">
                  <ProductSchematic visual={c.visual} label="none" grid={false} className="h-full w-full" />
                </span>
                <Icon name="arrow-right" size={18} className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
