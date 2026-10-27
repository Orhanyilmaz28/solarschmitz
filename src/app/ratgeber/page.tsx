import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/data/guides";
import { PageHeader } from "@/components/content/PageHeader";
import { ConsultCta } from "@/components/content/ConsultCta";
import { ProductSchematic } from "@/components/shop/ProductSchematic";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Ratgeber",
  description: "Balkonkraftwerk anmelden, 800 W und 2.000 Wp nach Solarpaket I, Speicher, Ausrichtung und Mietrecht: verständlich erklärt.",
};

export default function GuidesPage() {
  const [featured, ...rest] = guides;
  return (
    <>
      <PageHeader
        eyebrow="Ratgeber"
        titleLines={["Erst verstehen,", "dann entscheiden."]}
        lead="Anmeldung, Leistungsgrenzen, Speicher, Ausrichtung und Mietrecht. Kurz erklärt, mit Stand Oktober 2026."
        crumbs={[{ label: "Ratgeber" }]}
      />

      <section aria-label="Artikel" className="container-x py-14 md:py-24">
        {featured && (
          <Reveal>
            <Link href={`/ratgeber/${featured.slug}`} className="group grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-16">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-media)] border border-line bg-[radial-gradient(110%_90%_at_30%_15%,#ffffff_0%,#eef1ef_70%)] lg:col-span-7">
                <div className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]">
                  <ProductSchematic visual={featured.visual} label="none" title={featured.title} className="h-full w-full" />
                </div>
              </div>
              <div className="min-w-0 lg:col-span-5">
                <p className="t-label">
                  {featured.category} · {featured.readingMinutes} Min. Lesezeit
                </p>
                <h2 className="t-h2 m-0 mt-5 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-[10px]">{featured.title}</h2>
                <p className="t-lead mt-6 max-w-[46ch]">{featured.excerpt}</p>
                <span className="mt-8 inline-flex items-center gap-2 font-semibold">
                  Artikel lesen
                  <Icon name="arrow-right" size={18} className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        )}

        {rest.length > 0 && (
          <ul className="mt-16 divide-y divide-line border-y border-line md:mt-24">
            {rest.map((g, i) => (
              <li key={g.slug}>
                <Reveal delay={i * 60} y={16}>
                  <Link href={`/ratgeber/${g.slug}`} className="group grid gap-3 py-8 md:grid-cols-12 md:items-center md:gap-8 md:py-10">
                    <span className="t-label md:col-span-3">
                      {g.category} · {g.readingMinutes} Min.
                    </span>
                    <span className="min-w-0 md:col-span-6">
                      <span className="block font-display text-[1.375rem] font-semibold leading-tight tracking-[-0.03em] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-8 md:text-[1.75rem]">
                        {g.title}
                      </span>
                      <span className="mt-3 block max-w-[60ch] text-[15.5px] leading-relaxed text-muted">{g.excerpt}</span>
                    </span>
                    <span className="hidden md:col-span-3 md:flex md:items-center md:justify-end md:gap-6">
                      <span className="relative block aspect-[4/3] w-[150px] overflow-hidden rounded-2xl border border-line bg-[radial-gradient(110%_90%_at_30%_15%,#ffffff_0%,#eef1ef_70%)]">
                        <ProductSchematic visual={g.visual} label="none" grid={false} title={g.title} className="absolute inset-0 h-full w-full transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110" />
                      </span>
                      <Icon name="arrow-right" size={22} className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConsultCta label="Nächster Schritt" title="Welches Set passt zu dir?" />
    </>
  );
}
