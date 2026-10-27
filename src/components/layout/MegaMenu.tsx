"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { categories } from "@/data/categories";
import { getProductsByCategory } from "@/lib/catalog";
import { VisualImage } from "@/components/illustrations/VisualImage";
import { Icon } from "@/components/ui/Icon";
import { brand } from "@/config/brand";
import type { CategorySlug } from "@/lib/catalog/types";

interface Props {
  open: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onNavigate: () => void;
}

/**
 * Mega-Menü mit Vorschau: Links die Kategorien, in der Mitte das Bild und die
 * Beschreibung der Kategorie unter dem Mauszeiger (oder im Fokus), rechts Beratung.
 */
export function MegaMenu({ open, onEnter, onLeave, onNavigate }: Props) {
  const [active, setActive] = useState<CategorySlug>(categories[0]!.slug);
  const cat = categories.find((c) => c.slug === active) ?? categories[0]!;
  const tab = open ? 0 : -1;
  // Vorschau-Grafik erst nach dem ersten Öffnen erzeugen (spart Markup auf jeder Seite)
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (open) setSeen(true);
  }, [open]);

  return (
    <div
      id="mega-menu"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`absolute inset-x-0 top-full hidden transition-[opacity,transform,visibility] duration-500 ease-[var(--ease-out-expo)] lg:block ${
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
      }`}
    >
      <div className="border-t border-line bg-paper text-ink shadow-[0_40px_80px_-40px_rgb(16_24_32/0.35)]">
        <div className="container-x grid grid-cols-12 gap-8 py-10">
          {/* Kategorien */}
          <ul className="col-span-4 flex flex-col">
            {categories.map((c, i) => {
              const n = getProductsByCategory(c.slug).length;
              const isActive = c.slug === active;
              return (
                <li
                  key={c.slug}
                  style={{ transitionDelay: open ? `${40 + i * 30}ms` : "0ms" }}
                  className={`transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] ${open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
                >
                  <Link
                    href={`/kategorie/${c.slug}`}
                    onClick={onNavigate}
                    onMouseEnter={() => setActive(c.slug)}
                    onFocus={() => setActive(c.slug)}
                    tabIndex={tab}
                    className="group flex items-baseline justify-between gap-4 border-b border-line py-3.5"
                  >
                    <span className={`font-display text-[22px] font-semibold tracking-[-0.03em] transition-colors ${isActive ? "text-ink" : "text-muted"}`}>
                      {c.name}
                    </span>
                    <span className="font-mono text-xs text-muted tabular">{n}</span>
                  </Link>
                </li>
              );
            })}
            <li className="pt-5">
              <Link href="/produkte" onClick={onNavigate} tabIndex={tab} className="inline-flex items-center gap-2 text-sm font-semibold underline decoration-ink/20 underline-offset-4 hover:decoration-ink">
                Alle Produkte ansehen <Icon name="arrow-right" size={16} />
              </Link>
            </li>
          </ul>

          {/* Vorschau */}
          <Link
            href={`/kategorie/${cat.slug}`}
            onClick={onNavigate}
            tabIndex={-1}
            aria-hidden
            className="group relative col-span-5 flex min-h-[340px] flex-col overflow-hidden rounded-[var(--radius-card)] bg-stone"
          >
            <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_60%_35%,#ffffff_0%,transparent_70%)]" />
            <div key={cat.slug} className="relative flex-1 animate-[page-in_0.6s_var(--ease-out-expo)_both]">
              {seen && (
                <VisualImage visual={cat.visual} className="absolute inset-[8%] h-[84%] w-[84%] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105" />
              )}
            </div>
            <div key={`${cat.slug}-t`} className="relative flex items-end justify-between gap-6 p-6 animate-[page-in_0.6s_var(--ease-out-expo)_both]">
              <div>
                <p className="t-h3 m-0">{cat.tagline}</p>
                <p className="mt-1 max-w-[42ch] text-sm text-muted">{cat.description}</p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper transition-transform duration-500 group-hover:-rotate-45">
                <Icon name="arrow-right" size={18} />
              </span>
            </div>
          </Link>

          {/* Beratung */}
          <div className="on-dark relative col-span-3 flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-night p-7 text-paper">
            <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgb(255_164_42/0.45),transparent)]" />
            <p className="t-label relative">Unsicher, was passt?</p>
            <p className="relative mt-3 font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.03em]">In drei Fragen zur passenden Anlage.</p>
            <Link
              href="/konfigurator"
              onClick={onNavigate}
              tabIndex={tab}
              className="relative mt-6 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-ink hover:bg-lime-hover"
            >
              Jetzt konfigurieren <Icon name="arrow-right" size={16} />
            </Link>
            {brand.contact.phone && (
              <p className="relative mt-8 text-sm leading-relaxed text-paper/60">
                Lieber persönlich?
                <br />
                <a href={`tel:${brand.contact.phone.replace(/\s/g, "")}`} tabIndex={tab} className="font-semibold text-paper hover:text-lime">
                  {brand.contact.phone}
                </a>
                {brand.contact.hours && <span className="block text-xs text-paper/45">{brand.contact.hours}</span>}
              </p>
            )}
            <ul className="relative mt-auto space-y-2.5 border-t border-ink-line pt-5 text-sm">
              {[
                ["Produkte vergleichen", "/vergleich"],
                ["Versand & Lieferung", "/versand"],
                ["Ratgeber", "/ratgeber"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href!} onClick={onNavigate} tabIndex={tab} className="text-paper/80 hover:text-paper">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
