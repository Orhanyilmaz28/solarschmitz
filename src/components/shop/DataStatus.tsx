import type { Product } from "@/lib/catalog/types";
import { formatEUR, vatLabel } from "@/lib/format";
import { hasPrice } from "@/lib/catalog";

/** Kennzeichnet, woher Produktdaten stammen. Wichtig: keine Daten als final ausgeben, die es nicht sind. */
export function DataStatusChip({ product, className = "" }: { product: Product; className?: string }) {
  if (product.dataStatus === "live") return null;
  if (product.dataStatus === "demo")
    return (
      <span className={`chip bg-sun-soft text-[#7a4a00] ${className}`} title={product.dataNote}>
        Demo-Produkt
      </span>
    );
  return (
    <span className={`chip bg-mist text-muted ${className}`} title={product.dataNote}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sun" />
      Vorschau
    </span>
  );
}

export function PriceTag({ product, size = "md" }: { product: Product; size?: "md" | "lg" }) {
  if (!hasPrice(product)) {
    return (
      <div className="leading-tight">
        <span className={`font-display font-semibold text-muted ${size === "lg" ? "text-2xl" : "text-lg"}`}>Preis folgt</span>
        <span className="block text-xs text-muted">Demo-Produkt, kein Angebot</span>
      </div>
    );
  }
  return (
    <div className="leading-tight">
      {product.compareAtPrice && product.compareAtPrice > product.price && (
        <span className="mr-2 text-sm text-muted line-through tabular">{formatEUR(product.compareAtPrice)}</span>
      )}
      <span className={`font-display font-extrabold tabular ${size === "lg" ? "text-4xl" : "text-2xl"}`} style={{ fontStretch: "108%" }}>
        {formatEUR(product.price)}
      </span>
      <span className="block text-xs text-muted">
        {vatLabel(product.vatRate)}
        {product.dataStatus === "supplier-unverified" && " · Richtpreis, noch nicht bestätigt"}
      </span>
    </div>
  );
}
