import type { Metadata } from "next";
import Link from "next/link";
import { faqCategoryLabels, faqItems, type FaqItem } from "@/data/faq";
import { PageHeader } from "@/components/content/PageHeader";
import { ConsultCta } from "@/components/content/ConsultCta";
import { Accordion } from "@/components/ui/Accordion";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Häufige Fragen",
  description: "Antworten zu Leistung, Anmeldung, Speicher, Versand und Rückgabe von Balkonkraftwerken.",
};

const order: FaqItem["category"][] = ["recht", "technik", "speicher", "bestellung"];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <PageHeader
        eyebrow="Hilfe"
        title="Häufige Fragen"
        lead="Was erlaubt ist, wie du anmeldest, was ein Speicher bringt und wie Versand und Rückgabe funktionieren."
        crumbs={[{ label: "Häufige Fragen" }]}
      >
        <nav aria-label="Themen" className="flex flex-wrap gap-2">
          {order.map((c) => (
            <a key={c} href={`#${c}`} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-ink">
              {faqCategoryLabels[c]}
            </a>
          ))}
        </nav>
      </PageHeader>

      <div className="container-x space-y-16 py-14 md:py-20">
        {order.map((c) => {
          const items = faqItems.filter((f) => f.category === c);
          if (!items.length) return null;
          return (
            <Reveal key={c}>
              <section id={c} aria-labelledby={`${c}-titel`} className="grid scroll-mt-28 gap-6 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] lg:gap-14">
                <h2 id={`${c}-titel`} className="display-md m-0 text-2xl md:text-3xl">
                  {faqCategoryLabels[c]}
                </h2>
                <Accordion items={items.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
              </section>
            </Reveal>
          );
        })}
        <p className="text-muted">
          Deine Frage ist nicht dabei?{" "}
          <Link href="/kontakt" className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-4">
            Schreib uns
          </Link>{" "}
          oder lies weiter im{" "}
          <Link href="/ratgeber" className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-4">
            Ratgeber
          </Link>
          .
        </p>
      </div>

      <ConsultCta />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
