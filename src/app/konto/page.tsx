import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/content/AccountShell";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Kundenkonto", robots: { index: false, follow: false } };

const areas = [
  { href: "/konto/bestellungen", title: "Bestellungen", text: "Status, Sendungsverfolgung und Rechnungen deiner Bestellungen." },
  { href: "/konto/adressen", title: "Adressen", text: "Rechnungs- und Lieferadressen für schnelleres Bestellen." },
  { href: "/konto/anmelden", title: "Anmelden", text: "Mit E-Mail und Passwort in dein Konto." },
  { href: "/konto/registrieren", title: "Konto anlegen", text: "Bestellungen und Sendungen an einem Ort verwalten." },
];

export default function AccountPage() {
  return (
    <AccountShell title="Übersicht" active="/konto" lead="Hier verwaltest du künftig Bestellungen, Adressen und Zugangsdaten.">
      <ul className="divide-y divide-line border-y border-line">
        {areas.map((a) => (
          <li key={a.href}>
            <Link href={a.href} className="group flex items-center justify-between gap-6 py-6">
              <span className="min-w-0">
                <span className="t-h3 block group-hover:underline group-hover:decoration-2 group-hover:underline-offset-[6px]">{a.title}</span>
                <span className="mt-1.5 block text-[15px] text-muted">{a.text}</span>
              </span>
              <Icon name="arrow-right" size={22} className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </AccountShell>
  );
}
