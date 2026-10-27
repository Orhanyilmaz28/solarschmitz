"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart/store";
import { resolveCart } from "@/lib/cart/totals";
import { formatEUR } from "@/lib/format";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/config/site";

export function CartDrawer() {
  const { lines, isOpen, close, setQuantity, remove } = useCart();
  const panel = useRef<HTMLDivElement>(null);
  const totals = resolveCart(lines);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <div aria-hidden={!isOpen} className={`fixed inset-0 z-[80] overflow-hidden ${isOpen ? "" : "pointer-events-none"}`}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-ink/50 backdrop-blur-[2px] transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Warenkorb"
        tabIndex={-1}
        data-lenis-prevent
        className={`absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-paper shadow-[var(--shadow-lift)] outline-none transition-transform duration-700 ease-[var(--ease-out-expo)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="display-md m-0 text-2xl">Warenkorb</h2>
          <button type="button" onClick={close} aria-label="Warenkorb schließen" className="grid h-10 w-10 place-items-center rounded-full hover:bg-mist">
            <svg viewBox="0 0 20 20" className="h-5 w-5">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {totals.lines.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-semibold">Dein Warenkorb ist leer</p>
              <p className="mt-1 text-muted">Finde mit dem Produktfinder das passende Set.</p>
              <div className="mt-6 flex justify-center">
                <ButtonLink href="/konfigurator" onClick={close} variant="dark" arrow>
                  Produktfinder starten
                </ButtonLink>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {totals.lines.map(({ product, quantity, lineTotal }) => (
                <li key={product.id} className="grid grid-cols-[72px_1fr_auto] items-center gap-4 py-4">
                  <div className="h-[72px] w-[72px] rounded-xl bg-mist p-1.5">
                    <ProductVisual visual={product.visual} className="h-full w-full" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/produkt/${product.slug}`} onClick={close} className="line-clamp-2 text-sm font-semibold hover:underline">
                      {product.name}
                    </Link>
                    <div className="mt-2 inline-flex items-center rounded-full border border-line">
                      <button type="button" aria-label="Menge verringern" onClick={() => setQuantity(product.id, quantity - 1)} className="h-8 w-8 rounded-full hover:bg-mist">
                        −
                      </button>
                      <span className="w-6 text-center font-mono text-sm tabular">{quantity}</span>
                      <button type="button" aria-label="Menge erhöhen" onClick={() => setQuantity(product.id, quantity + 1)} className="h-8 w-8 rounded-full hover:bg-mist">
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm tabular">{formatEUR(lineTotal)}</p>
                    <button type="button" onClick={() => remove(product.id)} className="mt-2 text-xs text-muted underline-offset-2 hover:underline">
                      Entfernen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {totals.lines.length > 0 && (
          <div className="space-y-3 border-t border-line px-6 py-5">
            <div className="flex justify-between text-sm">
              <span>Zwischensumme</span>
              <span className="font-mono tabular">{formatEUR(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span>Versand</span>
              <span className="text-right text-muted">
                {totals.shipping === null ? "wird noch festgelegt" : totals.shipping === 0 ? "kostenlos" : formatEUR(totals.shipping)}
              </span>
            </div>
            {totals.hasUnverified && (
              <p className="rounded-xl bg-mist px-3 py-2 text-xs text-muted">
                Vorschau: Preise sind Richtpreise unseres Lieferanten und noch nicht bestätigt. {site.shipping.carrierNote}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <ButtonLink href="/warenkorb" onClick={close} variant="outline">
                Warenkorb
              </ButtonLink>
              <ButtonLink href="/checkout" onClick={close} variant="primary">
                Zur Kasse
              </ButtonLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
