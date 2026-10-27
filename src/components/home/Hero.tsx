"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { brand } from "@/config/brand";
import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/motion/Magnetic";
import { HeroScene } from "./HeroScene";

const lines = [
  ["DEINE", "ENERGIE"],
  ["DEINE", "ZUKUNFT"],
];

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduce) return;
      const q = gsap.utils.selector(el);

      // Auftritt
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(q("[data-scene]"), { scale: 1.12, filter: "brightness(0.55)", duration: 2.6, ease: "power3.out" }, 0)
        .from(q("[data-layer='sun']"), { y: 90, duration: 2.8, ease: "power2.out" }, 0)
        .from(q("[data-window]"), { opacity: 0, duration: 0.5, stagger: { each: 0.18, from: "random" }, ease: "steps(3)" }, 0.9)
        .from(q("[data-word]"), { yPercent: 115, rotate: 4, duration: 1.3, stagger: 0.09 }, 0.35)
        .from(q("[data-dot]"), { scale: 0, duration: 0.8, stagger: 0.25, ease: "back.out(3)" }, 1.1)
        .from(q("[data-underline]"), { scaleX: 0, duration: 1.2, ease: "expo.inOut" }, 1.3)
        .from(q("[data-fade]"), { y: 26, opacity: 0, duration: 1.1, stagger: 0.12 }, 0.9)
        .from(q("[data-rays]"), { opacity: 0, duration: 2.4, ease: "sine.out" }, 0.6);

      // Lichtreflex wandert über das Solardach
      gsap.fromTo(q("[data-sweep]"), { x: -200 }, { x: 900, duration: 3.6, ease: "sine.inOut", repeat: -1, repeatDelay: 2.4, delay: 2 });

      // Parallax beim Scrollen
      const depth: Record<string, number> = { sky: 0.05, sun: 0.22, far: 0.12, mid: 0.2, house: 0.3, front: 0.42 };
      Object.entries(depth).forEach(([layer, d]) => {
        gsap.to(q(`[data-layer='${layer}']`), {
          y: d * 260,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
        });
      });
      gsap.to(q("[data-content]"), {
        y: -80,
        opacity: 0.1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom 20%", scrub: true },
      });

      // Leichte Bewegung mit der Maus
      if (window.matchMedia("(pointer: fine)").matches) {
        const movers = Object.keys(depth).map((layer) => ({
          x: gsap.quickTo(q(`[data-layer='${layer}']`), "x", { duration: 1.2, ease: "power3.out" }),
          d: depth[layer]!,
        }));
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          movers.forEach((m) => m.x(-nx * m.d * 60));
        };
        el.addEventListener("pointermove", onMove);
        return () => el.removeEventListener("pointermove", onMove);
      }
    }, el);
    return () => ctx.revert();
  }, []);

  const photo = brand.media.hero;

  return (
    <section ref={root} className="on-dark relative isolate flex min-h-[max(680px,100svh)] flex-col overflow-hidden bg-ink text-paper" aria-labelledby="hero-title">
      {/* Bild oder gezeichnete Szene */}
      <div data-scene className="absolute inset-0 -z-10 origin-[70%_60%]">
        {photo ? (
          <>
            <Image src={photo.src} alt={photo.alt} fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(10_17_24/0.8)_0%,rgb(10_17_24/0.2)_60%),linear-gradient(0deg,rgb(16_24_32/0.9)_0%,transparent_35%)]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#0A1118_0%,#17212B_40%,#3a2f33_62%,#15171b_78%,#101820_100%)] md:hidden" />
            <HeroScene idPrefix="d" className="absolute inset-0 hidden h-full w-full md:block" />
          </>
        )}
        {/* Sonnenstrahlen */}
        <div
          data-rays
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-screen motion-safe:animate-[rays_90s_linear_infinite]"
          style={{
            background:
              "repeating-conic-gradient(from var(--ray-angle) at 74% 54%, rgb(255 214 150 / 0.11) 0deg 3deg, transparent 3deg 11deg)",
            maskImage: "radial-gradient(circle at 74% 54%, #000 0%, transparent 62%)",
            WebkitMaskImage: "radial-gradient(circle at 74% 54%, #000 0%, transparent 62%)",
          }}
        />
        {/* Feine Lichtpartikel */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_30%,rgb(255_220_160/0.5)_0_1px,transparent_2px),radial-gradient(circle_at_70%_20%,rgb(255_220_160/0.4)_0_1px,transparent_2px),radial-gradient(circle_at_40%_60%,rgb(255_220_160/0.35)_0_1px,transparent_2px),radial-gradient(circle_at_85%_45%,rgb(255_220_160/0.45)_0_1.5px,transparent_2.5px)] motion-safe:animate-[drift_18s_ease-in-out_infinite_alternate]" />
      </div>

      <div data-content className="container-x relative flex flex-col justify-start pb-6 pt-[calc(76px+40px)] md:flex-1 md:justify-center md:pb-36 md:pt-[calc(76px+40px)]">
        <p data-fade className="eyebrow mb-6 !text-paper/70">
          Balkonkraftwerke · Speicher · Solarmodule
        </p>
        <h1 id="hero-title" className="display-xl m-0 text-[min(9.2vw,52px)] md:text-[clamp(44px,7.4vw,118px)]">
          {lines.map((words, li) => (
            <span key={li} className="block whitespace-nowrap">
              {words.map((w, wi) => (
                <span key={wi} className="mr-[0.22em] inline-block overflow-hidden pb-[0.06em] align-bottom last:mr-0">
                  <span data-word className="relative inline-block will-change-transform">
                    {w}
                    {wi === words.length - 1 && (
                      <span data-dot className="inline-block origin-bottom text-lime">
                        .
                      </span>
                    )}
                    {li === 1 && wi === 1 && (
                      <span data-underline aria-hidden className="absolute -bottom-[0.04em] left-0 h-[0.07em] w-[calc(100%-0.35em)] origin-left rounded-full bg-lime" />
                    )}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </h1>
        <p data-fade className="mt-7 max-w-xl text-lg leading-relaxed text-paper/80 md:text-xl">
          Erzeuge deinen eigenen Strom. Spare Energiekosten. Gewinne Unabhängigkeit.
        </p>
        <div data-fade className="mt-10 flex flex-wrap gap-3">
          <Magnetic>
            <ButtonLink href="#kategorien" variant="primary" size="lg" arrow>
              Solarlösungen entdecken
            </ButtonLink>
          </Magnetic>
          <Magnetic>
            <ButtonLink href="#produktfinder" variant="outline-light" size="lg">
              Meine Solaranlage finden
            </ButtonLink>
          </Magnetic>
        </div>
      </div>

      {!photo && (
        <div aria-hidden className="relative -mt-2 h-[300px] flex-1 md:hidden">
          <HeroScene idPrefix="m" viewBox="900 420 720 540" align="xMidYMin slice" className="absolute inset-0 h-full w-full" />
        </div>
      )}

      {/* Fakten und Scroll-Hinweis */}
      <div data-fade className="container-x relative pb-8" style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <dl className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
            {[
              ["800 W", "Einspeisung erlaubt"],
              ["2.000 Wp", "Modulleistung möglich"],
              ["0 %", "MwSt. auf Solartechnik"],
            ].map(([v, l]) => (
              <div key={l} className="border-l border-paper/25 pl-4">
                <dt className="sr-only">{l}</dt>
                <dd className="font-sans text-2xl font-bold">{v}</dd>
                <dd className="text-paper/65">{l}</dd>
              </div>
            ))}
          </dl>
          <a href="#kategorien" className="group hidden items-center gap-3 text-sm text-paper/70 hover:text-paper md:flex" aria-label="Nach unten scrollen">
            Scrollen
            <span className="relative block h-12 w-[1.5px] overflow-hidden rounded-full bg-paper/25">
              <span className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-lime motion-safe:animate-[scrollcue_1.8s_var(--ease-in-out-soft)_infinite]" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
