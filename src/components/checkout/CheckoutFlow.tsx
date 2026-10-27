"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useCart } from "@/lib/cart/store";
import { resolveCart } from "@/lib/cart/totals";
import { addressSchema, checkoutSchema, contactSchema, fieldErrors } from "@/lib/checkout/schemas";
import { formatEUR } from "@/lib/format";
import { site } from "@/config/site";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useCartHydrated } from "@/components/shop/useHydrated";
import { Field } from "./Field";
import { AddressFields, emptyAddress, type AddressDraft } from "./AddressFields";
import { CheckboxRow } from "./CheckboxRow";
import { VatQuestion, type VatAnswer } from "./VatQuestion";
import { OrderReview } from "./OrderReview";
import { OrderTotals } from "./OrderTotals";
import { CheckoutSummary } from "./CheckoutSummary";

type StepId = "steuer" | "kontakt" | "adresse" | "versand" | "pruefen";

const STEPS: Record<StepId, { label: string; title: string; cta: string }> = {
  steuer: { label: "Umsatzsteuer", title: "Gilt für dich 0 % Umsatzsteuer?", cta: "Weiter zur Umsatzsteuer" },
  kontakt: { label: "Kontakt", title: "Wie erreichen wir dich?", cta: "Weiter zum Kontakt" },
  adresse: { label: "Adresse", title: "Rechnungs- und Lieferadresse", cta: "Weiter zur Adresse" },
  versand: { label: "Versand & Zahlung", title: "Versand und Zahlung", cta: "Weiter zu Versand & Zahlung" },
  pruefen: { label: "Prüfen & bestellen", title: "Prüfen und bestellen", cta: "Weiter zur Prüfung" },
};

const VAT_ERROR = "Bitte wähle Ja oder Nein. Davon hängt dein Endpreis ab.";
const CONSENT_ERROR = "Bitte bestätige die AGB, damit wir deine Bestellung annehmen können.";
// In der Kasse selbst ehrlich: was fehlt, ist noch nicht festgelegt (die Kasse ist dann gesperrt)
const OPEN_TEXT = "noch nicht festgelegt";

interface Props {
  /** Vom Server ermittelt: ist der Live-Checkout freigeschaltet? */
  checkoutEnabled: boolean;
}

export function CheckoutFlow({ checkoutEnabled }: Props) {
  const lines = useCart((s) => s.lines);
  const hydrated = useCartHydrated();

  const [vat, setVat] = useState<VatAnswer | null>(null);
  const [currentRaw, setCurrent] = useState<StepId | null>(null);
  const [done, setDone] = useState<StepId[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [billing, setBilling] = useState<AddressDraft>(emptyAddress);
  const [sameShipping, setSameShipping] = useState(true);
  const [shippingAddress, setShippingAddress] = useState<AddressDraft>(emptyAddress);
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitState, setSubmitState] = useState<{ status: "idle" | "sending" | "error"; message?: string }>({ status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  // Ohne Bestätigung gilt der Regelsteuersatz (resolveCart-Standard)
  const standard = resolveCart(lines);
  const zero = resolveCart(lines, { zeroRateConfirmed: true });
  const eligible = standard.hasZeroRateEligible;
  const zeroRateConfirmed = eligible && vat === "yes";
  const totals = zeroRateConfirmed ? zero : standard;

  const stepIds: StepId[] = eligible ? ["steuer", "kontakt", "adresse", "versand", "pruefen"] : ["kontakt", "adresse", "versand", "pruefen"];
  const current: StepId = currentRaw && stepIds.includes(currentRaw) ? currentRaw : stepIds[0]!;
  const index = stepIds.indexOf(current);

  if (!hydrated) {
    return (
      <div className="grid gap-10 lg:grid-cols-12" aria-busy="true" aria-label="Kasse wird geladen">
        <div className="space-y-4 lg:col-span-7">
          <div className="h-10 animate-pulse rounded-xl bg-stone" />
          <div className="h-80 animate-pulse rounded-2xl bg-stone" />
        </div>
        <div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-stone lg:col-span-5" />
      </div>
    );
  }

  if (standard.lines.length === 0) {
    return (
      <div className="max-w-[40rem]">
        <p className="t-h2 m-0">Dein Warenkorb ist leer.</p>
        <p className="t-lead mt-5 max-w-[46ch]">Leg zuerst Produkte in den Warenkorb, dann kannst du hier die Bestellung vorbereiten.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/produkte" variant="dark" size="lg" arrow>
            Produkte ansehen
          </ButtonLink>
          <ButtonLink href="/konfigurator" variant="outline" size="lg">
            Produktfinder
          </ButtonLink>
        </div>
      </div>
    );
  }

  const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showStep(id: StepId) {
    requestAnimationFrame(() => {
      document.getElementById(`step-${id}`)?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
      document.getElementById(`step-${id}-title`)?.focus({ preventScroll: true });
    });
  }

  function focusFirstError() {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    });
  }

  function goTo(id: StepId) {
    setErrors({});
    setSubmitState({ status: "idle" });
    setCurrent(id);
    showStep(id);
  }

  /** Fehler eines Schritts, leer = gültig */
  function validate(id: StepId): Record<string, string> {
    const out: Record<string, string> = {};
    if (id === "steuer" && !vat) out.vat = VAT_ERROR;
    if (id === "kontakt") {
      const r = contactSchema.safeParse(contact);
      if (!r.success) Object.assign(out, prefixed("contact", fieldErrors(r.error)));
    }
    if (id === "adresse") {
      const b = addressSchema.safeParse(billing);
      if (!b.success) Object.assign(out, prefixed("billingAddress", fieldErrors(b.error)));
      if (!sameShipping) {
        const s = addressSchema.safeParse(shippingAddress);
        if (!s.success) Object.assign(out, prefixed("shippingAddress", fieldErrors(s.error)));
      }
    }
    return out;
  }

  function next() {
    const errs = validate(current);
    setErrors(errs);
    if (Object.keys(errs).length) {
      focusFirstError();
      return;
    }
    setDone((d) => (d.includes(current) ? d : [...d, current]));
    const n = stepIds[index + 1];
    if (n) {
      setCurrent(n);
      showStep(n);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (current !== "pruefen") {
      next();
      return;
    }
    // Alle Schritte erneut prüfen, falls zwischendurch etwas geändert wurde
    for (const id of stepIds) {
      if (id === "pruefen") continue;
      const errs = validate(id);
      if (Object.keys(errs).length) {
        setErrors(errs);
        setCurrent(id);
        showStep(id);
        focusFirstError();
        return;
      }
    }
    if (!consent) {
      setErrors({ consent: CONSENT_ERROR });
      focusFirstError();
      return;
    }
    const payload = {
      contact: { email: contact.email, phone: contact.phone || undefined },
      billingAddress: { ...billing, company: billing.company || undefined },
      shippingSameAsBilling: sameShipping,
      shippingAddress: sameShipping ? undefined : { ...shippingAddress, company: shippingAddress.company || undefined },
      lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      note: note || undefined,
      // Eine Bestätigung deckt AGB und Kenntnisnahme der Widerrufsbelehrung ab
      acceptTerms: consent,
      acknowledgeWithdrawal: consent,
    };
    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) {
      handleFieldErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    if (!checkoutEnabled) {
      setSubmitState({ status: "error", message: "Die Kasse ist noch nicht freigeschaltet. Es wurde keine Bestellung ausgelöst." });
      return;
    }
    setSubmitState({ status: "sending" });
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Steuer-Angabe zusätzlich mitschicken (Server muss sie auswerten, siehe Übergabe)
        body: JSON.stringify({ ...parsed.data, zeroRateConfirmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; fields?: Record<string, string>; payment?: { redirectUrl?: string } };
      if (res.ok && data.payment?.redirectUrl) {
        window.location.assign(data.payment.redirectUrl);
        return;
      }
      if (data.fields) handleFieldErrors(data.fields);
      setSubmitState({ status: "error", message: data.message ?? "Die Bestellung konnte nicht angelegt werden. Bitte versuch es später erneut." });
    } catch {
      setSubmitState({ status: "error", message: "Keine Verbindung zum Server. Prüfe deine Internetverbindung und versuch es erneut." });
    }
  }

  /** Fehler dem passenden Schritt zuordnen und dorthin springen */
  function handleFieldErrors(fe: Record<string, string>) {
    const mapped: Record<string, string> = {};
    for (const [k, v] of Object.entries(fe)) mapped[k === "acceptTerms" || k === "acknowledgeWithdrawal" ? "consent" : k] = v;
    if (mapped.consent) mapped.consent = CONSENT_ERROR;
    setErrors(mapped);
    const first = Object.keys(mapped)[0] ?? "";
    const target: StepId = first.startsWith("contact") ? "kontakt" : first.startsWith("billingAddress") || first.startsWith("shippingAddress") ? "adresse" : "pruefen";
    if (target !== current) {
      setCurrent(target);
      showStep(target);
    }
    if (mapped.lines) setSubmitState({ status: "error", message: mapped.lines });
    focusFirstError();
  }

  const stateOf = (id: StepId): StepState => (id === current ? "current" : done.includes(id) ? "done" : "locked");
  const shippingCost = totals.shipping === null ? OPEN_TEXT : totals.shipping === 0 ? "kostenlos" : formatEUR(totals.shipping);
  const deliveryTime = site.shipping.deliveryTime ?? OPEN_TEXT;
  const vatSummary = vat === "yes" ? "Ja: 0 % USt. auf Photovoltaik-Komponenten" : vat === "no" ? "Nein: 19 % USt. auf alle Artikel" : "";
  const pendingNote =
    eligible && !vat ? `Noch offen: Bis du die Frage zur Umsatzsteuer beantwortest, rechnen wir mit 19 % USt. Mit Nullsteuersatz: ${formatEUR(zero.total)}.` : undefined;

  const stepSummary: Record<StepId, string> = {
    steuer: vatSummary,
    kontakt: [contact.email, contact.phone].filter(Boolean).join(" · "),
    adresse: billing.lastName
      ? `${billing.firstName} ${billing.lastName}, ${billing.street} ${billing.houseNumber}, ${billing.zip} ${billing.city}${sameShipping ? "" : " · abweichende Lieferadresse"}`
      : "",
    versand: "Standardversand durch den Lieferanten",
    pruefen: "",
  };

  const backTo = (id: StepId) => {
    const prev = stepIds[stepIds.indexOf(id) - 1];
    return prev ? () => goTo(prev) : undefined;
  };
  const nextLabel = (id: StepId) => {
    const n = stepIds[stepIds.indexOf(id) + 1];
    return n ? STEPS[n].cta : "Weiter";
  };

  function content(id: StepId): ReactNode {
    switch (id) {
      case "steuer":
        return (
          <>
            <VatQuestion
              value={vat}
              onChange={(v) => {
                setVat(v);
                setErrors((e) => {
                  const { vat: _drop, ...rest } = e;
                  return rest;
                });
              }}
              error={errors.vat}
              zeroTotal={zero.total}
              standardTotal={standard.total}
              mixed={standard.lines.some((l) => !l.zeroRateEligible)}
              shippingKnown={standard.shipping !== null}
            />
            <StepNav onBack={backTo(id)} nextLabel={nextLabel(id)} />
          </>
        );
      case "kontakt":
        return (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="contact-email"
                label="E-Mail-Adresse"
                type="email"
                autoComplete="email"
                inputMode="email"
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
                hint="Hilft bei Rückfragen zur Lieferung."
                className="sm:col-span-2 md:col-span-1"
              />
            </div>
            <StepNav onBack={backTo(id)} nextLabel={nextLabel(id)} />
          </>
        );
      case "adresse":
        return (
          <>
            <h3 className="t-label mb-4">Rechnungsadresse</h3>
            <AddressFields prefix="billing" value={billing} onChange={setBilling} errors={errors} errorPath="billingAddress" autoCompleteSection="billing" />
            <div className="mt-7">
              <CheckboxRow id="same-shipping" checked={sameShipping} onChange={setSameShipping}>
                Lieferung an die Rechnungsadresse
              </CheckboxRow>
            </div>
            {!sameShipping && (
              <div className="mt-7 border-t border-line pt-7">
                <h3 className="t-label mb-4">Lieferadresse</h3>
                <AddressFields
                  prefix="shipping"
                  value={shippingAddress}
                  onChange={setShippingAddress}
                  errors={errors}
                  errorPath="shippingAddress"
                  autoCompleteSection="shipping"
                />
              </div>
            )}
            <StepNav onBack={backTo(id)} nextLabel={nextLabel(id)} />
          </>
        );
      case "versand":
        return (
          <>
            <div className="space-y-9">
              <section aria-labelledby="shipping-method-title">
                <h3 id="shipping-method-title" className="t-label">
                  Versand
                </h3>
                <div className="mt-3 flex items-start gap-4 rounded-2xl border border-ink bg-white p-5 shadow-[0_0_0_1px_var(--color-ink)]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone">
                    <Icon name="truck" size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">Standardversand durch den Lieferanten</p>
                    <p className="mt-1 text-sm text-muted">{site.shipping.carrierNote}</p>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-muted">Versandkosten</dt>
                        <dd className="mt-0.5 font-semibold">{shippingCost}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Lieferzeit</dt>
                        <dd className="mt-0.5 font-semibold">{deliveryTime}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted">
                  Kommen Artikel von verschiedenen Lieferanten, erhältst du getrennte Sendungen mit eigener Sendungsnummer. Wir liefern nur innerhalb
                  Deutschlands.
                </p>
              </section>
              <section aria-labelledby="payment-title">
                <h3 id="payment-title" className="t-label">
                  Zahlung
                </h3>
                <div className="mt-3 flex items-start gap-4 rounded-2xl border border-dashed border-ink/20 p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone">
                    <Icon name="euro" size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{checkoutEnabled ? "Zahlung beim Zahlungsanbieter" : "Zahlungsarten werden eingerichtet"}</p>
                    <p className="mt-1 text-sm text-muted">
                      {checkoutEnabled
                        ? "Nach dem Absenden leiten wir dich zur Zahlung an unseren Zahlungsanbieter weiter."
                        : "Nach dem Absenden leiten wir dich zur Zahlung an unseren Zahlungsanbieter weiter. Welche Zahlungsarten du dort wählen kannst, steht hier, sobald die Zahlung eingerichtet ist."}
                    </p>
                  </div>
                </div>
              </section>
            </div>
            <StepNav onBack={backTo(id)} nextLabel={nextLabel(id)} />
          </>
        );
      case "pruefen":
        return (
          <div className="space-y-10">
            <p className="max-w-[60ch] text-[15px] text-muted">
              Bitte prüfe deine Angaben. Über „Ändern“ kannst du jeden Schritt vor dem Absenden korrigieren.
            </p>

            <dl className="grid gap-x-8 gap-y-6 text-[15px] sm:grid-cols-2">
              {eligible && (
                <ReviewItem title="Umsatzsteuer" onEdit={() => goTo("steuer")}>
                  {vatSummary}
                </ReviewItem>
              )}
              <ReviewItem title="Kontakt" onEdit={() => goTo("kontakt")}>
                <p>{contact.email}</p>
                {contact.phone && <p>{contact.phone}</p>}
              </ReviewItem>
              <ReviewItem title="Rechnungsadresse" onEdit={() => goTo("adresse")}>
                <AddressLines a={billing} />
              </ReviewItem>
              <ReviewItem title="Lieferadresse" onEdit={() => goTo("adresse")}>
                {sameShipping ? <p>wie Rechnungsadresse</p> : <AddressLines a={shippingAddress} />}
              </ReviewItem>
              <ReviewItem title="Versand und Lieferzeit" onEdit={() => goTo("versand")}>
                <p>Standardversand durch den Lieferanten</p>
                <p className="text-muted">
                  Versandkosten: {shippingCost} · Lieferzeit: {deliveryTime}
                </p>
              </ReviewItem>
              <ReviewItem title="Zahlung" onEdit={() => goTo("versand")}>
                <p>{checkoutEnabled ? "beim Zahlungsanbieter nach dem Absenden" : "wird eingerichtet"}</p>
              </ReviewItem>
            </dl>

            <div>
              <label htmlFor="order-note" className="field-label">
                Hinweis zur Bestellung <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="order-note"
                rows={3}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="field-input min-h-[104px] resize-y"
                aria-invalid={errors.note ? true : undefined}
                aria-describedby={errors.note ? "order-note-error" : undefined}
              />
              {errors.note && (
                <p id="order-note-error" className="field-error">
                  {errors.note}
                </p>
              )}
            </div>

            <section aria-labelledby="review-items-title">
              <h3 id="review-items-title" className="t-label">
                Deine Bestellung
              </h3>
              <div className="mt-3">
                <OrderReview totals={totals} />
              </div>
              <div className="mt-6 sm:ml-auto sm:max-w-[400px]">
                <OrderTotals totals={totals} openShippingText={OPEN_TEXT} />
              </div>
            </section>

            <div className="space-y-5 border-t border-line pt-8">
              <CheckboxRow
                id="consent"
                checked={consent}
                onChange={(v) => {
                  setConsent(v);
                  if (v)
                    setErrors((e) => {
                      const { consent: _drop, ...rest } = e;
                      return rest;
                    });
                }}
                error={errors.consent}
              >
                Ich habe die{" "}
                <Link href="/agb" target="_blank" rel="noopener" className="font-semibold underline underline-offset-4">
                  AGB<span className="sr-only"> (öffnet in neuem Tab)</span>
                </Link>{" "}
                gelesen und bin mit ihrer Geltung einverstanden. Die{" "}
                <Link href="/widerruf" target="_blank" rel="noopener" className="font-semibold underline underline-offset-4">
                  Widerrufsbelehrung<span className="sr-only"> (öffnet in neuem Tab)</span>
                </Link>{" "}
                habe ich zur Kenntnis genommen.
              </CheckboxRow>
              <p className="pl-[38px] text-sm text-muted">
                Wie wir deine Daten für die Bestellung verarbeiten, steht in der{" "}
                <Link href="/datenschutz" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-ink">
                  Datenschutzerklärung<span className="sr-only"> (öffnet in neuem Tab)</span>
                </Link>
                .
              </p>
            </div>

            <div>
              {submitState.status === "error" && submitState.message && (
                <p role="alert" className="mb-5 rounded-xl bg-[#fdf1ec] px-4 py-3 text-sm font-semibold text-danger">
                  {submitState.message}
                </p>
              )}
              <div className="flex sm:justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto sm:min-w-[300px]"
                  disabled={!checkoutEnabled || submitState.status === "sending"}
                  aria-describedby={!checkoutEnabled ? "order-button-hint" : undefined}
                >
                  {submitState.status === "sending" ? "Wird gesendet …" : "Zahlungspflichtig bestellen"}
                </Button>
              </div>
              {!checkoutEnabled && (
                <p id="order-button-hint" className="mt-3 text-[13px] text-muted sm:text-right">
                  Der Knopf wird aktiv, sobald die Kasse freigeschaltet ist. Bis dahin wird keine Bestellung ausgelöst.
                </p>
              )}
              <div className="mt-6">
                <button type="button" onClick={backTo("pruefen")} className="inline-flex h-11 items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
                  <Icon name="arrow-right" size={16} className="rotate-180" />
                  Zurück
                </button>
              </div>
            </div>
          </div>
        );
    }
  }

  return (
    <div className="grid gap-x-16 gap-y-6 lg:grid-cols-12">
      {/* Mobil: Bestellübersicht zum Aufklappen */}
      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={summaryOpen}
          aria-controls="checkout-summary"
          onClick={() => setSummaryOpen((o) => !o)}
          className="flex min-h-[60px] w-full items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-3 text-left"
        >
          <span className="flex items-center gap-3 text-[15px] font-semibold">
            <Icon name="cart" size={20} />
            {summaryOpen ? "Übersicht ausblenden" : "Bestellübersicht"}
          </span>
          <span className="flex items-center gap-2">
            <span className="font-semibold tabular">{formatEUR(totals.total)}</span>
            <Icon name="chevron-down" size={18} className={`transition-transform duration-300 ${summaryOpen ? "rotate-180" : ""}`} />
          </span>
        </button>
      </div>

      <aside
        id="checkout-summary"
        aria-label="Bestellübersicht"
        className={`${summaryOpen ? "block" : "hidden"} min-w-0 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:block`}
      >
        <div className="lg:sticky lg:top-28">
          <CheckoutSummary totals={totals} pendingNote={pendingNote} checkoutEnabled={checkoutEnabled} />
        </div>
      </aside>

      <form ref={formRef} onSubmit={submit} noValidate className="min-w-0 lg:col-span-7 lg:col-start-1 lg:row-start-1">
        <div className="pb-6">
          <div className="flex items-baseline justify-between gap-4">
            <p className="t-label">
              Schritt {index + 1} von {stepIds.length}
            </p>
            <p className="text-sm font-medium">{STEPS[current].label}</p>
          </div>
          <div aria-hidden className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${stepIds.length}, minmax(0, 1fr))` }}>
            {stepIds.map((id, i) => (
              <span key={id} className={`h-1 rounded-full transition-colors duration-500 ${i <= index ? "bg-ink" : "bg-line"}`} />
            ))}
          </div>
        </div>

        {stepIds.map((id, i) => (
          <Step
            key={id}
            id={id}
            number={i + 1}
            label={STEPS[id].label}
            title={STEPS[id].title}
            state={stateOf(id)}
            summary={stepSummary[id]}
            onEdit={() => goTo(id)}
          >
            {id === current ? content(id) : null}
          </Step>
        ))}
      </form>
    </div>
  );
}

type StepState = "current" | "done" | "locked";

function prefixed(prefix: string, errs: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(errs).map(([k, v]) => [`${prefix}.${k}`, v]));
}

function Step({
  id,
  number,
  label,
  title,
  state,
  summary,
  onEdit,
  children,
}: {
  id: StepId;
  number: number;
  label: string;
  title: string;
  state: StepState;
  summary?: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  const open = state === "current";
  return (
    <section id={`step-${id}`} aria-labelledby={`step-${id}-title`} className="scroll-mt-28 border-t border-line py-7 last:border-b md:py-9">
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold transition-colors duration-300 ${
            open ? "bg-ink text-paper" : state === "done" ? "border border-ink/15 bg-white text-ink" : "bg-stone text-muted"
          }`}
        >
          {state === "done" ? <Icon name="check" size={16} strokeWidth={2.2} /> : <span className="font-mono">{String(number).padStart(2, "0")}</span>}
        </span>
        <h2
          id={`step-${id}-title`}
          tabIndex={-1}
          className={`m-0 min-w-0 flex-1 outline-none ${open ? "t-h3" : "text-[17px] font-semibold tracking-[-0.01em]"} ${state === "locked" ? "text-muted" : ""}`}
        >
          <span className="sr-only">Schritt {number}: </span>
          {open ? title : label}
        </h2>
        {state === "done" && (
          <button
            type="button"
            onClick={onEdit}
            className="-mr-2 inline-flex h-10 shrink-0 items-center px-2 text-sm font-semibold underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
          >
            Ändern<span className="sr-only">: {label}</span>
          </button>
        )}
      </div>
      {state === "done" && summary && <p className="mt-2 truncate pl-[52px] text-sm text-muted">{summary}</p>}
      {open && <div className="mt-7 md:pl-[52px]">{children}</div>}
    </section>
  );
}

function StepNav({ onBack, nextLabel }: { onBack?: () => void; nextLabel: string }) {
  return (
    <div className="mt-9 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <button type="button" onClick={onBack} className="inline-flex h-11 items-center justify-center gap-2 text-sm font-semibold text-muted hover:text-ink sm:justify-start">
          <Icon name="arrow-right" size={16} className="rotate-180" />
          Zurück
        </button>
      ) : (
        <Link href="/warenkorb" className="inline-flex h-11 items-center justify-center gap-2 text-sm font-semibold text-muted hover:text-ink sm:justify-start">
          <Icon name="arrow-right" size={16} className="rotate-180" />
          Zum Warenkorb
        </Link>
      )}
      <Button type="submit" variant="dark" size="lg" arrow className="w-full sm:w-auto">
        {nextLabel}
      </Button>
    </div>
  );
}

function ReviewItem({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="min-w-0 border-t border-line pt-4">
      <dt className="flex items-center justify-between gap-3">
        <span className="t-label">{title}</span>
        <button type="button" onClick={onEdit} className="-my-2 inline-flex h-10 items-center text-sm font-semibold text-muted underline underline-offset-4 hover:text-ink">
          Ändern<span className="sr-only">: {title}</span>
        </button>
      </dt>
      <dd className="mt-2 space-y-0.5 text-ink/85">{children}</dd>
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
