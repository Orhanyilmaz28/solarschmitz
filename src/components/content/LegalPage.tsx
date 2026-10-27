import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Notice } from "./Notice";
import { Prose } from "./Prose";

/** Rahmen für Rechtstexte: deutlich als Entwurf markiert, bis sie geprüft sind */
export function LegalPage({ title, children, draft = true }: { title: string; children: ReactNode; draft?: boolean }) {
  return (
    <>
      <div className="container-x pt-8">
        <Breadcrumbs items={[{ label: title }]} />
      </div>
      <section className="container-x pb-24 pt-10">
        <h1 className="display-lg m-0 text-[clamp(2.25rem,5vw,3.75rem)]">{title}</h1>
        {draft && (
          <Notice tone="draft" title="Entwurf – vor Livegang anwaltlich prüfen" className="mt-8 max-w-3xl">
            Dieser Text ist eine Vorlage mit den üblichen Pflichtangaben. Er ist noch nicht vollständig und nicht rechtlich geprüft. Gelb markierte
            Stellen müssen ergänzt werden.
          </Notice>
        )}
        <div className="mt-12">
          <Prose>{children}</Prose>
        </div>
      </section>
    </>
  );
}
