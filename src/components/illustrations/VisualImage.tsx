import type { VisualKey } from "@/lib/catalog/types";

/**
 * Gezeichnete Produktgrafik als nachladbares Bild (/art/visual/<key>.svg).
 * Hält HTML und JavaScript schlank; die Zeichnung selbst entsteht beim Build aus ProductVisual.
 */
export function VisualImage({ visual, className, title, eager = false }: { visual: VisualKey; className?: string; title?: string; eager?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/art/visual/${visual}.svg`}
      alt={title ?? ""}
      width={400}
      height={300}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={className}
    />
  );
}
