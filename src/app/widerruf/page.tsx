import type { Metadata } from "next";
import { LegalPage } from "@/components/content/LegalPage";
import { Placeholder } from "@/components/content/Prose";
import { brand } from "@/config/brand";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Widerrufsbelehrung", robots: { index: false, follow: true } };

export default function WithdrawalPage() {
  const { legal, contact } = brand;
  return (
    <LegalPage title="Widerrufsbelehrung">
      <h2>Widerrufsrecht</h2>
      <p>
        Du hast das Recht, binnen {site.withdrawalDays} Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt{" "}
        {site.withdrawalDays} Tage ab dem Tag, an dem du oder ein von dir benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz
        genommen hast bzw. hat. Bei mehreren Waren in getrennten Lieferungen beginnt die Frist mit Erhalt der letzten Ware.
      </p>
      <p>
        Um dein Widerrufsrecht auszuüben, musst du uns ({legal.company ?? <Placeholder>Firmenname</Placeholder>},{" "}
        {contact.address ? `${contact.address.street}, ${contact.address.zip} ${contact.address.city}` : <Placeholder>Anschrift</Placeholder>},
        Telefon: {contact.phone ?? <Placeholder>Telefon</Placeholder>}, E-Mail: {contact.email ?? <Placeholder>E-Mail-Adresse</Placeholder>}) mittels einer eindeutigen Erklärung (z. B. per E-Mail oder Brief) über deinen Entschluss informieren, diesen Vertrag
        zu widerrufen.
      </p>

      <h2>Folgen des Widerrufs</h2>
      <p>
        <Placeholder>Gesetzlichen Mustertext nach Anlage 1 zu Art. 246a § 1 Abs. 2 EGBGB einsetzen, inkl. Regelung zu Rücksendekosten und Speditionsware</Placeholder>
      </p>

      <h2>Rücksendeadresse</h2>
      <p>
        Bei Dropshipping kann die Rücksendeadresse je nach Lieferant abweichen. Wir teilen sie dir nach Eingang deines Widerrufs mit.{" "}
        <Placeholder>Verfahren mit Lieferanten abstimmen</Placeholder>
      </p>

      <h2>Muster-Widerrufsformular</h2>
      <p>
        <Placeholder>Muster-Widerrufsformular nach Anlage 2 zu Art. 246a § 1 Abs. 2 Satz 1 Nr. 1 EGBGB einsetzen</Placeholder>
      </p>
    </LegalPage>
  );
}
