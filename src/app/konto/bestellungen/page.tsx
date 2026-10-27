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
      <div className="border-y border-line py-12">
        <p className="t-h3 m-0">Noch keine Bestellungen.</p>
        <p className="mt-3 max-w-[50ch] text-muted">Sobald Bestellungen möglich sind, siehst du hier Status und Sendungsverfolgung.</p>
        <ButtonLink href="/produkte" variant="outline" className="mt-7">
          Produkte ansehen
        </ButtonLink>
      </div>

      <h2 className="t-label mb-2 mt-16">So siehst du später den Bestellstatus</h2>
      <ol className="grid border-t border-line sm:grid-cols-5">
        {statuses.map((s, i) => (
          <li key={s.label} className="border-b border-line py-5 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
            <span className="font-mono text-[11px] tracking-[0.14em] text-muted">{String(i + 1).padStart(2, "0")}</span>
            <p className="mt-2 text-[15px] font-semibold leading-snug">{s.label}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-6 max-w-[64ch] text-sm text-muted">
        Enthält eine Bestellung Produkte verschiedener Lieferanten, kommen sie in getrennten Sendungen mit eigener Sendungsnummer.
      </p>
    </AccountShell>
  );
}
