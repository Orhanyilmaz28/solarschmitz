import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/catalog/types";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { DataStatusChip, PriceTag } from "./DataStatus";
import { AddToCartButton, CompareToggle } from "./ProductActions";
import { formatKWh, formatWp, formatInt } from "@/lib/format";

/** Wichtigste technische Werte als kurze Chips */
export function keySpecs(p: Product): string[] {
  const s = p.specs;
  const out: string[] = [];
  if (s.moduleCount && s.moduleWp && s.moduleCount > 1) out.push(`${s.moduleCount} × ${formatInt(s.moduleWp)} Wp`);
  else if (s.totalWp) out.push(formatWp(s.totalWp));
  if (s.inverterW) out.push(`${formatInt(s.inverterW)} W`);
  if (s.storageKWh) out.push(formatKWh(s.storageKWh));
  if (s.storageMaxKWh) out.push(`bis ${formatKWh(s.storageMaxKWh)}`);
  if (s.mppt) out.push(`${s.mppt} MPPT`);
  if (s.tiltRange) out.push(s.tiltRange);
  if (!out.length && s.connectivity) out.push(s.connectivity);
  return out.slice(0, 3);
}

export function ProductMedia({ product, className = "", priority = false }: { product: Product; className?: string; priority?: boolean }) {
  const img = product.images[0];
  if (img) {
    return (
      <Image src={img.src} alt={img.alt} fill priority={priority} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className={`object-contain ${className}`} />
    );
  }
  return <ProductVisual visual={product.visual} title={product.name} className={className} />;
}

export function ProductCard({ product, tone = "light" }: { product: Product; tone?: "light" | "dark" }) {
  const href = `/produkt/${product.slug}`;
  const dark = tone === "dark";
  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 ${
        dark ? "border-ink-line bg-ink-2 text-paper hover:border-paper/25" : "border-line bg-white hover:border-ink/15 hover:shadow-[var(--shadow-lift)]"
      }`}
    >
      <Link href={href} className="sheen relative block aspect-[4/3] max-w-full" aria-label={product.name}>
        <div
          className={`absolute inset-0 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03] ${
            dark ? "bg-[radial-gradient(120%_90%_at_30%_10%,#2a3843_0%,#17222c_60%)]" : "bg-[radial-gradient(120%_90%_at_30%_10%,#ffffff_0%,#e9eef0_70%)]"
          }`}
        />
        <div className="absolute inset-[8%] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06] group-hover:-rotate-1">
          <ProductMedia product={product} className="h-full w-full" />
        </div>
        <div className="absolute left-4 top-4 z-[3] flex flex-wrap gap-2">
          <DataStatusChip product={product} />
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="chip bg-ink text-lime">−{Math.round((1 - product.price / product.compareAtPrice) * 100)} %</span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className={`eyebrow !text-[11px] ${dark ? "!text-muted-dark" : ""}`}>{product.brand}</p>
        <h3 className="m-0 font-sans text-[17px] font-semibold leading-snug tracking-normal">
          <Link href={href} className="after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <ul className="flex flex-wrap gap-1.5" aria-label="Technische Eckdaten">
          {keySpecs(product).map((s) => (
            <li key={s} className={`rounded-md px-2 py-0.5 font-mono text-[12px] ${dark ? "bg-ink-3 text-paper" : "bg-mist text-ink"}`}>
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <PriceTag product={product} />
          <div className="relative z-[2]">
            <AddToCartButton product={product} compact size="md" className="!h-12 !w-12 !px-0" />
          </div>
        </div>
        <div className="relative z-[2] border-t border-dashed border-line pt-3">
          <CompareToggle product={product} tone={tone} />
        </div>
      </div>
    </article>
  );
}
