import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuide, guides } from "@/data/guides";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { Prose } from "@/components/content/Prose";
import { ConsultCta } from "@/components/content/ConsultCta";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
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
  return { title: g.title, description: g.excerpt, openGraph: { type: "article", title: g.title, description: g.excerpt } };
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

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const others = guides.filter((g) => g.slug !== guide.slug).slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    publisher: { "@type": "Organization", name: brand.name },
    mainEntityOfPage: new URL(`/ratgeber/${guide.slug}`, site.url).toString(),
  };

  return (
    <>
      <header className="border-b border-line bg-[radial-gradient(80%_120%_at_90%_10%,#ffffff_0%,#e9eef0_60%,#f8faf7_100%)]">
        <div className="container-x pb-14 pt-8 md:pb-20">
          <Breadcrumbs items={[{ label: "Ratgeber", href: "/ratgeber" }, { label: guide.title }]} />
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <div className="min-w-0">
              <p className="eyebrow">
                {guide.category} · {guide.readingMinutes} Min. Lesezeit
              </p>
              <h1 className="display-lg mt-4 text-[clamp(2.25rem,5vw,4rem)]">{guide.title}</h1>
              <p className="mt-5 max-w-[58ch] text-lg text-muted">{guide.excerpt}</p>
            </div>
            <div className="mx-auto w-full max-w-[380px]">
              <ProductVisual visual={guide.visual} title={guide.title} className="h-auto w-full" />
            </div>
          </div>
        </div>
      </header>

      <div className="container-x grid gap-12 py-14 md:py-20 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="Inhalt" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow mb-4">Inhalt</p>
          <ol className="space-y-2 border-l border-line text-sm">
            {guide.sections.map((s) => (
              <li key={s.heading}>
                <a href={`#${slugify(s.heading)}`} className="-ml-px block border-l-2 border-transparent py-1 pl-4 text-muted hover:border-lime hover:text-ink">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="min-w-0">
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
          <p className="mt-12 max-w-[68ch] border-t border-line pt-6 text-sm text-muted">
            Stand: Oktober 2026. Rechtliche Regeln können sich ändern. Dieser Ratgeber ersetzt keine Rechts- oder Steuerberatung.
          </p>
        </article>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="weiterlesen" className="border-t border-line bg-white">
          <div className="container-x py-14">
            <h2 id="weiterlesen" className="eyebrow mb-6">
              Weiterlesen
            </h2>
            <ul className="grid gap-4 md:grid-cols-3">
              {others.map((g) => (
                <li key={g.slug}>
                  <Link href={`/ratgeber/${g.slug}`} className="group block h-full rounded-[var(--radius-card)] border border-line p-6 transition-colors hover:border-ink">
                    <p className="eyebrow !text-[11px]">{g.category}</p>
                    <p className="mt-3 font-semibold leading-snug group-hover:underline group-hover:decoration-lime group-hover:decoration-2 group-hover:underline-offset-4">
                      {g.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <ConsultCta />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
