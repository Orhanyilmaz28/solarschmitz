"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/store";
import type { AccessorySuggestion } from "@/lib/cart/accessories";
import { formatEUR } from "@/lib/format";
import { vatLine } from "@/components/shop/pricing";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toaster";
import { LineThumb } from "./LineThumb";

interface Props {
  items: AccessorySuggestion[];
  size?: "md" | "sm";
  /** Beim Klick auf einen Produktlink (z. B. Drawer schließen) */
  onNavigate?: () => void;
}

/** „Passt dazu“: nur Zubehör, dessen Passung sich aus den Produktdaten ergibt. */
export function AccessorySuggestions({ items, size = "md", onNavigate }: Props) {
  const add = useCart((s) => s.add);
  if (!items.length) return null;
  const sm = size === "sm";
  return (
    <section aria-labelledby={sm ? "acc-title-drawer" : "acc-title"}>
      <h2 id={sm ? "acc-title-drawer" : "acc-title"} className="t-label">
        Passt dazu
      </h2>
      <ul className={`divide-y divide-line ${sm ? "mt-2" : "mt-4 border-y border-line"}`}>
        {items.map(({ product, reason, caveat }) => (
          <li
            key={product.id}
            className={`grid gap-x-4 gap-y-3 ${sm ? "grid-cols-[56px_minmax(0,1fr)] py-3" : "grid-cols-[64px_minmax(0,1fr)] py-5 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center"}`}
          >
            <LineThumb product={product} className={sm ? "h-14 w-14" : "h-16 w-16 sm:h-[72px] sm:w-[72px]"} />
            <div className="min-w-0">
              <Link href={`/produkt/${product.slug}`} onClick={onNavigate} className={`block font-semibold leading-snug hover:underline ${sm ? "text-sm" : ""}`}>
                {product.name}
              </Link>
              <p className={`mt-1 text-muted ${sm ? "text-xs" : "text-sm"}`}>{reason}</p>
              {caveat && <p className={`mt-1 text-[#7a4a00] ${sm ? "text-[11.5px]" : "text-xs"}`}>{caveat}</p>}
            </div>
            <div className={`col-start-2 flex items-center justify-between gap-3 ${sm ? "" : "sm:col-start-auto sm:flex-col sm:items-end"}`}>
              <p className="leading-tight sm:text-right">
                <span className="text-sm font-semibold tabular">{formatEUR(product.price)}</span>
                <span className="block text-[11px] text-muted">{vatLine(product)}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  add(product.id);
                  toast(`${product.name} hinzugefügt`, "success");
                }}
                className={buttonClass("outline", "sm", "gap-1.5 !px-3.5")}
                aria-label={`${product.name} hinzufügen`}
              >
                <Icon name="plus" size={16} />
                Hinzufügen
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
