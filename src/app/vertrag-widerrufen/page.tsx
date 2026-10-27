import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/PageHeader";
import { WithdrawalForm } from "@/components/content/WithdrawalForm";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Vertrag widerrufen",
  description: "Widerrufe online einen Vertrag, den du bei Sonnenwerk geschlossen hast. Du bekommst eine Eingangsbestätigung per E-Mail.",
  robots: { index: false, follow: true },
};

export default function VertragWiderrufenPage() {
  return (
    <div className="bg-paper">
      <PageHeader
        eyebrow="Widerrufsfunktion"
        titleLines={["Vertrag", "widerrufen."]}
        lead={`Hier kannst du einen online bei uns geschlossenen Vertrag innerhalb der Widerrufsfrist von ${site.withdrawalDays} Tagen widerrufen. Wir fragen nur, was wir zur Zuordnung brauchen.`}
        crumbs={[{ label: "Vertrag widerrufen" }]}
      />
      <section className="container-x grid gap-12 pb-24 pt-12 md:pb-32 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <WithdrawalForm />
        </div>
        <aside className="space-y-5 text-[15px] leading-relaxed text-muted lg:col-span-5">
          <h2 className="t-h3 m-0 text-ink">So läuft es ab</h2>
          <ol className="list-decimal space-y-2 pl-5 marker:text-sun-3">
            <li>Name, Bestellnummer und E-Mail eintragen, bei Bedarf die Artikel für einen Teilwiderruf.</li>
            <li>Auf „Widerruf bestätigen“ klicken. Damit ist der Widerruf erklärt.</li>
            <li>Du bekommst eine Eingangsbestätigung mit Inhalt, Datum und Uhrzeit per E-Mail.</li>
          </ol>
          <p>
            Wie Rücksendung und Rückzahlung ablaufen, steht in der{" "}
            <Link href="/widerruf" className="font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
              Widerrufsbelehrung
            </Link>
            . Du kannst auch weiterhin per Brief oder E-Mail widerrufen.
          </p>
        </aside>
      </section>
    </div>
  );
}
