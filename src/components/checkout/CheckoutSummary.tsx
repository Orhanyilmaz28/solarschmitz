import Link from "next/link";
import type { CartTotals } from "@/lib/cart/totals";
import { formatEUR } from "@/lib/format";
import { brand } from "@/config/brand";
import { LineThumb } from "./LineThumb";
import { OrderTotals } from "./OrderTotals";

interface Props {
  totals: CartTotals;
  /** Hinweis, solange die Frage zur Umsatzsteuer offen ist */
  pendingNote?: string;
  checkoutEnabled: boolean;
}

/** Bestellübersicht neben dem Formular (Desktop mitlaufend, mobil aufklappbar) */
export function CheckoutSummary({ totals, pendingNote, checkoutEnabled }: Props) {
  const { contact } = brand;
  return (
    <>
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-[var(--shadow-soft)] md:p-7">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="t-h3 m-0">Deine Bestellung</h2>
          <Link href="/warenkorb" className="text-sm font-semibold underline decoration-ink/20 underline-offset-4 hover:decoration-ink">
            Ändern
          </Link>
        </div>
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {totals.lines.map(({ product, quantity, lineTotal }) => (
            <li key={product.id} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3.5 py-3">
              <LineThumb product={product} className="h-14 w-14">
                <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] font-semibold text-paper">
                  <span className="sr-only">Menge </span>
                  {quantity}
                </span>
              </LineThumb>
              <span className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</span>
              <span className="text-sm font-semibold tabular">{formatEUR(lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <OrderTotals totals={totals} pendingNote={pendingNote} openShippingText="noch nicht festgelegt" />
        </div>
        {!checkoutEnabled && (
          <p className="mt-5 flex gap-2.5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
            <span aria-hidden className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sun" />
            <span>
              <span className="font-semibold text-ink">Vorschau:</span> Du kannst alle Schritte ausprobieren. Bestellen ist möglich, sobald Zahlung und
              Versand eingerichtet sind. Deine Eingaben werden nicht gespeichert oder übertragen.
            </span>
          </p>
        )}
      </div>
      {contact.phone && (
        <p className="mt-5 px-1 text-sm text-muted">
          Fragen zur Bestellung?{" "}
          <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="font-semibold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-ink">
            {contact.phone}
          </a>{" "}
          · {contact.hours}
        </p>
      )}
    </>
  );
}
