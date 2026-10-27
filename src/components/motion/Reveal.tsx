"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Blendet Inhalte beim Scrollen weich ein.
 * Ohne JavaScript oder bei "Bewegung reduzieren" bleibt alles sofort sichtbar:
 * Versteckt wird nur, wenn <html data-motion="on"> gesetzt ist (siehe layout.tsx).
 */
interface Props {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Versatz in px */
  y?: number;
  style?: CSSProperties;
}

export function Reveal({ as: Tag = "div", children, className = "", delay = 0, y = 28, style }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.documentElement.dataset.motion !== "on") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ ...style, ["--reveal-delay" as string]: `${delay}ms`, ["--reveal-y" as string]: `${y}px` }}
    >
      {children}
    </Tag>
  );
}
