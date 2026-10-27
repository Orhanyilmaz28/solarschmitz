import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/content/AccountShell";

export const metadata: Metadata = { title: "Kundenkonto", robots: { index: false, follow: false } };

const areas = [
  { href: "/konto/bestellungen", title: "Bestellungen", text: "Status, Sendungsverfolgung und Rechnungen deiner Bestellungen." },
  { href: "/konto/adressen", title: "Adressen", text: "Rechnungs- und Lieferadressen für schnelleres Bestellen." },
  { href: "/konto/anmelden", title: "Anmelden", text: "Mit E-Mail und Passwort in dein Konto." },
  { href: "/konto/registrieren", title: "Konto anlegen", text: "Konto erstellen und Bestellungen an einem Ort verwalten." },
];

export default function AccountPage() {
  return (
    <AccountShell title="Übersicht" active="/konto" lead="Hier verwaltest du künftig Bestellungen, Adressen und Zugangsdaten.">
      <ul className="grid gap-4 sm:grid-cols-2">
        {areas.map((a) => (
          <li key={a.href}>
            <Link href={a.href} className="group block h-full rounded-[var(--radius-card)] border border-line bg-white p-6 transition-colors hover:border-ink">
              <p className="font-semibold">{a.title}</p>
              <p className="mt-2 text-sm text-muted">{a.text}</p>
              <span className="mt-4 inline-block text-sm font-semibold underline decoration-lime decoration-2 underline-offset-4">Öffnen</span>
            </Link>
          </li>
        ))}
      </ul>
    </AccountShell>
  );
}
