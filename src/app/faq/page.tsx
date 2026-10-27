import type { Metadata } from "next";
import { faqItems } from "@/data/faq";
import { PageHeader } from "@/components/content/PageHeader";
import { ConsultCta } from "@/components/content/ConsultCta";
import { FaqBrowser } from "@/components/content/FaqBrowser";

export const metadata: Metadata = {
  title: "Häufige Fragen",
  description: "Antworten zu Leistung, Anmeldung, Zähler, Speicher, Umsatzsteuer, Versand und Rückgabe von Balkonkraftwerken.",
};

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
        lead="Was erlaubt ist, wie du dein Balkonkraftwerk anmeldest, wann sich ein Speicher lohnt und wie Versand und Rückgabe funktionieren."
        crumbs={[{ label: "Häufige Fragen" }]}
      />

      <div className="container-x py-14 md:py-24">
        <FaqBrowser items={faqItems} />
      </div>

      <ConsultCta
        label="Persönlich"
        title="Deine Frage ist nicht dabei?"
        text="Ruf uns an oder schreib uns. Nenne Montageort, Ausrichtung und ungefähren Stromverbrauch, dann antworten wir gezielt."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
