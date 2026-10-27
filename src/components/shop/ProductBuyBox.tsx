"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { hasPrice } from "@/lib/catalog";
import { AddToCartButton, CompareToggle } from "./ProductActions";

/** Menge wählen, in den Warenkorb legen, vergleichen */
export function ProductBuyBox({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const priced = hasPrice(product);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {priced && (
          <div className="inline-flex h-14 items-center rounded-full border border-line bg-white" role="group" aria-label="Menge">
            <button
              type="button"
              aria-label="Menge verringern"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="h-14 w-12 rounded-l-full text-lg hover:bg-mist disabled:opacity-40"
            >
              −
            </button>
            <label htmlFor={`qty-${product.id}`} className="sr-only">
              Menge
            </label>
            <input
              id={`qty-${product.id}`}
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={qty}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                setQty(Number.isFinite(n) ? Math.min(20, Math.max(1, n)) : 1);
              }}
              className="h-14 w-12 bg-transparent text-center font-mono tabular [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label="Menge erhöhen"
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              disabled={qty >= 20}
              className="h-14 w-12 rounded-r-full text-lg hover:bg-mist disabled:opacity-40"
            >
              +
            </button>
          </div>
        )}
        <AddToCartButton product={product} quantity={qty} size="lg" className="flex-1 sm:flex-none" />
      </div>
      <CompareToggle product={product} />
    </div>
  );
}
