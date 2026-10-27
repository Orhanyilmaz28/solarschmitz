import Link from "next/link";
import { categories } from "@/data/categories";
import { getProductsByCategory } from "@/lib/catalog";
import { VisualImage } from "@/components/illustrations/VisualImage";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";

/**
 * Produktwelt: die zwei Balkonkraftwerk-Kategorien groß, der Rest kompakt.
 * Die Grafik kippt beim Überfahren leicht in die Tiefe, ein Lichtreflex gleitet darüber.
 */
export function CategoryShowcase({ id = "produktwelt" }: { id?: string }) {
  return (
    <section id={id} className="cv-auto section-y scroll-mt-16 bg-paper" aria-labelledby={`${id}-title`} style={{ ["--cv-d" as string]: "1330px", ["--cv-m" as string]: "2970px" }}>
      <div className="container-x">
        <SectionHeader
          id={`${id}-title`}
          label="Produktwelt"
          lines={["Alles für deinen", "eigenen Solarstrom."]}
          size="display"
          align="split"
          lead="Komplettsets für Balkon, Terrasse und Garten, Speicher zum Nachrüsten, einzelne Module, Wechselrichter und Zubehör aus dem Sortiment unseres Lieferanten."
          actions={
            <ButtonLink href="/produkte" variant="outline" arrow>
              Alle Produkte
            </ButtonLink>
          }
        />

        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-20 lg:grid-cols-12 lg:gap-5">
          {categories.map((c, i) => {
            const count = getProductsByCategory(c.slug).length;
            const big = i < 2;
            const dark = i === 1;
            return (
              <Reveal as="li" key={c.slug} delay={(i % 4) * 80} className={big ? "sm:col-span-2 lg:col-span-6" : "lg:col-span-3"}>
                <Link
                  href={`/kategorie/${c.slug}`}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border transition-[transform,box-shadow,border-color] duration-700 ease-[var(--ease-out-expo)] [perspective:900px] hover:-translate-y-1.5 ${
                    dark
                      ? "on-dark border-ink-line bg-night text-paper hover:shadow-[0_40px_80px_-30px_rgb(16_24_32/0.6)]"
                      : "border-line bg-white hover:border-ink/15 hover:shadow-[var(--shadow-lift)]"
                  } ${big ? "min-h-[420px] lg:min-h-[540px]" : "min-h-[360px]"}`}
                >
                  <div
                    aria-hidden
                    className={`absolute inset-0 ${
                      dark
                        ? "bg-[radial-gradient(80%_70%_at_72%_28%,rgb(255_164_42/0.22),transparent_62%)]"
                        : "bg-[radial-gradient(90%_70%_at_75%_25%,#ffffff_0%,#eef1ef_80%)]"
                    }`}
                  />
                  <div className={`sheen relative flex-1 ${big ? "min-h-[250px]" : "min-h-[190px]"}`}>
                    <div className="absolute inset-[7%] transition-transform duration-[900ms] ease-[var(--ease-out-expo)] [transform-style:preserve-3d] group-hover:[transform:rotateX(8deg)_rotateY(-10deg)_scale(1.05)]">
                      <VisualImage visual={c.visual} className="h-full w-full object-contain drop-shadow-[0_30px_30px_rgb(16_24_32/0.18)]" />
                    </div>
                  </div>
                  <div className="relative flex items-end justify-between gap-6 p-6 md:p-7">
                    <div className="min-w-0">
                      <p className="t-label">
                        {count} {count === 1 ? "Produkt" : "Produkte"}
                      </p>
                      <h3 className={`${big ? "t-h2" : "t-h3"} m-0 mt-2`}>{c.name}</h3>
                      <p className={`mt-2 max-w-md text-[15px] leading-relaxed ${dark ? "text-muted-dark" : "text-muted"}`}>{big ? c.description : c.tagline}</p>
                    </div>
                    <span
                      aria-hidden
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full transition-[background-color,color,transform] duration-500 ease-[var(--ease-out-expo)] group-hover:-rotate-45 ${
                        dark ? "bg-lime text-ink" : "bg-ink text-paper group-hover:bg-lime group-hover:text-ink"
                      }`}
                    >
                      <Icon name="arrow-right" size={20} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
