import Link from "next/link";
import { guides } from "@/data/guides";
import { faqItems } from "@/data/faq";
import { VisualImage } from "@/components/illustrations/VisualImage";
import { Reveal } from "@/components/motion/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";

export function GuidesTeaser() {
  const list = guides.slice(0, 3);
  return (
    <section className="cv-auto bg-paper pb-[var(--space-section)]" aria-labelledby="ratgeber-title" style={{ ["--cv-d" as string]: "765px", ["--cv-m" as string]: "1825px" }}>
      <div className="container-x">
        <SectionHeader
          id="ratgeber-title"
          label="Ratgeber"
          lines={["Gut informiert", "entscheiden."]}
          align="split"
          lead="Anmeldung, Montage, Speicher: die Regeln und Zusammenhänge, kurz und verständlich erklärt."
          actions={
            <ButtonLink href="/ratgeber" variant="outline" arrow>
              Alle Artikel
            </ButtonLink>
          }
        />
        <ul className="mt-12 grid gap-5 md:mt-16 md:grid-cols-3">
          {list.map((g, i) => (
            <Reveal as="li" key={g.slug} delay={i * 100}>
              <Link
                href={`/ratgeber/${g.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
              >
                <div className="sheen relative aspect-[16/9] max-w-full bg-[radial-gradient(120%_90%_at_30%_10%,#fff_0%,#eef1ef_75%)]">
                  <VisualImage visual={g.visual} className="absolute inset-[12%] h-[76%] w-[76%] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <p className="t-label">
                    {g.category} · {g.readingMinutes} Min.
                  </p>
                  <h3 className="t-h3 m-0">{g.title}</h3>
                  <p className="text-[15px] leading-relaxed text-muted">{g.excerpt}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold">
                    Weiterlesen <Icon name="arrow-right" size={16} className="transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FaqTeaser() {
  const items = faqItems.slice(0, 6).map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }));
  return (
    <section className="cv-auto section-y border-t border-line bg-paper" aria-labelledby="faq-title" style={{ ["--cv-d" as string]: "620px", ["--cv-m" as string]: "1060px" }}>
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeader
            id="faq-title"
            label="Häufige Fragen"
            lines={["Kurz erklärt."]}
            lead="Die wichtigsten Regeln für Balkonkraftwerke in Deutschland, dazu Antworten zu Bestellung und Versand."
            actions={
              <ButtonLink href="/faq" variant="dark" arrow>
                Alle Fragen
              </ButtonLink>
            }
          />
        </div>
        <Reveal delay={120} className="lg:col-span-7">
          <Accordion items={items} defaultOpen={items[0]?.id} />
        </Reveal>
      </div>
    </section>
  );
}
