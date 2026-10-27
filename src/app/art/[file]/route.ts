import { siedlungSvg, type SiedlungLayer, type SiedlungVariant } from "@/components/home/chapters/sun/siedlung";
import { heroLayerSvg, type HeroLayer, type HeroVariant } from "@/components/home/hero/heroSvg";

/**
 * Statische Linienwerk-Grafiken als eigene SVG-Dateien.
 * Werden beim Build einmal erzeugt und wie Bilder geladen und gecacht,
 * statt die Seite selbst schwer zu machen.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

const FILES: Record<string, () => string> = {};
for (const v of ["d", "m"] as SiedlungVariant[]) {
  for (const l of ["base", "pv", "win"] as SiedlungLayer[]) {
    FILES[`siedlung-${v}-${l}.svg`] = () => siedlungSvg(v, l);
  }
}

for (const v of ["desktop", "mobile"] as HeroVariant[]) {
  for (const l of ["ground", "house", "win"] as HeroLayer[]) {
    FILES[`hero-${v === "desktop" ? "d" : "m"}-${l}.svg`] = () => heroLayerSvg(v, l);
  }
}

export function generateStaticParams() {
  return Object.keys(FILES).map((file) => ({ file }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const make = FILES[file];
  if (!make) return new Response("Not Found", { status: 404 });
  return new Response(make(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
