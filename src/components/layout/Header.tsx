"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { mainNav } from "@/config/navigation";
import { useCart, cartCount } from "@/lib/cart/store";
import { useCompare } from "@/lib/compare/store";
import { Icon } from "@/components/ui/Icon";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";

/**
 * Kopfzeile.
 * Über dem Hero transparent, beim Scrollen fest, hell und etwas flacher.
 * Sichtbare Suche (ab xl als Feld), Warenkorb-Status, Haupt-Handlung „Jetzt konfigurieren“,
 * Lesefortschritt als feine Linie in Sonnenfarben.
 */
export function Header() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [bump, setBump] = useState(false);
  const [overDark, setOverDark] = useState(false);
  const [menuTop, setMenuTop] = useState(80);
  const headerRef = useRef<HTMLElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lines = useCart((s) => s.lines);
  const openCart = useCart((s) => s.open);
  const compareCount = useCompare((s) => s.ids.length);
  const count = cartCount(lines);
  const prevCount = useRef(count);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress.current) progress.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  // Warenkorb-Zähler kurz hervorheben, wenn etwas dazukommt
  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 600);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  useEffect(() => {
    setMega(false);
    setMobile(false);
    setSearch(false);
  }, [pathname]);

  // Liegt unter der Kopfzeile ein dunkler Abschnitt (data-header="dark"), wird sie dunkel
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    const setup = () => {
      io?.disconnect();
      const hits = new Set<Element>();
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => (e.isIntersecting ? hits.add(e.target) : hits.delete(e.target)));
          setOverDark(hits.size > 0);
        },
        // Band unter der Kopfzeile; oben 1 px eingerückt, damit ein Abschnitt, der genau an der Oberkante endet, nicht mehr zählt
        { rootMargin: `-1px 0px -${Math.max(0, window.innerHeight - 72)}px 0px` },
      );
      document.querySelectorAll('[data-header="dark"]').forEach((el) => io!.observe(el));
    };
    const id = requestAnimationFrame(setup);
    let t: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(setup, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      io?.disconnect();
    };
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

  // clear: transparent über dem Hero · dark: dunkles Glas · light: helles Glas · open: Menü offen
  const mode: "clear" | "dark" | "light" | "open" = mega || mobile ? "open" : overHero && !scrolled ? "clear" : overDark ? "dark" : "light";
  const solid = mode === "light" || mode === "open";
  const tone = solid ? "light" : "dark";
  const hover = solid ? "hover:bg-ink/[0.06]" : "hover:bg-paper/10";

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMega(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(false), 180);
  };
  // Das Handy-Menü beginnt direkt unter der Kopfzeile (Vorschau-Leiste darüber eingerechnet)
  const toggleMobile = () => {
    if (!mobile && headerRef.current) setMenuTop(Math.round(headerRef.current.getBoundingClientRect().top) + 80);
    setMobile(!mobile);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky z-50 transition-[background-color,box-shadow,color] duration-500 ease-[var(--ease-out-expo)] ${overHero ? "-mb-[80px]" : ""} ${
          mode === "open"
            ? "bg-paper text-ink shadow-[0_1px_0_rgb(16_24_32/0.07)]"
            : mode === "light"
              ? "bg-paper/80 text-ink shadow-[0_1px_0_rgb(16_24_32/0.07)] backdrop-blur-2xl backdrop-saturate-150"
              : mode === "dark"
                ? "bg-night/65 text-paper shadow-[0_1px_0_rgb(248_250_247/0.07)] backdrop-blur-2xl backdrop-saturate-150"
                : "bg-transparent text-paper"
        }`}
        style={{ top: "env(safe-area-inset-top, 0px)" }}
        onMouseLeave={scheduleClose}
      >
        <div
          className={`container-x flex items-center gap-3 transition-[height] duration-500 ease-[var(--ease-out-expo)] sm:gap-5 ${
            scrolled && !mobile ? "h-[66px]" : "h-[80px]"
          }`}
        >
          <Link href="/" aria-label="Sonnenwerk – zur Startseite" className="shrink-0 rounded-md">
            <Logo tone={tone} height={26} animated glow={tone === "dark"} className="h-[22px] w-auto min-[400px]:h-[25px]" />
          </Link>

          <nav aria-label="Hauptnavigation" className="ml-4 hidden items-center lg:flex xl:ml-8">
            <button
              type="button"
              aria-expanded={mega}
              aria-controls="mega-menu"
              onMouseEnter={openMega}
              onClick={() => setMega((m) => !m)}
              className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[15px] font-medium transition-colors ${hover} ${
                mega ? (solid ? "bg-ink/[0.06]" : "bg-paper/10") : ""
              }`}
            >
              Produkte
              <Icon name="chevron-down" size={14} strokeWidth={2} className={`transition-transform duration-300 ${mega ? "rotate-180" : ""}`} />
            </button>
            {mainNav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onMouseEnter={scheduleClose}
                aria-current={pathname.startsWith(l.href) ? "page" : undefined}
                className={`relative h-10 items-center whitespace-nowrap rounded-full px-4 text-[15px] font-medium transition-colors ${hover} ${
                  l.wide ? "hidden min-[1400px]:inline-flex" : "inline-flex"
                } after:absolute after:inset-x-4 after:bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 aria-[current=page]:after:scale-x-100`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            {/* Sichtbare Suche ab xl, sonst Symbol */}
            <button
              type="button"
              onClick={() => setSearch(true)}
              className={`hidden h-10 w-[230px] items-center gap-2.5 whitespace-nowrap rounded-full border px-4 text-left text-sm transition-colors xl:flex ${
                solid ? "border-ink/10 bg-white/70 text-muted hover:border-ink/25" : "border-paper/20 bg-paper/[0.06] text-paper/70 hover:border-paper/40"
              }`}
            >
              <Icon name="search" size={16} />
              <span className="flex-1">Produkte suchen</span>
              <kbd className={`rounded-md border px-1.5 font-mono text-[11px] ${solid ? "border-ink/10" : "border-paper/20"}`}>Strg K</kbd>
            </button>
            <button type="button" aria-label="Suche öffnen" onClick={() => setSearch(true)} className={`grid h-11 w-11 place-items-center rounded-full transition-colors xl:hidden ${hover}`}>
              <Icon name="search" size={20} />
            </button>
            <Link
              href="/vergleich"
              aria-label={`Produktvergleich, ${compareCount} Produkte`}
              className={`relative hidden h-11 w-11 place-items-center rounded-full transition-colors sm:grid ${hover}`}
            >
              <Icon name="compare" size={20} />
              {compareCount > 0 && <Badge n={compareCount} />}
            </Link>
            <button
              type="button"
              aria-label={`Warenkorb öffnen, ${count} ${count === 1 ? "Artikel" : "Artikel"}`}
              onClick={openCart}
              className={`relative grid h-11 w-11 place-items-center rounded-full transition-colors ${hover}`}
            >
              <Icon name="cart" size={20} />
              {count > 0 && <Badge n={count} bump={bump} />}
            </button>
            <Link
              href="/konfigurator"
              className={`ml-2 hidden h-10 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors lg:inline-flex ${
                solid ? "bg-ink text-paper hover:bg-ink-3" : "bg-paper text-ink hover:bg-white"
              }`}
            >
              Jetzt konfigurieren
            </Link>
            <button
              type="button"
              className={`ml-0.5 grid h-11 w-11 place-items-center rounded-full lg:hidden ${hover}`}
              aria-label={mobile ? "Menü schließen" : "Menü öffnen"}
              aria-expanded={mobile}
              aria-controls="mobile-menu"
              onClick={toggleMobile}
            >
              <span className="relative block h-3 w-5">
                <span className={`absolute left-0 h-[1.6px] w-5 bg-current transition-transform duration-500 ease-[var(--ease-out-expo)] ${mobile ? "top-[5px] rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 h-[1.6px] w-5 bg-current transition-transform duration-500 ease-[var(--ease-out-expo)] ${mobile ? "top-[5px] -rotate-45" : "top-[10px]"}`} />
              </span>
            </button>
          </div>
        </div>

        {/* Lesefortschritt */}
        <div aria-hidden className={`absolute inset-x-0 bottom-0 h-[2px] overflow-hidden transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}>
          <div ref={progress} className="h-full origin-left bg-[image:var(--sun-gradient)]" style={{ transform: "scaleX(0)" }} />
        </div>

        <MegaMenu open={mega} onEnter={openMega} onLeave={scheduleClose} onNavigate={() => setMega(false)} />
      </header>
      <MobileMenu open={mobile} top={menuTop} onClose={() => setMobile(false)} onSearch={() => setSearch(true)} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}

function Badge({ n, bump = false }: { n: number; bump?: boolean }) {
  return (
    <span
      className={`absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[image:var(--sun-gradient)] px-1 font-mono text-[10.5px] font-semibold text-ink tabular transition-transform duration-300 ${
        bump ? "scale-125" : "scale-100"
      }`}
    >
      {n}
    </span>
  );
}
