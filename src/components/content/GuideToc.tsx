"use client";

import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  label: string;
}

/** Inhaltsverzeichnis für Artikel: markiert den Abschnitt, der gerade gelesen wird. */
export function GuideToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.3;
      let current = items[0]?.id;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= line) current = it.id;
      }
      // Am Seitenende den letzten Abschnitt markieren, auch wenn er kurz ist
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = items[items.length - 1]?.id;
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items]);

  return (
    <nav aria-label="Inhalt">
      <p className="t-label">Inhalt</p>
      <ol className="mt-4 border-l border-line">
        {items.map((it, i) => {
          const on = active === it.id;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={on ? "location" : undefined}
                className={`-ml-px flex gap-3 border-l-2 py-2.5 pl-4 text-[14.5px] leading-snug transition-colors duration-300 ${
                  on ? "border-ink font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                <span className="pt-[3px] font-mono text-[11px] font-normal text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span>{it.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
