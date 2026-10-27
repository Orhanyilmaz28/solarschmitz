"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart/store";
import { resolveCart } from "@/lib/cart/totals";
import { suggestAccessories } from "@/lib/cart/accessories";
import { getAllProducts } from "@/lib/catalog";
import { formatEUR } from "@/lib/format";
import { site } from "@/config/site";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LineThumb } from "@/components/checkout/LineThumb";
import { QuantityStepper } from "@/components/checkout/QuantityStepper";
import { ZeroRateHint } from "@/components/checkout/ZeroRateHint";
import { AccessorySuggestions } from "@/components/checkout/AccessorySuggestions";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

export function CartDrawer() {
  const { lines, isOpen, close, setQuantity, remove } = useCart();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  const totals = resolveCart(lines, { zeroRateConfirmed: true });
  const standard = resolveCart(lines, { zeroRateConfirmed: false });
  const suggestions = isOpen ? suggestAccessories(totals.lines.map((l) => l.product), getAllProducts(), 2) : [];

  useEffect(() => {
    if (!isOpen) return;
    opener.current = document.activeElement;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      // Fokus im Dialog halten
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, [isOpen, close]);

  const empty = totals.lines.length === 0;

  return (
    <div aria-hidden={!isOpen} inert={!isOpen} className={`fixed inset-0 z-[80] overflow-hidden ${isOpen ? "" : "pointer-events-none"}`}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-night/55 backdrop-blur-[3px] transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        tabIndex={-1}
        data-lenis-prevent
        className={`absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col bg-paper shadow-[var(--shadow-lift)] outline-none transition-[transform,visibility] duration-700 ease-[var(--ease-out-expo)] ${
          isOpen ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
          <h2 id="cart-drawer-title" className="t-h3 m-0 flex items-baseline gap-2.5">
            Warenkorb
            {!empty && <span className="font-mono text-sm font-normal tracking-normal text-muted">{totals.itemCount}</span>}
          </h2>
          <button type="button" onClick={close} aria-label="Warenkorb schließen" className="-mr-2 grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-stone">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7">
          {empty ? (
            <div className="py-16">
              <p className="t-h3 m-0">Noch nichts im Warenkorb.</p>
              <p className="mt-2 max-w-[34ch] text-muted">Der Produktfinder schlägt dir in wenigen Schritten ein passendes Set vor.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/konfigurator" onClick={close} variant="dark" arrow>
                  Produktfinder starten
                </ButtonLink>
                <ButtonLink href="/produkte" onClick={close} variant="outline">
                  Alle Produkte
                </ButtonLink>
              </div>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-line">
                {totals.lines.map(({ product, quantity, unitPrice, lineTotal, vatRate }) => (
                  <li key={product.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 py-5">
                    <Link href={`/produkt/${product.slug}`} onClick={close} aria-label={product.name}>
                      <LineThumb product={product} className="h-[72px] w-[72px]" />
                    </Link>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <Link href={`/produkt/${product.slug}`} onClick={close} className="line-clamp-2 text-[15px] font-semibold leading-snug hover:underline">
                          {product.name}
                        </Link>
                        <p className="shrink-0 text-[15px] font-semibold tabular">{formatEUR(lineTotal)}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {formatEUR(unitPrice)} je Stück · inkl. {vatRate} % USt.
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <QuantityStepper size="sm" value={quantity} label={product.name} onChange={(q) => setQuantity(product.id, q)} />
                        <button
                          type="button"
                          onClick={() => remove(product.id)}
                          className="h-10 px-1 text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline"
                        >
                          Entfernen
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {totals.hasZeroRateEligible && (
                <div className="pb-2 pt-1">
                  <ZeroRateHint standardTotal={standard.total} size="sm" />
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="mt-6 border-t border-line pb-6 pt-5">
                  <AccessorySuggestions items={suggestions} size="sm" onNavigate={close} />
                </div>
              )}
            </>
          )}
        </div>

        {!empty && (
          <div className="border-t border-line bg-white px-5 pb-5 pt-4 sm:px-7">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[15px] font-semibold">{totals.shipping === null ? "Summe ohne Versand" : "Gesamtsumme"}</p>
              <p className="t-num tabular text-[1.5rem]">{formatEUR(totals.total)}</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {totals.shipping === null ? (
                <>
                  inkl. USt., zzgl.{" "}
                  <Link href="/versand" onClick={close} className="underline underline-offset-2">
                    Versand
                  </Link>{" "}
                  (wird vor der Bestellung angezeigt)
                </>
              ) : (
                "inkl. USt. und Versand"
              )}
              {totals.hasUnverified && (
                <>
                  <br />
                  Richtpreise, noch nicht bestätigt
                </>
              )}
            </p>
            <ButtonLink href="/checkout" onClick={close} variant="primary" size="lg" className="mt-4 w-full" arrow>
              Zur Kasse
            </ButtonLink>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <Link href="/warenkorb" onClick={close} className="inline-flex h-10 items-center font-semibold underline decoration-ink/20 underline-offset-4 hover:decoration-ink">
                Warenkorb ansehen
              </Link>
              {site.previewMode && <span className="text-xs text-muted">Vorschau, noch keine Bestellung</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
