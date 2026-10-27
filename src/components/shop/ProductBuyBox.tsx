"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { hasPrice } from "@/lib/catalog";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AddToCartButton } from "./ProductActions";

const MAX = 20;

/** Menge wählen und in den Warenkorb legen: die eine Haupthandlung der Produktseite */
export function ProductBuyBox({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [product.id]);

  if (!hasPrice(product)) {
    return (
      <button type="button" disabled className={buttonClass("outline", "lg", "w-full")}>
        Nicht bestellbar
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="inline-flex h-[60px] shrink-0 items-center rounded-full border border-ink/15" role="group" aria-label="Menge">
        <button
          type="button"
          aria-label="Menge verringern"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          className="grid h-full w-11 place-items-center rounded-l-full transition-colors hover:bg-ink/5 disabled:opacity-30"
        >
          <Icon name="minus" size={16} />
        </button>
        <label htmlFor={`menge-${product.id}`} className="sr-only">
          Menge
        </label>
        <input
          id={`menge-${product.id}`}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX}
          value={qty}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10);
            setQty(Number.isFinite(n) ? Math.min(MAX, Math.max(1, n)) : 1);
          }}
          className="h-full w-8 bg-transparent text-center font-mono text-[15px] tabular [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label="Menge erhöhen"
          onClick={() => setQty((q) => Math.min(MAX, q + 1))}
          disabled={qty >= MAX}
          className="grid h-full w-11 place-items-center rounded-r-full transition-colors hover:bg-ink/5 disabled:opacity-30"
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
      <AddToCartButton product={product} quantity={qty} size="lg" className="min-w-0 flex-1" />
    </div>
  );
}
