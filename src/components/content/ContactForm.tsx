"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { contactFormSchema, contactTopicLabels, contactTopics } from "./contactSchema";
import { Button } from "@/components/ui/Button";
import { CheckboxRow } from "@/components/checkout/CheckboxRow";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "success"; message: string } | { kind: "error"; message: string };

const initial = { name: "", email: "", topic: "beratung", message: "", privacy: false, website: "" };

export function ContactForm() {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) => setValues((s) => ({ ...s, [k]: v }));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = contactFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const k = i.path.join(".");
        if (!(k in next)) next[k] = i.message;
      }
      setErrors(next);
      requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setErrors({});
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = (await res.json().catch(() => ({}))) as { message?: string; fields?: Record<string, string> };
      if (res.ok) {
        setStatus({ kind: "success", message: data.message ?? "Danke! Deine Nachricht ist angekommen." });
        setValues(initial);
      } else {
        if (data.fields) setErrors(data.fields);
        setStatus({ kind: "error", message: data.message ?? "Die Nachricht konnte nicht gesendet werden." });
      }
    } catch {
      setStatus({ kind: "error", message: "Keine Verbindung zum Server. Prüfe deine Internetverbindung und versuch es erneut." });
    }
  }

  const err = (k: string) => errors[k];
  const desc = (k: string) => (errors[k] ? `kf-${k}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="relative">
      <div className="grid gap-6 sm:grid-cols-2">
        <fieldset className="sm:col-span-2">
          <legend className="field-label">Worum geht es?</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {contactTopics.map((t) => (
              <label
                key={t}
                className={`inline-flex h-11 cursor-pointer items-center rounded-full border px-5 text-[15px] font-semibold transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-sun/30 ${
                  values.topic === t ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/40"
                }`}
              >
                <input type="radio" name="kf-topic" value={t} checked={values.topic === t} onChange={() => set("topic", t)} className="sr-only" />
                {contactTopicLabels[t]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="min-w-0">
          <label htmlFor="kf-name" className="field-label">
            Name
          </label>
          <input
            id="kf-name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            aria-invalid={err("name") ? true : undefined}
            aria-describedby={desc("name")}
            className={`field-input ${err("name") ? "!border-danger" : ""}`}
          />
          {err("name") && (
            <p id="kf-name-error" className="field-error">
              {err("name")}
            </p>
          )}
        </div>
        <div className="min-w-0">
          <label htmlFor="kf-email" className="field-label">
            E-Mail-Adresse
          </label>
          <input
            id="kf-email"
            type="email"
            inputMode="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
            aria-invalid={err("email") ? true : undefined}
            aria-describedby={desc("email")}
            className={`field-input ${err("email") ? "!border-danger" : ""}`}
          />
          {err("email") && (
            <p id="kf-email-error" className="field-error">
              {err("email")}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="kf-message" className="field-label">
            Nachricht
          </label>
          <textarea
            id="kf-message"
            rows={6}
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            aria-invalid={err("message") ? true : undefined}
            aria-describedby={err("message") ? "kf-message-error" : "kf-message-hint"}
            className={`field-input min-h-[160px] resize-y ${err("message") ? "!border-danger" : ""}`}
          />
          {err("message") ? (
            <p id="kf-message-error" className="field-error">
              {err("message")}
            </p>
          ) : (
            <p id="kf-message-hint" className="mt-1.5 text-[13px] text-muted">
              Für eine Beratung hilft: Montageort, Ausrichtung, ungefährer Jahresverbrauch.
            </p>
          )}
        </div>
        {/* Honeypot: für Menschen unsichtbar */}
        <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
          <label htmlFor="kf-website">Website</label>
          <input id="kf-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <CheckboxRow id="kf-privacy" checked={values.privacy} onChange={(v) => set("privacy", v)} error={err("privacy")}>
            Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage verwendet werden. Mehr in der{" "}
            <Link href="/datenschutz" className="font-semibold underline underline-offset-4">
              Datenschutzerklärung
            </Link>
            .
          </CheckboxRow>
        </div>
      </div>

      <div className="mt-8">
        <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto" disabled={status.kind === "sending"} arrow>
          {status.kind === "sending" ? "Wird gesendet …" : "Nachricht senden"}
        </Button>
      </div>
      <div aria-live="polite">
        {status.kind === "success" && <p className="mt-5 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold">{status.message}</p>}
        {status.kind === "error" && (
          <p role="alert" className="mt-5 rounded-xl bg-[#fdf1ec] px-4 py-3 text-sm font-semibold text-danger">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
