import { formatEUR } from "@/lib/format";
import { zeroRateConditions, zeroRateFallback } from "@/lib/cart/vat";

/**
 * Hinweis im Warenkorb: Preise mit 0 % USt. gelten nur unter Voraussetzungen.
 * Zeigt die Summe mit Regelsteuersatz als Alternative, damit nichts überrascht.
 */
export function ZeroRateHint({ standardTotal, size = "md" }: { standardTotal: number; size?: "md" | "sm" }) {
  return (
    <div className={`rounded-2xl border border-line bg-stone/70 ${size === "sm" ? "p-3.5 text-[13px]" : "p-4 text-[13.5px]"} leading-relaxed`}>
      <p className="flex items-start gap-2.5 font-semibold text-ink">
        <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[linear-gradient(135deg,#ffd84d,#ff6f1a)]" />
        0&nbsp;% USt. auf Photovoltaik-Komponenten
      </p>
      <p className="mt-1 pl-4 text-muted">
        Gilt, wenn du die Anlage selbst betreibst und sie an oder nahe einem Wohngebäude steht. Das bestätigst du an der Kasse. Trifft es nicht zu,
        beträgt die Summe <strong className="font-semibold text-ink">{formatEUR(standardTotal)}</strong> inkl. 19&nbsp;% USt.
      </p>
      <details className="group mt-2 pl-4">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink [&::-webkit-details-marker]:hidden">
          Voraussetzungen im Detail
          <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform group-open:rotate-180">
            <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-muted marker:text-sun-3">
          {zeroRateConditions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="mt-2 text-muted">{zeroRateFallback}</p>
      </details>
    </div>
  );
}
