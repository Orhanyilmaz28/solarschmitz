import type { Metadata } from "next";
import { AccountShell } from "@/components/content/AccountShell";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Bestellungen", robots: { index: false, follow: false } };

const statuses = [
  { label: "Eingegangen", text: "Wir haben deine Bestellung erhalten." },
  { label: "Bezahlt", text: "Die Zahlung ist bestätigt." },
  { label: "An Lieferant übergeben", text: "Der Lieferant bereitet den Versand vor." },
  { label: "Versendet", text: "Du bekommst die Sendungsnummer per E-Mail." },
  { label: "Zugestellt", text: "Die Sendung ist angekommen." },
];

export default function OrdersPage() {
  return (
    <AccountShell title="Bestellungen" active="/konto/bestellungen">
      <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-white px-6 py-12 text-center">
        <p className="display-md m-0 text-xl">Noch keine Bestellungen</p>
        <p className="mx-auto mt-3 max-w-[48ch] text-muted">Sobald Bestellungen möglich sind, siehst du hier Status und Sendungsverfolgung.</p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/produkte" variant="outline">
            Produkte ansehen
          </ButtonLink>
        </div>
      </div>

      <h2 className="eyebrow mb-5 mt-12">So siehst du später den Bestellstatus</h2>
      <ol className="grid gap-3 sm:grid-cols-5">
        {statuses.map((s, i) => (
          <li key={s.label} className="rounded-2xl border border-line bg-white p-4">
            <span className="font-mono text-xs text-lime-deep">{i + 1}</span>
            <p className="mt-1 text-sm font-semibold">{s.label}</p>
            <p className="mt-1 text-xs text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-muted">
        Enthält eine Bestellung Produkte verschiedener Lieferanten, kommen sie in getrennten Sendungen mit eigener Sendungsnummer.
      </p>
    </AccountShell>
  );
}
