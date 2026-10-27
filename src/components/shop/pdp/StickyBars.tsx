"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/lib/catalog/types";
import { hasPrice } from "@/lib/catalog";
import { formatEUR } from "@/lib/format";
import { getLenis } from "@/components/motion/SmoothScroll";
import { AddToCartButton } from "../ProductActions";
import { VAT_FOOTNOTE_ID, vatLine } from "../pricing";

export interface NavSection {
  id: string;
  label: string;
}

/** Sanft zu einem Abschnitt scrollen, ohne einen Verlaufseintrag anzulegen */
function scrollToSection(e: MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(el);
  else el.scrollIntoView({ behavior: document.documentElement.dataset.motion === "on" ? "smooth" : "auto", block: "start" });
}

function PriceMini({ product }: { product: Product }) {
  return (
    <span className="block text-right leading-tight">
      <span className="t-num block text-[18px] tabular">{formatEUR(product.price)}</span>
      <span className="block text-[11px] text-muted">
        {vatLine(product)}
        {product.vatRate === 0 && (
          <sup>
            <a href={`#${VAT_FOOTNOTE_ID}`} className="no-underline" aria-label="Fußnote 1: Hinweis zum Nullsteuersatz">
              1
            </a>
          </sup>
        )}{" "}
        zzgl. Versand
      </span>
    </span>
  );
}

/**
 * Abschnittsnavigation unter dem Header. Markiert den sichtbaren Abschnitt.
 * Auf großen Bildschirmen erscheint rechts der Kaufknopf, sobald der Hauptknopf aus dem Bild ist.
 */
export function SectionNav({ sections, product, showBuy }: { sections: NavSection[]; product: Product; showBuy: boolean }) {
  const [active, setActive] = useState<string | undefined>(undefined);
  const key = sections.map((s) => s.id).join("|");

  // Aktiv ist der letzte Abschnitt, dessen Anfang das obere Drittel erreicht hat
  useEffect(() => {
    const ids = key.split("|");
    let raf = 0;
    const measure = () => {
      raf = 0;
      const line = window.innerHeight * 0.35;
      let current: string | undefined;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
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
  }, [key]);

  const buy = showBuy && hasPrice(product);

  return (
    <nav
      aria-label="Produktinformationen"
      className="sticky z-20 border-y border-line bg-paper/90 backdrop-blur-xl backdrop-saturate-150"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + var(--header-h, 66px))" }}
    >
      <div className="container-x flex h-14 items-center gap-6">
        <ul className="relative -mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1 [mask-image:linear-gradient(90deg,#000_calc(100%-24px),transparent)] [scrollbar-width:none] lg:[mask-image:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                onClick={(e) => scrollToSection(e, s.id)}
                aria-current={active === s.id ? "true" : undefined}
                className={`inline-flex h-9 items-center rounded-full px-3.5 text-[14px] font-semibold transition-colors duration-300 ${
                  active === s.id ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <div
          inert={!buy}
          className={`hidden shrink-0 items-center gap-5 transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] lg:flex ${
            buy ? "opacity-100" : "pointer-events-none translate-y-1 opacity-0"
          }`}
        >
          <PriceMini product={product} />
          <AddToCartButton product={product} size="sm" />
        </div>
      </div>
    </nav>
  );
}

/**
 * Kaufleiste am unteren Rand (nur Handy und Tablet), sobald der Hauptknopf
 * aus dem Bild gescrollt ist. Schiebt die Vergleichsleiste über --sticky-buybar nach oben.
 */
export function StickyBuyBar({ product, visible }: { product: Product; visible: boolean }) {
  const priced = hasPrice(product);
  const [footer, setFooter] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const show = visible && priced && !footer;

  // Über dem Footer ausblenden, damit nichts verdeckt wird
  useEffect(() => {
    const f = document.querySelector("body > footer, footer");
    if (!f) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      setFooter(f.getBoundingClientRect().top < window.innerHeight);
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
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(max-width: 1023.98px)");
    const sync = () => {
      if (show && mq.matches) root.style.setProperty("--sticky-buybar", "72px");
      else root.style.removeProperty("--sticky-buybar");
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      root.style.removeProperty("--sticky-buybar");
    };
  }, [show]);

  // Per Portal direkt in <body>: Ein Vorfahr mit transform (z. B. die Seitenüberblendung)
  // würde position: fixed sonst an sich binden statt an das Browserfenster.
  if (!priced || !mounted) return null;
  return createPortal(
    <div
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-[65] border-t border-line bg-paper/92 backdrop-blur-xl backdrop-saturate-150 transition-transform duration-500 ease-[var(--ease-out-expo)] lg:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="container-x flex h-[72px] items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{product.name}</p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <span className="t-num text-[19px] tabular">{formatEUR(product.price)}</span>
            <span className="truncate text-[11px] text-muted">
              {vatLine(product)}
              {product.vatRate === 0 && <sup>1</sup>} zzgl. Versand
            </span>
          </p>
        </div>
        <AddToCartButton product={product} size="md" className="!h-12 shrink-0 !px-5" />
      </div>
    </div>,
    document.body,
  );
}
