import Link from "next/link";
import { guides } from "@/data/guides";
import { faqItems } from "@/data/faq";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { Reveal } from "@/components/motion/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/Button";

export function GuidesTeaser() {
  const list = guides.slice(0, 3);
  return (
    <section className="bg-paper pb-24 md:pb-32" aria-labelledby="guides-title">
      <div className="container-x">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <p className="eyebrow">Ratgeber</p>
            <h2 id="guides-title" className="display-lg mt-4 text-[34px] md:text-[52px]">
              Gut informiert entscheiden.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <ButtonLink href="/ratgeber" variant="outline" arrow>
              Alle Artikel
            </ButtonLink>
          </Reveal>
        </div>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {list.map((g, i) => (
            <Reveal as="li" key={g.slug} delay={i * 100}>
              <Link href={`/ratgeber/${g.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                <div className="sheen relative aspect-[16/9] max-w-full bg-[radial-gradient(120%_90%_at_30%_10%,#fff_0%,#e9eef0_75%)]">
                  <ProductVisual visual={g.visual} className="absolute inset-[12%] h-[76%] w-[76%] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <p className="eyebrow !text-[11px]">
                    {g.category} · {g.readingMinutes} Min.
                  </p>
                  <h3 className="font-sans text-xl font-semibold leading-snug tracking-normal">{g.title}</h3>
                  <p className="text-[15px] text-muted">{g.excerpt}</p>
                  <span className="mt-auto pt-2 text-sm font-semibold text-lime-deep">Weiterlesen →</span>
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
    <section className="border-t border-line bg-paper py-24 md:py-32" aria-labelledby="faq-title">
      <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Reveal>
          <p className="eyebrow">Häufige Fragen</p>
          <h2 id="faq-title" className="display-lg mt-4 text-[34px] md:text-[52px]">
            Kurz erklärt.
          </h2>
          <p className="mt-5 max-w-md text-muted">Die wichtigsten Regeln für Balkonkraftwerke in Deutschland, plus Antworten zu Bestellung und Versand.</p>
          <div className="mt-8">
            <ButtonLink href="/faq" variant="dark" arrow>
              Alle Fragen
            </ButtonLink>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <Accordion items={items} defaultOpen={items[0]?.id} />
        </Reveal>
      </div>
    </section>
  );
}
