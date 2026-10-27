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
      <section className="container-x grid gap-10 pb-24 pt-12 md:pb-32 md:pt-16 lg:grid-cols-12 lg:gap-16">
        <nav aria-label="Kundenkonto" className="min-w-0 lg:col-span-3">
          <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:block lg:overflow-visible lg:border-l lg:border-line lg:pb-0">
            {nav.map((n) => {
              const on = active === n.href;
              return (
                <li key={n.href} className="shrink-0">
                  <Link
                    href={n.href}
                    aria-current={on ? "page" : undefined}
                    className={`flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors lg:-ml-px lg:h-auto lg:rounded-none lg:border-0 lg:border-l-2 lg:py-2.5 lg:pl-4 lg:text-[15px] ${
                      on ? "border-ink bg-ink text-paper lg:border-ink lg:bg-transparent lg:text-ink" : "border-line text-muted hover:text-ink lg:border-transparent"
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0 lg:col-span-8 lg:col-start-5">
          <p className="t-label">Kundenkonto</p>
          <h1 className="t-h1 m-0 mt-5">{title}</h1>
          {lead && <p className="t-lead mt-6 max-w-[56ch]">{lead}</p>}
          <Notice tone="preview" title="Kundenkonten folgen mit dem Shop-Backend" className="mt-10 max-w-[64ch]">
            Anmeldung, Registrierung und Bestellübersicht werden freigeschaltet, sobald Benutzerverwaltung und Bestellsystem angebunden sind. Bis dahin
            werden hier keine Daten gespeichert.
          </Notice>
          <div className="mt-12">{children}</div>
        </div>
      </section>
    </>
  );
}
