import type { Metadata } from "next";
import { LegalPage } from "@/components/content/LegalPage";
import { Placeholder } from "@/components/content/Prose";
import Link from "next/link";
import { brand } from "@/config/brand";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Widerrufsbelehrung", robots: { index: false, follow: true } };

export default function WithdrawalPage() {
  const { legal, contact } = brand;
  const company = legal.company ?? "[Firmenname]";
  const address = contact.address ? `${contact.address.street}, ${contact.address.zip} ${contact.address.city}` : "[Anschrift]";
  const formText = [
    `An ${company}, ${address}${contact.email ? `, E-Mail: ${contact.email}` : ""}:`,
    "",
    "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*):",
    "",
    "Bestellt am (*)/erhalten am (*):",
    "Name des/der Verbraucher(s):",
    "Anschrift des/der Verbraucher(s):",
    "Datum:",
    "",
    "(*) Unzutreffendes streichen.",
  ].join("\n");
  const mailto = contact.email ? `mailto:${contact.email}?subject=${encodeURIComponent("Widerruf")}&body=${encodeURIComponent(formText)}` : null;

  return (
    <LegalPage
      title="Widerrufsbelehrung"
      intro={
        <>
          Als Verbraucherin oder Verbraucher hast du ein gesetzliches Widerrufsrecht. Die Belehrung folgt dem gesetzlichen Mustertext und steht deshalb in
          der Sie-Form.
        </>
      }
    >
      <h2>Widerrufsrecht</h2>
      <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>
      <p>
        Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte
        Ware in Besitz genommen haben bzw. hat.{" "}
        <Placeholder>Variante für den Fristbeginn prüfen: eine Ware oder mehrere Waren in getrennten Lieferungen</Placeholder>
      </p>
      <p>
        Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({company}, {address}
        {contact.phone ? `, Telefon: ${contact.phone}` : ""}
        {contact.email ? `, E-Mail: ${contact.email}` : ""}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail)
        über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch
        nicht vorgeschrieben ist.
      </p>
      <p>
        Sie können Ihren Widerruf auch über unsere Widerrufsfunktion erklären: Schaltfläche „Vertrag widerrufen“ in der Fußzeile jeder Seite oder direkt
        unter{" "}
        <Link href="/vertrag-widerrufen" className="font-semibold underline underline-offset-4">
          {(site.url ?? "").replace(/^https?:\/\//, "")}/vertrag-widerrufen
        </Link>
        . Den Eingang bestätigen wir Ihnen unverzüglich per E-Mail.{" "}
        <Placeholder>Wortlaut mit Gestaltungshinweis 3 der amtlichen Muster-Widerrufsbelehrung in der Fassung ab 19. Juni 2026 abgleichen</Placeholder>
      </p>
      <p>
        Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist
        absenden.
      </p>

      <h2>Folgen des Widerrufs</h2>
      <p>
        Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit
        Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste
        Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren
        Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen
        Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser
        Rückzahlung Entgelte berechnet.
      </p>
      <p>
        Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren
        zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.
      </p>
      <p>
        Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags
        unterrichten, an uns zurückzusenden oder zu übergeben.{" "}
        <Placeholder>Rücksendeadresse festlegen: eigene Anschrift oder die des jeweiligen Lieferanten (Dropshipping)</Placeholder> Die Frist ist gewahrt,
        wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.
      </p>
      <p>
        Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.{" "}
        <Placeholder>Für Waren, die nicht normal mit der Post zurückgesandt werden können (Speditionsware), Kostenangabe nach Gestaltungshinweis 5 ergänzen, z. B. „Die Kosten werden auf höchstens etwa … EUR geschätzt.“</Placeholder>
      </p>
      <p>
        Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit,
        Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.
      </p>

      <h2 id="formular">Muster-Widerrufsformular</h2>
      <p>(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)</p>
      <div role="group" aria-label="Muster-Widerrufsformular" className="mt-6 rounded-2xl border border-line bg-white p-6 text-[15.5px] leading-relaxed text-ink md:p-8">
        <div className="space-y-5">
          <div>
            An {company}, {address}
            {contact.email ? `, E-Mail: ${contact.email}` : ""}:
          </div>
          <div>
            Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden
            Dienstleistung (*)
            <span aria-hidden className="mt-4 block h-px bg-line" />
          </div>
          {["Bestellt am (*)/erhalten am (*)", "Name des/der Verbraucher(s)", "Anschrift des/der Verbraucher(s)", "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)", "Datum"].map(
            (label) => (
              <div key={label}>
                {label}
                <span aria-hidden className="mt-4 block h-px bg-line" />
              </div>
            ),
          )}
        </div>
        <div className="mt-6 text-sm text-muted">(*) Unzutreffendes streichen.</div>
      </div>
      {mailto && (
        <p>
          Am einfachsten per E-Mail: <a href={mailto}>Widerruf als E-Mail vorbereiten</a>. Die Vorlage öffnet sich in deinem E-Mail-Programm, du ergänzt
          nur noch deine Angaben.
        </p>
      )}
    </LegalPage>
  );
}
