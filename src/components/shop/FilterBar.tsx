"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { categories } from "@/data/categories";
import { installLocations } from "@/lib/catalog/types";
import { Icon } from "@/components/ui/Icon";
import { getLenis } from "@/components/motion/SmoothScroll";
import { locationLabels } from "./specRows";
import { priceOptions, sortLabels, wpOptions } from "./productQuery";

interface Props {
  brands: string[];
  resultCount: number;
  /** Kategorie fest vorgegeben (Kategorieseite). Die Schnellwahl zeigt dann die Montageorte. */
  lockedCategory?: boolean;
  /** Anzahl Produkte je Kategorie für die Schnellwahl */
  categoryCounts?: Record<string, number>;
  /** Filter, die für die Auswahl sinnvoll sind (z. B. keine Modulleistung bei Speichern) */
  facets?: { wp?: boolean; storage?: boolean; price?: boolean };
}

const shortCategory: Record<string, string> = {
  balkonkraftwerke: "Balkonkraftwerke",
  "balkonkraftwerke-mit-speicher": "Mit Speicher",
  solarmodule: "Solarmodule",
  batteriespeicher: "Batteriespeicher",
  wechselrichter: "Wechselrichter",
  "montage-zubehoer": "Montage & Zubehör",
};

const plural = (n: number) => `${n} ${n === 1 ? "Produkt" : "Produkte"}`;

/**
 * Filterleiste über der Produktliste: Schnellwahl als Chips, Sortierung, Trefferzahl.
 * Weitere Filter im Panel (Desktop) bzw. im Sheet (Handy).
 * Der Zustand liegt vollständig in der URL, damit Ergebnisse teilbar sind.
 */
export function FilterBar({ brands, resultCount, lockedCategory = false, categoryCounts, facets = {} }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [panel, setPanel] = useState(false);
  const [sheet, setSheet] = useState(false);
  const closeSheet = useCallback(() => setSheet(false), []);
  const barRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const get = (k: string) => params.get(k) ?? "";
  const selectedBrands = get("hersteller").split(",").filter(Boolean);

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [params, pathname, router],
  );

  const toggleBrand = (b: string) => {
    const set = new Set(selectedBrands);
    if (set.has(b)) set.delete(b);
    else set.add(b);
    update({ hersteller: [...set].join(",") || null });
  };

  // Filter im Panel (ohne Schnellwahl)
  const panelKeys = lockedCategory ? ["hersteller", "speicher", "minwp", "maxpreis"] : ["ort", "hersteller", "speicher", "minwp", "maxpreis"];
  const panelCount = panelKeys.filter((k) => params.has(k)).length;
  const resetAll = () =>
    update({ ort: null, hersteller: null, speicher: null, minwp: null, maxpreis: null, q: null, sortierung: null, ...(lockedCategory ? {} : { kategorie: null }) });

  // Panel: schließen bei Escape und Klick außerhalb
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(false);
    const onDown = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setPanel(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [panel]);

  const openFilters = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setPanel((p) => !p);
    else setSheet(true);
  };

  const sort = get("sortierung") || "relevanz";
  const setSort = (v: string) => update({ sortierung: v === "relevanz" ? null : v });

  const groups = (
    <FilterGroups
      lockedCategory={lockedCategory}
      facets={facets}
      brands={brands}
      selectedBrands={selectedBrands}
      get={get}
      update={update}
      toggleBrand={toggleBrand}
    />
  );

  // Aktive Filter als entfernbare Chips
  const active: { key: string; label: string; clear: () => void }[] = [];
  const q = get("q");
  if (q) active.push({ key: "q", label: `Suche: „${q}“`, clear: () => update({ q: null }) });
  if (!lockedCategory && get("ort")) active.push({ key: "ort", label: locationLabels[get("ort")] ?? get("ort"), clear: () => update({ ort: null }) });
  if (get("speicher") === "1") active.push({ key: "speicher", label: "Mit Batteriespeicher", clear: () => update({ speicher: null }) });
  for (const b of selectedBrands) active.push({ key: `b-${b}`, label: b, clear: () => toggleBrand(b) });
  const wp = wpOptions.find((o) => o.value && o.value === get("minwp"));
  if (wp) active.push({ key: "minwp", label: wp.label, clear: () => update({ minwp: null }) });
  const price = priceOptions.find((o) => o.value && o.value === get("maxpreis"));
  if (price) active.push({ key: "maxpreis", label: price.label, clear: () => update({ maxpreis: null }) });

  return (
    <>
      <div
        ref={barRef}
        className="sticky z-30 border-b border-line bg-paper/90 backdrop-blur-xl backdrop-saturate-150"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + var(--header-h, 66px))" }}
      >
        <div className="container-x flex h-[60px] items-center gap-3 md:h-16 md:gap-6">
          {/* Schnellwahl */}
          <div
            role="group"
            aria-label={lockedCategory ? "Montageort" : "Kategorie"}
            className="relative -mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1 py-2 [mask-image:linear-gradient(90deg,#000_calc(100%-28px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {lockedCategory ? (
              <>
                <QuickChip active={!get("ort")} onClick={() => update({ ort: null })}>
                  Alle Orte
                </QuickChip>
                {installLocations.map((l) => (
                  <QuickChip key={l} active={get("ort") === l} onClick={() => update({ ort: get("ort") === l ? null : l })}>
                    {locationLabels[l]}
                  </QuickChip>
                ))}
              </>
            ) : (
              <>
                <QuickChip active={!get("kategorie")} onClick={() => update({ kategorie: null })}>
                  Alle
                </QuickChip>
                {categories.map((c) => (
                  <QuickChip
                    key={c.slug}
                    active={get("kategorie") === c.slug}
                    count={categoryCounts?.[c.slug]}
                    onClick={() => update({ kategorie: get("kategorie") === c.slug ? null : c.slug })}
                  >
                    {shortCategory[c.slug] ?? c.name}
                  </QuickChip>
                ))}
              </>
            )}
          </div>

          {/* Trefferzahl, Sortierung, Filter */}
          <div className="hidden shrink-0 items-center lg:flex">
            <p className="hidden border-r border-line pr-4 font-mono text-[12px] tabular text-muted min-[1400px]:block" aria-hidden>
              {plural(resultCount)}
            </p>
            <SortSelect value={sort} onChange={setSort} className="ml-2" />
          </div>
          <button
            type="button"
            onClick={openFilters}
            aria-expanded={panel || sheet}
            aria-controls={panelId}
            className={`relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
              panel ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink"
            }`}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 6h9M15.5 6H17M3 14h2.5M9 14h8" />
              <circle cx="13.75" cy="6" r="1.75" />
              <circle cx="7.25" cy="14" r="1.75" />
            </svg>
            <span className="hidden sm:inline">Filter</span>
            <span className="sr-only sm:hidden">Filter</span>
            {panelCount > 0 && (
              <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 font-mono text-[11px] tabular ${panel ? "bg-paper text-ink" : "bg-ink text-paper"}`}>
                {panelCount}
                <span className="sr-only"> aktiv</span>
              </span>
            )}
          </button>
        </div>

        {/* Ladeanzeige */}
        <div aria-hidden className={`absolute inset-x-0 bottom-[-1px] h-px overflow-hidden transition-opacity duration-300 ${pending ? "opacity-100" : "opacity-0"}`}>
          <div className="h-full w-full animate-pulse" style={{ background: "var(--sun-gradient)" }} />
        </div>

        {/* Desktop-Panel */}
        {panel && (
          <div
            id={panelId}
            className="absolute inset-x-0 top-full hidden border-b border-line bg-paper shadow-[0_30px_60px_-30px_rgb(16_24_32/0.25)] lg:block"
            data-lenis-prevent
          >
            <div className="container-x py-8">
              {groups}
              <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
                <button type="button" onClick={resetAll} className="text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
                  Alle Filter zurücksetzen
                </button>
                <div className="flex items-center gap-5">
                  <span className="font-mono text-[12px] tabular text-muted">{pending ? "Wird aktualisiert …" : plural(resultCount)}</span>
                  <button type="button" onClick={() => setPanel(false)} className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-ink-3">
                    Fertig
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aktive Filter und Trefferzahl (unter der Leiste, nicht fixiert) */}
      <div className={`container-x ${active.length ? "" : "min-[1400px]:hidden"}`}>
        <div className="flex min-h-[52px] flex-wrap items-center gap-x-3 gap-y-2 py-3">
          <p className="font-mono text-[12px] tabular text-muted min-[1400px]:hidden" aria-hidden>
            {pending ? "Wird aktualisiert …" : plural(resultCount)}
          </p>
          <p className="sr-only" aria-live="polite">
            {pending ? "Ergebnisse werden aktualisiert" : `${plural(resultCount)} gefunden`}
          </p>
          {active.length > 0 && (
            <>
              <span aria-hidden className="hidden h-4 w-px bg-line sm:block min-[1400px]:hidden" />
              <ul className="flex flex-wrap items-center gap-2" aria-label="Aktive Filter">
                {active.map((a) => (
                  <li key={a.key}>
                    <button
                      type="button"
                      onClick={a.clear}
                      className="group inline-flex h-8 items-center gap-1.5 rounded-full bg-ink/[0.06] pl-3 pr-2 text-[13px] font-medium hover:bg-ink hover:text-paper"
                      aria-label={`Filter entfernen: ${a.label}`}
                    >
                      {a.label}
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={resetAll} className="text-[13px] font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
                Alle zurücksetzen
              </button>
            </>
          )}
        </div>
      </div>

      <FilterSheet open={sheet} onClose={closeSheet} resultCount={resultCount} pending={pending} onReset={resetAll}>
        <div className="mb-8">
          <p className="t-label mb-3">Sortierung</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(sortLabels).map(([k, label]) => (
              <Chip key={k} active={sort === k} onClick={() => setSort(k)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>
        {groups}
      </FilterSheet>
    </>
  );
}

// ---------- Filtergruppen ----------

function FilterGroups({
  lockedCategory,
  facets,
  brands,
  selectedBrands,
  get,
  update,
  toggleBrand,
}: {
  lockedCategory: boolean;
  facets: { wp?: boolean; storage?: boolean; price?: boolean };
  brands: string[];
  selectedBrands: string[];
  get: (k: string) => string;
  update: (c: Record<string, string | null>) => void;
  toggleBrand: (b: string) => void;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] lg:gap-10">
      {!lockedCategory && (
        <Group title="Montageort">
          {installLocations.map((l) => (
            <Chip key={l} active={get("ort") === l} onClick={() => update({ ort: get("ort") === l ? null : l })}>
              {locationLabels[l]}
            </Chip>
          ))}
        </Group>
      )}
      {facets.storage !== false && (
        <Group title="Ausstattung">
          <Switch checked={get("speicher") === "1"} onChange={(v) => update({ speicher: v ? "1" : null })}>
            Nur mit Batteriespeicher
          </Switch>
        </Group>
      )}
      {brands.length > 0 && (
        <Group title="Hersteller">
          {brands.map((b) => (
            <Chip key={b} active={selectedBrands.includes(b)} onClick={() => toggleBrand(b)}>
              {b}
            </Chip>
          ))}
        </Group>
      )}
      {facets.wp !== false && (
        <Group title="Modulleistung">
          {wpOptions.map((o) => (
            <Chip key={o.value || "alle"} active={get("minwp") === o.value} onClick={() => update({ minwp: o.value || null })}>
              {o.label}
            </Chip>
          ))}
        </Group>
      )}
      {facets.price !== false && (
        <Group title="Preis">
          {priceOptions.map((o) => (
            <Chip key={o.value || "alle"} active={get("maxpreis") === o.value} onClick={() => update({ maxpreis: o.value || null })}>
              {o.label}
            </Chip>
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="t-label mb-3">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function QuickChip({ active, onClick, count, children }: { active: boolean; onClick: () => void; count?: number; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[14px] font-semibold transition-colors duration-300 ${
        active ? "bg-ink text-paper" : "text-muted hover:bg-ink/[0.05] hover:text-ink"
      }`}
    >
      {children}
      {typeof count === "number" && (
        <>
          <span aria-hidden className={`ml-1.5 font-mono text-[10.5px] font-normal tabular ${active ? "text-paper/70" : "text-muted"}`}>
            {count}
          </span>
          <span className="sr-only">, {count} {count === 1 ? "Produkt" : "Produkte"}</span>
        </>
      )}
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors duration-200 ${
        active ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink hover:border-ink/40"
      }`}
    >
      {active && <Icon name="check" size={14} strokeWidth={2} />}
      {children}
    </button>
  );
}

function Switch({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-3 text-[14.5px] font-medium">
      <span aria-hidden className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-ink" : "bg-ink/15"}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[var(--ease-out-expo)] ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
      {children}
    </button>
  );
}

function SortSelect({ value, onChange, className = "" }: { value: string; onChange: (v: string) => void; className?: string }) {
  const id = useId();
  return (
    <div
      className={`relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full pl-3.5 pr-9 text-sm transition-colors hover:bg-ink/[0.05] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${className}`}
    >
      <label htmlFor={id} className="inline-flex items-center text-muted">
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M3.5 5.5h13M5.5 10h9M8 14.5h4" />
        </svg>
        <span className="sr-only">Sortieren</span>
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent font-semibold [field-sizing:content] focus:outline-none"
      >
        {Object.entries(sortLabels).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
    </div>
  );
}

// ---------- Mobiles Filter-Sheet ----------

function FilterSheet({
  open,
  onClose,
  resultCount,
  pending,
  onReset,
  children,
}: {
  open: boolean;
  onClose: () => void;
  resultCount: number;
  pending: boolean;
  onReset: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      if (!d.open) {
        d.showModal();
        getLenis()?.stop();
        document.documentElement.style.overflow = "hidden";
      }
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    if (d.open) {
      setShown(false);
      const t = window.setTimeout(() => d.close(), 320);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onDialogClose = () => {
      getLenis()?.start();
      document.documentElement.style.overflow = "";
      setShown(false);
      onClose();
    };
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("close", onDialogClose);
    d.addEventListener("cancel", onCancel);
    return () => {
      d.removeEventListener("close", onDialogClose);
      d.removeEventListener("cancel", onCancel);
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 text-ink backdrop:bg-transparent lg:hidden"
    >
      <div aria-hidden className={`absolute inset-0 bg-night/45 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div
        className={`absolute inset-x-0 bottom-0 flex max-h-[88svh] flex-col rounded-t-[28px] bg-paper shadow-[0_-20px_60px_-20px_rgb(16_24_32/0.35)] transition-transform duration-[420ms] ease-[var(--ease-out-expo)] ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <span aria-hidden className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-ink/15" />
          <h2 id={titleId} className="t-h3 m-0 pt-2">
            Filter & Sortierung
          </h2>
          <button type="button" onClick={onClose} aria-label="Filter schließen" className="-mr-2 grid h-11 w-11 place-items-center rounded-full hover:bg-ink/5">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-2" data-lenis-prevent>
          {children}
        </div>
        <div className="flex items-center gap-3 border-t border-line px-5 pt-4" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          <button type="button" onClick={onReset} className="h-12 shrink-0 rounded-full px-4 text-sm font-semibold text-muted hover:text-ink">
            Zurücksetzen
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-full bg-lime text-[15px] font-semibold text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] hover:bg-lime-hover"
          >
            {pending ? "Wird aktualisiert …" : `${plural(resultCount)} anzeigen`}
          </button>
        </div>
      </div>
    </dialog>
  );
}
