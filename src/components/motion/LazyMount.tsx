"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Rendert schwere, interaktive Bereiche erst kurz bevor sie ins Bild kommen.
 * Bis dahin steht ein leichter Platzhalter mit ähnlicher Höhe da (kein Layout-Sprung im Bild).
 * Spart beim ersten Laden JavaScript und Hydration.
 */
export function LazyMount({
  children,
  fallback,
  rootMargin = "900px 0px",
  className = "",
}: {
  children: ReactNode;
  fallback: ReactNode;
  rootMargin?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Direkter Sprung per Anker (z. B. #produktfinder) soll sofort den echten Inhalt zeigen
    if (location.hash && el.closest(location.hash.replace(/[^#\w-]/g, ""))) {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {show ? children : fallback}
    </div>
  );
}
