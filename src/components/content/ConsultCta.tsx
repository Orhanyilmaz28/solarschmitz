import { ButtonLink } from "@/components/ui/Button";

/** Dunkler Abschluss-Block: Produktfinder oder persönliche Beratung */
export function ConsultCta({ title = "Unsicher, was zu dir passt?", text }: { title?: string; text?: string }) {
  return (
    <section className="on-dark bg-ink text-paper">
      <div className="container-x grid gap-8 py-16 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:py-20">
        <div className="min-w-0">
          <p className="eyebrow mb-3">Kaufberatung</p>
          <h2 className="display-md m-0 text-[clamp(1.75rem,3.5vw,2.75rem)]">{title}</h2>
          <p className="mt-4 max-w-[56ch] text-muted-dark">
            {text ??
              "Der Produktfinder schlägt dir nach sechs kurzen Fragen passende Produkte vor und rechnet deine Ersparnis durch. Wenn danach Fragen offen sind, schreib uns."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/konfigurator" variant="primary" size="lg" arrow>
            Produktfinder starten
          </ButtonLink>
          <ButtonLink href="/kontakt" variant="outline-light" size="lg">
            Beratung anfragen
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
