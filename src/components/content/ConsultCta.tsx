import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { brand } from "@/config/brand";

interface Props {
  title?: string;
  text?: string;
  label?: string;
}

/**
 * Ruhiger, dunkler Abschluss einer Seite: Produktfinder oder persönliche Beratung.
 * Pro Seite höchstens einmal einsetzen.
 */
export function ConsultCta({ title = "Unsicher, was zu dir passt?", text, label = "Kaufberatung" }: Props) {
  const { contact } = brand;
  return (
    <section className="on-dark relative isolate overflow-hidden bg-night text-paper" aria-labelledby="consult-title">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-48 top-1/2 -z-10 h-[620px] w-[620px] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_164_42/0.2),transparent)]"
      />
      <div className="container-x grid gap-12 py-20 md:py-28 lg:grid-cols-12 lg:items-end">
        <div className="min-w-0 lg:col-span-7">
          <Reveal as="p" className="t-label" y={12}>
            {label}
          </Reveal>
          <Reveal y={20} delay={60}>
            <h2 id="consult-title" className="t-h1 mt-5">
              {title}
            </h2>
          </Reveal>
          <Reveal y={16} delay={120}>
            <p className="t-lead mt-6 max-w-[52ch]">
              {text ??
                "Der Produktfinder schlägt dir in wenigen Schritten passende Sets vor und rechnet deine Ersparnis mit offenen Annahmen durch. Bleiben Fragen, sprich direkt mit uns."}
            </p>
          </Reveal>
        </div>
        <Reveal y={16} delay={180} className="min-w-0 lg:col-span-5">
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink href="/konfigurator" variant="primary" size="lg" arrow>
              Produktfinder starten
            </ButtonLink>
            <ButtonLink href="/kontakt" variant="outline-light" size="lg">
              Beratung anfragen
            </ButtonLink>
          </div>
          {(contact.phone || contact.email) && (
            <dl className="mt-8 grid gap-3 border-t border-ink-line pt-6 text-sm sm:grid-cols-2 lg:text-right">
              {contact.phone && (
                <div className="min-w-0">
                  <dt className="t-label !text-[10.5px]">Telefon · {contact.hours}</dt>
                  <dd className="mt-1.5">
                    <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 font-semibold hover:text-sun-1">
                      <Icon name="phone" size={16} />
                      {contact.phone}
                    </a>
                  </dd>
                </div>
              )}
              {contact.email && (
                <div className="min-w-0">
                  <dt className="t-label !text-[10.5px]">E-Mail</dt>
                  <dd className="mt-1.5">
                    <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 font-semibold hover:text-sun-1">
                      <Icon name="mail" size={16} />
                      {contact.email}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </Reveal>
      </div>
    </section>
  );
}
