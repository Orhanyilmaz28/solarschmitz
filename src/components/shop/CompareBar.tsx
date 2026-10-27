"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompare } from "@/lib/compare/store";
import { getProductById } from "@/lib/catalog";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/config/site";
import { ProductThumb } from "./ProductMedia";

/**
 * Schwebende Leiste mit den Produkten im Vergleich. Erscheint ab einem Produkt.
 * Weicht einer Kaufleiste am unteren Rand aus (CSS-Variable --sticky-buybar).
 */
export function CompareBar() {
  const ids = useCompare((s) => s.ids);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);
  const pathname = usePathname();
  const products = ids.map((id) => getProductById(id)).filter((p) => p !== undefined);
  const visible = products.length > 0 && pathname !== "/vergleich" && !pathname.startsWith("/checkout") && !pathname.startsWith("/admin");

  return (
    <div
      inert={!visible}
      className={`fixed inset-x-0 z-[70] flex justify-center px-4 transition-[transform,opacity,bottom] duration-500 ease-[var(--ease-out-expo)] ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[140%] opacity-0"
      }`}
      style={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px) + var(--sticky-buybar, 0px))" }}
    >
      <div
        role="region"
        aria-label="Produktvergleich"
        className="on-dark flex w-full max-w-2xl items-center gap-3 rounded-full bg-ink py-2 pl-2.5 pr-2 text-paper shadow-[var(--shadow-lift)] sm:gap-4"
      >
        <ul className="flex min-w-0 items-center -space-x-3 sm:-space-x-2">
          {products.map((p) => (
            <li key={p.id} className="group relative">
              <span className="block h-11 w-11 overflow-hidden rounded-full bg-stone ring-2 ring-ink" title={p.name}>
                <ProductThumb product={p} className="h-full w-full scale-[1.15]" />
              </span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label={`${p.name} aus dem Vergleich entfernen`}
                className="absolute -right-0.5 -top-1 hidden h-5 w-5 place-items-center rounded-full bg-paper text-ink shadow transition-opacity hover:bg-sun-1 sm:grid sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <Icon name="close" size={11} strokeWidth={2.2} />
              </button>
            </li>
          ))}
        </ul>
        <p className="min-w-0 flex-1 truncate text-[13px] text-muted-dark sm:text-sm">
          <span aria-hidden className="font-mono tabular text-paper">
            {products.length}/{site.compareLimit}
          </span>
          <span aria-hidden className="hidden min-[420px]:inline"> im Vergleich</span>
          <span className="sr-only">
            {products.length} von {site.compareLimit} Produkten im Vergleich
          </span>
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button type="button" onClick={clear} className="hidden h-10 rounded-full px-4 text-sm text-muted-dark hover:text-paper sm:block">
            Leeren
          </button>
          <Link href="/vergleich" className={buttonClass("light", "sm", "!h-11 !px-5")}>
            Vergleichen
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
