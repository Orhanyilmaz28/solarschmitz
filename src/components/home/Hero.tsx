"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { withGsap } from "@/lib/motion/gsap";
import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/motion/Magnetic";
import { Icon } from "@/components/ui/Icon";

/**
 * Cinematic Hero.
 * Choreografie (CSS, startet ohne JavaScript): Szene blendet ein → Überschrift
 * gleitet zeilenweise aus der Maske → Unterzeile und Buttons → Fenster gehen an,
 * Energielinie läuft durch die Szene → Scroll-Hinweis.
 * GSAP ergänzt nur Parallaxe beim Scrollen und mit der Maus.
 */
interface Props {
  /** Bild für Desktop (Foto über ArtImage oder Linienwerk-Szene) */
  art: ReactNode;
  /** Eigener Bildausschnitt für Handy */
  artMobile: ReactNode;
  facts: { value: string; label: string }[];
}

export function Hero({ art, artMobile, facts }: Props) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (document.documentElement.dataset.motion !== "on") return;
    return withGsap(({ gsap }) => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const depth: Record<string, number> = { sky: 0.08, sun: 0.22, ground: 0.18, house: 0.3, energy: 0.3 };
      Object.entries(depth).forEach(([layer, d]) => {
        gsap.to(q(`[data-layer='${layer}']`), {
          y: d * 240,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
        });
      });
      gsap.to(q("[data-hero-content]"), {
        y: -90,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom 25%", scrub: true },
      });
      if (window.matchMedia("(pointer: fine)").matches) {
        const movers = Object.entries(depth).map(([layer, d]) => ({
          x: gsap.quickTo(q(`[data-layer='${layer}']`), "x", { duration: 1.4, ease: "power3.out" }),
          d,
        }));
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          movers.forEach((m) => m.x(-nx * m.d * 70));
        };
        el.addEventListener("pointermove", onMove);
        return () => el.removeEventListener("pointermove", onMove);
      }
    }, el);
    return () => ctx.revert();
    });
  }, []);

  return (
    <section
      ref={root}
      data-header="dark"
      className="hero on-dark relative isolate flex min-h-[max(680px,100svh)] flex-col overflow-hidden bg-night text-paper"
      aria-labelledby="hero-title"
    >
      {/* Desktop: Bild füllt die Bühne */}
      <div className="hero-art absolute inset-0 -z-10 hidden md:block">{art}</div>

      <div data-hero-content className="container-x relative z-10 flex flex-1 flex-col pt-[calc(76px+48px)] md:justify-end md:pb-16 md:pt-[calc(76px+56px)]">
        <p className="hero-fade t-label !text-paper/60" style={{ ["--d" as string]: "0.15s" }}>
          Solartechnik für dein Zuhause
        </p>
        <h1 id="hero-title" className="hero-title t-hero m-0 mt-6 uppercase">
          <span className="line" style={{ ["--line" as string]: 0 }}>
            <span>Energie</span>
          </span>
          <span className="line" style={{ ["--line" as string]: 1 }}>
            <span>
              neu gedacht
              <span aria-hidden className="ml-[0.06em] inline-block h-[0.17em] w-[0.17em] rounded-full bg-[image:var(--sun-gradient)] align-baseline shadow-[0_0_0.35em_rgb(255_164_42/0.7)]" />
              <span className="sr-only">.</span>
            </span>
          </span>
        </h1>
        <p className="hero-fade mt-7 max-w-[34ch] text-lg leading-relaxed text-paper/75 md:text-xl" style={{ ["--d" as string]: "0.85s" }}>
          Dein Zuhause. Deine Energie. Deine Unabhängigkeit.
        </p>
        <div className="hero-fade mt-8 flex flex-wrap gap-3 md:mt-9" style={{ ["--d" as string]: "1.05s" }}>
          <Magnetic>
            <ButtonLink href="#produktwelt" variant="primary" size="lg" arrow>
              Solarlösung entdecken
            </ButtonLink>
          </Magnetic>
          <Magnetic>
            <ButtonLink href="#produktfinder" variant="outline-light" size="lg">
              Jetzt konfigurieren
            </ButtonLink>
          </Magnetic>
        </div>
      </div>

      {/* Handy: eigener Bildausschnitt unter dem Text */}
      <div aria-hidden className="hero-art relative -mt-10 h-[min(58svh,460px)] [mask-image:linear-gradient(to_bottom,transparent,#000_22%)] md:hidden">
        {artMobile}
      </div>

      <div className="hero-fade container-x relative pb-8 md:pb-10" style={{ ["--d" as string]: "1.3s", paddingBottom: "max(28px, env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex items-end justify-between gap-6 border-t border-paper/15 pt-5">
          <dl className="grid flex-1 grid-cols-3 gap-4 md:flex md:flex-none md:gap-12">
            {facts.map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="sr-only">{f.label}</dt>
                <dd className="t-num text-xl text-paper md:text-2xl">{f.value}</dd>
                <dd className="mt-1 text-xs leading-snug text-paper/55 md:text-sm">{f.label}</dd>
              </div>
            ))}
          </dl>
          <a href="#kapitel-sonne" className="hidden items-center gap-3 text-sm text-paper/60 transition-colors hover:text-paper md:flex">
            Entdecken
            <span className="relative grid h-11 w-11 place-items-center rounded-full border border-paper/20">
              <Icon name="arrow-down" size={18} className="hero-cue-arrow" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
