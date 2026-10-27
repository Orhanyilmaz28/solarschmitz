"use client";

import { useState } from "react";
import { Field } from "@/components/checkout/Field";
import { Icon } from "@/components/ui/Icon";
import { CONFIRM_BUTTON_LABEL, withdrawalSchema } from "@/lib/withdrawal";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; receivedAtText: string; receipt: string; email: string }
  | { kind: "error"; message: string };

/**
 * Formular der Widerrufsfunktion. Fragt nur, was das Gesetz erlaubt:
 * Name, Vertrag (optional ein Teil davon) und die E-Mail für die Eingangsbestätigung.
 */
export function WithdrawalForm() {
  const [v, setV] = useState({ name: "", contract: "", part: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<State>({ kind: "idle" });
  const set = (k: keyof typeof v) => (val: string) => setV((s) => ({ ...s, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = withdrawalSchema.safeParse(v);
    if (!parsed.success) {
      const f: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const k = i.path.join(".");
        if (!(k in f)) f[k] = i.message;
      }
      setErrors(f);
      return;
    }
    setErrors({});
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/widerruf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = (await res.json()) as { ok: boolean; message?: string; receivedAtText?: string; receipt?: string; fields?: Record<string, string> };
      if (data.ok && data.receivedAtText && data.receipt) {
        setState({ kind: "done", receivedAtText: data.receivedAtText, receipt: data.receipt, email: parsed.data.email });
      } else {
        if (data.fields) setErrors(data.fields);
        setState({ kind: "error", message: data.message ?? "Der Widerruf konnte nicht übermittelt werden." });
      }
    } catch {
      setState({ kind: "error", message: "Keine Verbindung. Bitte versuche es erneut." });
    }
  }

  if (state.kind === "done") {
    return (
      <div role="status" className="rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-8">
        <p className="flex items-center gap-3 font-display text-xl font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-paper">
            <Icon name="check" size={18} />
          </span>
          Dein Widerruf ist eingegangen.
        </p>
        <p className="mt-4 text-muted">
          Eingang am {state.receivedAtText}. Die Eingangsbestätigung schicken wir dir per E-Mail an <strong className="text-ink">{state.email}</strong>.
        </p>
        <pre className="mt-6 whitespace-pre-wrap rounded-2xl bg-stone p-5 font-sans text-sm leading-relaxed text-ink">{state.receipt}</pre>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="name" label="Dein Name" value={v.name} onChange={set("name")} error={errors.name} autoComplete="name" required />
        <Field
          id="email"
          label="E-Mail für die Eingangsbestätigung"
          type="email"
          value={v.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
          required
        />
        <Field
          id="contract"
          label="Bestellnummer oder Vertrag"
          value={v.contract}
          onChange={set("contract")}
          error={errors.contract}
          hint="Zum Beispiel SS-20261027-7F3A aus deiner Bestellbestätigung."
          required
          className="md:col-span-2"
        />
        <Field
          id="part"
          label="Nur einen Teil widerrufen?"
          value={v.part}
          onChange={set("part")}
          error={errors.part}
          optional
          hint="Leer lassen, wenn du die ganze Bestellung widerrufst. Sonst die Artikel nennen."
          className="md:col-span-2"
        />
      </div>
      <p className="mt-6 text-sm text-muted">Einen Grund musst du nicht angeben. Mit dem Klick wird dein Widerruf verbindlich an uns übermittelt.</p>
      {state.kind === "error" && (
        <p role="alert" className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={state.kind === "sending"}
        className="mt-6 inline-flex h-[52px] items-center gap-2 rounded-full bg-ink px-7 font-semibold text-paper transition-colors hover:bg-ink-3 disabled:opacity-60"
      >
        {state.kind === "sending" ? "Wird übermittelt …" : CONFIRM_BUTTON_LABEL}
      </button>
    </form>
  );
}
