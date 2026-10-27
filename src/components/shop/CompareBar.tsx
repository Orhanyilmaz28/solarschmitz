"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompare } from "@/lib/compare/store";
import { getProductById } from "@/lib/catalog";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { buttonClass } from "@/components/ui/Button";
import { site } from "@/config/site";

/** Schwebende Leiste mit den Produkten im Vergleich. Erscheint ab einem Produkt. */
export function CompareBar() {
  const ids = useCompare((s) => s.ids);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);
  const pathname = usePathname();
  const products = ids.map((id) => getProductById(id)).filter((p) => p !== undefined);
  const visible = products.length > 0 && pathname !== "/vergleich" && !pathname.startsWith("/checkout") && !pathname.startsWith("/admin");

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 z-[70] flex justify-center px-4 transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)] ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[140%] opacity-0"
      }`}
      style={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        role="region"
        aria-label="Produktvergleich"
        className="on-dark flex w-full max-w-3xl items-center gap-3 rounded-full bg-ink py-2 pl-3 pr-2 text-paper shadow-[var(--shadow-lift)] sm:gap-4 sm:pl-4"
      >
        <ul className="flex min-w-0 items-center gap-2">
          {products.map((p) => (
            <li key={p.id} className="relative">
              <span className="block h-11 w-11 overflow-hidden rounded-full bg-ink-3 p-1" title={p.name}>
                <ProductVisual visual={p.visual} className="h-full w-full" title={p.name} />
              </span>
              <button
                type="button"
                tabIndex={visible ? 0 : -1}
                onClick={() => remove(p.id)}
                aria-label={`${p.name} aus dem Vergleich entfernen`}
                className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-paper text-[11px] font-bold text-ink hover:bg-lime"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <p className="hidden min-w-0 flex-1 truncate text-sm text-muted-dark sm:block">
          {products.length} von {site.compareLimit} Produkten im Vergleich
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            tabIndex={visible ? 0 : -1}
            onClick={clear}
            className="hidden h-10 rounded-full px-4 text-sm text-muted-dark hover:text-paper sm:block"
          >
            Leeren
          </button>
          <Link href="/vergleich" tabIndex={visible ? 0 : -1} className={buttonClass("primary", "md", "!h-11")}>
            Vergleichen
          </Link>
        </div>
      </div>
    </div>
  );
}
