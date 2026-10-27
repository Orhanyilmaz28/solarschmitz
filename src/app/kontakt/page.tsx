import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/PageHeader";
import { ContactForm } from "@/components/content/ContactForm";
import { Placeholder } from "@/components/content/Prose";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Fragen zu Produkten, Bestellung oder Lieferung? Schreib uns.",
};

export default function ContactPage() {
  const { contact } = brand;
  return (
    <>
      <PageHeader
        eyebrow="Kontakt"
        title="Wie können wir helfen?"
        lead="Ob Kaufberatung, Frage zur Lieferung oder etwas ganz anderes: Schreib uns, wir antworten per E-Mail."
        crumbs={[{ label: "Kontakt" }]}
      />
      <section className="container-x grid gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-16">
        <div className="relative min-w-0">
          <ContactForm />
        </div>
        <aside className="min-w-0 space-y-6">
          <div className="rounded-[var(--radius-card)] bg-ink p-6 text-paper">
            <p className="eyebrow !text-muted-dark">Direkt erreichen</p>
            <dl className="mt-5 space-y-4 text-[15px]">
              <div>
                <dt className="text-sm text-muted-dark">E-Mail</dt>
                <dd className="mt-1 select-all font-semibold">{contact.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-dark">Telefon</dt>
                <dd className="mt-1 font-semibold">{contact.phone ?? <span className="font-normal text-muted-dark">folgt in Kürze</span>}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-dark">Erreichbarkeit</dt>
                <dd className="mt-1 font-semibold">{contact.hours}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-dark">Anschrift</dt>
                <dd className="mt-1">
                  {contact.address ? (
                    <>
                      {contact.address.street}
                      <br />
                      {contact.address.zip} {contact.address.city}
                    </>
                  ) : (
                    <Placeholder>Anschrift ergänzen</Placeholder>
                  )}
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-[var(--radius-card)] border border-line bg-white p-6">
            <p className="font-semibold">Schneller zur Antwort</p>
            <ul className="mt-3 space-y-2 text-[15px]">
              <li>
                <Link href="/konfigurator" className="underline decoration-lime decoration-2 underline-offset-4">
                  Produktfinder: passende Sets in 2 Minuten
                </Link>
              </li>
              <li>
                <Link href="/faq" className="underline decoration-lime decoration-2 underline-offset-4">
                  Häufige Fragen
                </Link>
              </li>
              <li>
                <Link href="/versand" className="underline decoration-lime decoration-2 underline-offset-4">
                  Versand & Rückgabe
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
