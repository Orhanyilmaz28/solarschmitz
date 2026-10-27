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
    <form aria-describedby="form-disabled-note" className="max-w-md rounded-[var(--radius-card)] border border-line bg-white p-6">
      <fieldset disabled className="space-y-4">
        {fields.map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="field-label">
              {f.label}
            </label>
            <input id={f.id} name={f.id} type={f.type ?? "text"} autoComplete={f.autoComplete} className="field-input disabled:cursor-not-allowed disabled:bg-mist" />
          </div>
        ))}
        <button type="submit" className="h-12 w-full rounded-full bg-ink font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-40">
          {submitLabel}
        </button>
      </fieldset>
      <p id="form-disabled-note" className="mt-4 text-sm text-muted">
        Dieses Formular ist noch nicht aktiv.
      </p>
      {footer && <div className="mt-4 border-t border-line pt-4 text-sm">{footer}</div>}
    </form>
  );
}
