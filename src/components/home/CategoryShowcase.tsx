import Link from "next/link";
import { categories } from "@/data/categories";
import { getProductsByCategory } from "@/lib/catalog";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Bento-Raster: Die beiden Balkonkraftwerk-Kategorien groß, der Rest kompakt.
 * Grafik kippt beim Hover leicht in die Tiefe.
 */
export function CategoryShowcase() {
  return (
    <section id="kategorien" className="scroll-mt-20 bg-paper py-24 md:py-32" aria-labelledby="kat-title">
      <div className="container-x">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <p className="eyebrow">Produktwelt</p>
            <h2 id="kat-title" className="display-lg mt-4 max-w-3xl text-[36px] md:text-[60px]">
              Alles für deinen eigenen Solarstrom.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <ButtonLink href="/produkte" variant="outline" arrow>
              Alle Produkte
            </ButtonLink>
          </Reveal>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {categories.map((c, i) => {
            const count = getProductsByCategory(c.slug).length;
            const big = i < 2;
            const dark = i === 1;
            return (
              <Reveal
                as="li"
                key={c.slug}
                delay={i * 80}
                className={big ? "sm:col-span-2 lg:col-span-6" : "lg:col-span-3"}
              >
                <Link
                  href={`/kategorie/${c.slug}`}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border transition-[transform,box-shadow,border-color] duration-700 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 [perspective:900px] ${
                    dark
                      ? "on-dark border-ink-line bg-ink text-paper hover:shadow-[0_40px_80px_-30px_rgb(16_24_32/0.6)]"
                      : "border-line bg-white hover:border-ink/15 hover:shadow-[var(--shadow-lift)]"
                  } ${big ? "min-h-[440px] lg:min-h-[520px]" : "min-h-[380px]"}`}
                >
                  <div
                    aria-hidden
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      dark
                        ? "bg-[radial-gradient(90%_70%_at_75%_30%,rgb(183_243_75/0.18),transparent_60%)]"
                        : "bg-[radial-gradient(90%_70%_at_75%_25%,#ffffff_0%,#e9eef0_80%)]"
                    }`}
                  />
                  <div className={`sheen relative flex-1 ${big ? "min-h-[260px]" : "min-h-[200px]"}`}>
                    <div className="absolute inset-[6%] transition-transform duration-[900ms] ease-[var(--ease-out-expo)] [transform-style:preserve-3d] group-hover:[transform:rotateX(8deg)_rotateY(-10deg)_scale(1.06)]">
                      <ProductVisual visual={c.visual} className="h-full w-full drop-shadow-[0_30px_30px_rgb(16_24_32/0.18)]" title={c.name} />
                    </div>
                  </div>
                  <div className="relative flex items-end justify-between gap-6 p-6 md:p-7">
                    <div className="min-w-0">
                      <p className={`eyebrow ${dark ? "" : ""}`}>{count} {count === 1 ? "Produkt" : "Produkte"}</p>
                      <h3 className={`display-md mt-2 ${big ? "text-[30px] md:text-[38px]" : "text-[24px]"}`}>{c.name}</h3>
                      <p className={`mt-2 max-w-md text-[15px] ${dark ? "text-muted-dark" : "text-muted"}`}>{big ? c.description : c.tagline}</p>
                    </div>
                    <span
                      aria-hidden
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full transition-[background-color,transform] duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-[-45deg] ${
                        dark ? "bg-lime text-ink" : "bg-ink text-paper group-hover:bg-lime group-hover:text-ink"
                      }`}
                    >
                      <svg viewBox="0 0 20 20" className="h-5 w-5">
                        <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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
