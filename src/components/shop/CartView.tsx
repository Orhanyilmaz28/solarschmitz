"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/store";
import { resolveCart } from "@/lib/cart/totals";
import { suggestAccessories } from "@/lib/cart/accessories";
import { essentialFeatures } from "@/lib/cart/features";
import { getAllProducts, getCategory } from "@/lib/catalog";
import { formatEUR } from "@/lib/format";
import { site } from "@/config/site";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LineThumb } from "@/components/checkout/LineThumb";
import { QuantityStepper } from "@/components/checkout/QuantityStepper";
import { OrderTotals } from "@/components/checkout/OrderTotals";
import { ZeroRateHint } from "@/components/checkout/ZeroRateHint";
import { AccessorySuggestions } from "@/components/checkout/AccessorySuggestions";
import { ServiceFacts } from "@/components/checkout/ServiceFacts";
import { DataStatusChip } from "./DataStatus";
import { useCartHydrated } from "./useHydrated";

/** Bestellen ist erst möglich, wenn Vorschau beendet und Versand festgelegt ist. */
const orderingOpen = !site.previewMode && site.shipping.status === "configured";

export function CartView() {
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const hydrated = useCartHydrated();

  // Warenkorb zeigt die Katalogpreise (0 % für Photovoltaik). Die Kasse fragt die Voraussetzungen ab.
  const totals = resolveCart(lines, { zeroRateConfirmed: true });
  const standard = resolveCart(lines, { zeroRateConfirmed: false });
  const suggestions = suggestAccessories(
    totals.lines.map((l) => l.product),
    getAllProducts(),
    3,
  );

  if (!hydrated) {
    return (
      <div className="grid gap-10 lg:grid-cols-12" aria-busy="true" aria-label="Warenkorb wird geladen">
        <div className="space-y-4 lg:col-span-7">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-stone" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-stone lg:col-span-5" />
      </div>
    );
  }

  if (totals.lines.length === 0) return <EmptyCart />;

  return (
    <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7">
        {/* Mobil: Summe und Kasse sofort sichtbar */}
        <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 pl-5 lg:hidden">
          <div className="min-w-0">
            <p className="text-xs text-muted">{totals.shipping === null ? "Summe ohne Versand" : "Gesamtsumme"}</p>
            <p className="t-num mt-1 text-[1.5rem] tabular">{formatEUR(totals.total)}</p>
            <p className="mt-1 text-[11px] text-muted">{totals.shipping === null ? "inkl. USt., zzgl. Versand" : "inkl. USt. und Versand"}</p>
          </div>
          <ButtonLink href="/checkout" variant="primary" className="shrink-0" arrow>
            Zur Kasse
          </ButtonLink>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
          <p className="t-label">
            {totals.itemCount} Artikel
          </p>
          <Link href="/produkte" className="text-sm font-semibold underline decoration-ink/20 underline-offset-4 hover:decoration-ink">
            Weiter einkaufen
          </Link>
        </div>

        <ul className="divide-y divide-line border-b border-line">
          {totals.lines.map(({ product, quantity, unitPrice, lineTotal, vatRate }) => {
            const features = essentialFeatures(product).slice(0, 3);
            const href = `/produkt/${product.slug}`;
            return (
              <li key={product.id} className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-4 gap-y-4 py-6 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:gap-x-6 md:py-8">
                <Link href={href} aria-label={product.name} className="block">
                  <LineThumb product={product} className="h-[84px] w-[84px] sm:h-[120px] sm:w-[120px]" />
                </Link>
                <div className="min-w-0">
                  <p className="t-label !text-[10.5px]">{product.brand}</p>
                  <Link href={href} className="mt-1.5 block font-display text-[1.0625rem] font-semibold leading-snug tracking-[-0.015em] hover:underline md:text-[1.1875rem]">
                    {product.name}
                  </Link>
                  {features.length > 0 && <p className="mt-1.5 text-sm text-muted">{features.join(" · ")}</p>}
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
                    <span className="font-medium tabular text-ink">{formatEUR(unitPrice)}</span>
                    <span>je Stück · inkl. {vatRate} % USt.</span>
                    <DataStatusChip product={product} className="!py-0.5 !text-[11px]" />
                  </p>
                  <div className="mt-4 flex items-center gap-5">
                    <QuantityStepper value={quantity} label={product.name} onChange={(q) => setQuantity(product.id, q)} />
                    <button
                      type="button"
                      onClick={() => remove(product.id)}
                      className="inline-flex h-11 items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
                    >
                      <Icon name="close" size={15} />
                      Entfernen
                    </button>
                  </div>
                </div>
                <p className="col-start-2 -mt-1 text-right sm:col-start-auto sm:mt-0">
                  <span className="t-num tabular text-[1.25rem] md:text-[1.375rem]">{formatEUR(lineTotal)}</span>
                </p>
              </li>
            );
          })}
        </ul>

        {suggestions.length > 0 && (
          <div className="mt-14">
            <AccessorySuggestions items={suggestions} />
          </div>
        )}
      </div>

      <aside aria-label="Zusammenfassung" className="min-w-0 lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-[var(--shadow-soft)] md:p-8">
            <h2 className="t-h3 m-0">Zusammenfassung</h2>
            <div className="mt-6">
              <OrderTotals totals={totals} />
            </div>
            {totals.hasZeroRateEligible && (
              <div className="mt-5">
                <ZeroRateHint standardTotal={standard.total} />
              </div>
            )}
            <ButtonLink href="/checkout" variant="primary" size="lg" className="mt-6 w-full" arrow>
              Zur Kasse
            </ButtonLink>
            <p className="mt-3 text-center text-xs leading-relaxed text-muted">
              {orderingOpen
                ? "Lieferzeit und Versandkosten siehst du vor der Bestellung."
                : "Vorschau: Bestellen ist noch nicht möglich. Den Ablauf an der Kasse kannst du schon ansehen."}
            </p>
            {totals.hasUnverified && (
              <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                <span className="font-semibold text-ink">Richtpreise:</span> Die Preise stammen aus dem Katalog unseres Lieferanten und sind noch nicht
                bestätigt.
              </p>
            )}
          </div>
          <ServiceFacts className="mt-8" />
        </div>
      </aside>
    </div>
  );
}

function EmptyCart() {
  const starts = ["balkonkraftwerke", "balkonkraftwerke-mit-speicher", "batteriespeicher"]
    .map((slug) => getCategory(slug))
    .filter((c) => c !== undefined)
    .map((c) => ({ href: `/kategorie/${c.slug}`, title: c.name, text: c.tagline }));
  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <p className="t-h2 m-0 max-w-[16ch]">Noch nichts im Warenkorb.</p>
        <p className="t-lead mt-5 max-w-[46ch]">
          Der Produktfinder schlägt dir in wenigen Schritten ein Set vor, das zu deinem Balkon, Dach oder Garten passt.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/konfigurator" variant="primary" size="lg" arrow>
            Produktfinder starten
          </ButtonLink>
          <ButtonLink href="/produkte" variant="outline" size="lg">
            Alle Produkte
          </ButtonLink>
        </div>
      </div>
      <nav aria-label="Einstiege" className="lg:col-span-5 lg:col-start-8">
        <p className="t-label">Beliebte Einstiege</p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {starts.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="group flex items-center justify-between gap-4 py-5">
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold tracking-[-0.02em] group-hover:underline">{s.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{s.text}</span>
                </span>
                <Icon name="arrow-right" size={20} className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
