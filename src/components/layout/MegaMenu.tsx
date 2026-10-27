"use client";

import Link from "next/link";
import { categories } from "@/data/categories";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { ButtonLink } from "@/components/ui/Button";

interface Props {
  open: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onNavigate: () => void;
}

export function MegaMenu({ open, onEnter, onLeave, onNavigate }: Props) {
  return (
    <div
      id="mega-menu"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`absolute inset-x-0 top-full hidden origin-top transition-[opacity,transform,visibility] duration-500 ease-[var(--ease-out-expo)] lg:block ${
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
      }`}
    >
      <div className="border-t border-line bg-paper text-ink shadow-[0_30px_60px_-30px_rgb(16_24_32/0.35)]">
        <div className="container-x grid grid-cols-[1fr_300px] gap-10 py-8">
          <ul className="grid grid-cols-3 content-start gap-2">
            {categories.map((c, i) => (
              <li key={c.slug} style={{ transitionDelay: open ? `${60 + i * 35}ms` : "0ms" }} className={`transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] ${open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
                <Link
                  href={`/kategorie/${c.slug}`}
                  onClick={onNavigate}
                  tabIndex={open ? 0 : -1}
                  className="group flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-white"
                >
                  <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[radial-gradient(120%_90%_at_30%_10%,#fff_0%,#e9eef0_75%)]">
                    <ProductVisual visual={c.visual} className="absolute inset-1 h-[calc(100%-8px)] w-[calc(100%-8px)] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{c.name}</span>
                    <span className="line-clamp-2 block text-sm text-muted">{c.tagline}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-paper on-dark">
            <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime/30 blur-3xl" />
            <p className="eyebrow">Unsicher, was passt?</p>
            <p className="display-md mt-2 text-2xl">Finde deine Solarlösung in 6 Fragen.</p>
            <div className="mt-5">
              <ButtonLink href="/konfigurator" onClick={onNavigate} tabIndex={open ? 0 : -1} variant="primary" size="sm" arrow>
                Produktfinder
              </ButtonLink>
            </div>
            <div className="mt-6 flex flex-col gap-2 border-t border-ink-line pt-4 text-sm">
              <Link href="/produkte" onClick={onNavigate} tabIndex={open ? 0 : -1} className="hover:text-lime">
                Alle Produkte ansehen
              </Link>
              <Link href="/vergleich" onClick={onNavigate} tabIndex={open ? 0 : -1} className="hover:text-lime">
                Produkte vergleichen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
