"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { contactFormSchema, contactTopicLabels, contactTopics } from "./contactSchema";
import { Button } from "@/components/ui/Button";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "success"; message: string } | { kind: "error"; message: string };

export function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", topic: "beratung", message: "", privacy: false, website: "" });
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
        setValues({ name: "", email: "", topic: "beratung", message: "", privacy: false, website: "" });
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
    <form onSubmit={onSubmit} noValidate className="rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="kf-name" className="field-label">
            Name
          </label>
          <input id="kf-name" value={values.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" aria-invalid={err("name") ? true : undefined} aria-describedby={desc("name")} className="field-input" />
          {err("name") && <p id="kf-name-error" className="field-error">{err("name")}</p>}
        </div>
        <div>
          <label htmlFor="kf-email" className="field-label">
            E-Mail-Adresse
          </label>
          <input id="kf-email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" aria-invalid={err("email") ? true : undefined} aria-describedby={desc("email")} className="field-input" />
          {err("email") && <p id="kf-email-error" className="field-error">{err("email")}</p>}
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="field-label">Worum geht es?</legend>
          <div className="flex flex-wrap gap-2">
            {contactTopics.map((t) => (
              <label
                key={t}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-lime-deep ${
                  values.topic === t ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40"
                }`}
              >
                <input type="radio" name="kf-topic" value={t} checked={values.topic === t} onChange={() => set("topic", t)} className="sr-only" />
                {contactTopicLabels[t]}
              </label>
            ))}
          </div>
        </fieldset>
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
            className="field-input"
          />
          {err("message") ? (
            <p id="kf-message-error" className="field-error">{err("message")}</p>
          ) : (
            <p id="kf-message-hint" className="mt-1.5 text-xs text-muted">
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
          <div className="flex items-start gap-3 text-[15px]">
            <input
              id="kf-privacy"
              type="checkbox"
              checked={values.privacy}
              onChange={(e) => set("privacy", e.target.checked)}
              aria-invalid={err("privacy") ? true : undefined}
              aria-describedby={desc("privacy")}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-ink)]"
            />
            <label htmlFor="kf-privacy">
              Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage verwendet werden. Mehr in der{" "}
              <Link href="/datenschutz" className="font-semibold underline underline-offset-4">
                Datenschutzerklärung
              </Link>
              .
            </label>
          </div>
          {err("privacy") && <p id="kf-privacy-error" className="field-error ml-8">{err("privacy")}</p>}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Button type="submit" variant="dark" size="lg" disabled={status.kind === "sending"} arrow>
          {status.kind === "sending" ? "Wird gesendet …" : "Nachricht senden"}
        </Button>
      </div>
      <div aria-live="polite">
        {status.kind === "success" && <p className="mt-5 rounded-xl bg-lime/30 px-4 py-3 text-sm font-semibold">{status.message}</p>}
        {status.kind === "error" && <p role="alert" className="mt-5 rounded-xl bg-[#fdf1ec] px-4 py-3 text-sm font-semibold text-danger">{status.message}</p>}
      </div>
    </form>
  );
}
