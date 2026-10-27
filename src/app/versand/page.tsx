import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/content/PageHeader";
import { Notice } from "@/components/content/Notice";
import { Placeholder, Prose } from "@/components/content/Prose";
import { GuideToc } from "@/components/content/GuideToc";
import { site } from "@/config/site";
import { formatEUR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Versand und Rückgabe",
  description: "Versand direkt vom Lieferanten, Sendungsverfolgung, Rückgabe sowie Rücknahme von Altbatterien und Elektro-Altgeräten.",
};

const sections = [
  { id: "ueberblick", label: "Auf einen Blick" },
  { id: "versand", label: "So läuft der Versand" },
  { id: "pruefen", label: "Lieferung prüfen" },
  { id: "rueckgabe", label: "Rückgabe und Widerruf" },
  { id: "batterien", label: "Batterien und Akkus" },
  { id: "altgeraete", label: "Elektro-Altgeräte" },
];

export default function ShippingPage() {
  const s = site.shipping;
  const pending = s.status !== "configured";
  const open = "wird noch festgelegt";
  const facts = [
    { label: "Versandkosten", value: s.flatRateEUR !== null ? formatEUR(s.flatRateEUR) : open },
    { label: "Versandkostenfrei ab", value: s.freeShippingFromEUR !== null ? formatEUR(s.freeShippingFromEUR) : open },
    { label: "Lieferzeit", value: s.deliveryTime ?? open },
    { label: "Liefergebiet", value: s.countries.includes("DE") ? "Deutschland" : s.countries.join(", ") },
    { label: "Versand durch", value: "den jeweiligen Lieferanten" },
    { label: "Widerrufsrecht", value: `${site.withdrawalDays} Tage ab Erhalt` },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Service"
        titleLines={["Versand und Rückgabe"]}
        lead="Deine Bestellung kommt direkt von unseren Lieferanten zu dir. Hier steht, wie das abläuft, wie du zurückgibst und wohin alte Akkus und Geräte gehören."
        crumbs={[{ label: "Versand und Rückgabe" }]}
      />

      <div className="container-x grid gap-12 py-14 md:py-24 lg:grid-cols-12 lg:gap-16">
        <div className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-28">
            <GuideToc items={sections} />
          </div>
        </div>

        <div className="min-w-0 space-y-20 lg:col-span-8 lg:col-start-5 md:space-y-24">
          <Section id="ueberblick" title="Auf einen Blick">
            {pending && (
              <Notice tone="preview" title="Versandkonditionen werden gerade festgelegt" className="mb-8">
                Versandkosten und Lieferzeiten stimmen wir mit unseren Lieferanten ab. Sobald sie feststehen, stehen sie hier und vor jeder Bestellung
                verbindlich im Warenkorb und an der Kasse.
              </Notice>
            )}
            <dl className="grid border-t border-line sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.label} className="border-b border-line py-5 sm:odd:pr-8 sm:even:border-l sm:even:pl-8">
                  <dt className="t-label">{f.label}</dt>
                  <dd className={`m-0 mt-2 text-[1.25rem] font-semibold tracking-[-0.02em] ${f.value === open ? "text-muted" : ""}`}>{f.value}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="versand" title="So läuft der Versand">
            <Prose>
              <p>
                Wir verkaufen im Streckengeschäft (Dropshipping) und halten keine eigenen Lagerbestände. Nach deiner Bestellung geben wir den Auftrag an
                den Lieferanten weiter, der die Ware vorrätig hat. Er verpackt und versendet direkt an deine Adresse.
              </p>
              <p>
                Sobald das Paket unterwegs ist, bekommst du eine E-Mail mit der Sendungsnummer. Enthält deine Bestellung Produkte verschiedener
                Lieferanten, kommen sie in getrennten Sendungen, jede mit eigener Sendungsnummer.
              </p>
              <p>
                Große oder schwere Artikel wie Solarmodule und Speicher können per Spedition kommen. Den Liefertermin stimmt die Spedition dann meist
                telefonisch ab. Gib deshalb an der Kasse am besten eine Telefonnummer an.
              </p>
            </Prose>
          </Section>

          <Section id="pruefen" title="Lieferung prüfen">
            <Prose>
              <p>
                Prüfe die Sendung bei der Annahme auf sichtbare Schäden. Lass Schäden an der Verpackung vom Zusteller schriftlich bestätigen und melde
                dich bei uns. Das hilft, eine Reklamation schnell zu klären. Deine gesetzlichen Rechte bleiben davon unberührt, auch wenn du nichts
                vermerken lässt.
              </p>
            </Prose>
          </Section>

          <Section id="rueckgabe" title="Rückgabe und Widerruf">
            <Prose>
              <p>
                Als Verbraucherin oder Verbraucher kannst du deine Bestellung innerhalb von {site.withdrawalDays} Tagen ab Erhalt der Ware ohne Angabe
                von Gründen widerrufen. Melde dich dafür bei uns. Wir sagen dir, an welche Adresse die Rücksendung geht, denn sie kann je nach Lieferant
                unterschiedlich sein.
              </p>
              <p>
                Alle Einzelheiten stehen in der <Link href="/widerruf">Widerrufsbelehrung</Link>, dort findest du auch das Muster-Widerrufsformular. Für
                Mängel gilt die gesetzliche Gewährleistung.
              </p>
            </Prose>
          </Section>

          <Section id="batterien" title="Batterien und Akkus" draft>
            <Prose>
              <p>
                Batteriespeicher und viele Geräte enthalten Akkus. Für sie gilt das Batterierecht-Durchführungsgesetz (BattDG) zusammen mit der
                EU-Batterieverordnung (EU) 2023/1542.
              </p>
              <ul>
                <li>
                  <strong>Nicht in den Hausmüll:</strong> Altbatterien und Altakkus gehören nicht in den Hausmüll. Du bist gesetzlich verpflichtet, sie
                  getrennt zu entsorgen und zur Rücknahme zu geben.
                </li>
                <li>
                  <strong>Kostenlos zurückgeben:</strong> Altbatterien kannst du unentgeltlich bei kommunalen Sammelstellen abgeben. Batterien der Art, die
                  wir als neue Batterien anbieten, nehmen wir ebenfalls unentgeltlich zurück. <Placeholder>Ablauf und Rückgabeadresse ergänzen; Rücknahme von Speichern über 5 kg (Industriebatterien) mit Hersteller oder Lieferant klären</Placeholder>
                </li>
                <li>
                  <strong>Symbole:</strong> Die durchgestrichene Mülltonne bedeutet, dass die Batterie nicht in den Hausmüll darf. Die Zeichen Hg, Cd oder
                  Pb darunter stehen für Quecksilber, Cadmium und Blei.
                </li>
                <li>
                  <strong>Lithium-Akkus:</strong> Beschädigte Lithium-Akkus können sich entzünden. Schütze die Anschlüsse vor Kurzschluss und melde dich vor
                  einer Rücksendung bei uns: Große Speicher sind Gefahrgut und brauchen einen geeigneten Transport.
                </li>
                <li>
                  <strong>Länger nutzen:</strong> Lade, lagere und betreibe Akkus nach den Angaben des Herstellers. Das verlängert ihre Lebensdauer und
                  vermeidet Abfall.
                </li>
              </ul>
              <p>
                <Placeholder>Weitere Pflichtangaben nach § 24 Abs. 3 BattDG und Art. 74 EU-Batterieverordnung prüfen und ergänzen</Placeholder>
              </p>
            </Prose>
          </Section>

          <Section id="altgeraete" title="Elektro-Altgeräte" draft>
            <Prose>
              <p>
                Solarmodule, Wechselrichter und Speicher sind Elektro- und Elektronikgeräte im Sinne des Elektro- und Elektronikgerätegesetzes
                (ElektroG).
              </p>
              <ul>
                <li>
                  <strong>Getrennt entsorgen:</strong> Altgeräte gehören nicht in den Hausmüll, darauf weist die durchgestrichene Mülltonne auf dem Gerät
                  hin. Du kannst sie unentgeltlich bei den Sammelstellen deiner Stadt oder Gemeinde abgeben, zum Beispiel am Wertstoffhof.
                </li>
                <li>
                  <strong>Akkus vorher entnehmen:</strong> Altbatterien und Altakkus, die nicht vom Gerät umschlossen sind und sich zerstörungsfrei
                  entnehmen lassen, nimmst du vor der Abgabe heraus und entsorgst sie getrennt.
                </li>
                <li>
                  <strong>Daten löschen:</strong> Für das Löschen persönlicher Daten auf Altgeräten bist du selbst verantwortlich, etwa App-Konten und
                  WLAN-Zugangsdaten von Wechselrichtern und Speichern.
                </li>
                <li>
                  <strong>Rücknahme durch uns:</strong> <Placeholder>Rücknahmepflicht als Vertreiber nach § 17 ElektroG prüfen und Ablauf ergänzen</Placeholder>
                </li>
              </ul>
              <p>
                <Placeholder>WEEE-Registrierungsnummern der Hersteller bzw. eigene Registrierung als Hersteller (Import) prüfen und ergänzen</Placeholder>
              </p>
            </Prose>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ id, title, draft = false, children }: { id: string; title: string; draft?: boolean; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28">
      <div className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id={`${id}-title`} className="t-h2 m-0">
          {title}
        </h2>
        {draft && <span className="chip border border-line bg-stone text-muted">Entwurf · vor Livegang anwaltlich prüfen</span>}
      </div>
      {children}
    </section>
  );
}
