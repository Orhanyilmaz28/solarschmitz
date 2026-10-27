import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Notice } from "./Notice";
import { Prose } from "./Prose";

interface Props {
  title: string;
  children: ReactNode;
  /** Als Entwurf markieren, bis der Text rechtlich geprüft ist */
  draft?: boolean;
  /** Stand des Textes */
  updated?: string;
  /** Kurze Einordnung unter der Überschrift */
  intro?: ReactNode;
}

/** Rahmen für Rechtstexte: links Titel und Status (mitlaufend), rechts gut lesbarer Text. */
export function LegalPage({ title, children, draft = true, updated = "Oktober 2026", intro }: Props) {
  return (
    <>
      <div className="container-x pt-8">
        <Breadcrumbs items={[{ label: title }]} />
      </div>
      <section className="container-x grid gap-12 pb-28 pt-12 md:pt-20 lg:grid-cols-12 lg:gap-16">
        <div className="min-w-0 lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="t-label">Rechtliches</p>
            <h1 className="t-h2 mt-5">{title}</h1>
            <p className="mt-4 font-mono text-xs text-muted">Stand: {updated}</p>
            {intro && <div className="mt-6 text-[15px] text-muted">{intro}</div>}
            {draft && (
              <Notice tone="draft" title="Entwurf – vor Livegang anwaltlich prüfen" className="mt-8">
                Vorlage mit den üblichen Pflichtangaben, noch nicht rechtlich geprüft. Gelb markierte Stellen müssen ergänzt werden.
              </Notice>
            )}
          </div>
        </div>
        <div className="min-w-0 lg:col-span-8">
          <Prose>{children}</Prose>
        </div>
      </section>
    </>
  );
}
