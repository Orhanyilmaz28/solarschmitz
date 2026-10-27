import { createElement } from "react";
import { VisualSvg } from "@/components/illustrations/ProductVisual";
import { visualKeys, type VisualKey } from "@/lib/catalog/types";

/**
 * Gezeichnete Produktgrafiken als eigene SVG-Dateien (/art/visual/<key>.svg).
 * Karten laden sie als Bild nach, statt das Markup doppelt ins HTML zu schreiben.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return visualKeys.map((k) => ({ key: `${k}.svg` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const name = key.replace(/\.svg$/, "") as VisualKey;
  if (!(visualKeys as readonly string[]).includes(name)) return new Response("Not Found", { status: 404 });
  const { renderToStaticMarkup } = await import("react-dom/server");
  let svg = renderToStaticMarkup(createElement(VisualSvg, { visual: name, uid: "v" }));
  svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
  });
}
