"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Pausiert Dauer-Animationen in Abschnitten außerhalb des Bildes.
 * Jeder <section> in <main> bekommt data-inview="true|false"; CSS hält dann
 * alle Animationen darin an (siehe globals.css). Spart Rechenzeit und Akku.
 */
export function OffscreenPause() {
  const pathname = usePathname();
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main section"));
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => ((e.target as HTMLElement).dataset.inview = e.isIntersecting ? "true" : "false")),
      { rootMargin: "200px 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
