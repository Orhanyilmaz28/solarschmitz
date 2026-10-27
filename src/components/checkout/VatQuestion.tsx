"use client";

import type { ReactNode } from "react";
import { formatEUR } from "@/lib/format";
import { zeroRateConditions, zeroRateFallback } from "@/lib/cart/vat";
import { Icon } from "@/components/ui/Icon";

export type VatAnswer = "yes" | "no";

interface Props {
  value: VatAnswer | null;
  onChange: (value: VatAnswer) => void;
  error?: string;
  /** Summe mit Nullsteuersatz */
  zeroTotal: number;
  /** Summe mit Regelsteuersatz */
  standardTotal: number;
  /** Warenkorb enthält auch Artikel, die immer 19 % haben */
  mixed: boolean;
  shippingKnown: boolean;
}

/**
 * Pflichtfrage zum Nullsteuersatz (§ 12 Abs. 3 UStG). Ohne Antwort geht es nicht weiter,
 * die Summen beider Antworten stehen direkt an den Optionen.
 */
export function VatQuestion({ value, onChange, error, zeroTotal, standardTotal, mixed, shippingKnown }: Props) {
  const suffix = shippingKnown ? "inkl. Versand" : "ohne Versand";
  return (
    <div>
      <p className="max-w-[62ch] text-[15px] leading-relaxed text-muted">
        Für Solarmodule, Wechselrichter, Speicher und die wesentlichen Komponenten einer Photovoltaikanlage gilt 0 % Umsatzsteuer, wenn diese
        Voraussetzungen erfüllt sind (§ 12 Abs. 3 UStG). Deine Antwort bestimmt den Endpreis.
      </p>
      <ul className="mt-5 space-y-3">
        {zeroRateConditions.map((c) => (
          <li key={c} className="flex gap-3 text-[15px] leading-relaxed">
            <span aria-hidden className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sun-soft text-[#7a4a00]">
              <Icon name="check" size={13} strokeWidth={2.2} />
            </span>
            <span>{c}</span>
          </li>
        ))}
      </ul>

      <fieldset className="mt-8" aria-describedby={error ? "vat-error" : "vat-note"}>
        <legend className="text-[15px] font-semibold">Treffen diese Voraussetzungen auf dich zu?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Choice
            id="vat-yes"
            checked={value === "yes"}
            invalid={Boolean(error)}
            onSelect={() => onChange("yes")}
            title="Ja, sie treffen zu"
            text={mixed ? "0\u00a0% USt. auf Photovoltaik-Komponenten, 19\u00a0% auf die übrigen Artikel" : "0\u00a0% USt. auf alle Artikel"}
            amount={
              <>
                {formatEUR(zeroTotal)} <span className="text-xs font-normal text-muted">{suffix}</span>
              </>
            }
          />
          <Choice
            id="vat-no"
            checked={value === "no"}
            invalid={Boolean(error)}
            onSelect={() => onChange("no")}
            title="Nein"
            text="19\u00a0% USt. auf alle Artikel"
            amount={
              <>
                {formatEUR(standardTotal)} <span className="text-xs font-normal text-muted">{suffix}</span>
              </>
            }
          />
        </div>
        {error && (
          <p id="vat-error" role="alert" className="field-error">
            {error}
          </p>
        )}
      </fieldset>
      <p id="vat-note" className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-muted">
        {zeroRateFallback} Mit „Ja“ bestätigst du, dass die Voraussetzungen für diese Bestellung erfüllt sind.
      </p>
    </div>
  );
}

function Choice({
  id,
  checked,
  invalid,
  onSelect,
  title,
  text,
  amount,
}: {
  id: string;
  checked: boolean;
  invalid: boolean;
  onSelect: () => void;
  title: string;
  text: string;
  amount: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={`relative flex min-h-[112px] cursor-pointer flex-col justify-between gap-4 rounded-2xl border bg-white p-5 transition-[border-color,box-shadow] duration-300 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-sun/30 ${
        checked ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : invalid ? "border-danger/60" : "border-line hover:border-ink/40"
      }`}
    >
      <span className="flex items-start gap-3">
        <input
          id={id}
          type="radio"
          name="vat-answer"
          checked={checked}
          onChange={onSelect}
          aria-invalid={invalid ? true : undefined}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${checked ? "border-ink bg-ink" : "border-ink/30 bg-white"}`}
        >
          <span className={`h-2 w-2 rounded-full bg-paper transition-transform duration-300 ${checked ? "scale-100" : "scale-0"}`} />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold leading-snug">{title}</span>
          <span className="mt-1 block text-sm leading-snug text-muted">{text}</span>
        </span>
      </span>
      <span className="pl-8 text-[15px] font-semibold tabular">{amount}</span>
    </label>
  );
}
