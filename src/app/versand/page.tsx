import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/PageHeader";
import { Notice } from "@/components/content/Notice";
import { Prose } from "@/components/content/Prose";
import { site } from "@/config/site";
import { formatEUR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Versand & Rückgabe",
  description: "Wie Versand, Lieferzeit, Sendungsverfolgung und Rückgabe bei uns funktionieren.",
};

export default function ShippingPage() {
  const s = site.shipping;
  const pending = s.status !== "configured";
  const facts = [
    { label: "Versandkosten", value: s.flatRateEUR !== null ? formatEUR(s.flatRateEUR) : "wird noch festgelegt" },
    { label: "Versandkostenfrei ab", value: s.freeShippingFromEUR !== null ? formatEUR(s.freeShippingFromEUR) : "wird noch festgelegt" },
    { label: "Lieferzeit", value: s.deliveryTime ?? "wird noch festgelegt" },
    { label: "Liefergebiet", value: s.countries.includes("DE") ? "Deutschland" : s.countries.join(", ") },
    { label: "Widerrufsrecht", value: `${site.withdrawalDays} Tage` },
    { label: "Versand durch", value: "den jeweiligen Lieferanten" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Service"
        title="Versand & Rückgabe"
        lead="Deine Bestellung kommt direkt von unseren Lieferanten zu dir. Hier steht, wie das abläuft und was es kostet."
        crumbs={[{ label: "Versand & Rückgabe" }]}
      />

      <section className="container-x py-14 md:py-20">
        {pending && (
          <Notice tone="preview" title="Versandkonditionen werden gerade festgelegt" className="mb-10 max-w-3xl">
            Versandkosten und Lieferzeiten stimmen wir mit unseren Lieferanten ab. Sobald sie feststehen, stehen sie hier und vor jeder Bestellung
            verbindlich im Warenkorb.
          </Notice>
        )}

        <dl className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="bg-white p-6">
              <dt className="eyebrow !text-[11px]">{f.label}</dt>
              <dd className="mt-2 font-display text-xl font-bold" style={{ fontStretch: "106%" }}>
                {f.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
          <h2 className="display-md m-0 text-2xl md:text-3xl">So läuft der Versand</h2>
          <Prose>
            <p>
              Wir arbeiten im Streckengeschäft (Dropshipping): Wir halten keine eigenen Lagerbestände. Nach deiner Bestellung geben wir den Auftrag an
              den Lieferanten weiter, der die Ware vorrätig hat. Er verpackt und versendet direkt an deine Adresse.
            </p>
            <p>
              Sobald das Paket unterwegs ist, bekommst du eine E-Mail mit der Sendungsnummer. Enthält deine Bestellung Produkte verschiedener
              Lieferanten, kommen sie in getrennten Sendungen, jede mit eigener Sendungsnummer.
            </p>
            <p>
              Große oder schwere Artikel wie Solarmodule und Speicher können per Spedition geliefert werden. In diesem Fall meldet sich die Spedition
              vorab bei dir. Gib deshalb im Checkout am besten eine Telefonnummer an.
            </p>
            <h3>Bei Lieferung prüfen</h3>
            <p>
              Prüfe die Sendung bei der Annahme auf sichtbare Schäden. Lass Schäden an der Verpackung vom Zusteller schriftlich bestätigen und
              melde dich bei uns. Das hilft, eine Reklamation schnell zu klären. Deine gesetzlichen Rechte bleiben davon unberührt.
            </p>
          </Prose>
        </div>

        <div className="mt-16 grid gap-12 border-t border-line pt-16 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
          <h2 className="display-md m-0 text-2xl md:text-3xl">Rückgabe & Widerruf</h2>
          <Prose>
            <p>
              Als Verbraucherin oder Verbraucher kannst du deine Bestellung innerhalb von {site.withdrawalDays} Tagen ab Erhalt der Ware ohne Angabe
              von Gründen widerrufen. Melde dich dafür bei uns. Wir sagen dir, an welche Adresse die Rücksendung geht, denn sie kann je nach Lieferant
              unterschiedlich sein.
            </p>
            <p>
              Alle Einzelheiten stehen in der <Link href="/widerruf">Widerrufsbelehrung</Link>. Für Mängel gilt die gesetzliche Gewährleistung.
            </p>
          </Prose>
        </div>
      </section>
    </>
  );
}
