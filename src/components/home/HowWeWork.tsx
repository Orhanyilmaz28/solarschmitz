import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/config/site";

/**
 * Vertrauen durch Offenheit: wie Bestellung, Versand und Beratung ablaufen.
 * Keine Siegel, Bewertungen oder Verkaufszahlen, nur überprüfbare Aussagen.
 */
const points = [
  {
    title: "Persönliche Beratung",
    body: "Du schickst uns Fotos von Balkon oder Dach, wir sagen dir, welches Set passt und welche Halterung du brauchst.",
    icon: "M6 10a8 8 0 1 1 3 6.2L4 18l1.6-4.4A7.9 7.9 0 0 1 6 10Z",
  },
  {
    title: "Versand direkt vom Lieferanten",
    body: "Wir arbeiten ohne eigenes Lager. Deine Bestellung geht direkt beim Lieferanten raus, die Sendungsnummer bekommst du per E-Mail.",
    icon: "M2 6h11v9H2zM13 9h4l3 3v3h-7M5.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  },
  {
    title: "0 % Mehrwertsteuer",
    body: "Für Solarmodule, Wechselrichter, Speicher und Halterungen gilt bei privater Nutzung der Nullsteuersatz nach § 12 Abs. 3 UStG.",
    icon: "M5 17 17 5M7 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM15 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  },
  {
    title: `${site.withdrawalDays} Tage Widerrufsrecht`,
    body: "Als Verbraucher kannst du online gekaufte Ware innerhalb von 14 Tagen ohne Angabe von Gründen zurückgeben.",
    icon: "M4 10a6 6 0 1 0 2-4.5M4 4v3h3",
  },
  {
    title: "Ehrliche Produktdaten",
    body: "Jedes Produkt zeigt, woher seine Daten stammen: Vorschau aus dem Lieferantenkatalog, Demo oder bestätigt.",
    icon: "M10 3 3 6v4c0 4 3 6.5 7 7.5 4-1 7-3.5 7-7.5V6zM7 10l2 2 4-4",
  },
  {
    title: "Rechner mit offenen Annahmen",
    body: "Ertrag, Ersparnis und Amortisation berechnen wir mit Werten, die du siehst und selbst anpassen kannst.",
    icon: "M4 16V9M9 16V4M14 16v-5M3 16h14",
  },
];

export function HowWeWork() {
  return (
    <section className="bg-paper py-24 md:py-32" aria-labelledby="how-title">
      <div className="container-x">
        <Reveal>
          <p className="eyebrow">So arbeiten wir</p>
          <h2 id="how-title" className="display-lg mt-4 max-w-3xl text-[34px] md:text-[52px]">
            Klar beraten, transparent liefern.
          </h2>
        </Reveal>
        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((p, i) => (
            <Reveal as="li" key={p.title} delay={(i % 3) * 100} className="border-t border-line pt-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-lime">
                <svg viewBox="0 0 20 20" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={p.icon} />
                </svg>
              </span>
              <h3 className="mt-5 font-sans text-xl font-semibold tracking-normal">{p.title}</h3>
              <p className="mt-2 text-muted">{p.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
