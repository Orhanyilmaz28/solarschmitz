import { getAllProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

/** Eine Auswahl aus verschiedenen Kategorien, echte Lieferantendaten vor Demo-Produkten. */
export function FeaturedProducts() {
  const picks = ["p-eforu-set-880", "p-eforu-set-880-e1600", "p-anker-sb2-e1600ac", "p-apsystems-ez1m"];
  const products = picks.map((id) => getAllProducts().find((p) => p.id === id)).filter((p) => p !== undefined);
  return (
    <section className="cv-auto section-y bg-stone" aria-labelledby="auswahl-title" style={{ ["--cv-d" as string]: "700px", ["--cv-m" as string]: "2260px" }}>
      <div className="container-x">
        <SectionHeader
          id="auswahl-title"
          label="Auswahl"
          lines={["Gute Startpunkte."]}
          align="split"
          lead="Komplettsets, Speicher und Wechselrichter aus dem Katalog unseres Lieferanten. Jede Angabe zeigt, woher sie stammt."
          actions={
            <ButtonLink href="/vergleich" variant="outline">
              Produkte vergleichen
            </ButtonLink>
          }
        />
        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
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
