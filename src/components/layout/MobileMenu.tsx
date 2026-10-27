"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { categories } from "@/data/categories";
import { brand } from "@/config/brand";
import { VisualImage } from "@/components/illustrations/VisualImage";
import { Icon } from "@/components/ui/Icon";
import { getLenis } from "@/components/motion/SmoothScroll";

/**
 * Vollbild-Menü für Handy und Tablet: große Typo, Produkte aufklappbar
 * mit kleinen Bildern, Haupt-Handlung und Kontakt immer erreichbar.
 */
export function MobileMenu({ open, top, onClose, onSearch }: { open: boolean; top: number; onClose: () => void; onSearch: () => void }) {
  const [products, setProducts] = useState(false);
  // Inhalt erst beim ersten Öffnen erzeugen: hält das HTML jeder Seite schlank
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (open) setSeen(true);
  }, [open]);

  useEffect(() => {
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
      setProducts(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const tab = open ? 0 : -1;
  const links = [
    { label: "Konfigurator", href: "/konfigurator" },
    { label: "Ratgeber", href: "/ratgeber" },
    { label: "Über uns", href: "/ueber-uns" },
    { label: "Kontakt", href: "/kontakt" },
  ];

  return (
    <div
      id="mobile-menu"
      aria-hidden={!open}
      data-lenis-prevent
      className={`fixed inset-0 z-40 overflow-y-auto bg-paper text-ink transition-[clip-path,visibility] duration-700 ease-[var(--ease-cine)] lg:hidden ${
        open ? "visible [clip-path:inset(0_0_0_0)]" : "invisible [clip-path:inset(0_0_100%_0)]"
      }`}
      style={{ paddingTop: top, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <nav aria-label="Mobile Navigation" className="container-x flex min-h-full flex-col pb-8 pt-4">
        <button
          type="button"
          onClick={() => {
            onClose();
            onSearch();
          }}
          tabIndex={tab}
          className="flex h-12 items-center gap-3 rounded-full border border-line bg-white px-5 text-left text-muted"
        >
          <Icon name="search" size={18} />
          Produkte suchen
        </button>

        <ul className="mt-6 flex flex-col">
          <li className="border-b border-line">
            <button
              type="button"
              tabIndex={tab}
              aria-expanded={products}
              onClick={() => setProducts((p) => !p)}
              className={`flex w-full items-center justify-between py-4 text-left font-display text-[34px] font-semibold tracking-[-0.04em] transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
              style={{ transitionDelay: open ? "120ms" : "0ms" }}
            >
              Produkte
              <Icon name="chevron-down" size={24} className={`transition-transform duration-500 ${products ? "rotate-180" : ""}`} />
            </button>
            <div className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)] ${products ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <ul className="grid grid-cols-2 gap-2 overflow-hidden">
                {seen && categories.map((c) => (
                  <li key={c.slug} className="pb-2">
                    <Link href={`/kategorie/${c.slug}`} onClick={onClose} tabIndex={products ? tab : -1} className="flex h-full flex-col gap-2 rounded-2xl bg-stone p-3">
                      <span className="relative block aspect-[4/3] max-w-full">
                        <VisualImage visual={c.visual} className="absolute inset-0 h-full w-full" />
                      </span>
                      <span className="text-sm font-semibold leading-tight">{c.name}</span>
                    </Link>
                  </li>
                ))}
                <li className="col-span-2 pb-4">
                  <Link href="/produkte" onClick={onClose} tabIndex={products ? tab : -1} className="inline-flex items-center gap-2 text-sm font-semibold">
                    Alle Produkte <Icon name="arrow-right" size={16} />
                  </Link>
                </li>
              </ul>
            </div>
          </li>
          {links.map((l, i) => (
            <li key={l.href} className="border-b border-line">
              <Link
                href={l.href}
                onClick={onClose}
                tabIndex={tab}
                className={`block py-4 font-display text-[34px] font-semibold tracking-[-0.04em] transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${
                  open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{ transitionDelay: open ? `${180 + i * 60}ms` : "0ms" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-10">
          <Link
            href="/konfigurator"
            onClick={onClose}
            tabIndex={tab}
            className="flex h-14 items-center justify-center gap-2 rounded-full bg-lime font-semibold text-ink"
          >
            Jetzt konfigurieren <Icon name="arrow-right" size={18} />
          </Link>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            {brand.contact.phone && (
              <div>
                <dt className="t-label">Telefon</dt>
                <dd className="mt-1 select-all font-medium">{brand.contact.phone}</dd>
              </div>
            )}
            {brand.contact.email && (
              <div>
                <dt className="t-label">E-Mail</dt>
                <dd className="mt-1 select-all font-medium">{brand.contact.email}</dd>
              </div>
            )}
          </dl>
        </div>
      </nav>
    </div>
  );
}
