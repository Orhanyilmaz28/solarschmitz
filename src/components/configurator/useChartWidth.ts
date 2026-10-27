"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Misst die verfügbare Breite eines Diagramms. Die SVGs zeichnen damit in echter
 * Pixelgröße: Beschriftungen bleiben auf dem Handy so groß wie auf dem Desktop,
 * statt mit dem ganzen Bild zu schrumpfen.
 */
export function useChartWidth<T extends HTMLElement = HTMLDivElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // clientWidth ignoriert Transformationen (z. B. die Einblend-Animation der Schritte)
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width] as const;
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
