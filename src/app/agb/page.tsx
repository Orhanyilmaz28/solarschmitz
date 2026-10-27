import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/content/LegalPage";
import { Placeholder } from "@/components/content/Prose";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "AGB", robots: { index: false, follow: true } };

export default function TermsPage() {
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen">
      <h2>§ 1 Geltungsbereich</h2>
      <p>
        Diese Bedingungen gelten für alle Bestellungen über den Onlineshop von {brand.legal.company ?? <Placeholder>Firmenname</Placeholder>}.
      </p>

      <h2>§ 2 Vertragsschluss</h2>
      <p>
        Die Darstellung der Produkte im Shop ist kein rechtlich bindendes Angebot. Mit dem Klick auf „Zahlungspflichtig bestellen“ gibst du ein
        verbindliches Angebot ab. Der Vertrag kommt zustande, wenn wir die Bestellung bestätigen. <Placeholder>Ablauf und Zeitpunkt prüfen</Placeholder>
      </p>

      <h2>§ 3 Preise und Versandkosten</h2>
      <p>
        Alle Preise sind Endpreise inklusive der gesetzlichen Umsatzsteuer. Für Photovoltaik-Komponenten kann der Nullsteuersatz nach § 12 Abs. 3
        UStG gelten. Versandkosten werden vor Abschluss der Bestellung angegeben.
      </p>

      <h2>§ 4 Lieferung</h2>
      <p>
        Die Lieferung erfolgt innerhalb Deutschlands direkt durch unsere Lieferanten. Teillieferungen sind möglich, wenn Produkte von verschiedenen
        Lieferanten stammen. <Placeholder>Lieferzeiten und Regelungen bei Nichtverfügbarkeit ergänzen</Placeholder>
      </p>

      <h2>§ 5 Zahlung</h2>
      <p>
        <Placeholder>Angebotene Zahlungsarten und Fälligkeit ergänzen</Placeholder>
      </p>

      <h2>§ 6 Eigentumsvorbehalt</h2>
      <p>Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.</p>

      <h2>§ 7 Widerrufsrecht</h2>
      <p>
        Verbraucherinnen und Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Einzelheiten stehen in der{" "}
        <Link href="/widerruf">Widerrufsbelehrung</Link>.
      </p>

      <h2>§ 8 Gewährleistung</h2>
      <p>Es gilt die gesetzliche Mängelhaftung. Herstellergarantien bestehen nur, wenn der Hersteller sie ausdrücklich gewährt.</p>

      <h2>§ 9 Schlussbestimmungen</h2>
      <p>
        <Placeholder>Anwendbares Recht, Vertragssprache, Speicherung des Vertragstextes</Placeholder>
      </p>
    </LegalPage>
  );
}
