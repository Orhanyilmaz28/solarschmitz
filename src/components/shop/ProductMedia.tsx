import Image from "next/image";
import type { Product } from "@/lib/catalog/types";
import { ProductSchematic } from "./ProductSchematic";

type Caption = "full" | "short" | "none";

const captionText: Record<Exclude<Caption, "none">, string> = {
  full: "Schematische Darstellung · Produktfoto folgt",
  short: "Schema · Foto folgt",
};

/** Beschriftung für schematische Zeichnungen. Als HTML, damit sie in jeder Größe gut lesbar bleibt. */
export function SchematicCaption({ label, tone = "light", className = "" }: { label: Exclude<Caption, "none">; tone?: "light" | "dark"; className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute bottom-3.5 left-4 z-[1] font-mono text-[10px] uppercase leading-none tracking-[0.14em] md:left-5 ${
        tone === "dark" ? "text-muted-dark" : "text-muted"
      } ${className}`}
    >
      {captionText[label]}
    </span>
  );
}

interface MediaProps {
  product: Product;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** Beschriftung der Schemazeichnung */
  label?: Caption;
  /** Punktraster hinter der Zeichnung */
  grid?: boolean;
}

/**
 * Produktbild: echtes Foto, sobald der Lieferant eines liefert.
 * Sonst eine klar beschriftete schematische Zeichnung, nie ein vorgetäuschtes Produktfoto.
 * Der Container muss eine Größe haben (z. B. aspect-[4/3] oder absolute inset-0).
 */
export function ProductMedia({
  product,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw",
  label = "short",
  grid = true,
}: MediaProps) {
  const img = product.images[0];
  if (img) {
    return (
      <div className={`relative ${className}`}>
        <Image src={img.src} alt={img.alt} fill priority={priority} sizes={sizes} className="object-contain" />
      </div>
    );
  }
  return (
    <div className={`relative ${className}`}>
      <ProductSchematic visual={product.visual} title={product.name} label="none" grid={grid} className="h-full w-full" />
      {label !== "none" && <SchematicCaption label={label} />}
    </div>
  );
}

/** Kleine Vorschau ohne Beschriftung, z. B. für Vergleichsleiste und Zubehörlisten */
export function ProductThumb({ product, className = "", sizes = "96px" }: { product: Product; className?: string; sizes?: string }) {
  const img = product.images[0];
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {img ? (
        <Image src={img.src} alt="" fill sizes={sizes} className="object-contain" />
      ) : (
        <ProductSchematic visual={product.visual} title={product.name} label="none" grid={false} className="h-full w-full" />
      )}
    </span>
  );
}
