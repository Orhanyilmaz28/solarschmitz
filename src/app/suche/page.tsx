import type { Metadata } from "next";
import Link from "next/link";
import { queryProducts } from "@/lib/catalog";
import { categories } from "@/data/categories";
import { guides } from "@/data/guides";
import { ProductCard } from "@/components/shop/ProductCard";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { ConsultCta } from "@/components/content/ConsultCta";
import { Reveal } from "@/components/motion/Reveal";
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
      <section className="border-b border-line">
        <div className="container-x pb-12 pt-8 md:pb-16">
          <Breadcrumbs items={[{ label: "Suche" }]} />
          <h1 className="display-lg mt-10 text-[clamp(2.25rem,5vw,4rem)]">{q ? <>Suche nach „{q}“</> : "Was suchst du?"}</h1>
          <form action="/suche" method="get" role="search" className="mt-8 flex max-w-2xl gap-3">
            <label htmlFor="suche-q" className="sr-only">
              Suchbegriff
            </label>
            <input
              id="suche-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="z. B. Balkonkraftwerk mit Speicher"
              autoComplete="off"
              className="field-input h-14 !rounded-full !px-6 text-base"
            />
            <button type="submit" className="h-14 shrink-0 rounded-full bg-ink px-7 font-semibold text-paper hover:bg-ink-3">
              Suchen
            </button>
          </form>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Beliebt:</span>
            {suggestions.map((s) => (
              <Link key={s} href={`/suche?q=${encodeURIComponent(s)}`} className="rounded-full border border-line bg-white px-3 py-1.5 hover:border-ink">
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container-x py-12 md:py-16">
        {q && (
          <p className="mb-10 text-sm text-muted" aria-live="polite">
            <span className="font-semibold text-ink tabular">{total}</span> {total === 1 ? "Treffer" : "Treffer"}
          </p>
        )}

        {q && total === 0 && (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-white px-6 py-14 text-center">
            <p className="display-md m-0 text-2xl">Keine Treffer für „{q}“</p>
            <p className="mx-auto mt-3 max-w-[48ch] text-muted">
              Prüfe die Schreibweise oder versuch einen allgemeineren Begriff. Du kannst auch alle Produkte ansehen oder den Produktfinder nutzen.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link href="/produkte" className="font-semibold underline decoration-lime decoration-2 underline-offset-4">
                Alle Produkte
              </Link>
              <Link href="/konfigurator" className="font-semibold underline decoration-lime decoration-2 underline-offset-4">
                Produktfinder
              </Link>
            </div>
          </div>
        )}

        {cats.length > 0 && (
          <section aria-labelledby="treffer-kategorien" className="mb-14">
            <h2 id="treffer-kategorien" className="eyebrow mb-4">
              Kategorien
            </h2>
            <ul className="flex flex-wrap gap-3">
              {cats.map((c) => (
                <li key={c.slug}>
                  <Link href={`/kategorie/${c.slug}`} className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-3">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {products.length > 0 && (
          <section aria-labelledby="treffer-produkte" className="mb-14">
            <h2 id="treffer-produkte" className="eyebrow mb-5">
              Produkte ({products.length})
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => (
                <li key={p.id} className="min-w-0">
                  <Reveal delay={(i % 4) * 60} className="h-full">
                    <ProductCard product={p} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        )}

        {articles.length > 0 && (
          <section aria-labelledby="treffer-ratgeber">
            <h2 id="treffer-ratgeber" className="eyebrow mb-5">
              Ratgeber
            </h2>
            <ul className="divide-y divide-line border-y border-line">
              {articles.map((g) => (
                <li key={g.slug}>
                  <Link href={`/ratgeber/${g.slug}`} className="group flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                    <span className="text-lg font-semibold group-hover:underline group-hover:decoration-lime group-hover:decoration-2 group-hover:underline-offset-4">
                      {g.title}
                    </span>
                    <span className="shrink-0 text-sm text-muted">{g.readingMinutes} Min. Lesezeit</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <ConsultCta />
    </>
  );
}
