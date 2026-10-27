"use client";

import { useId } from "react";
import type { Product } from "@/lib/catalog/types";
import { variantSpecs } from "../specRows";
import { nb } from "../typo";

/**
 * Varianten einer Produktfamilie als Auswahlfelder.
 * Bewusst ohne Preise: Der vollständige Preis mit Pflichtangaben steht direkt darunter.
 */
export function VariantSwitch({ variants, activeId, onSelect }: { variants: Product[]; activeId: string; onSelect: (id: string) => void }) {
  const name = useId();
  if (variants.length < 2) return null;
  const lines = variantSpecs(variants);
  return (
    <fieldset className="mt-9 min-w-0">
      <legend className="t-label mb-3">Variante wählen</legend>
      <div className={`grid gap-2.5 ${variants.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
        {variants.map((v) => {
          const checked = v.id === activeId;
          const spec = lines.get(v.id) ?? "";
          return (
            <label key={v.id} className="relative block min-w-0 cursor-pointer">
              <input type="radio" name={name} value={v.id} checked={checked} onChange={() => onSelect(v.id)} className="peer sr-only" />
              <span
                className={`flex h-full flex-col justify-between gap-2 rounded-2xl border px-4 py-3.5 transition-[border-color,background-color,box-shadow] duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink ${
                  checked ? "border-ink bg-white shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line hover:border-ink/40"
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-[15px] font-semibold leading-snug">{nb(v.variantLabel ?? v.name)}</span>
                  <span
                    aria-hidden
                    className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${checked ? "border-ink bg-ink" : "border-ink/25"}`}
                  >
                    {checked && <span className="h-1.5 w-1.5 rounded-full bg-paper" />}
                  </span>
                </span>
                {spec && <span className="font-mono text-[11.5px] text-muted">{nb(spec)}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
