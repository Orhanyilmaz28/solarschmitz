import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/content/LegalPage";
import { Placeholder } from "@/components/content/Prose";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { zeroRateConditions, zeroRateFallback } from "@/lib/cart/vat";

export const metadata: Metadata = { title: "AGB", robots: { index: false, follow: true } };

export default function TermsPage() {
  const { legal, contact } = brand;
  return (
    <LegalPage
      title="Allgemeine Geschäftsbedingungen"
      intro="Die Regeln für Bestellungen bei uns: wie der Vertrag zustande kommt, was Preise enthalten und wie Lieferung und Gewährleistung funktionieren."
    >
      <h2>§ 1 Geltungsbereich und Anbieter</h2>
      <p>
        Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen über den Onlineshop {brand.domain} der{" "}
        {legal.company ?? <Placeholder>Firmenname</Placeholder>},{" "}
        {contact.address ? `${contact.address.street}, ${contact.address.zip} ${contact.address.city}` : <Placeholder>Anschrift</Placeholder>} (im
        Folgenden „wir“).
      </p>
      <p>
        Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer
        selbständigen beruflichen Tätigkeit zugerechnet werden können (§ 13 BGB).
      </p>

      <h2>§ 2 Vertragsschluss</h2>
      <p>
        Die Darstellung der Produkte im Shop ist kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Bestellung. Mit dem Klick auf
        „Zahlungspflichtig bestellen“ gibst du ein verbindliches Angebot zum Kauf der Waren im Warenkorb ab.
      </p>
      <p>
        Den Eingang deiner Bestellung bestätigen wir per E-Mail. Diese Eingangsbestätigung ist noch keine Annahme. Der Vertrag kommt zustande, wenn wir
        die Annahme ausdrücklich erklären oder die Ware versenden. <Placeholder>Ablauf und Zeitpunkt der Annahme mit dem Bestellsystem abstimmen</Placeholder>
      </p>
      <p>
        Vor dem Absenden siehst du alle Angaben noch einmal und kannst Eingabefehler über „Ändern“ in jedem Schritt der Kasse korrigieren.
      </p>

      <h2>§ 3 Preise, Umsatzsteuer und Versandkosten</h2>
      <p>Alle Preise sind Endpreise und enthalten die gesetzliche Umsatzsteuer. Versandkosten zeigen wir vor dem Absenden der Bestellung an.</p>
      <p>
        Für Solarmodule, Wechselrichter, Speicher und wesentliche Komponenten einer Photovoltaikanlage gilt der Nullsteuersatz nach § 12 Abs. 3 UStG,
        wenn diese Voraussetzungen erfüllt sind:
      </p>
      <ul>
        {zeroRateConditions.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <p>
        An der Kasse fragen wir ab, ob die Voraussetzungen für deine Bestellung erfüllt sind. Mit „Ja“ bestätigst du das. {zeroRateFallback} Artikel, die
        nicht unter den Nullsteuersatz fallen, etwa smarte Steckdosen, berechnen wir immer mit 19 %. Der Steuersatz steht bei jedem Produkt.
      </p>

      <h2>§ 4 Lieferung</h2>
      <p>
        Wir liefern innerhalb Deutschlands. Die Ware wird direkt von unseren Lieferanten versendet. Kommen Artikel von verschiedenen Lieferanten, erhältst
        du getrennte Sendungen. Die Lieferzeit zeigen wir vor dem Absenden der Bestellung an.
      </p>
      <p>
        <Placeholder>Regelung bei Nichtverfügbarkeit trotz Bestellung (Information und unverzügliche Erstattung) ergänzen</Placeholder>
      </p>

      <h2>§ 5 Zahlung</h2>
      <p>
        <Placeholder>Angebotene Zahlungsarten, Zahlungsdienstleister und Fälligkeit ergänzen</Placeholder>
      </p>

      <h2>§ 6 Eigentumsvorbehalt</h2>
      <p>Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.</p>

      <h2>§ 7 Widerrufsrecht</h2>
      <p>
        Verbraucherinnen und Verbrauchern steht ein gesetzliches Widerrufsrecht von {site.withdrawalDays} Tagen zu. Einzelheiten stehen in der{" "}
        <Link href="/widerruf">Widerrufsbelehrung</Link>.
      </p>

      <h2>§ 8 Gewährleistung und Garantie</h2>
      <p>
        Es gilt das gesetzliche Mängelhaftungsrecht. Garantien gelten nur, wenn ein Hersteller sie ausdrücklich gewährt, und nur zu dessen Bedingungen.
        Die Garantiebedingungen findest du bei den jeweiligen Produkten oder in den Unterlagen des Herstellers.
      </p>

      <h2>§ 9 Transportschäden</h2>
      <p>
        Bitte melde offensichtliche Transportschäden möglichst sofort beim Zusteller und bei uns. Deine gesetzlichen Ansprüche bleiben unberührt, auch
        wenn du das nicht tust.
      </p>

      <h2>§ 10 Vertragssprache und Vertragstext</h2>
      <p>
        Vertragssprache ist Deutsch. Die Bestelldaten senden wir dir per E-Mail. <Placeholder>Speicherung des Vertragstextes und Zugriff für Kundinnen und Kunden beschreiben</Placeholder>
      </p>

      <h2>§ 11 Streitbeilegung</h2>
      <p>
        Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.{" "}
        <Placeholder>Formulierung nach § 36 VSBG prüfen</Placeholder>
      </p>

      <h2>§ 12 Schlussbestimmungen</h2>
      <p>
        Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Bei Verbraucherinnen und Verbrauchern gilt diese Rechtswahl
        nur, soweit dadurch nicht der Schutz durch zwingende Bestimmungen des Rechts des Staates entzogen wird, in dem sie ihren gewöhnlichen Aufenthalt
        haben.
      </p>
    </LegalPage>
  );
}
