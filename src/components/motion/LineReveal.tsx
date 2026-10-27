"use client";

import { useEffect, useRef, type ElementType } from "react";

/**
 * Große Überschrift, deren Zeilen nacheinander aus einer Maske gleiten.
 * Zeilen werden explizit übergeben (wie gesetzt), damit der Umbruch gestaltet bleibt.
 * Ohne JavaScript oder bei reduzierter Bewegung ist der Text sofort sichtbar.
 */
interface Props {
  as?: ElementType;
  lines: string[];
  className?: string;
  delay?: number;
  id?: string;
  /** Sofort beim Laden starten statt beim Scrollen (z. B. im Hero) */
  immediate?: boolean;
}

export function LineReveal({ as: Tag = "h2", lines, className = "", delay = 0, id, immediate = false }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.documentElement.dataset.motion !== "on" || immediate) {
      requestAnimationFrame(() => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  return (
    <Tag ref={ref} id={id} className={`line-reveal ${className}`} style={{ ["--reveal-delay" as string]: `${delay}ms` }}>
      {lines.map((line, i) => (
        <span key={i} className="line" style={{ ["--line" as string]: i }}>
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
