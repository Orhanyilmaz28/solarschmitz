"use client";

import { Icon } from "@/components/ui/Icon";

interface Props {
  value: number;
  onChange: (next: number) => void;
  /** Produktname für Screenreader */
  label: string;
  max?: number;
  size?: "md" | "sm";
}

/** Mengenwahl mit großen Tippflächen. Menge 0 entfernt die Position. */
export function QuantityStepper({ value, onChange, label, max = 20, size = "md" }: Props) {
  const btn = size === "sm" ? "h-10 w-10" : "h-11 w-11";
  return (
    <div role="group" aria-label={`Menge für ${label}`} className="inline-flex items-center rounded-full border border-line bg-white">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label={value <= 1 ? `${label} entfernen` : "Menge verringern"}
        className={`${btn} grid place-items-center rounded-full text-ink transition-colors hover:bg-stone`}
      >
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite" aria-label={`Menge: ${value}`} className="min-w-7 text-center font-mono text-[15px] tabular">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Menge erhöhen"
        className={`${btn} grid place-items-center rounded-full text-ink transition-colors hover:bg-stone disabled:cursor-not-allowed disabled:opacity-35`}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
