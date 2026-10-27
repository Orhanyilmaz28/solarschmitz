"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { mainNav } from "@/config/navigation";
import { useCart, cartCount } from "@/lib/cart/store";
import { useCompare } from "@/lib/compare/store";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";

/**
 * Sticky-Navigation. Auf der Startseite liegt sie transparent über dem Hero
 * und wird beim Scrollen hell und fest.
 */
export function Header() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [menuTop, setMenuTop] = useState(76);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lines = useCart((s) => s.lines);
  const openCart = useCart((s) => s.open);
  const compareCount = useCompare((s) => s.ids.length);
  const count = cartCount(lines);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMega(false);
    setMobile(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMega(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const solid = !overHero || scrolled || mega || mobile;
  const tone = solid ? "light" : "dark";

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMega(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(false), 160);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky z-50 transition-[transform,background-color,box-shadow,color] duration-500 ease-[var(--ease-out-expo)] ${
          overHero ? "-mb-[76px]" : ""
        } ${
          solid ? "bg-paper/85 text-ink shadow-[0_1px_0_rgb(16_24_32/0.08)] backdrop-blur-xl backdrop-saturate-150" : "bg-transparent text-paper"
        }`}
        style={{ top: "env(safe-area-inset-top, 0px)" }}
        onMouseLeave={scheduleClose}
      >
        <div className="container-x flex h-[76px] items-center gap-3 sm:gap-6">
          <Link href="/" aria-label="Zur Startseite" className="shrink-0 animate-[logo-in_1s_var(--ease-out-expo)_both]">
            <Logo tone={tone} size={30} />
          </Link>

          <nav aria-label="Hauptnavigation" className="ml-6 hidden items-center gap-1 lg:flex">
            <button
              type="button"
              aria-expanded={mega}
              aria-controls="mega-menu"
              onMouseEnter={openMega}
              onFocus={openMega}
              onClick={() => setMega((m) => !m)}
              className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-colors ${
                solid ? "hover:bg-ink/5" : "hover:bg-paper/10"
              } ${mega ? (solid ? "bg-ink/5" : "bg-paper/10") : ""}`}
            >
              Produkte
              <svg viewBox="0 0 12 12" aria-hidden className={`h-3 w-3 transition-transform duration-300 ${mega ? "rotate-180" : ""}`}>
                <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {mainNav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onMouseEnter={scheduleClose}
                aria-current={pathname.startsWith(l.href) ? "page" : undefined}
                className={`inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold transition-colors ${
                  solid ? "hover:bg-ink/5" : "hover:bg-paper/10"
                } aria-[current=page]:underline aria-[current=page]:decoration-lime aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="-mr-2 ml-auto flex items-center sm:gap-1">
            <IconButton label="Suche öffnen (Strg+K)" onClick={() => setSearch(true)} solid={solid}>
              <path d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm7.5 13-3.6-3.6" />
            </IconButton>
            <Link
              href="/vergleich"
              aria-label={`Produktvergleich, ${compareCount} Produkte`}
              className={`relative hidden h-11 w-11 place-items-center rounded-full transition-colors sm:grid ${solid ? "hover:bg-ink/5" : "hover:bg-paper/10"}`}
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M4 7h12l-3-3M16 13H4l3 3" />
              </svg>
              {compareCount > 0 && <Badge n={compareCount} />}
            </Link>
            <IconButton label={`Warenkorb öffnen, ${count} Artikel`} onClick={openCart} solid={solid} badge={count}>
              <path d="M2.5 3h2.2l2 10.2h9.1l1.7-7.2H5.6M8 17.2h.01M15 17.2h.01" />
            </IconButton>
            <button
              type="button"
              className={`ml-1 grid h-11 w-11 place-items-center rounded-full lg:hidden ${solid ? "hover:bg-ink/5" : "hover:bg-paper/10"}`}
              aria-label={mobile ? "Menü schließen" : "Menü öffnen"}
              aria-expanded={mobile}
              onClick={() => {
                setMenuTop(headerRef.current?.getBoundingClientRect().bottom ?? 76);
                setMobile((m) => !m);
              }}
            >
              <span className="relative block h-3.5 w-5">
                <span className={`absolute left-0 h-[1.8px] w-5 bg-current transition-transform duration-500 ${mobile ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 top-1.5 h-[1.8px] w-5 bg-current transition-opacity ${mobile ? "opacity-0" : ""}`} />
                <span className={`absolute left-0 h-[1.8px] w-5 bg-current transition-transform duration-500 ${mobile ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          </div>
        </div>
        <MegaMenu open={mega} onEnter={openMega} onLeave={scheduleClose} onNavigate={() => setMega(false)} />
      </header>
      <MobileMenu open={mobile} top={menuTop} onClose={() => setMobile(false)} onSearch={() => setSearch(true)} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-lime px-1 font-mono text-[11px] font-medium text-ink tabular">
      {n}
    </span>
  );
}

function IconButton({ label, onClick, children, solid, badge }: { label: string; onClick: () => void; children: React.ReactNode; solid: boolean; badge?: number }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`relative grid h-11 w-11 place-items-center rounded-full transition-colors ${solid ? "hover:bg-ink/5" : "hover:bg-paper/10"}`}
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
      {badge ? <Badge n={badge} /> : null}
    </button>
  );
}
