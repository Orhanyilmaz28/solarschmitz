"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCompare } from "@/lib/compare/store";
import { getProductById } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { DataStatusChip, PriceTag } from "./DataStatus";
import { AddToCartButton } from "./ProductActions";
import { baseRows, specRows, type SpecRow } from "./specRows";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/config/site";

/** Vergleichstabelle für bis zu vier Produkte aus dem Vergleichs-Store */
export function CompareTable() {
  const ids = useCompare((s) => s.ids);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);
  const [hydrated, setHydrated] = useState(false);
  const [onlyDiff, setOnlyDiff] = useState(false);

  useEffect(() => {
    if (useCompare.persist.hasHydrated()) setHydrated(true);
    return useCompare.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const products = ids.map((id) => getProductById(id)).filter((p): p is Product => p !== undefined);

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-mist" aria-label="Vergleich wird geladen" />;
  }

  if (products.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-white px-6 py-16 text-center">
        <p className="display-md m-0 text-2xl">Noch nichts im Vergleich</p>
        <p className="mx-auto mt-3 max-w-[50ch] text-muted">
          Setze bei bis zu {site.compareLimit} Produkten den Haken „Vergleichen“. Sie erscheinen dann hier nebeneinander.
        </p>
        <div className="mt-7 flex justify-center">
          <ButtonLink href="/produkte" variant="dark" arrow>
            Produkte ansehen
          </ButtonLink>
        </div>
      </div>
    );
  }

  const allRows = [...specRows, ...baseRows].filter((r) => products.some((p) => r.value(p) !== null));
  const isDifferent = (r: SpecRow) => new Set(products.map((p) => r.value(p) ?? "–")).size > 1;
  const rows = onlyDiff && products.length > 1 ? allRows.filter(isDifferent) : allRows;
  const best = (r: SpecRow): number | undefined => {
    if (!r.numeric || products.length < 2) return undefined;
    const vals = products.map((p) => r.numeric!(p)).filter((v): v is number => typeof v === "number");
    if (vals.length < 2) return undefined;
    const max = Math.max(...vals);
    return vals.every((v) => v === max) ? undefined : max;
  };

  const colWidth = "min-w-[220px]";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink tabular">{products.length}</span> von {site.compareLimit} Produkten
        </p>
        <div className="flex flex-wrap items-center gap-5">
          {products.length > 1 && (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} className="h-5 w-5 accent-[var(--color-ink)]" />
              Nur Unterschiede zeigen
            </label>
          )}
          <button type="button" onClick={clear} className="text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
            Vergleich leeren
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white" style={{ ["--cols" as string]: products.length }}>
        <table className="w-full border-collapse text-left text-[15px]">
          <caption className="sr-only">Vergleich von {products.length} Produkten</caption>
          <thead>
            <tr className="align-top">
              <th scope="col" className="sticky left-0 z-10 w-[200px] min-w-[160px] bg-white p-5 text-sm font-normal text-muted">
                Produkt
              </th>
              {products.map((p) => (
                <th key={p.id} scope="col" className={`${colWidth} border-l border-line p-5 font-normal`}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      aria-label={`${p.name} aus dem Vergleich entfernen`}
                      className="absolute right-0 top-0 z-[2] grid h-8 w-8 place-items-center rounded-full bg-mist text-ink hover:bg-ink hover:text-paper"
                    >
                      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                        <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                    <Link href={`/produkt/${p.slug}`} className="block aspect-[4/3] rounded-2xl bg-mist p-3">
                      <ProductVisual visual={p.visual} title={p.name} className="h-full w-full" />
                    </Link>
                    <div className="mt-4">
                      <DataStatusChip product={p} />
                    </div>
                    <Link href={`/produkt/${p.slug}`} className="mt-3 block font-semibold leading-snug hover:underline">
                      {p.name}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line">
              <th scope="row" className="sticky left-0 z-10 bg-white p-5 align-top text-sm font-normal text-muted">
                Preis
              </th>
              {products.map((p) => (
                <td key={p.id} className="border-l border-line p-5 align-top">
                  <PriceTag product={p} />
                  <div className="mt-4">
                    <AddToCartButton product={p} size="sm" />
                  </div>
                </td>
              ))}
            </tr>
            {rows.map((r) => {
              const diff = isDifferent(r);
              const top = best(r);
              return (
                <tr key={r.key} className={`border-t border-line ${diff && products.length > 1 ? "bg-[#fbfdf6]" : ""}`}>
                  <th scope="row" className={`sticky left-0 z-10 p-5 align-top text-sm font-normal text-muted ${diff && products.length > 1 ? "bg-[#fbfdf6]" : "bg-white"}`}>
                    {r.label}
                    {diff && products.length > 1 && <span className="sr-only"> (unterschiedlich)</span>}
                  </th>
                  {products.map((p) => {
                    const v = r.value(p);
                    const isTop = top !== undefined && r.numeric?.(p) === top;
                    return (
                      <td key={p.id} className="border-l border-line p-5 align-top">
                        {v === null ? (
                          <span className="text-muted">–</span>
                        ) : (
                          <span className={`inline-flex items-center gap-2 ${isTop ? "font-semibold" : ""}`}>
                            {v}
                            {isTop && <span className="chip bg-lime text-ink">höchster Wert</span>}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {products.length < site.compareLimit && (
        <p className="mt-6 text-sm text-muted">
          Du kannst noch {site.compareLimit - products.length} {site.compareLimit - products.length === 1 ? "Produkt" : "Produkte"} hinzufügen.{" "}
          <Link href="/produkte" className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-4">
            Weitere Produkte auswählen
          </Link>
        </p>
      )}
    </div>
  );
}
