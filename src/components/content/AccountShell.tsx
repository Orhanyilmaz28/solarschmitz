import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Notice } from "./Notice";

const nav = [
  { href: "/konto", label: "Übersicht" },
  { href: "/konto/bestellungen", label: "Bestellungen" },
  { href: "/konto/adressen", label: "Adressen" },
  { href: "/konto/anmelden", label: "Anmelden" },
  { href: "/konto/registrieren", label: "Registrieren" },
];

/** Gemeinsamer Rahmen für die Kundenkonto-Seiten */
export function AccountShell({ title, active, children, lead }: { title: string; active: string; children: ReactNode; lead?: string }) {
  return (
    <>
      <div className="container-x pt-8">
        <Breadcrumbs items={[{ label: "Kundenkonto", href: "/konto" }, ...(active !== "/konto" ? [{ label: title }] : [])]} />
      </div>
      <section className="container-x grid gap-10 pb-24 pt-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <nav aria-label="Kundenkonto" className="min-w-0">
          <ul className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible">
            {nav.map((n) => (
              <li key={n.href} className="shrink-0">
                <Link
                  href={n.href}
                  aria-current={active === n.href ? "page" : undefined}
                  className={`block rounded-full px-4 py-2 text-sm font-semibold transition-colors lg:rounded-xl ${
                    active === n.href ? "bg-ink text-paper" : "text-muted hover:bg-mist hover:text-ink"
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          <p className="eyebrow">Kundenkonto</p>
          <h1 className="display-lg mt-3 text-[clamp(2rem,4.5vw,3.5rem)]">{title}</h1>
          {lead && <p className="mt-4 max-w-[60ch] text-lg text-muted">{lead}</p>}
          <Notice tone="preview" title="Kundenkonten folgen mit dem Shop-Backend" className="mt-8">
            Anmeldung, Registrierung und Bestellübersicht werden freigeschaltet, sobald Benutzerverwaltung und Bestellsystem angebunden sind. Bis dahin
            werden hier keine Daten gespeichert.
          </Notice>
          <div className="mt-10">{children}</div>
        </div>
      </section>
    </>
  );
}
