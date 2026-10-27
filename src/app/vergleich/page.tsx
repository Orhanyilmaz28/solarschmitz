import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { CompareTable } from "@/components/shop/CompareTable";

export const metadata: Metadata = {
  title: "Produktvergleich",
  description: "Vergleiche bis zu vier Produkte Seite an Seite: Leistung, Speicher, Ausstattung und Preis.",
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return (
    <>
      <div className="container-x pt-8">
        <Breadcrumbs items={[{ label: "Produktvergleich" }]} />
        <p className="eyebrow mt-10">Vergleich</p>
        <h1 className="display-lg mt-3 text-[clamp(2.25rem,5vw,4rem)]">Produkte vergleichen</h1>
        <p className="mt-4 max-w-[60ch] text-lg text-muted">
          Leistung, Speicher und Ausstattung Seite an Seite. Unterschiede sind hervorgehoben, die jeweils höheren Werte markiert.
        </p>
      </div>
      <section className="container-x pb-24 pt-10">
        <CompareTable />
      </section>
    </>
  );
}
