"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useCompare } from "@/lib/compare/store";
import { getProductById } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/config/site";
import { DataStatusChip, PriceTag } from "./DataStatus";
import { AddToCartButton } from "./ProductActions";
import { ProductThumb } from "./ProductMedia";
import { baseRows, specRows, type SpecRow } from "./specRows";
import { nb } from "./typo";

/**
 * Vergleichstabelle für bis zu vier Produkte. Unterschiede sind markiert,
 * beim Scrollen bleibt eine schmale Kopfzeile mit den Produkten stehen.
 */
export function CompareTable() {
  const ids = useCompare((s) => s.ids);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);
  const [hydrated, setHydrated] = useState(false);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [stuck, setStuck] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    if (useCompare.persist.hasHydrated()) setHydrated(true);
    return useCompare.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const products = ids.map((id) => getProductById(id)).filter((p): p is Product => p !== undefined);

  // Kopfzeile einblenden, sobald der Tabellenkopf unter dem Header verschwunden ist
  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const table = el.closest("table");
      const tableBottom = table ? table.getBoundingClientRect().bottom : 0;
      setStuck(el.getBoundingClientRect().bottom < 80 && tableBottom > 160);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hydrated, products.length]);

  const syncScroll = () => {
    if (miniRef.current && scrollRef.current) miniRef.current.style.transform = `translateX(${-scrollRef.current.scrollLeft}px)`;
  };

  if (!hydrated) {
    return <div className="h-72 animate-pulse rounded-[var(--radius-media)] bg-stone" aria-label="Vergleich wird geladen" />;
  }

  if (products.length === 0) {
    return (
      <div className="grid gap-8 border-t border-line pt-10 md:grid-cols-12 md:pt-14">
        <p className="t-h2 m-0 md:col-span-6">Noch nichts im Vergleich</p>
        <div className="md:col-span-5 md:col-start-8">
          <p className="m-0 text-[16px] leading-relaxed text-muted">
            Tippe bei bis zu {site.compareLimit} Produkten auf das Vergleichssymbol. Sie erscheinen dann hier nebeneinander, Unterschiede sind markiert.
          </p>
          <ButtonLink href="/produkte" variant="dark" arrow className="mt-7">
            Produkte ansehen
          </ButtonLink>
        </div>
      </div>
    );
  }

  const many = products.length > 1;
  const allRows = [...specRows, ...baseRows].filter((r) => products.some((p) => r.value(p) !== null));
  const isDifferent = (r: SpecRow) => new Set(products.map((p) => r.value(p) ?? "–")).size > 1;
  const rows = onlyDiff && many ? allRows.filter(isDifferent) : allRows;
  const diffCount = allRows.filter(isDifferent).length;
  const best = (r: SpecRow): number | undefined => {
    if (!r.numeric || !many) return undefined;
    const vals = products.map((p) => r.numeric!(p)).filter((v): v is number => typeof v === "number");
    if (vals.length < 2) return undefined;
    const max = Math.max(...vals);
    return vals.every((v) => v === max) ? undefined : max;
  };

  const vars = {
    "--n": products.length,
  } as CSSProperties;
  const tableWidth = "max(100%, calc(var(--c0) + var(--n) * var(--cmin)))";

  return (
    <div className="[--c0:128px] [--cmin:158px] md:[--c0:190px] md:[--cmin:210px]" style={vars}>
      {/* Werkzeugleiste */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-5">
        <p className="font-mono text-[12px] tabular text-muted">
          {products.length} von {site.compareLimit} Produkten{many && ` · ${diffCount} ${diffCount === 1 ? "Unterschied" : "Unterschiede"}`}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {many && (
            <button type="button" role="switch" aria-checked={onlyDiff} onClick={() => setOnlyDiff((v) => !v)} className="inline-flex items-center gap-3 text-[14px] font-semibold">
              <span aria-hidden className={`relative h-6 w-10 rounded-full transition-colors duration-300 ${onlyDiff ? "bg-ink" : "bg-ink/15"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[var(--ease-out-expo)] ${onlyDiff ? "translate-x-[18px]" : "translate-x-0.5"}`} />
              </span>
              Nur Unterschiede
            </button>
          )}
          <button type="button" onClick={clear} className="text-[14px] font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
            Vergleich leeren
          </button>
        </div>
      </div>

      {/* Mitlaufende Kopfzeile */}
      <div className="sticky z-20 h-0" style={{ top: "calc(env(safe-area-inset-top, 0px) + var(--header-h, 66px))" }}>
        <div
          aria-hidden
          className={`flex overflow-hidden border-b border-line bg-paper/92 backdrop-blur-xl transition-[opacity,transform] duration-300 ease-[var(--ease-out-expo)] ${
            stuck ? "opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <div className="flex w-[var(--c0)] shrink-0 items-center py-3 pr-3">
            <span className="t-label !text-[10px]">Vergleich</span>
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div
              ref={miniRef}
              className="grid"
              style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))`, width: `max(100%, calc(var(--n) * var(--cmin)))` }}
            >
              {products.map((p) => (
                <div key={p.id} className="flex min-w-0 items-center gap-3 border-l border-line px-3 py-2.5 md:px-4">
                  <span className="hidden h-10 w-[54px] shrink-0 overflow-hidden rounded-lg bg-stone sm:block">
                    <ProductThumb product={p} className="h-full w-full" />
                  </span>
                  <span className="line-clamp-2 min-w-0 text-[12.5px] font-semibold leading-snug md:text-[13px]">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} onScroll={syncScroll} className="relative overflow-x-auto [scrollbar-width:thin]">
        <table className="border-collapse text-left text-[15px]" style={{ tableLayout: "fixed", width: tableWidth }}>
          <caption className="sr-only">Vergleich von {products.length} Produkten</caption>
          <colgroup>
            <col style={{ width: "var(--c0)" }} />
            {products.map((p) => (
              <col key={p.id} />
            ))}
          </colgroup>
          <thead ref={headRef}>
            <tr className="align-top">
              <th scope="col" className="sticky left-0 z-10 bg-paper pb-6 pr-3 font-normal">
                <span className="t-label">Produkt</span>
              </th>
              {products.map((p) => (
                <th key={p.id} scope="col" className="border-l border-line px-3 pb-6 font-normal md:px-5">
                  <div className="relative">
                    <Link href={`/produkt/${p.slug}`} tabIndex={-1} aria-hidden className="group block aspect-[4/3] overflow-hidden rounded-2xl bg-stone">
                      <ProductThumb product={p} className="h-full w-full p-2 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      aria-label={`${p.name} aus dem Vergleich entfernen`}
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-paper/90 text-ink shadow-[0_0_0_1px_rgb(16_24_32/0.08)] backdrop-blur hover:bg-ink hover:text-paper"
                    >
                      <Icon name="close" size={15} />
                    </button>
                    <div className="mt-4 min-h-6">
                      <DataStatusChip product={p} className="!px-2 !py-0.5 !text-[11px]" />
                    </div>
                    <p className="t-label mt-3 !text-[10px]">{p.brand}</p>
                    <Link href={`/produkt/${p.slug}`} className="mt-1.5 block text-[14.5px] font-semibold leading-snug underline-offset-4 hover:underline md:text-[15.5px]">
                      {nb(p.name)}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-ink align-top">
              <th scope="row" className="sticky left-0 z-10 bg-paper py-5 pr-3 font-normal text-muted">
                Preis
              </th>
              {products.map((p) => (
                <td key={p.id} className="border-l border-line px-3 py-5 md:px-5">
                  <PriceTag product={p} footnote />
                  <div className="mt-4">
                    <AddToCartButton product={p} size="sm" variant="subtle" className="max-md:!px-3 max-md:!text-[13px]" />
                  </div>
                </td>
              ))}
            </tr>
            {rows.map((r) => {
              const diff = many && isDifferent(r);
              const top = best(r);
              return (
                <tr key={r.key} className={`border-t border-line align-top ${diff ? "bg-sun-soft/30" : ""}`}>
                  <th scope="row" className={`sticky left-0 z-10 py-4 pr-3 text-[13px] font-normal text-muted hyphens-auto [overflow-wrap:anywhere] md:text-[15px] md:[overflow-wrap:normal] ${diff ? "bg-[#faf4e7]" : "bg-paper"}`}>
                    <span className="flex items-start gap-2">
                      {diff && <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sun-3" />}
                      <span>
                        {r.label}
                        {diff && <span className="sr-only"> (unterschiedlich)</span>}
                      </span>
                    </span>
                  </th>
                  {products.map((p) => {
                    const v = r.value(p);
                    const isTop = top !== undefined && r.numeric?.(p) === top;
                    return (
                      <td key={p.id} className="border-l border-line px-3 py-4 md:px-5">
                        {v === null ? (
                          <span className="text-muted" aria-label="keine Angabe">
                            –
                          </span>
                        ) : (
                          <span className={isTop ? "font-semibold" : ""}>
                            {nb(v)}
                            {isTop && (
                              <span className="mt-1 flex items-center gap-1.5 font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-muted">
                                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sun" />
                                Höchster Wert
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr className="border-t border-line">
                <td colSpan={products.length + 1} className="py-8 text-muted">
                  Keine Unterschiede in den technischen Daten.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {products.length < site.compareLimit && (
        <p className="mt-10 text-[15px] text-muted">
          Du kannst noch {site.compareLimit - products.length} {site.compareLimit - products.length === 1 ? "Produkt" : "Produkte"} hinzufügen.{" "}
          <Link href="/produkte" className="font-semibold text-ink underline decoration-ink/20 underline-offset-[6px] hover:decoration-ink">
            Weitere Produkte auswählen
          </Link>
        </p>
      )}
    </div>
  );
}
