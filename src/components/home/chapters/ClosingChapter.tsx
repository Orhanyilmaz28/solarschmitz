"use client";

import { useEffect, useRef } from "react";
import { withGsap } from "@/lib/motion/gsap";
import { LineReveal } from "@/components/motion/LineReveal";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { ButtonLink } from "@/components/ui/Button";
import { brand } from "@/config/brand";
import css from "./closing-chapter.module.css";

/**
 * Kapitel 5 – Abschluss.
 * Nach dem Tag aus Kapitel 1 und der Nacht aus Kapitel 3 beginnt hier der nächste
 * Morgen: Beim Hineinscrollen geht eine große Sonne über dem Horizont auf.
 */

/** Perspektivisches Bodenraster bis zum Horizont (Bildraum 1600 × 400) */
function groundLines() {
  const w = 1600;
  const h = 400;
  const vx = w / 2;
  const lines: string[] = [];
  for (let i = -14; i <= 14; i++) {
    const x = vx + i * 150;
    lines.push(`M${vx + i * 6} 0L${x} ${h}`);
  }
  for (let k = 1; k <= 9; k++) {
    const y = Math.round(h * Math.pow(k / 9, 2.2));
    lines.push(`M0 ${y}L${w} ${y}`);
  }
  return lines.join("");
}

export function ClosingChapter({ id = "kapitel-morgen", label = "Kapitel 5" }: { id?: string; label?: string }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || document.documentElement.dataset.motion !== "on") return;
    return withGsap(({ gsap }) => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "top 85%", end: "bottom bottom", scrub: 0.6 },
      });
      tl.fromTo("[data-sun]", { yPercent: 38, scale: 0.92 }, { yPercent: 0, scale: 1 }, 0)
        .fromTo("[data-glow]", { opacity: 0.15 }, { opacity: 1 }, 0)
        .fromTo("[data-rays]", { opacity: 0 }, { opacity: 1 }, 0.25)
        .fromTo("[data-sky]", { opacity: 0 }, { opacity: 1 }, 0);
    }, el);
    return () => ctx.revert();
    });
  }, []);

  const phone = brand.contact.phone;
  return (
    <section id={id} ref={root} data-header="dark" className={`on-dark ${css.section}`} aria-labelledby={`${id}-title`}>
      {/* Himmel und Sonne */}
      <div aria-hidden className={css.art}>
        <div className={css.sky} data-sky />
        <div className={css.glow} data-glow />
        <div className={css.sunWrap} data-sun>
          <div className={`hero-rays ${css.rays}`} data-rays style={{ ["--sx" as string]: "50%", ["--sy" as string]: "50%" }} />
          <div className={css.sun} />
        </div>
        <div className={css.ground}>
          <svg viewBox="0 0 1600 400" preserveAspectRatio="none" className={css.grid}>
            <path d={groundLines()} fill="none" stroke="#F8FAF7" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className={css.horizon} />
      </div>

      <div className={`container-x ${css.content}`}>
        <Reveal as="p" className="t-label">
          {label} · Morgen
        </Reveal>
        <LineReveal as="h2" id={`${id}-title`} lines={["Morgen geht die Sonne", "wieder auf."]} className={`t-display m-0 mt-6 ${css.title}`} />
        <LineReveal as="p" lines={["Diesmal für dich."]} delay={180} className={`t-display m-0 ${css.title} ${css.sunText}`} />
        <Reveal delay={200} className={`t-lead mx-auto mt-8 max-w-[52ch] ${css.lead}`}>
          In drei Fragen zur passenden Anlage für Balkon, Dach oder Garten. Oder du erzählst uns von deinem Zuhause, und wir beraten dich persönlich.
        </Reveal>
        <Reveal delay={280} className="mt-10 flex flex-wrap justify-center gap-3">
          <Magnetic>
            <ButtonLink href="/konfigurator" variant="primary" size="lg" arrow>
              Jetzt konfigurieren
            </ButtonLink>
          </Magnetic>
          <Magnetic>
            <ButtonLink href="/kontakt" variant="outline-light" size="lg">
              Beratung anfragen
            </ButtonLink>
          </Magnetic>
        </Reveal>
        {phone && (
          <Reveal delay={340} as="p" className={css.contact}>
            Lieber direkt sprechen?{" "}
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-semibold text-paper underline decoration-paper/30 underline-offset-4 hover:decoration-paper">
              {phone}
            </a>
            {brand.contact.hours && <span className="text-paper/50"> · {brand.contact.hours}</span>}
          </Reveal>
        )}
      </div>
    </section>
  );
}
