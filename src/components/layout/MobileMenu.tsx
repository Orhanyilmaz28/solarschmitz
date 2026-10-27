"use client";

import Link from "next/link";
import { useEffect } from "react";
import { categories } from "@/data/categories";
import { mainNav } from "@/config/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { getLenis } from "@/components/motion/SmoothScroll";

export function MobileMenu({ open, top, onClose, onSearch }: { open: boolean; top: number; onClose: () => void; onSearch: () => void }) {
  useEffect(() => {
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      data-lenis-prevent
      className={`fixed inset-x-0 bottom-0 z-40 overflow-y-auto bg-paper transition-[opacity,transform,visibility] duration-500 ease-[var(--ease-out-expo)] lg:hidden ${
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0"
      }`}
      style={{ top, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <nav aria-label="Mobile Navigation" className="container-x flex flex-col gap-8 py-8">
        <button type="button" onClick={() => { onClose(); onSearch(); }} tabIndex={open ? 0 : -1} className="flex h-12 items-center gap-3 rounded-full border border-line bg-white px-5 text-left text-muted">
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm7.5 13-3.6-3.6" />
          </svg>
          Produkte suchen
        </button>
        <div>
          <p className="eyebrow mb-3">Produkte</p>
          <ul className="grid grid-cols-1 gap-1 min-[420px]:grid-cols-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/kategorie/${c.slug}`} onClick={onClose} tabIndex={open ? 0 : -1} className="block rounded-xl px-3 py-3 font-semibold hover:bg-mist">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/produkte" onClick={onClose} tabIndex={open ? 0 : -1} className="block rounded-xl px-3 py-3 font-semibold text-lime-deep hover:bg-mist">
                Alle Produkte
              </Link>
            </li>
          </ul>
        </div>
        <ul className="flex flex-col border-t border-line pt-4">
          {mainNav.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={onClose} tabIndex={open ? 0 : -1} className="display-md block py-3 text-3xl">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <ButtonLink href="/konfigurator" onClick={onClose} tabIndex={open ? 0 : -1} variant="primary" size="lg" arrow>
          Meine Solaranlage finden
        </ButtonLink>
      </nav>
    </div>
  );
}
