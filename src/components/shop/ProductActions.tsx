"use client";

import { useCart } from "@/lib/cart/store";
import { useCompare } from "@/lib/compare/store";
import { hasPrice } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";
import { site } from "@/config/site";
import { toast } from "@/components/ui/Toaster";
import { buttonClass } from "@/components/ui/Button";

export function AddToCartButton({
  product,
  quantity = 1,
  size = "md",
  className = "",
  compact = false,
}: {
  product: Product;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  compact?: boolean;
}) {
  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);
  if (!hasPrice(product)) {
    return (
      <button type="button" disabled className={buttonClass("outline", size, className)} title="Demo-Produkte können nicht in den Warenkorb gelegt werden">
        {compact ? "Demo" : "Nicht bestellbar"}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={buttonClass("primary", size, className)}
      aria-label={compact ? `${product.name} in den Warenkorb` : undefined}
      onClick={() => {
        add(product.id, quantity);
        toast(`${product.name} im Warenkorb`, "success");
        if (!compact) open();
      }}
    >
      {compact ? (
        <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        "In den Warenkorb"
      )}
    </button>
  );
}

export function CompareToggle({ product, tone = "light", label = true }: { product: Product; tone?: "light" | "dark"; label?: boolean }) {
  const ids = useCompare((s) => s.ids);
  const toggle = useCompare((s) => s.toggle);
  const active = ids.includes(product.id);
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        const r = toggle(product.id);
        if (r === "full") toast(`Du kannst bis zu ${site.compareLimit} Produkte vergleichen.`, "warning");
        if (r === "added") toast("Zum Vergleich hinzugefügt");
      }}
      className={`inline-flex items-center gap-2 rounded-full text-sm font-semibold transition-colors ${
        tone === "light" ? "text-muted hover:text-ink" : "text-muted-dark hover:text-paper"
      } ${active ? (tone === "light" ? "!text-ink" : "!text-paper") : ""}`}
    >
      <span
        aria-hidden
        className={`grid h-5 w-5 place-items-center rounded-md border transition-colors ${
          active ? "border-lime bg-lime text-ink" : tone === "light" ? "border-ink/25" : "border-paper/30"
        }`}
      >
        {active && (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label && "Vergleichen"}
    </button>
  );
}
