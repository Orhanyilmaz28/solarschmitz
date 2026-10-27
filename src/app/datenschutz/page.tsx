import type { Metadata } from "next";
import { LegalPage } from "@/components/content/LegalPage";
import { Placeholder } from "@/components/content/Prose";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "Datenschutz", robots: { index: false, follow: true } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Datenschutzerklärung" intro="Welche Daten wir verarbeiten, wenn du die Website nutzt, uns schreibst oder bestellst, und welche Rechte du hast.">
      <h2>1. Verantwortlicher</h2>
      <p>
        {brand.legal.company ?? <Placeholder>Firmenname</Placeholder>}
        <br />
        {brand.contact.address ? (
          <>
            {brand.contact.address.street}, {brand.contact.address.zip} {brand.contact.address.city}
          </>
        ) : (
          <Placeholder>Anschrift</Placeholder>
        )}
        <br />
        Vertreten durch: {brand.legal.managingDirector ?? <Placeholder>Geschäftsführung</Placeholder>}
        <br />
        Telefon: {brand.contact.phone ?? <Placeholder>Telefonnummer</Placeholder>}
        <br />
        E-Mail: {brand.contact.email ?? <Placeholder>E-Mail-Adresse ergänzen</Placeholder>}
      </p>

      <h2>2. Hosting und Server-Logfiles</h2>
      <p>
        Beim Aufruf der Website verarbeitet der Hosting-Anbieter technisch notwendige Daten wie IP-Adresse, Zeitpunkt und aufgerufene Seite, um die
        Website auszuliefern und abzusichern (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <p>
        <Placeholder>Hosting-Anbieter, Serverstandort, Auftragsverarbeitungsvertrag und Speicherdauer ergänzen</Placeholder>
      </p>

      <h2>3. Lokale Speicherung im Browser</h2>
      <p>
        Warenkorb und Produktvergleich werden im lokalen Speicher deines Browsers (localStorage) abgelegt, damit sie beim nächsten Besuch erhalten
        bleiben. Diese Daten werden nicht an uns übertragen. Du kannst sie jederzeit über die Einstellungen deines Browsers löschen.
      </p>

      <h2>4. Kontaktformular und E-Mail</h2>
      <p>
        Wenn du uns schreibst, verarbeiten wir deine Angaben (Name, E-Mail-Adresse, Nachricht), um deine Anfrage zu beantworten (Art. 6 Abs. 1 lit.
        b bzw. f DSGVO).
      </p>
      <p>
        <Placeholder>Eingesetzten Dienst für die Zustellung der Nachrichten und Speicherdauer ergänzen</Placeholder>
      </p>

      <h2>5. Bestellungen und Weitergabe an Lieferanten</h2>
      <p>
        Zur Abwicklung einer Bestellung geben wir Name, Lieferadresse und gegebenenfalls Telefonnummer an den Lieferanten weiter, der die Ware
        versendet, sowie an das beauftragte Versandunternehmen (Art. 6 Abs. 1 lit. b DSGVO).
      </p>
      <p>
        Deine Angabe an der Kasse, ob die Voraussetzungen für den Nullsteuersatz erfüllt sind, speichern wir mit der Bestellung. Wir brauchen sie für
        die Rechnung und müssen sie gegenüber dem Finanzamt nachweisen können (Art. 6 Abs. 1 lit. c DSGVO).{" "}
        <Placeholder>Speicherung im Bestellsystem umsetzen</Placeholder>
      </p>
      <p>
        Solange die Kasse nicht freigeschaltet ist, werden Eingaben an der Kasse weder übertragen noch gespeichert.
      </p>
      <p>
        <Placeholder>Lieferanten, Zahlungsdienstleister und Versanddienstleister benennen</Placeholder>
      </p>

      <h2>6. Schriftarten</h2>
      <p>
        Die Schriftarten werden beim Erstellen der Website eingebunden und von unserem eigenen Server ausgeliefert. Beim Seitenaufruf wird keine
        Verbindung zu Servern von Google hergestellt.
      </p>

      <h2>7. Keine Analyse- und Werbedienste</h2>
      <p>
        Wir binden derzeit keine Dienste zur Reichweitenmessung, für Werbung oder für Tracking ein. Ändert sich das, ergänzen wir diese Erklärung vorher.
      </p>

      <h2>8. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht
        auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde.
      </p>
    </LegalPage>
  );
}
