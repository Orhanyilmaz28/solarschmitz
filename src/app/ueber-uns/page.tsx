import type { Metadata } from "next";
import { PageHeader } from "@/components/content/PageHeader";
import { ConsultCta } from "@/components/content/ConsultCta";
import { Reveal } from "@/components/motion/Reveal";
import { Placeholder } from "@/components/content/Prose";
import { LogoIcon } from "@/components/brand/Logo";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Über uns",
  description: `Wer hinter ${brand.name} steht und wie wir arbeiten: ausgewählte Lieferanten, ehrliche Beratung, transparente Preise.`,
};

const principles = [
  {
    title: "Ehrlich beraten",
    text: "Wir empfehlen, was zu deinem Balkon, Dach und Verbrauch passt. Wenn ein kleineres Set reicht, sagen wir das.",
  },
  {
    title: "Transparent rechnen",
    text: "Unser Ertragsrechner zeigt alle Annahmen offen und lässt dich jede davon ändern. Keine geschönten Versprechen.",
  },
  {
    title: "Ausgewählte Lieferanten",
    text: "Wir arbeiten mit Fachhändlern und Herstellern zusammen, die direkt an dich liefern. So zahlst du keine Lagerkosten mit.",
  },
  {
    title: "Klare Informationen",
    text: "Technische Daten, Steuersätze, Versand und Rückgabe stehen vor dem Kauf vollständig auf der Seite.",
  },
];

const howItWorks = [
  { title: "Du bestellst bei uns", text: "Beratung, Bestellung, Rechnung und Kundenservice laufen über uns." },
  { title: "Wir geben die Bestellung weiter", text: "Dein Auftrag geht an den Lieferanten, der die Ware auf Lager hat." },
  { title: "Der Lieferant versendet", text: "Die Ware kommt direkt vom Lieferanten zu dir, mit Sendungsnummer per E-Mail." },
  { title: "Wir bleiben dein Ansprechpartner", text: "Bei Fragen zu Lieferung, Rückgabe oder Gewährleistung meldest du dich bei uns." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Über uns"
        title={
          <>
            Solarstrom für alle,
            <br /> die selbst anpacken.
          </>
        }
        lead={`${brand.name} ist ein junger Onlineshop für Balkonkraftwerke, Speicher und Solarzubehör. Wir wollen, dass der Einstieg in eigenen Solarstrom einfach, verständlich und ehrlich ist.`}
        crumbs={[{ label: "Über uns" }]}
        aside={
          <div className="relative mx-auto grid aspect-square w-full max-w-[360px] place-items-center rounded-[40px] bg-ink">
            <div aria-hidden className="absolute inset-[18%] rounded-full bg-lime/20 blur-3xl" />
            <LogoIcon tone="dark" size={180} className="relative" />
          </div>
        }
      />

      <section className="container-x py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <p className="eyebrow mb-3">Wofür wir stehen</p>
            <h2 className="display-md m-0 text-[clamp(1.75rem,3vw,2.5rem)]">Unsere Grundsätze</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {principles.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 70} className="rounded-[var(--radius-card)] border border-line bg-white p-6">
                <p className="font-display text-xl font-bold" style={{ fontStretch: "108%" }}>
                  {p.title}
                </p>
                <p className="mt-3 text-[15px] text-muted">{p.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="on-dark bg-ink text-paper">
        <div className="container-x py-16 md:py-24">
          <p className="eyebrow mb-3">So arbeiten wir</p>
          <h2 className="display-md m-0 max-w-[22ch] text-[clamp(1.75rem,3.5vw,2.75rem)]">Kein eigenes Lager. Dafür direkte Wege.</h2>
          <p className="mt-5 max-w-[60ch] text-muted-dark">
            Wir verkaufen im Streckengeschäft, auch Dropshipping genannt. Wir halten keine eigenen Bestände, sondern geben deine Bestellung an
            ausgewählte Lieferanten weiter, die direkt an dich versenden.
          </p>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-ink-line bg-ink-line sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((s, i) => (
              <li key={s.title} className="bg-ink-2 p-6">
                <span className="font-mono text-sm text-lime">Schritt {i + 1}</span>
                <p className="mt-3 font-semibold">{s.title}</p>
                <p className="mt-2 text-sm text-muted-dark">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-x py-16 md:py-24">
        <div className="max-w-[68ch]">
          <p className="eyebrow mb-3">Wer wir sind</p>
          <h2 className="display-md m-0 text-[clamp(1.75rem,3vw,2.5rem)]">Das Team hinter {brand.name}</h2>
          <p className="mt-5 text-lg text-muted">
            <Placeholder>Gründungsgeschichte, Standort und Ansprechpartner ergänzen</Placeholder>
          </p>
          <p className="mt-4 text-muted">
            Hier stellen wir uns bald persönlich vor. Bis dahin erreichst du uns über das Kontaktformular.
          </p>
        </div>
      </section>

      <ConsultCta />
    </>
  );
}
