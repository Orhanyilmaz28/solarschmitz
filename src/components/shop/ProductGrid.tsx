import Link from "next/link";
import type { Category, Product } from "@/lib/catalog/types";
import { categories } from "@/data/categories";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";
import { ProductCard } from "./ProductCard";

interface Props {
  products: Product[];
  /** Nach Kategorien gegliedert, mit nummerierten Abschnitten (nur ohne Filter sinnvoll) */
  grouped?: boolean;
  /** Erste Kachel einer Gruppe groß, wenn sie echte Lieferantendaten hat */
  features?: boolean;
  /** Freie Plätze in der letzten Reihe mit Kaufberatung füllen */
  tips?: boolean;
  footnote?: boolean;
}

/**
 * Editoriale Produktliste: ruhiges Raster mit großen Medienflächen,
 * einzelne große Kacheln und Kaufberatung als typografische Fläche.
 */
export function ProductGrid({ products, grouped = false, features = false, tips = false, footnote = false }: Props) {
  if (!grouped) {
    return <Tiles items={products} features={features} tips={false} footnote={footnote} />;
  }
  const groups = categories
    .map((c) => ({ category: c, items: products.filter((p) => p.category === c.slug) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-24 md:space-y-32">
      {groups.map((g, gi) => (
        <section key={g.category.slug} aria-labelledby={`gruppe-${g.category.slug}`}>
          <GroupHeader category={g.category} index={gi} count={g.items.length} />
          <Tiles items={g.items} features={features} tips={tips} category={g.category} footnote={footnote} />
        </section>
      ))}
    </div>
  );
}

function GroupHeader({ category, index, count }: { category: Category; index: number; count: number }) {
  return (
    <header className="mb-8 grid grid-cols-12 items-end gap-x-[var(--grid-gap)] gap-y-3 border-t border-line pt-6 md:mb-12 md:pt-8">
      <p className="col-span-12 font-mono text-[12px] tabular text-muted md:col-span-1 md:self-start md:pt-2">{String(index + 1).padStart(2, "0")}</p>
      <h2 id={`gruppe-${category.slug}`} className="t-h2 col-span-12 m-0 md:col-span-7 lg:col-span-6">
        {category.name}
      </h2>
      <p className="col-span-12 max-w-[36ch] text-[15px] leading-snug text-muted md:col-span-4 lg:col-span-3">{category.tagline}</p>
      <Link
        href={`/kategorie/${category.slug}`}
        className="group/link col-span-12 inline-flex items-center gap-2 justify-self-start text-[14px] font-semibold lg:col-span-2 lg:justify-self-end"
      >
        <span className="underline decoration-ink/20 underline-offset-[6px] transition-colors group-hover/link:decoration-ink">
          {count === 1 ? "Zur Kategorie" : `Alle ${count} ansehen`}
        </span>
        <Icon name="arrow-right" size={16} className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/link:translate-x-1" />
      </Link>
    </header>
  );
}

const tipSm = (rest: number) => (rest === 0 ? "sm:hidden" : "sm:block sm:col-span-1");
const tipLg = (rest: number) => (rest === 0 ? "lg:hidden" : rest === 1 ? "lg:block lg:col-span-2" : "lg:block lg:col-span-1");

function Tiles({
  items,
  features,
  tips,
  category,
  footnote,
}: {
  items: Product[];
  features: boolean;
  tips: boolean;
  category?: Category;
  footnote: boolean;
}) {
  const first = items[0];
  const featureFirst = features && items.length >= 2 && first !== undefined && first.dataStatus !== "demo";
  const slots = items.length + (featureFirst ? 1 : 0);
  const showTip = tips && category && category.buyingTips.length > 0;

  return (
    <ul className="grid gap-x-[var(--grid-gap)] gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-20">
      {items.map((p, i) => {
        const feature = featureFirst && i === 0;
        return (
          <li key={p.id} className={`min-w-0 ${feature ? "sm:col-span-2" : ""}`}>
            <Reveal delay={(i % 3) * 80} className="h-full">
              <ProductCard product={p} feature={feature} footnote={footnote} priority={i < 2} />
            </Reveal>
          </li>
        );
      })}
      {showTip && (
        <li className={`hidden min-w-0 ${tipSm(slots % 2)} ${tipLg(slots % 3)}`}>
          <Reveal delay={160} className="h-full">
            <TipTile category={category} />
          </Reveal>
        </li>
      )}
    </ul>
  );
}

function TipTile({ category }: { category: Category }) {
  return (
    <aside aria-label={`Kaufberatung ${category.name}`} className="@container flex h-full flex-col border-t border-ink pt-6">
      <p className="t-label">Kaufberatung · {category.name}</p>
      <p className="t-h3 mt-4 max-w-[22ch]">Worauf es beim Kauf ankommt</p>
      <ol className="mt-8 grid gap-6 @xl:grid-cols-3 @xl:gap-8">
        {category.buyingTips.map((tip, i) => (
          <li key={tip} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 @xl:grid-cols-1 @xl:gap-3">
            <span className="font-mono text-[12px] tabular text-muted">{String(i + 1).padStart(2, "0")}</span>
            <p className="m-0 text-[15px] leading-relaxed">{tip}</p>
          </li>
        ))}
      </ol>
      <Link href={`/kategorie/${category.slug}`} className="group/tip mt-auto inline-flex items-center gap-2 pt-8 text-[14px] font-semibold">
        <span className="underline decoration-ink/20 underline-offset-[6px] group-hover/tip:decoration-ink">Zur Kategorie</span>
        <Icon name="arrow-right" size={16} className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/tip:translate-x-1" />
      </Link>
    </aside>
  );
}
