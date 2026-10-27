import type { Metadata } from "next";
import { PageHeader } from "@/components/content/PageHeader";
import { CompareTable } from "@/components/shop/CompareTable";
import { VatFootnote } from "@/components/shop/VatFootnote";

export const metadata: Metadata = {
  title: "Produktvergleich",
  description: "Vergleiche bis zu vier Produkte Seite an Seite: Leistung, Speicher, Ausstattung und Preis.",
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return (
    <>
      <PageHeader
        eyebrow="Vergleich"
        title="Produkte vergleichen"
        lead="Leistung, Speicher und Ausstattung Seite an Seite. Unterschiede sind markiert, der jeweils höchste Wert hervorgehoben."
        crumbs={[{ label: "Produktvergleich" }]}
        flush
      />
      <section className="container-x pb-24 md:pb-32">
        <CompareTable />
        <VatFootnote className="mt-20 md:mt-28" />
      </section>
    </>
  );
}
