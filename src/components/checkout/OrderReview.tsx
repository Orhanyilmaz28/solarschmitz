import type { CartTotals } from "@/lib/cart/totals";
import { essentialFeatures, scopeOfDelivery } from "@/lib/cart/features";
import { formatEUR } from "@/lib/format";
import { LineThumb } from "./LineThumb";

/**
 * Wesentliche Merkmale jeder Position direkt vor dem Bestellknopf (§ 312j Abs. 2 BGB):
 * Name, technische Eckdaten, Lieferumfang, Menge, Einzel- und Gesamtpreis mit Steuersatz.
 */
export function OrderReview({ totals }: { totals: CartTotals }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {totals.lines.map(({ product, quantity, unitPrice, lineTotal, vatRate }) => {
        const features = essentialFeatures(product);
        const scope = scopeOfDelivery(product);
        return (
          <li key={product.id} className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-4 gap-y-2 py-5 sm:grid-cols-[64px_minmax(0,1fr)_auto]">
            <LineThumb product={product} className="h-14 w-14 sm:h-16 sm:w-16" />
            <div className="min-w-0">
              <p className="font-semibold leading-snug">{product.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {product.brand} · Art.-Nr. {product.sku}
              </p>
              {features.length > 0 && <p className="mt-2 text-sm leading-relaxed text-ink/85">{features.join(" · ")}</p>}
              {scope && <p className="mt-1 text-sm leading-relaxed text-muted">Lieferumfang: {scope}</p>}
              <p className="mt-2 text-sm">
                {quantity} × {formatEUR(unitPrice)} <span className="text-muted">· inkl. {vatRate} % USt.</span>
              </p>
            </div>
            <p className="col-start-2 font-semibold tabular sm:col-start-auto sm:text-right">{formatEUR(lineTotal)}</p>
          </li>
        );
      })}
    </ul>
  );
}
