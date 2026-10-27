import Link from "next/link";
import type { CartTotals } from "@/lib/cart/totals";
import { formatEUR } from "@/lib/format";

interface Props {
  totals: CartTotals;
  /** Kompakte Darstellung (Drawer) */
  size?: "md" | "sm";
  /** Text statt Summe, solange der Steuersatz offen ist */
  pendingNote?: string;
  /** Text, solange Versandkosten nicht feststehen */
  openShippingText?: string;
}

/**
 * Summenblock nach PAngV: Gesamtpreis inkl. Umsatzsteuer, Versandkosten ausdrücklich genannt
 * (oder als „wird vor der Bestellung angezeigt“, solange sie nicht feststehen), USt. je Satz.
 */
export function OrderTotals({ totals, size = "md", pendingNote, openShippingText = "wird vor der Bestellung angezeigt" }: Props) {
  const sm = size === "sm";
  const shippingKnown = totals.shipping !== null;
  const row = `flex items-baseline justify-between gap-4 ${sm ? "text-sm" : "text-[15px]"}`;
  return (
    <div>
      <dl className={sm ? "space-y-2" : "space-y-3"}>
        <div className={row}>
          <dt>
            Zwischensumme <span className="text-muted">({totals.itemCount} Artikel)</span>
          </dt>
          <dd className="font-medium tabular">{formatEUR(totals.subtotal)}</dd>
        </div>
        <div className={row}>
          <dt>
            <Link href="/versand" className="underline decoration-ink/20 underline-offset-4 hover:decoration-ink">
              Versand
            </Link>
          </dt>
          <dd className="text-right">
            {totals.shipping === null ? (
              <span className="text-muted">{openShippingText}</span>
            ) : totals.shipping === 0 ? (
              "kostenlos"
            ) : (
              <span className="font-medium tabular">{formatEUR(totals.shipping)}</span>
            )}
          </dd>
        </div>
      </dl>

      <div className={`mt-4 border-t border-line ${sm ? "pt-3" : "pt-5"}`}>
        <div className="flex items-baseline justify-between gap-4">
          <p className={`font-semibold ${sm ? "text-[15px]" : "text-base"}`}>{shippingKnown ? "Gesamtsumme" : "Summe ohne Versand"}</p>
          <p className={`t-num tabular ${sm ? "text-[1.375rem]" : "text-[1.875rem]"}`} aria-live="polite">
            {formatEUR(totals.total)}
          </p>
        </div>
        <p className="mt-1 text-right text-xs text-muted">{shippingKnown ? "inkl. USt. und Versand" : "inkl. USt., zzgl. Versand"}</p>
        {pendingNote && <p className="mt-3 rounded-xl bg-sun-soft/60 px-3 py-2 text-xs leading-relaxed text-[#6b4200]">{pendingNote}</p>}
        <dl className="mt-3 space-y-1 text-xs text-muted">
          {totals.vatBreakdown.map((b) => (
            <div key={b.rate} className="flex justify-between gap-4">
              <dt>{b.rate === 0 ? "USt. 0 % (§ 12 Abs. 3 UStG)" : `enthaltene USt. ${b.rate} %`}</dt>
              <dd className="tabular">{formatEUR(b.vat)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
