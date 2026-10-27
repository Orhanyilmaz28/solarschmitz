"use client";

import { useCart } from "@/lib/cart/store";
import { useCompare } from "@/lib/compare/store";
import { hasPrice } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";
import { site } from "@/config/site";
import { toast } from "@/components/ui/Toaster";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface AddProps {
  product: Product;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Nur Symbol (rund) statt Beschriftung */
  compact?: boolean;
  /**
   * primary = Haupthandlung einer Ansicht (grün, höchstens einmal sichtbar).
   * subtle = zurückhaltend, z. B. auf Produktkacheln und in Listen.
   */
  variant?: "primary" | "subtle";
  tone?: "light" | "dark";
  /** Warenkorb nach dem Hinzufügen öffnen (Standard: nur bei beschriftetem Knopf) */
  openCart?: boolean;
  label?: string;
}

export function AddToCartButton({
  product,
  quantity = 1,
  size = "md",
  className = "",
  compact = false,
  variant = "primary",
  tone = "light",
  openCart,
  label = "In den Warenkorb",
}: AddProps) {
  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);
  const subtle = variant === "subtle";

  if (!hasPrice(product)) {
    return (
      <button type="button" disabled className={buttonClass("outline", size, className)} title="Demo-Produkte können nicht in den Warenkorb gelegt werden">
        {compact ? "Demo" : "Nicht bestellbar"}
      </button>
    );
  }

  const onClick = () => {
    add(product.id, quantity);
    toast(quantity > 1 ? `${quantity} × ${product.name} im Warenkorb` : `${product.name} im Warenkorb`, "success");
    if (openCart ?? !compact) open();
  };

  if (compact && subtle) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${product.name} in den Warenkorb legen`}
        title="In den Warenkorb"
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-[background-color,color,border-color,transform] duration-300 ease-[var(--ease-out-expo)] active:scale-95 ${
          tone === "dark" ? "border-paper/25 text-paper hover:border-paper hover:bg-paper hover:text-ink" : "border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-paper"
        } ${className}`}
      >
        <Icon name="plus" size={18} strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={buttonClass(subtle ? (tone === "dark" ? "outline-light" : "outline") : "primary", size, className)}
      aria-label={compact ? `${product.name} in den Warenkorb legen` : undefined}
      onClick={onClick}
    >
      {compact ? <Icon name="plus" size={20} strokeWidth={2} /> : label}
    </button>
  );
}

interface CompareProps {
  product: Product;
  tone?: "light" | "dark";
  label?: boolean;
  /** icon = runder Knopf, z. B. in der Ecke einer Produktkachel */
  variant?: "default" | "icon";
  className?: string;
}

export function CompareToggle({ product, tone = "light", label = true, variant = "default", className = "" }: CompareProps) {
  const ids = useCompare((s) => s.ids);
  const toggle = useCompare((s) => s.toggle);
  const active = ids.includes(product.id);
  const onClick = () => {
    const r = toggle(product.id);
    if (r === "full") toast(`Du kannst bis zu ${site.compareLimit} Produkte vergleichen.`, "warning");
    if (r === "added") toast("Zum Vergleich hinzugefügt");
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-pressed={active}
        aria-label={`${product.name} ${active ? "aus dem Vergleich entfernen" : "vergleichen"}`}
        title={active ? "Im Vergleich" : "Vergleichen"}
        onClick={onClick}
        className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur transition-[background-color,color,box-shadow] duration-300 ${
          active
            ? "bg-ink text-paper"
            : tone === "dark"
              ? "bg-ink-3/80 text-paper hover:bg-paper hover:text-ink"
              : "bg-paper/85 text-ink shadow-[0_0_0_1px_rgb(16_24_32/0.08)] hover:bg-ink hover:text-paper"
        } ${className}`}
      >
        <Icon name={active ? "check" : "compare"} size={17} strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full text-sm font-semibold transition-colors ${
        tone === "light" ? "text-muted hover:text-ink" : "text-muted-dark hover:text-paper"
      } ${active ? (tone === "light" ? "!text-ink" : "!text-paper") : ""} ${className}`}
    >
      <span
        aria-hidden
        className={`grid h-5 w-5 place-items-center rounded-md border transition-colors ${
          active ? (tone === "light" ? "border-ink bg-ink text-paper" : "border-paper bg-paper text-ink") : tone === "light" ? "border-ink/25" : "border-paper/30"
        }`}
      >
        {active && (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label && (active ? "Im Vergleich" : "Vergleichen")}
    </button>
  );
}
