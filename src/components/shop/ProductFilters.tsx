"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { categories } from "@/data/categories";
import { installLocations } from "@/lib/catalog/types";
import { locationLabels } from "./specRows";
import { sortLabels } from "./productQuery";

interface Props {
  brands: string[];
  /** Kategorie fest vorgegeben (z. B. auf Kategorieseiten) */
  lockedCategory?: boolean;
  resultCount: number;
}

const wpOptions = [
  { value: "", label: "Beliebig" },
  { value: "800", label: "ab 800 Wp" },
  { value: "1500", label: "ab 1.500 Wp" },
];

const priceOptions = [
  { value: "", label: "Beliebig" },
  { value: "300", label: "bis 300 €" },
  { value: "1000", label: "bis 1.000 €" },
  { value: "1500", label: "bis 1.500 €" },
];

/** Filterleiste. Der Zustand liegt komplett in der URL, damit Ergebnisse teilbar sind. */
export function ProductFilters({ brands, lockedCategory = false, resultCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const get = (k: string) => params.get(k) ?? "";
  const selectedBrands = get("hersteller").split(",").filter(Boolean);

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function toggleBrand(b: string) {
    const set = new Set(selectedBrands);
    if (set.has(b)) set.delete(b);
    else set.add(b);
    update({ hersteller: [...set].join(",") || null });
  }

  const hasFilters = ["kategorie", "ort", "hersteller", "speicher", "minwp", "maxpreis"].some((k) => (lockedCategory && k === "kategorie" ? false : params.has(k)));

  const panel = (
    <div className="space-y-7">
      {!lockedCategory && (
        <FilterGroup title="Kategorie">
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch lg:gap-1">
            <Pill active={!get("kategorie")} onClick={() => update({ kategorie: null })}>
              Alle Produkte
            </Pill>
            {categories.map((c) => (
              <Pill key={c.slug} active={get("kategorie") === c.slug} onClick={() => update({ kategorie: c.slug })}>
                {c.name}
              </Pill>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Montageort">
        <div className="flex flex-wrap gap-2">
          {installLocations.map((l) => (
            <Pill key={l} active={get("ort") === l} onClick={() => update({ ort: get("ort") === l ? null : l })}>
              {locationLabels[l]}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Ausstattung">
        <label className="flex cursor-pointer items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={get("speicher") === "1"}
            onChange={(e) => update({ speicher: e.target.checked ? "1" : null })}
            className="h-5 w-5 rounded accent-[var(--color-ink)]"
          />
          Nur mit Batteriespeicher
        </label>
      </FilterGroup>

      <FilterGroup title="Hersteller">
        <div className="space-y-2">
          {brands.map((b) => (
            <label key={b} className="flex cursor-pointer items-center gap-3 text-[15px]">
              <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} className="h-5 w-5 rounded accent-[var(--color-ink)]" />
              {b}
            </label>
          ))}
        </div>
      </FilterGroup>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
        <SelectField id="f-minwp" label="Modulleistung" value={get("minwp")} options={wpOptions} onChange={(v) => update({ minwp: v || null })} />
        <SelectField id="f-maxpreis" label="Preis" value={get("maxpreis")} options={priceOptions} onChange={(v) => update({ maxpreis: v || null })} />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => update({ ort: null, hersteller: null, speicher: null, minwp: null, maxpreis: null, ...(lockedCategory ? {} : { kategorie: null }) })}
          className="text-sm font-semibold underline decoration-lime decoration-2 underline-offset-4 hover:text-lime-deep"
        >
          Alle Filter zurücksetzen
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Kopfzeile: Anzahl + Sortierung + mobiler Filterknopf */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls="filter-panel-mobile"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-semibold"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
            <path d="M3 5h14M6 10h8M8.5 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Filter {mobileOpen ? "ausblenden" : "anzeigen"}
        </button>
      </div>
      <div id="filter-panel-mobile" className={`mb-8 rounded-2xl border border-line bg-white p-5 lg:hidden ${mobileOpen ? "" : "hidden"}`}>
        {panel}
      </div>
      <div className="hidden lg:block">{panel}</div>
      <p className="sr-only" aria-live="polite">
        {pending ? "Ergebnisse werden aktualisiert" : `${resultCount} Produkte gefunden`}
      </p>
    </div>
  );
}

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const value = params.get("sortierung") ?? "relevanz";
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Sortieren</span>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === "relevanz") next.delete("sortierung");
          else next.set("sortierung", e.target.value);
          const qs = next.toString();
          startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
        }}
        className="h-10 rounded-full border border-line bg-white px-4 pr-8 text-sm font-semibold"
      >
        {Object.entries(sortLabels).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="eyebrow mb-3">{title}</legend>
      {children}
    </fieldset>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-left text-sm font-semibold transition-colors lg:rounded-xl ${
        active ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink hover:border-ink/40"
      }`}
    >
      {children}
    </button>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-3 block">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field-input !py-2.5 text-sm">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
