"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useCart } from "@/lib/cart/store";
import { resolveCart } from "@/lib/cart/totals";
import { addressSchema, checkoutSchema, contactSchema, fieldErrors } from "@/lib/checkout/schemas";
import { formatEUR } from "@/lib/format";
import { site } from "@/config/site";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/content/Notice";
import { useCartHydrated } from "@/components/shop/useHydrated";
import { Field } from "./Field";
import { AddressFields, emptyAddress, type AddressDraft } from "./AddressFields";

const steps = [
  { id: "kontakt", label: "Kontakt" },
  { id: "adresse", label: "Adresse" },
  { id: "versand", label: "Versand" },
  { id: "zahlung", label: "Zahlung" },
  { id: "pruefen", label: "Prüfen" },
] as const;

const paymentMethods = [
  { id: "paypal", label: "PayPal" },
  { id: "karte", label: "Kredit- oder Debitkarte" },
  { id: "rechnung", label: "Kauf auf Rechnung" },
  { id: "vorkasse", label: "Vorkasse per Überweisung" },
];

interface Props {
  /** Vom Server ermittelt: ist der Live-Checkout freigeschaltet? */
  checkoutEnabled: boolean;
}

export function CheckoutFlow({ checkoutEnabled }: Props) {
  const lines = useCart((s) => s.lines);
  const hydrated = useCartHydrated();
  const totals = resolveCart(lines);

  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [billing, setBilling] = useState<AddressDraft>(emptyAddress);
  const [sameShipping, setSameShipping] = useState(true);
  const [shipping, setShipping] = useState<AddressDraft>(emptyAddress);
  const [note, setNote] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [ackWithdrawal, setAckWithdrawal] = useState(false);
  const [submitState, setSubmitState] = useState<{ status: "idle" | "sending" | "error"; message?: string }>({ status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  if (!hydrated) return <div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-mist" aria-label="Kasse wird geladen" />;

  if (totals.lines.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-white px-6 py-16 text-center">
        <p className="display-md m-0 text-2xl">Dein Warenkorb ist leer</p>
        <p className="mx-auto mt-3 max-w-[46ch] text-muted">Leg zuerst Produkte in den Warenkorb, dann kannst du hier die Bestellung vorbereiten.</p>
        <div className="mt-7 flex justify-center">
          <ButtonLink href="/produkte" variant="dark" arrow>
            Produkte ansehen
          </ButtonLink>
        </div>
      </div>
    );
  }

  function focusFirstError() {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    });
  }

  /** Prüft den aktuellen Schritt. Gibt true zurück, wenn alles gültig ist. */
  function validateStep(index: number): boolean {
    let next: Record<string, string> = {};
    if (index === 0) {
      const r = contactSchema.safeParse(contact);
      if (!r.success) next = Object.fromEntries(Object.entries(fieldErrors(r.error)).map(([k, v]) => [`contact.${k}`, v]));
    }
    if (index === 1) {
      const b = addressSchema.safeParse(billing);
      if (!b.success) Object.assign(next, prefixed("billingAddress", fieldErrors(b.error)));
      if (!sameShipping) {
        const s = addressSchema.safeParse(shipping);
        if (!s.success) Object.assign(next, prefixed("shippingAddress", fieldErrors(s.error)));
      }
    }
    setErrors(next);
    if (Object.keys(next).length) {
      focusFirstError();
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    const n = Math.min(step + 1, steps.length - 1);
    setStep(n);
    setReached((r) => Math.max(r, n));
    requestAnimationFrame(() => document.getElementById(`step-${steps[n]!.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step !== steps.length - 1) {
      goNext();
      return;
    }
    const payload = {
      contact: { email: contact.email, phone: contact.phone || undefined },
      billingAddress: { ...billing, company: billing.company || undefined },
      shippingSameAsBilling: sameShipping,
      shippingAddress: sameShipping ? undefined : { ...shipping, company: shipping.company || undefined },
      lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      note: note || undefined,
      acceptTerms,
      acknowledgeWithdrawal: ackWithdrawal,
    };
    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      focusFirstError();
      return;
    }
    setErrors({});
    if (!checkoutEnabled) {
      setSubmitState({ status: "error", message: "Der Checkout ist noch nicht freigeschaltet. Es wurde keine Bestellung ausgelöst." });
      return;
    }
    setSubmitState({ status: "sending" });
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; fields?: Record<string, string>; payment?: { redirectUrl?: string } };
      if (res.ok && data.payment?.redirectUrl) {
        window.location.assign(data.payment.redirectUrl);
        return;
      }
      if (data.fields) setErrors(data.fields);
      setSubmitState({ status: "error", message: data.message ?? "Die Bestellung konnte nicht angelegt werden. Bitte versuch es später erneut." });
    } catch {
      setSubmitState({ status: "error", message: "Keine Verbindung zum Server. Prüfe deine Internetverbindung und versuch es erneut." });
    }
  }

  const summary = (
    <aside aria-label="Bestellübersicht" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="display-md m-0 text-xl">Deine Bestellung</h2>
          <Link href="/warenkorb" className="text-sm font-semibold underline decoration-lime decoration-2 underline-offset-4">
            Ändern
          </Link>
        </div>
        <ul className="mt-5 divide-y divide-line">
          {totals.lines.map(({ product, quantity, lineTotal }) => (
            <li key={product.id} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 py-3">
              <span className="relative block h-[52px] w-[52px] rounded-xl bg-mist p-1">
                <ProductVisual visual={product.visual} title={product.name} className="h-full w-full" />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 font-mono text-[11px] text-paper">
                  {quantity}
                </span>
              </span>
              <span className="line-clamp-2 text-sm font-medium">{product.name}</span>
              <span className="font-mono text-sm tabular">{formatEUR(lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt>Zwischensumme</dt>
            <dd className="font-mono tabular">{formatEUR(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Versand</dt>
            <dd className="text-right text-muted">{totals.shipping === null ? "wird noch festgelegt" : formatEUR(totals.shipping)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-3 text-lg font-semibold">
            <dt>Gesamt</dt>
            <dd className="font-mono tabular">{formatEUR(totals.total)}</dd>
          </div>
        </dl>
      </div>
      {!checkoutEnabled && (
        <Notice tone="preview" title="Vorschau" className="mt-4">
          Du kannst alle Schritte ausprobieren. Eine Bestellung wird erst möglich, wenn Zahlung, Versand und Lieferanten angebunden sind.
        </Notice>
      )}
    </aside>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
      <form ref={formRef} onSubmit={submit} noValidate className="min-w-0">
        {/* Fortschritt */}
        <ol className="mb-8 grid grid-cols-5 gap-2" aria-label="Schritte">
          {steps.map((s, i) => {
            const done = i < step;
            const current = i === step;
            const clickable = i <= reached && i !== step;
            return (
              <li key={s.id} className="min-w-0">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => setStep(i)}
                  aria-current={current ? "step" : undefined}
                  className="group block w-full text-left disabled:cursor-default"
                >
                  <span className={`block h-1.5 rounded-full transition-colors duration-500 ${done || current ? "bg-ink" : "bg-line"}`} />
                  <span className={`mt-2 block truncate text-xs font-semibold sm:text-sm ${current ? "text-ink" : "text-muted"} ${clickable ? "group-hover:text-ink" : ""}`}>
                    <span className="font-mono">{i + 1}</span> {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="space-y-4">
          <Step index={0} current={step} id="kontakt" title="Kontakt" summary={contact.email} onEdit={() => setStep(0)} reached={reached}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="contact-email"
                label="E-Mail-Adresse"
                type="email"
                autoComplete="email"
                value={contact.email}
                onChange={(v) => setContact({ ...contact, email: v })}
                error={errors["contact.email"]}
                hint="Für Bestellbestätigung und Sendungsverfolgung."
                className="sm:col-span-2"
              />
              <Field
                id="contact-phone"
                label="Telefon"
                optional
                type="tel"
                autoComplete="tel"
                value={contact.phone}
                onChange={(v) => setContact({ ...contact, phone: v })}
                error={errors["contact.phone"]}
                hint="Hilft bei Rückfragen zur Lieferung per Spedition."
              />
            </div>
          </Step>

          <Step
            index={1}
            current={step}
            id="adresse"
            title="Adresse"
            summary={billing.lastName ? `${billing.firstName} ${billing.lastName}, ${billing.zip} ${billing.city}` : ""}
            onEdit={() => setStep(1)}
            reached={reached}
          >
            <p className="mb-4 text-sm font-semibold">Rechnungsadresse</p>
            <AddressFields prefix="billing" value={billing} onChange={setBilling} errors={errors} errorPath="billingAddress" autoCompleteSection="billing" />
            <label className="mt-6 flex cursor-pointer items-center gap-3 text-[15px]">
              <input type="checkbox" checked={sameShipping} onChange={(e) => setSameShipping(e.target.checked)} className="h-5 w-5 accent-[var(--color-ink)]" />
              Lieferadresse ist gleich Rechnungsadresse
            </label>
            {!sameShipping && (
              <div className="mt-6 border-t border-line pt-6">
                <p className="mb-4 text-sm font-semibold">Lieferadresse</p>
                <AddressFields prefix="shipping" value={shipping} onChange={setShipping} errors={errors} errorPath="shippingAddress" autoCompleteSection="shipping" />
              </div>
            )}
          </Step>

          <Step index={2} current={step} id="versand" title="Versand" summary="Versand durch den Lieferanten" onEdit={() => setStep(2)} reached={reached}>
            <fieldset>
              <legend className="sr-only">Versandart</legend>
              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-ink bg-white p-5">
                <input type="radio" name="shipping-method" defaultChecked className="mt-1 h-5 w-5 accent-[var(--color-ink)]" />
                <span className="min-w-0">
                  <span className="block font-semibold">Standardversand durch den Lieferanten</span>
                  <span className="mt-1 block text-sm text-muted">{site.shipping.carrierNote}</span>
                  <span className="mt-2 block text-sm">
                    Kosten: <strong>{site.shipping.flatRateEUR !== null ? formatEUR(site.shipping.flatRateEUR) : "wird noch festgelegt"}</strong> · Lieferzeit:{" "}
                    <strong>{site.shipping.deliveryTime ?? "wird noch festgelegt"}</strong>
                  </span>
                </span>
              </label>
            </fieldset>
            <p className="mt-4 text-sm text-muted">
              Bestellungen mit Produkten verschiedener Lieferanten kommen in getrennten Sendungen. Jede bekommt eine eigene Sendungsnummer.
            </p>
          </Step>

          <Step index={3} current={step} id="zahlung" title="Zahlung" summary="Zahlungsarten in Vorbereitung" onEdit={() => setStep(3)} reached={reached}>
            <fieldset>
              <legend className="mb-4 text-sm text-muted">Die Zahlungsabwicklung wird gerade angebunden. Diese Zahlungsarten sind geplant:</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentMethods.map((m) => (
                  <label key={m.id} className="flex cursor-not-allowed items-center gap-3 rounded-2xl border border-line bg-mist/60 p-4 text-muted">
                    <input type="radio" name="payment" disabled className="h-5 w-5" />
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink/70">{m.label}</span>
                      <span className="text-xs">in Vorbereitung</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Step>

          <Step index={4} current={step} id="pruefen" title="Prüfen und bestellen" onEdit={() => setStep(4)} reached={reached}>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <ReviewBlock title="Kontakt" onEdit={() => setStep(0)}>
                <p>{contact.email}</p>
                {contact.phone && <p>{contact.phone}</p>}
              </ReviewBlock>
              <ReviewBlock title="Rechnungsadresse" onEdit={() => setStep(1)}>
                <AddressLines a={billing} />
              </ReviewBlock>
              <ReviewBlock title="Lieferadresse" onEdit={() => setStep(1)}>
                {sameShipping ? <p>wie Rechnungsadresse</p> : <AddressLines a={shipping} />}
              </ReviewBlock>
              <ReviewBlock title="Versand & Zahlung" onEdit={() => setStep(2)}>
                <p>Standardversand durch den Lieferanten</p>
                <p className="text-muted">Zahlung: in Vorbereitung</p>
              </ReviewBlock>
            </div>

            <div className="mt-6">
              <label htmlFor="order-note" className="field-label">
                Hinweis zur Bestellung <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="order-note"
                rows={3}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="field-input"
                aria-invalid={errors.note ? true : undefined}
              />
              {errors.note && <p className="field-error">{errors.note}</p>}
            </div>

            <div className="mt-6 space-y-3">
              <Check
                id="accept-terms"
                checked={acceptTerms}
                onChange={setAcceptTerms}
                error={errors.acceptTerms}
                label={
                  <>
                    Ich akzeptiere die{" "}
                    <Link href="/agb" className="font-semibold underline underline-offset-4" target="_blank">
                      AGB
                    </Link>{" "}
                    und habe die{" "}
                    <Link href="/datenschutz" className="font-semibold underline underline-offset-4" target="_blank">
                      Datenschutzerklärung
                    </Link>{" "}
                    gelesen.
                  </>
                }
              />
              <Check
                id="ack-withdrawal"
                checked={ackWithdrawal}
                onChange={setAckWithdrawal}
                error={errors.acknowledgeWithdrawal}
                label={
                  <>
                    Ich habe die{" "}
                    <Link href="/widerruf" className="font-semibold underline underline-offset-4" target="_blank">
                      Widerrufsbelehrung
                    </Link>{" "}
                    zur Kenntnis genommen.
                  </>
                }
              />
            </div>

            {!checkoutEnabled && (
              <Notice tone="preview" title="Der Checkout ist noch nicht freigeschaltet" className="mt-6">
                Bestellungen sind möglich, sobald Zahlung, Versand und Lieferantenanbindung eingerichtet und getestet sind. Deine Angaben werden nicht
                gespeichert oder übertragen.
              </Notice>
            )}
            {submitState.status === "error" && submitState.message && (
              <p role="alert" className="mt-4 rounded-xl bg-[#fdf1ec] px-4 py-3 text-sm font-semibold text-danger">
                {submitState.message}
              </p>
            )}

            <div className="mt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                disabled={!checkoutEnabled || submitState.status === "sending"}
                aria-describedby={!checkoutEnabled ? "checkout-disabled-hint" : undefined}
              >
                {submitState.status === "sending" ? "Wird gesendet …" : "Zahlungspflichtig bestellen"}
              </Button>
              {!checkoutEnabled && (
                <p id="checkout-disabled-hint" className="mt-2 text-xs text-muted">
                  Dieser Knopf wird aktiv, sobald der Checkout freigeschaltet ist.
                </p>
              )}
            </div>
          </Step>
        </div>

        {step < steps.length - 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="text-sm font-semibold text-muted hover:text-ink">
                ← Zurück
              </button>
            ) : (
              <Link href="/warenkorb" className="text-sm font-semibold text-muted hover:text-ink">
                ← Zum Warenkorb
              </Link>
            )}
            <Button type="submit" variant="dark" size="lg" arrow>
              Weiter zu {steps[step + 1]!.label}
            </Button>
          </div>
        )}
      </form>
      {summary}
    </div>
  );
}

function prefixed(prefix: string, errs: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(errs).map(([k, v]) => [`${prefix}.${k}`, v]));
}

function Step({
  index,
  current,
  reached,
  id,
  title,
  summary,
  onEdit,
  children,
}: {
  index: number;
  current: number;
  reached: number;
  id: string;
  title: string;
  summary?: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  const open = index === current;
  const done = index < current || (index <= reached && index !== current);
  return (
    <section
      id={`step-${id}`}
      aria-labelledby={`step-${id}-title`}
      className={`scroll-mt-28 rounded-[var(--radius-card)] border bg-white transition-colors ${open ? "border-ink/20 shadow-[var(--shadow-soft)]" : "border-line"}`}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <h2 id={`step-${id}-title`} className="m-0 flex min-w-0 items-center gap-3 font-sans text-lg font-semibold tracking-normal">
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-sm ${
              open ? "bg-ink text-paper" : done ? "bg-lime text-ink" : "bg-mist text-muted"
            }`}
          >
            {done && !open ? "✓" : index + 1}
          </span>
          <span className="truncate">{title}</span>
        </h2>
        {!open && done && (
          <button type="button" onClick={onEdit} className="shrink-0 text-sm font-semibold underline decoration-lime decoration-2 underline-offset-4">
            Bearbeiten
          </button>
        )}
      </div>
      {!open && done && summary && <p className="-mt-2 truncate px-6 pb-5 pl-[68px] text-sm text-muted">{summary}</p>}
      {open && <div className="border-t border-line px-6 py-6">{children}</div>}
    </section>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-mist/70 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-semibold">{title}</p>
        <button type="button" onClick={onEdit} className="text-xs font-semibold text-muted underline underline-offset-4 hover:text-ink">
          Ändern
        </button>
      </div>
      <div className="space-y-0.5 text-ink/80">{children}</div>
    </div>
  );
}

function AddressLines({ a }: { a: AddressDraft }) {
  return (
    <>
      <p>
        {a.firstName} {a.lastName}
      </p>
      {a.company && <p>{a.company}</p>}
      <p>
        {a.street} {a.houseNumber}
      </p>
      <p>
        {a.zip} {a.city}
      </p>
      <p>Deutschland</p>
    </>
  );
}

function Check({ id, checked, onChange, label, error }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: ReactNode; error?: string }) {
  return (
    <div>
      <div className="flex items-start gap-3 text-[15px]">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-ink)]"
        />
        <label htmlFor={id}>{label}</label>
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error ml-8">
          {error}
        </p>
      )}
    </div>
  );
}
