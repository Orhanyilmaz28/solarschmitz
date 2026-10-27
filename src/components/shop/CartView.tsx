"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/store";
import { resolveCart } from "@/lib/cart/totals";
import { formatEUR, vatLabel } from "@/lib/format";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { DataStatusChip } from "./DataStatus";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/content/Notice";
import { site } from "@/config/site";
import { useCartHydrated } from "./useHydrated";

export function CartView() {
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const hydrated = useCartHydrated();
  const totals = resolveCart(lines);

  if (!hydrated) return <div className="h-72 animate-pulse rounded-[var(--radius-card)] bg-mist" aria-label="Warenkorb wird geladen" />;

  if (totals.lines.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-white px-6 py-16 text-center">
        <p className="display-md m-0 text-2xl">Dein Warenkorb ist leer</p>
        <p className="mx-auto mt-3 max-w-[48ch] text-muted">Stöbere im Sortiment oder lass dir vom Produktfinder ein passendes Set vorschlagen.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/konfigurator" variant="primary" arrow>
            Produktfinder starten
          </ButtonLink>
          <ButtonLink href="/produkte" variant="outline">
            Alle Produkte
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
      <div className="min-w-0">
        <ul className="divide-y divide-line border-y border-line">
          {totals.lines.map(({ product, quantity, lineTotal }) => (
            <li key={product.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:gap-6">
              <Link href={`/produkt/${product.slug}`} className="block aspect-square rounded-2xl bg-mist p-2">
                <ProductVisual visual={product.visual} title={product.name} className="h-full w-full" />
              </Link>
              <div className="min-w-0">
                <DataStatusChip product={product} />
                <Link href={`/produkt/${product.slug}`} className="mt-2 block font-semibold leading-snug hover:underline">
                  {product.name}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {formatEUR(product.price)} je Stück · {vatLabel(product.vatRate)}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center rounded-full border border-line bg-white" role="group" aria-label={`Menge ${product.name}`}>
                    <button
                      type="button"
                      aria-label="Menge verringern"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                      className="h-10 w-10 rounded-l-full hover:bg-mist"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-mono tabular" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Menge erhöhen"
                      onClick={() => setQuantity(product.id, quantity + 1)}
                      disabled={quantity >= 20}
                      className="h-10 w-10 rounded-r-full hover:bg-mist disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <button type="button" onClick={() => remove(product.id)} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
                    Entfernen
                  </button>
                </div>
              </div>
              <p className="col-start-2 font-mono text-lg tabular sm:col-start-auto sm:text-right">{formatEUR(lineTotal)}</p>
            </li>
          ))}
        </ul>
        <Link href="/produkte" className="mt-6 inline-block text-sm font-semibold underline decoration-lime decoration-2 underline-offset-4">
          Weiter einkaufen
        </Link>
      </div>

      <aside aria-label="Zusammenfassung" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[var(--radius-card)] border border-line bg-white p-6">
          <h2 className="display-md m-0 text-xl">Zusammenfassung</h2>
          <dl className="mt-6 space-y-3 text-[15px]">
            <div className="flex justify-between gap-4">
              <dt>Zwischensumme</dt>
              <dd className="font-mono tabular">{formatEUR(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Versand</dt>
              <dd className="text-right text-muted">
                {totals.shipping === null ? "wird noch festgelegt" : totals.shipping === 0 ? "kostenlos" : formatEUR(totals.shipping)}
              </dd>
            </div>
            {totals.vatIncluded > 0 && (
              <div className="flex justify-between gap-4 text-sm text-muted">
                <dt>enthaltene MwSt. (19 %)</dt>
                <dd className="font-mono tabular">{formatEUR(totals.vatIncluded)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-line pt-4 text-lg font-semibold">
              <dt>Gesamt{totals.shipping === null ? " ohne Versand" : ""}</dt>
              <dd className="font-mono tabular">{formatEUR(totals.total)}</dd>
            </div>
          </dl>
          <ButtonLink href="/checkout" variant="primary" size="lg" className="mt-6 w-full" arrow>
            Zur Kasse
          </ButtonLink>
          <p className="mt-3 text-center text-xs text-muted">Bestellungen sind in der Vorschau noch nicht möglich.</p>
        </div>
        {totals.hasUnverified && (
          <Notice tone="preview" title="Vorschau-Preise" className="mt-4">
            Die Preise sind Richtpreise aus dem Katalog unseres Lieferanten und noch nicht bestätigt. {site.shipping.carrierNote}
          </Notice>
        )}
      </aside>
    </div>
  );
}
