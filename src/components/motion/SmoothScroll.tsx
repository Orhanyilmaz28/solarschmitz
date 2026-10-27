"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";
import { gsapIfLoaded, withGsap } from "@/lib/motion/gsap";

let lenisInstance: Lenis | null = null;
export function getLenis() {
  return lenisInstance;
}

/** Weiches Scrollen mit Lenis, gekoppelt an GSAP ScrollTrigger. Aus bei reduzierter Bewegung und Touch. */
export function SmoothScroll() {
  const pathname = usePathname();

  // Abschnitte mit content-visibility: auto bekommen erst beim Rendern ihre echte Höhe.
  // Dann Scroll-Positionen neu berechnen (gebündelt).
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const onCv = () => {
      clearTimeout(t);
      t = setTimeout(() => gsapIfLoaded()?.ScrollTrigger.refresh(), 150);
    };
    document.addEventListener("contentvisibilityautostatechange", onCv, true);
    return () => {
      clearTimeout(t);
      document.removeEventListener("contentvisibilityautostatechange", onCv, true);
    };
  }, []);

  // Lenis und GSAP werden nachgeladen, das erste Bild wartet nicht darauf
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;
    let lenis: Lenis | null = null;
    let cancelled = false;
    const stop = withGsap(({ gsap, ScrollTrigger }) => {
      let tick: ((time: number) => void) | null = null;
      import("lenis").then(({ default: LenisCtor }) => {
        if (cancelled) return;
        lenis = new LenisCtor({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 3.2), anchors: true });
        lenisInstance = lenis;
        lenis.on("scroll", ScrollTrigger.update);
        tick = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      });
      return () => {
        if (tick) gsap.ticker.remove(tick);
      };
    });
    return () => {
      cancelled = true;
      stop();
      lenis?.destroy();
      lenisInstance = null;
    };
  }, []);

  // Beim Seitenwechsel nach oben und Trigger neu berechnen
  useEffect(() => {
    lenisInstance?.scrollTo(0, { immediate: true });
    const id = requestAnimationFrame(() => gsapIfLoaded()?.ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
