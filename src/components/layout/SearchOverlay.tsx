"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { queryProducts } from "@/lib/catalog";
import { categories } from "@/data/categories";
import { VisualImage } from "@/components/illustrations/VisualImage";
import { PriceTag } from "@/components/shop/DataStatus";
import { getLenis } from "@/components/motion/SmoothScroll";

const suggestions = ["Speicher", "800 W", "Anker", "Halterung", "bifazial"];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const results = useMemo(() => (q.trim() ? queryProducts({ q }).slice(0, 6) : []), [q]);
  const catHits = useMemo(
    () => (q.trim() ? categories.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 3) : []),
    [q],
  );

  useEffect(() => {
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      setTimeout(() => input.current?.focus(), 50);
    } else lenis?.start();
  }, [open]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = () => {
    const hit = results[active];
    if (hit) router.push(`/produkt/${hit.slug}`);
    else if (q.trim()) router.push(`/suche?q=${encodeURIComponent(q.trim())}`);
    onClose();
  };

  return (
    <div aria-hidden={!open} className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-ink/55 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Produktsuche"
        data-lenis-prevent
        className={`relative mx-auto mt-[calc(12px+env(safe-area-inset-top,0px))] w-[calc(100%-24px)] max-w-2xl overflow-hidden rounded-3xl bg-paper shadow-[var(--shadow-lift)] transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] sm:mt-24 ${
          open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-center gap-3 border-b border-line px-5"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm7.5 13-3.6-3.6" />
          </svg>
          <input
            ref={input}
            id="site-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              }
            }}
            placeholder="Wonach suchst du? z. B. Speicher, 800 W, Halterung"
            className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
            aria-label="Produkte suchen"
            aria-controls="search-results"
            tabIndex={open ? 0 : -1}
          />
          <kbd className="hidden rounded-md border border-line px-2 py-0.5 font-mono text-xs text-muted sm:block">Esc</kbd>
        </form>
        <div id="search-results" className="max-h-[60vh] overflow-y-auto p-3">
          {!q.trim() && (
            <div className="p-3">
              <p className="eyebrow mb-3">Beliebte Suchen</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} type="button" tabIndex={open ? 0 : -1} onClick={() => setQ(s)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-ink">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {catHits.length > 0 && (
            <ul className="mb-2 flex flex-wrap gap-2 px-3 pt-2">
              {catHits.map((c) => (
                <li key={c.slug}>
                  <Link href={`/kategorie/${c.slug}`} onClick={onClose} tabIndex={open ? 0 : -1} className="chip bg-ink text-paper">
                    Kategorie: {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {q.trim() && results.length === 0 && (
            <p className="p-6 text-center text-muted">Keine Produkte gefunden. Versuch es mit einem anderen Begriff.</p>
          )}
          <ul>
            {results.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/produkt/${p.slug}`}
                  onClick={onClose}
                  onMouseEnter={() => setActive(i)}
                  tabIndex={open ? 0 : -1}
                  className={`grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-2xl p-2.5 ${i === active ? "bg-mist" : ""}`}
                >
                  <span className="h-16 w-16 rounded-xl bg-white p-1">
                    <VisualImage visual={p.visual} className="h-full w-full" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block truncate text-sm text-muted">{p.shortDescription}</span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <PriceTag product={p} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {q.trim() && results.length > 0 && (
            <Link href={`/suche?q=${encodeURIComponent(q.trim())}`} onClick={onClose} tabIndex={open ? 0 : -1} className="mt-2 block rounded-2xl p-3 text-center text-sm font-semibold hover:bg-mist">
              Alle Ergebnisse für „{q.trim()}“ anzeigen
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
