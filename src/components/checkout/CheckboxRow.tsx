"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface Props {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  error?: string;
}

/** Große, gut treffbare Checkbox mit Text daneben */
export function CheckboxRow({ id, checked, onChange, children, error }: Props) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3.5 text-[15px] leading-relaxed">
        <span className="relative mt-[1px] grid h-6 w-6 shrink-0 place-items-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`peer absolute inset-0 h-6 w-6 cursor-pointer appearance-none rounded-[7px] border bg-white transition-colors checked:border-ink checked:bg-ink ${
              error ? "border-danger" : "border-ink/30 hover:border-ink"
            }`}
          />
          <Icon name="check" size={16} strokeWidth={2.4} className="pointer-events-none relative text-paper opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
        <span className="min-w-0">{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="field-error ml-[38px]">
          {error}
        </p>
      )}
    </div>
  );
}
