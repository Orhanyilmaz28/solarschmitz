import { getAllProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";

/** Eine Auswahl aus verschiedenen Kategorien, echte Lieferantendaten vor Demo-Produkten. */
export function FeaturedProducts() {
  const picks = ["p-eforu-set-880", "p-eforu-set-880-e1600", "p-anker-sb2-e1600ac", "p-apsystems-ez1m"];
  const products = picks.map((id) => getAllProducts().find((p) => p.id === id)).filter((p) => p !== undefined);
  return (
    <section className="bg-mist/60 py-24 md:py-32" aria-labelledby="featured-title">
      <div className="container-x">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <p className="eyebrow">Auswahl</p>
            <h2 id="featured-title" className="display-lg mt-4 text-[34px] md:text-[52px]">
              Gute Startpunkte.
            </h2>
            <p className="mt-4 max-w-xl text-muted">
              Komplettsets, Speicher und Wechselrichter aus dem Katalog unseres Lieferanten. Preise sind Richtpreise und werden vor dem Verkaufsstart bestätigt.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <ButtonLink href="/vergleich" variant="outline">
              Produkte vergleichen
            </ButtonLink>
          </Reveal>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal as="li" key={p.id} delay={i * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
