"use client";

import { useId, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/** Segment-Umschalter (Radiogruppe) im App-Stil */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      <div className="inline-flex rounded-full border border-ink-line bg-night/60 p-1">
        {options.map((o) => {
          const id = `${name}-${o.value}`;
          const active = o.value === value;
          return (
            <label
              key={o.value}
              htmlFor={id}
              className={`relative cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sun-1 sm:px-4 ${
                active ? "bg-paper text-ink" : "text-muted-dark hover:text-paper"
              }`}
            >
              <input id={id} type="radio" name={name} value={o.value} checked={active} onChange={() => onChange(o.value)} className="sr-only" />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Schalter (an/aus) */
export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode }) {
  const id = useId();
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-3 text-[13px] font-semibold text-paper">
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={`relative h-6 w-11 rounded-full border transition-colors duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sun-1 ${
          checked ? "border-lime bg-lime/90" : "border-ink-line bg-night/60"
        }`}
      >
        <span
          className={`absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full transition-[left,background-color] duration-300 ease-[var(--ease-out-expo)] ${
            checked ? "left-[22px] bg-ink" : "left-[3px] bg-muted-dark"
          }`}
        />
      </span>
      <span>
        {label}
        {hint && <span className="block text-[12px] font-normal text-muted-dark">{hint}</span>}
      </span>
    </label>
  );
}

export function PlayButton({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={playing}
      aria-label={playing ? "Tagesablauf pausieren" : "Tagesablauf abspielen"}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-ink transition-transform duration-300 hover:scale-105 active:scale-95"
    >
      <Icon name={playing ? "pause" : "play"} size={18} strokeWidth={2.2} />
    </button>
  );
}
