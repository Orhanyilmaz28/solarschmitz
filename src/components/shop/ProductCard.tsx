import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { hasPrice } from "@/lib/catalog";
import { DataStatusChip, PriceTag } from "./DataStatus";
import { AddToCartButton, CompareToggle } from "./ProductActions";
import { ProductMedia } from "./ProductMedia";
import { TiltMedia } from "./TiltMedia";
import { keySpecs } from "./specRows";
import { nb } from "./typo";

export { ProductMedia } from "./ProductMedia";
export { keySpecs } from "./specRows";

interface CardProps {
  product: Product;
  tone?: "light" | "dark";
  /** Große Kachel über zwei Spalten, mit Kurzbeschreibung */
  feature?: boolean;
  /** Fußnotenzeichen „¹“ am Preis. Die Seite muss dann <VatFootnote /> enthalten. */
  footnote?: boolean;
  priority?: boolean;
}

/**
 * Produktkachel: große Medienfläche ohne Rahmen, ruhige Typografie, leise Aktionen.
 * Grün bleibt der einen Haupthandlung einer Seite vorbehalten, deshalb nicht hier.
 */
export function ProductCard({ product, tone = "light", feature = false, footnote = false, priority = false }: CardProps) {
  const href = `/produkt/${product.slug}`;
  const dark = tone === "dark";
  const specs = keySpecs(product);
  const priced = hasPrice(product);

  return (
    <article
      className={`group relative flex h-full min-w-0 flex-col ${dark ? "text-paper" : "text-ink"} ${
        feature ? "md:grid md:grid-cols-[minmax(0,1.32fr)_minmax(0,1fr)] md:gap-8 lg:gap-10" : ""
      }`}
    >
      <div className={`relative aspect-[4/3] overflow-hidden rounded-[var(--radius-media)] ${dark ? "bg-ink-2" : "bg-stone"}`}>
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 ${
            dark
              ? "bg-[radial-gradient(80%_70%_at_30%_15%,rgb(255_255_255/0.06),transparent_70%)]"
              : "bg-[radial-gradient(80%_70%_at_30%_15%,rgb(255_255_255/0.85),transparent_70%)]"
          }`}
        />
        <TiltMedia className="absolute inset-0" track="article">
          <ProductMedia
            product={product}
            label="short"
            priority={priority}
            sizes={feature ? "(min-width: 1024px) 40vw, (min-width: 768px) 55vw, 100vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"}
            className="h-full w-full transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.035]"
          />
        </TiltMedia>
        <div className="absolute left-4 top-4 z-[2] md:left-5 md:top-5">
          <DataStatusChip product={product} />
        </div>
        <div className="absolute right-3 top-3 z-[2] md:right-4 md:top-4">
          <CompareToggle product={product} variant="icon" tone={tone} />
        </div>
      </div>

      <div className={`flex min-w-0 flex-1 flex-col ${feature ? "mt-5 md:mt-0 md:pt-1" : "mt-5"}`}>
        <p className={`t-label !text-[10.5px] ${dark ? "!text-muted-dark" : ""}`}>{product.brand}</p>
        <h3
          className={`mt-2 font-display font-semibold leading-[1.18] tracking-[-0.022em] ${
            feature ? "text-[clamp(1.375rem,2.1vw,1.875rem)] leading-[1.1]" : "text-[18px] md:text-[19px]"
          }`}
        >
          <Link
            href={href}
            className="rounded-[var(--radius-media)] after:absolute after:inset-0 after:z-[1] after:rounded-[var(--radius-media)] after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-current"
          >
            {nb(product.name)}
          </Link>
        </h3>
        {feature && <p className={`mt-3 max-w-[44ch] text-[15px] leading-relaxed ${dark ? "text-muted-dark" : "text-muted"}`}>{nb(product.shortDescription)}</p>}
        {specs.length > 0 && (
          <p className={`mt-2.5 font-mono text-[12px] tracking-[0.01em] ${dark ? "text-muted-dark" : "text-muted"}`}>
            <span className="sr-only">Eckdaten: </span>
            {nb(specs.join("  ·  "))}
          </p>
        )}
        <div className="mt-auto pt-5">
          <div className={`flex items-end justify-between gap-4 border-t pt-4 ${dark ? "border-ink-line" : "border-line"}`}>
            <PriceTag product={product} footnote={footnote} tone={tone} />
            {priced && (
              <div className="relative z-[2]">
                <AddToCartButton product={product} compact variant="subtle" tone={tone} />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
