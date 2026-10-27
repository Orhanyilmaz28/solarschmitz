import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/PageHeader";
import { ContactForm } from "@/components/content/ContactForm";
import { Icon } from "@/components/ui/Icon";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kaufberatung, Bestellung, Lieferung oder Rückgabe: Ruf uns an oder schreib uns.",
};

export default function ContactPage() {
  const { contact, legal } = brand;
  const shortcuts = [
    { href: "/konfigurator", label: "Produktfinder", text: "Passende Sets in wenigen Schritten" },
    { href: "/faq", label: "Häufige Fragen", text: "Anmeldung, Zähler, Speicher, Umsatzsteuer" },
    { href: "/versand", label: "Versand und Lieferung", text: "Versand, Rücksendung, Entsorgung" },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Kontakt"
        titleLines={["Fragen zum Set?", "Wir antworten persönlich."]}
        lead="Kaufberatung, Lieferung oder Rückgabe: Ruf uns an oder schreib uns. Für eine Beratung helfen Montageort, Ausrichtung und ungefährer Jahresverbrauch."
        crumbs={[{ label: "Kontakt" }]}
      />
      <section className="container-x grid gap-16 py-14 md:py-24 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <h2 className="t-h3 m-0 mb-8">Nachricht schreiben</h2>
          <ContactForm />
        </div>

        <aside className="min-w-0 lg:col-span-4 lg:col-start-9">
          <h2 className="t-label">Direkt erreichen</h2>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            {contact.phone && (
              <div className="py-5">
                <dt className="text-sm text-muted">Telefon · {contact.hours}</dt>
                <dd className="mt-1.5">
                  <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2.5 font-display text-[1.5rem] font-semibold tracking-[-0.03em] hover:underline">
                    <Icon name="phone" size={20} />
                    {contact.phone}
                  </a>
                </dd>
              </div>
            )}
            {contact.email && (
              <div className="py-5">
                <dt className="text-sm text-muted">E-Mail</dt>
                <dd className="mt-1.5">
                  <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2.5 text-[1.0625rem] font-semibold hover:underline">
                    <Icon name="mail" size={18} />
                    {contact.email}
                  </a>
                </dd>
              </div>
            )}
            {contact.address && (
              <div className="py-5">
                <dt className="text-sm text-muted">Anschrift</dt>
                <dd className="mt-1.5 leading-relaxed">
                  {legal.company && (
                    <>
                      {legal.company}
                      <br />
                    </>
                  )}
                  {contact.address.street}
                  <br />
                  {contact.address.zip} {contact.address.city}
                </dd>
              </div>
            )}
          </dl>

          <h2 className="t-label mt-12">Schneller zur Antwort</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {shortcuts.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="group flex items-center justify-between gap-4 py-4">
                  <span className="min-w-0">
                    <span className="block font-semibold group-hover:underline">{s.label}</span>
                    <span className="mt-0.5 block text-sm text-muted">{s.text}</span>
                  </span>
                  <Icon name="arrow-right" size={18} className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </>
  );
}
