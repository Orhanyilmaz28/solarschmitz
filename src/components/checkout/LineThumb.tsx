import Image from "next/image";
import type { ReactNode } from "react";
import type { Product } from "@/lib/catalog/types";
import { ProductSchematic } from "@/components/shop/ProductSchematic";

/**
 * Vorschaubild einer Warenkorb-Position: Lieferantenfoto, sonst die schematische Zeichnung.
 * Größe über className (z. B. „h-24 w-24“).
 */
export function LineThumb({ product, className = "h-20 w-20", children }: { product: Product; className?: string; children?: ReactNode }) {
  const img = product.images[0];
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-2xl border border-line/70 bg-[radial-gradient(120%_100%_at_30%_10%,#ffffff_0%,#eef1ef_75%)] ${className}`}>
      {img ? (
        <Image src={img.src} alt={img.alt} fill sizes="120px" className="object-contain p-2" />
      ) : (
        <ProductSchematic visual={product.visual} label="none" grid={false} title={product.name} className="absolute inset-[6%] h-[88%] w-[88%]" />
      )}
      {children}
    </span>
  );
}
