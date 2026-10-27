"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Zählt beim ersten Sichtbarwerden hoch. Ändert sich der Wert danach
 * (z. B. durch einen Regler), gleitet die Zahl vom aktuellen Stand zum neuen.
 * Der Server rendert den Endwert.
 */
export function CountUp({ value, decimals = 0, duration = 1400, prefix = "", suffix = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const current = useRef(value);
  const started = useRef(false);
  const fmt = (n: number) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

  useEffect(() => {
    const el = ref.current;
    let raf = 0;
    const animate = (from: number, to: number, ms: number) => {
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / ms);
        const v = from + (to - from) * (1 - Math.pow(1 - p, 4));
        current.current = v;
        setDisplay(v);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    if (!el || document.documentElement.dataset.motion !== "on") {
      current.current = value;
      setDisplay(value);
      return;
    }
    // Schon einmal gelaufen: weich zum neuen Wert
    if (started.current) {
      animate(current.current, value, 450);
      return () => cancelAnimationFrame(raf);
    }
    const rect = el.getBoundingClientRect();
    const visible = rect.top < window.innerHeight && rect.bottom > 0;
    if (visible) {
      started.current = true;
      animate(value * 0.6, value, duration);
      return () => cancelAnimationFrame(raf);
    }
    current.current = 0;
    setDisplay(0);
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        started.current = true;
        animate(0, value, duration);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={`tabular ${className ?? ""}`}>
      {prefix}
      {fmt(display)}
      {suffix}
    </span>
  );
}
