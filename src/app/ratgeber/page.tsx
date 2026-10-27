import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/data/guides";
import { PageHeader } from "@/components/content/PageHeader";
import { ConsultCta } from "@/components/content/ConsultCta";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Ratgeber",
  description: "Anmeldung, Solarpaket I, Speicher, Ausrichtung und Mietrecht: verständlich erklärt.",
};

export default function GuidesPage() {
  const [featured, ...rest] = guides;
  return (
    <>
      <PageHeader
        eyebrow="Ratgeber"
        title="Wissen für deine Solaranlage"
        lead="Klare Antworten auf die Fragen, die vor dem Kauf wirklich zählen. Ohne Fachchinesisch."
        crumbs={[{ label: "Ratgeber" }]}
      />

      <section className="container-x py-14 md:py-20">
        {featured && (
          <Reveal>
            <Link
              href={`/ratgeber/${featured.slug}`}
              className="group grid overflow-hidden rounded-[28px] border border-line bg-white transition-shadow duration-500 hover:shadow-[var(--shadow-lift)] md:grid-cols-2"
            >
              <div className="sheen relative aspect-[4/3] bg-[radial-gradient(110%_90%_at_30%_10%,#ffffff_0%,#e9eef0_70%)] md:aspect-auto">
                <div className="absolute inset-[10%] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105">
                  <ProductVisual visual={featured.visual} title={featured.title} className="h-full w-full" />
                </div>
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12">
                <p className="eyebrow">
                  {featured.category} · {featured.readingMinutes} Min.
                </p>
                <h2 className="display-md mt-4 text-[clamp(1.75rem,3vw,2.5rem)] group-hover:underline group-hover:decoration-lime group-hover:decoration-[3px] group-hover:underline-offset-8">
                  {featured.title}
                </h2>
                <p className="mt-4 text-muted">{featured.excerpt}</p>
                <span className="mt-8 text-sm font-semibold">Artikel lesen →</span>
              </div>
            </Link>
          </Reveal>
        )}

        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {rest.map((g, i) => (
            <li key={g.slug} className="min-w-0">
              <Reveal delay={(i % 2) * 80} className="h-full">
                <Link
                  href={`/ratgeber/${g.slug}`}
                  className="group grid h-full grid-cols-[minmax(0,1fr)_120px] gap-6 rounded-[var(--radius-card)] border border-line bg-white p-6 transition-colors hover:border-ink sm:grid-cols-[minmax(0,1fr)_160px]"
                >
                  <div className="min-w-0">
                    <p className="eyebrow !text-[11px]">
                      {g.category} · {g.readingMinutes} Min.
                    </p>
                    <h2 className="mt-3 font-sans text-xl font-semibold leading-snug tracking-normal">{g.title}</h2>
                    <p className="mt-3 line-clamp-3 text-sm text-muted">{g.excerpt}</p>
                  </div>
                  <div className="aspect-square self-center rounded-2xl bg-mist p-3">
                    <ProductVisual visual={g.visual} title={g.title} className="h-full w-full transition-transform duration-500 group-hover:scale-110" />
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <ConsultCta />
    </>
  );
}
