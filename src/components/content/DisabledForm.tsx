import type { ReactNode } from "react";

interface FieldDef {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
}

/** Formular-Gerüst, das sichtbar ist, aber bis zur Backend-Anbindung deaktiviert bleibt */
export function DisabledForm({ fields, submitLabel, footer }: { fields: FieldDef[]; submitLabel: string; footer?: ReactNode }) {
  return (
    <form aria-describedby="form-disabled-note" className="max-w-md">
      <fieldset disabled className="space-y-5">
        {fields.map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="field-label text-muted">
              {f.label}
            </label>
            <input
              id={f.id}
              name={f.id}
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              className="field-input disabled:cursor-not-allowed disabled:border-line disabled:bg-stone"
            />
          </div>
        ))}
        <button
          type="submit"
          className="mt-2 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-35"
        >
          {submitLabel}
        </button>
      </fieldset>
      <p id="form-disabled-note" className="mt-4 text-sm text-muted">
        Dieses Formular ist noch nicht aktiv.
      </p>
      {footer && <div className="mt-6 border-t border-line pt-5 text-[15px]">{footer}</div>}
    </form>
  );
}
