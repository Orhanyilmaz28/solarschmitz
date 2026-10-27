"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /** Maximale Neigung in Grad */
  max?: number;
  /** Maximale Verschiebung in px */
  shift?: number;
  /** Bewegung auf dem nächsten Vorfahren mit diesem Selektor verfolgen (z. B. die ganze Karte) */
  track?: string;
  style?: CSSProperties;
}

/**
 * Leichte Neigung der Zeichnung zur Maus.
 * Nur bei feinem Zeiger (Maus, Trackpad) und ohne „Bewegung reduzieren“.
 */
export function TiltMedia({ children, className = "", max = 4, shift = 6, track, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine || document.documentElement.dataset.motion !== "on") return;
    const host = (track ? el.closest<HTMLElement>(track) : null) ?? el;
    let raf = 0;
    let nx = 0;
    let ny = 0;
    const apply = () => {
      raf = 0;
      el.style.transform = `perspective(1100px) rotateX(${(-ny * max).toFixed(2)}deg) rotateY(${(nx * max).toFixed(2)}deg) translate3d(${(nx * shift).toFixed(1)}px, ${(ny * shift).toFixed(1)}px, 0)`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const r = el.getBoundingClientRect();
      nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      schedule();
    };
    const onLeave = () => {
      nx = 0;
      ny = 0;
      schedule();
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [max, shift, track]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ transition: "transform 0.9s var(--ease-out-expo)", ...style }}
    >
      {children}
    </div>
  );
}
