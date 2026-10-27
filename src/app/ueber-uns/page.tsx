import type { Metadata } from "next";
import { PageHeader } from "@/components/content/PageHeader";
import { ConsultCta } from "@/components/content/ConsultCta";
import { Reveal } from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { LogoMark } from "@/components/brand/Logo";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Über uns",
  description: `${brand.name} ist der Onlineshop der Energiezentrale Schmitz UG aus Hilden: Balkonkraftwerke, Speicher und Zubehör mit ehrlicher Beratung und klaren Preisen.`,
};

const principles = [
  {
    title: "Ehrlich beraten",
    text: "Wir empfehlen, was zu deinem Balkon, Dach und Verbrauch passt. Wenn ein kleineres Set reicht, sagen wir das.",
  },
  {
    title: "Offen rechnen",
    text: "Der Produktfinder zeigt seine Annahmen offen, und du kannst sie ändern. Keine geschönten Ertragsversprechen.",
  },
  {
    title: "Direkt liefern lassen",
    text: "Wir arbeiten mit ausgewählten Lieferanten zusammen, die direkt an dich versenden. Ein eigenes Lager haben wir nicht.",
  },
  {
    title: "Klar informieren",
    text: "Technische Daten, Steuersatz, Versandkosten und Rückgaberegeln siehst du vor dem Kauf. Was noch nicht feststeht, kennzeichnen wir als offen.",
  },
];

const howItWorks = [
  { title: "Du bestellst bei uns", text: "Beratung, Bestellung, Rechnung und Kundenservice laufen über uns." },
  { title: "Wir geben den Auftrag weiter", text: "Deine Bestellung geht an den Lieferanten, der die Ware vorrätig hat." },
  { title: "Der Lieferant versendet", text: "Die Ware kommt direkt zu dir, die Sendungsnummer per E-Mail." },
  { title: "Wir bleiben ansprechbar", text: "Bei Fragen zu Lieferung, Rückgabe oder Gewährleistung meldest du dich bei uns." },
];

export default function AboutPage() {
  const { legal, contact } = brand;
  const facts = [
    legal.company && { label: "Unternehmen", value: legal.company },
    contact.address && { label: "Sitz", value: `${contact.address.street}, ${contact.address.zip} ${contact.address.city}` },
    legal.managingDirector && { label: "Geschäftsführung", value: legal.managingDirector.replace(/\s*\(Geschäftsführer\)\s*/, "") },
    contact.phone && { label: "Telefon", value: `${contact.phone} · ${contact.hours}` },
    contact.email && { label: "E-Mail", value: contact.email },
  ].filter((f): f is { label: string; value: string } => Boolean(f));

  return (
    <>
      <PageHeader
        eyebrow="Über uns"
        titleLines={["Solarstrom für alle,", "die selbst anpacken."]}
        lead={`${brand.name} ist der Onlineshop der ${legal.company ?? "Energiezentrale Schmitz UG"} aus Hilden. Wir verkaufen Balkonkraftwerke, Speicher und Zubehör und sorgen dafür, dass du vor dem Kauf alles weißt, was zählt.`}
        crumbs={[{ label: "Über uns" }]}
        aside={
          <div className="relative mx-auto grid aspect-square w-full max-w-[420px] place-items-center overflow-hidden rounded-[var(--radius-media)] bg-night">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(closest-side_at_50%_55%,rgb(255_164_42/0.3),rgb(255_111_26/0.08)_55%,transparent_75%)]" />
            <LogoMark tone="dark" size={190} className="relative" />
          </div>
        }
      />

      <section aria-labelledby="grundsaetze" className="container-x section-y">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="t-label">Wofür wir stehen</p>
            <LineReveal id="grundsaetze" lines={["Vier Grundsätze"]} className="t-h2 m-0 mt-5" />
          </div>
          <ul className="divide-y divide-line border-y border-line lg:col-span-8">
            {principles.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 60} y={16} className="grid gap-3 py-8 md:grid-cols-12 md:gap-8">
                <p className="t-h3 m-0 md:col-span-5">{p.title}</p>
                <p className="m-0 text-[16.5px] leading-relaxed text-muted md:col-span-7">{p.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="arbeitsweise" className="on-dark relative isolate overflow-hidden bg-night text-paper">
        <div aria-hidden className="pointer-events-none absolute -left-40 top-0 -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(255_164_42/0.14),transparent)]" />
        <div className="container-x section-y">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
            <div className="lg:col-span-7">
              <p className="t-label">So arbeiten wir</p>
              <LineReveal id="arbeitsweise" lines={["Kein eigenes Lager.", "Dafür direkte Wege."]} className="t-h1 m-0 mt-5" />
            </div>
            <p className="t-lead m-0 max-w-[52ch] lg:col-span-5">
              Wir verkaufen im Streckengeschäft, auch Dropshipping genannt. Dein Vertragspartner sind wir, versendet wird direkt vom Lieferanten.
            </p>
          </div>
          <ol className="mt-16 grid border-t border-ink-line sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((s, i) => (
              <Reveal
                as="li"
                key={s.title}
                delay={i * 90}
                y={20}
                className="border-b border-ink-line py-8 sm:pr-8 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0"
              >
                <span className="font-mono text-xs tracking-[0.14em] text-sun-1">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-4 text-lg font-semibold">{s.title}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-dark">{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="wer-wir-sind" className="container-x section-y">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="t-label">Wer wir sind</p>
            <LineReveal id="wer-wir-sind" lines={["Das Unternehmen", `hinter ${brand.name}`]} className="t-h2 m-0 mt-5" />
          </div>
          <div className="lg:col-span-8">
            <p className="t-lead m-0 max-w-[58ch]">
              Wir sitzen in Hilden und sind vor und nach deiner Bestellung für dich da. Die vollständigen Anbieterangaben stehen im Impressum.
            </p>
            <dl className="mt-10 divide-y divide-line border-y border-line">
              {facts.map((f) => (
                <div key={f.label} className="grid gap-1 py-5 sm:grid-cols-12 sm:gap-8">
                  <dt className="t-label pt-1 sm:col-span-4">{f.label}</dt>
                  <dd className="m-0 text-[16.5px] sm:col-span-8">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <ConsultCta />
    </>
  );
}
