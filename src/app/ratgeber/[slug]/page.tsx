import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuide, guides } from "@/data/guides";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { Prose } from "@/components/content/Prose";
import { ConsultCta } from "@/components/content/ConsultCta";
import { GuideToc } from "@/components/content/GuideToc";
import { ProductSchematic } from "@/components/shop/ProductSchematic";
import { LineReveal } from "@/components/motion/LineReveal";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";
import { brand } from "@/config/brand";
import { site } from "@/config/site";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.excerpt,
    alternates: { canonical: `/ratgeber/${g.slug}` },
    openGraph: { type: "article", title: g.title, description: g.excerpt },
  };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** „Balkonkraftwerk anmelden: Schritt für Schritt“ → zwei gesetzte Zeilen */
function titleLines(title: string): string[] {
  const i = title.indexOf(": ");
  return i > 0 ? [title.slice(0, i + 1), title.slice(i + 2)] : [title];
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const toc = guide.sections.map((s) => ({ id: slugify(s.heading), label: s.heading }));
  const index = guides.findIndex((g) => g.slug === guide.slug);
  // Weiterlesen: die folgenden Artikel, ringförmig
  const others = [1, 2, 3].map((k) => guides[(index + k) % guides.length]!).filter((g) => g.slug !== guide.slug);
  const url = new URL(`/ratgeber/${guide.slug}`, site.url).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    inLanguage: "de-DE",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
    mainEntityOfPage: url,
  };

  return (
    <>
      <header className="border-b border-line">
        <div className="container-x pb-14 pt-8 md:pb-20">
          <Breadcrumbs items={[{ label: "Ratgeber", href: "/ratgeber" }, { label: guide.title }]} />
          <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-12 lg:items-end lg:gap-16">
            <div className="min-w-0 lg:col-span-7">
              <Reveal as="p" className="t-label" y={12}>
                {guide.category} · {guide.readingMinutes} Min. Lesezeit
              </Reveal>
              <LineReveal as="h1" lines={titleLines(guide.title)} immediate className="t-h1 m-0 mt-5" />
              <Reveal delay={150} y={16}>
                <p className="t-lead mt-7 max-w-[56ch]">{guide.excerpt}</p>
              </Reveal>
              {guide.updated && (
                <p className="mt-6 font-mono text-xs text-muted">Stand: {guide.updated}</p>
              )}
            </div>
            <Reveal delay={120} y={24} className="min-w-0 lg:col-span-5">
              <figure className="relative mx-auto aspect-[4/3] w-full max-w-[520px] overflow-hidden rounded-[var(--radius-media)] border border-line bg-[radial-gradient(110%_90%_at_30%_15%,#ffffff_0%,#eef1ef_70%)]">
                <ProductSchematic visual={guide.visual} label="none" title={guide.title} className="absolute inset-0 h-full w-full" />
              </figure>
            </Reveal>
          </div>
        </div>
      </header>

      <div className="container-x grid gap-10 py-14 md:py-24 lg:grid-cols-12 lg:gap-16">
        {/* Mobil: Inhalt zum Aufklappen */}
        <details className="group rounded-2xl border border-line bg-white lg:hidden">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 font-semibold [&::-webkit-details-marker]:hidden">
            Inhalt <span className="font-normal text-muted">({toc.length} Abschnitte)</span>
            <Icon name="chevron-down" size={18} className="ml-auto transition-transform group-open:rotate-180" />
          </summary>
          <ol className="border-t border-line px-5 py-3">
            {toc.map((t, i) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="flex gap-3 py-2.5 text-[15px] text-ink">
                  <span className="pt-[3px] font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                  {t.label}
                </a>
              </li>
            ))}
          </ol>
        </details>

        <div className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-28">
            <GuideToc items={toc} />
          </div>
        </div>

        <article className="min-w-0 lg:col-span-8 lg:col-start-5">
          <Prose>
            {guide.sections.map((s) => (
              <section key={s.heading} id={slugify(s.heading)} className="scroll-mt-28">
                <h2>{s.heading}</h2>
                {s.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </section>
            ))}
          </Prose>
          <p className="mt-14 max-w-[66ch] border-t border-line pt-6 text-sm leading-relaxed text-muted">
            {guide.updated ? `Stand: ${guide.updated}. ` : ""}Gesetzliche Regeln können sich ändern. Dieser Ratgeber ersetzt keine Rechts- oder
            Steuerberatung.
          </p>
        </article>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="weiterlesen" className="border-t border-line">
          <div className="container-x py-16 md:py-24">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
              <h2 id="weiterlesen" className="t-h2 m-0 lg:col-span-4">
                Weiterlesen
              </h2>
              <ul className="divide-y divide-line border-y border-line lg:col-span-8">
                {others.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/ratgeber/${g.slug}`} className="group flex items-center gap-6 py-6">
                      <span className="min-w-0 flex-1">
                        <span className="t-label block !text-[10.5px]">
                          {g.category} · {g.readingMinutes} Min.
                        </span>
                        <span className="mt-2 block font-display text-[1.2rem] font-semibold leading-snug tracking-[-0.02em] group-hover:underline md:text-[1.375rem]">
                          {g.title}
                        </span>
                      </span>
                      <Icon name="arrow-right" size={22} className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <ConsultCta
        label="Nächster Schritt"
        title="Welches Set passt zu dir?"
        text="Der Produktfinder fragt Montageort, Ausrichtung und Verbrauch ab und schlägt dir passende Sets vor. Bleiben Fragen, sprich direkt mit uns."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
