import { Reveal } from "@/components/motion/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon, type IconName } from "@/components/ui/Icon";
import { site } from "@/config/site";

/**
 * Vertrauen durch Offenheit: wie Beratung, Versand, Steuern und Daten funktionieren.
 * Keine Siegel, Bewertungen oder Verkaufszahlen, nur überprüfbare Aussagen.
 */
const points: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Persönliche Beratung",
    body: "Schick uns Fotos von Balkon, Dach oder Garten. Wir sagen dir, welches Set passt und welche Halterung du brauchst.",
    icon: "chat",
  },
  {
    title: "Versand direkt vom Lieferanten",
    body: "Wir arbeiten ohne eigenes Lager. Deine Bestellung geht direkt beim Lieferanten raus, die Sendungsnummer bekommst du per E-Mail.",
    icon: "truck",
  },
  {
    title: "0 % Mehrwertsteuer, wenn es passt",
    body: "Für Photovoltaik-Komponenten gilt der Nullsteuersatz nach § 12 Abs. 3 UStG, wenn du die Anlage selbst betreibst und sie an oder nahe einem Wohngebäude steht. Im Warenkorb siehst du beide Summen.",
    icon: "euro",
  },
  {
    title: `${site.withdrawalDays} Tage Widerrufsrecht`,
    body: `Als Verbraucherin oder Verbraucher kannst du online gekaufte Ware innerhalb von ${site.withdrawalDays} Tagen ohne Angabe von Gründen widerrufen.`,
    icon: "return",
  },
  {
    title: "Ehrliche Produktdaten",
    body: "Jedes Produkt zeigt, woher seine Daten stammen: aus dem Lieferantenkatalog, als Demo gekennzeichnet oder vom Hersteller bestätigt.",
    icon: "shield",
  },
  {
    title: "Rechnungen mit offenen Annahmen",
    body: "Ertrag, Ersparnis und Amortisation rechnen wir mit Werten, die du siehst und im Konfigurator selbst ändern kannst.",
    icon: "chart",
  },
];

export function HowWeWork() {
  return (
    <section className="cv-auto section-y bg-paper" aria-labelledby="vertrauen-title" style={{ ["--cv-d" as string]: "730px", ["--cv-m" as string]: "1640px" }}>
      <div className="container-x">
        <SectionHeader id="vertrauen-title" label="So arbeiten wir" lines={["Klar beraten.", "Transparent liefern."]} />
        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
          {points.map((p, i) => (
            <Reveal as="li" key={p.title} delay={(i % 3) * 100} className="border-t border-line pt-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-night text-sun-1">
                <Icon name={p.icon} size={22} />
              </span>
              <h3 className="t-h3 m-0 mt-5">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
