import type { Metadata } from "next";
import { LegalPage } from "@/components/content/LegalPage";
import { Placeholder } from "@/components/content/Prose";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "Impressum", robots: { index: false, follow: true } };

function Value({ value, label }: { value: string | null | undefined; label: string }) {
  return value ? <>{value}</> : <Placeholder>{label} ergänzen</Placeholder>;
}

export default function ImprintPage() {
  const { legal, contact } = brand;
  return (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        <Value value={legal.company} label="Firmenname mit Rechtsform" />
        <br />
        {contact.address ? (
          <>
            {contact.address.street}
            <br />
            {contact.address.zip} {contact.address.city}
          </>
        ) : (
          <Placeholder>Straße, PLZ und Ort ergänzen</Placeholder>
        )}
      </p>

      <h2>Vertreten durch</h2>
      <p>
        <Value value={legal.managingDirector} label="Geschäftsführung / Inhaber" />
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: {contact.email}
        <br />
        Telefon: <Value value={contact.phone} label="Telefonnummer" />
      </p>

      <h2>Registereintrag</h2>
      <p>
        <Value value={legal.register} label="Registergericht und Registernummer (falls vorhanden)" />
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: <Value value={legal.vatId} label="USt-IdNr." />
      </p>

      <h2>Registrierungen nach ElektroG, BattDG und VerpackG</h2>
      <p>
        Als Händler von Elektrogeräten, Batterien und verpackter Ware können Registrierungspflichten bestehen, z. B. bei der Stiftung EAR und im
        Verpackungsregister LUCID. Bei Dropshipping muss geklärt sein, wer diese Pflichten erfüllt.
      </p>
      <p>
        <Placeholder>WEEE-Reg.-Nr., Batterie-Registrierung und LUCID-Nummer ergänzen oder Verweis auf den Lieferanten</Placeholder>
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.{" "}
        <Placeholder>Formulierung prüfen</Placeholder>
      </p>

      <h2>Verantwortlich für den Inhalt</h2>
      <p>
        <Placeholder>Name und Anschrift nach § 18 Abs. 2 MStV</Placeholder>
      </p>
    </LegalPage>
  );
}
