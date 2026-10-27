"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { InstallLocation } from "@/lib/catalog/types";
import { solarAssumptions, type OrientationKey } from "@/config/solar-assumptions";
import { powerRanges, recommend, recommendAccessories, type FinderAnswers, type ModuleCount, type PowerWish, type StorageWish } from "@/lib/solar/recommend";
import { defaultAssumptions, simulate, type Assumptions } from "@/lib/solar/calc";
import { hasPrice } from "@/lib/catalog";
import { formatEUR, formatInt, formatNumber } from "@/lib/format";
import { ProductVisual } from "@/components/illustrations/ProductVisual";
import { PriceTag, DataStatusChip } from "@/components/shop/DataStatus";
import { AddToCartButton } from "@/components/shop/ProductActions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CountUp } from "@/components/motion/CountUp";
import { getLenis } from "@/components/motion/SmoothScroll";
import { CashflowChart, MonthlyChart } from "./SavingsChart";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { StepIcon } from "./StepIcons";

type Draft = Partial<FinderAnswers> & { orientation?: OrientationKey };

interface Option<V> {
  value: V;
  label: string;
  hint: string;
  icon: string;
}

interface StepDef {
  key: keyof Draft;
  question: string;
  help: string;
  options: Option<unknown>[];
}

const steps: StepDef[] = [
  {
    key: "location",
    question: "Wo möchtest du deine Solaranlage installieren?",
    help: "Balkon, Flachdach, Schrägdach oder Garten: Der Ort bestimmt Halterung und Ertrag.",
    options: [
      { value: "balkon", label: "Balkon", hint: "Am Geländer oder an der Brüstung", icon: "balkon" },
      { value: "flachdach", label: "Flachdach", hint: "Garage, Carport oder Bungalow", icon: "flachdach" },
      { value: "schraegdach", label: "Schrägdach", hint: "Ziegel- oder Blechdach", icon: "schraegdach" },
      { value: "garten", label: "Garten", hint: "Terrasse, Rasen oder Freifläche", icon: "garten" },
    ],
  },
  {
    key: "orientation",
    question: "In welche Richtung zeigt die Fläche?",
    help: "Süden bringt am meisten. Ost/West verteilt den Strom besser über den Tag.",
    options: [
      { value: "sued", label: "Süd", hint: "Höchster Ertrag", icon: "sued" },
      { value: "suedost_suedwest", label: "Südost / Südwest", hint: "Etwa 6 % weniger als Süd", icon: "suedwest" },
      { value: "ost_west", label: "Ost / West", hint: "Strom morgens und abends", icon: "ostwest" },
      { value: "nord", label: "Nord", hint: "Deutlich weniger Ertrag", icon: "nord" },
    ],
  },
  {
    key: "storage",
    question: "Mit oder ohne Batteriespeicher?",
    help: "Ein Speicher hebt Mittagsstrom für den Abend auf und erhöht deinen Eigenverbrauch.",
    options: [
      { value: "ja", label: "Mit Speicher", hint: "Strom auch am Abend nutzen", icon: "speicher" },
      { value: "nein", label: "Ohne Speicher", hint: "Günstiger Einstieg", icon: "ohne" },
      { value: "offen", label: "Weiß ich noch nicht", hint: "Zeig mir beides", icon: "offen" },
    ],
  },
  {
    key: "modules",
    question: "Wie viele Solarmodule sind möglich?",
    help: "Ein Modul misst ungefähr 1,1 × 1,8 m. An Balkongeländern passen meist zwei.",
    options: [
      { value: 1, label: "1 Modul", hint: "Kleine Fläche", icon: "m1" },
      { value: 2, label: "2 Module", hint: "Typisch für Balkone", icon: "m2" },
      { value: 4, label: "4 Module", hint: "Garten, Flachdach, Dach", icon: "m4" },
    ],
  },
  {
    key: "power",
    question: "Welche ungefähre Leistung wünschst du?",
    help: "Erlaubt sind bis zu 2.000 Wp Modulleistung bei 800 W Einspeisung.",
    options: (Object.keys(powerRanges) as PowerWish[]).map((k) => ({ value: k, label: powerRanges[k].label, hint: powerRanges[k].hint, icon: `p-${k}` })),
  },
  {
    key: "budget",
    question: "Welches Budget hast du?",
    help: "Wir zeigen dir zuerst, was in deinen Rahmen passt.",
    options: [
      { value: 500, label: "bis 500 €", hint: "Einstieg ohne Speicher", icon: "b1" },
      { value: 1000, label: "bis 1.000 €", hint: "Größere Sets", icon: "b2" },
      { value: 1500, label: "bis 1.500 €", hint: "Sets mit Speicher", icon: "b3" },
      { value: null, label: "Budget offen", hint: "Beste Lösung zeigen", icon: "b4" },
    ],
  },
];

const locationToMounting: Record<InstallLocation, keyof typeof solarAssumptions.mounting> = {
  balkon: "balkon",
  flachdach: "flachdach",
  schraegdach: "schraegdach",
  garten: "garten",
};

const answerLabel = (key: keyof Draft, value: unknown) => steps.find((s) => s.key === key)?.options.find((o) => o.value === value)?.label ?? "–";

export function Configurator({ id = "produktfinder" }: { id?: string }) {
  const [draft, setDraft] = useState<Draft>({});
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const root = useRef<HTMLDivElement>(null);
  const done = step >= steps.length;

  const scrollIntoView = () => {
    const el = root.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.5) {
      const lenis = getLenis();
      const target = window.scrollY + top - 96;
      if (lenis) lenis.scrollTo(target, { duration: 0.9 });
      else window.scrollTo({ top: target, behavior: "smooth" });
    }
  };

  const choose = (key: keyof Draft, value: unknown) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirection(1);
    window.setTimeout(() => {
      setStep((s) => s + 1);
      scrollIntoView();
    }, 220);
  };

  const goTo = (i: number) => {
    setDirection(i < step ? -1 : 1);
    setStep(i);
    scrollIntoView();
  };

  const answers: FinderAnswers | null =
    draft.location && draft.storage && draft.modules && draft.power && draft.budget !== undefined
      ? { location: draft.location, storage: draft.storage as StorageWish, modules: draft.modules as ModuleCount, power: draft.power, budget: draft.budget ?? null }
      : null;

  return (
    <div id={id} ref={root} className="scroll-mt-28">
      <div className="overflow-hidden rounded-[28px] border border-line bg-white shadow-[var(--shadow-soft)]">
        {/* Fortschritt */}
        <div className="flex items-center gap-4 border-b border-line px-5 py-4 md:px-8">
          <div className="flex flex-1 gap-1.5" aria-hidden>
            {steps.map((s, i) => (
              <span key={s.key} className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
                <span
                  className="block h-full rounded-full bg-ink transition-[width] duration-700 ease-[var(--ease-out-expo)]"
                  style={{ width: i < step ? "100%" : i === step ? "35%" : "0%" }}
                />
              </span>
            ))}
          </div>
          <p className="shrink-0 font-mono text-xs text-muted tabular" aria-live="polite">
            {done ? "Fertig" : `Frage ${step + 1} von ${steps.length}`}
          </p>
        </div>

        {!done ? (
          <StepView
            key={step}
            def={steps[step]!}
            value={draft[steps[step]!.key]}
            direction={direction}
            onChoose={(v) => choose(steps[step]!.key, v)}
            onBack={step > 0 ? () => goTo(step - 1) : undefined}
          />
        ) : (
          answers && (
            <Results
              answers={answers}
              orientation={draft.orientation ?? "sued"}
              summary={
                <ul className="flex flex-wrap gap-2">
                  {steps.map((s, i) => (
                    <li key={s.key}>
                      <button type="button" onClick={() => goTo(i)} className="chip border border-line bg-paper text-ink hover:border-ink" title="Antwort ändern">
                        {answerLabel(s.key, draft[s.key] ?? (s.key === "budget" ? null : undefined))}
                        <svg viewBox="0 0 12 12" className="h-3 w-3 text-muted" aria-hidden>
                          <path d="M8.5 1.5l2 2-6 6H2.5v-2z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              }
              onRestart={() => {
                setDraft({});
                goTo(0);
              }}
            />
          )
        )}
      </div>
    </div>
  );
}

function StepView({
  def,
  value,
  direction,
  onChoose,
  onBack,
}: {
  def: StepDef;
  value: unknown;
  direction: 1 | -1;
  onChoose: (v: unknown) => void;
  onBack?: () => void;
}) {
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Fokus nur setzen, wenn der Nutzer schon im Finder ist (nicht beim Laden der Seite)
    if (document.activeElement && document.activeElement !== document.body) first.current?.focus({ preventScroll: true });
  }, []);
  const cols = def.options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <fieldset
      className="m-0 min-w-0 border-0 p-5 md:p-8"
      style={{ animation: `${direction === 1 ? "step-in" : "step-back"} 0.6s var(--ease-out-expo) both` }}
    >
      <legend className="display-md float-left mb-2 w-full p-0 text-[26px] md:text-[34px]">{def.question}</legend>
      <p className="clear-both mb-7 max-w-2xl text-muted">{def.help}</p>
      <div className={`grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 ${cols}`}>
        {def.options.map((o, i) => {
          const checked = value === o.value;
          const id = `${def.key}-${String(o.value)}`;
          return (
            <label
              key={id}
              htmlFor={id}
              className={`group relative flex cursor-pointer flex-col gap-4 rounded-2xl border p-5 transition-[border-color,background-color,transform,box-shadow] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-lime/60 ${
                checked ? "border-ink bg-ink text-paper shadow-[var(--shadow-lift)]" : "border-line bg-paper hover:border-ink/40 hover:bg-white"
              }`}
            >
              <input
                ref={i === 0 ? first : undefined}
                id={id}
                type="radio"
                name={def.key}
                className="sr-only"
                checked={checked}
                onChange={() => onChoose(o.value)}
                onClick={() => checked && onChoose(o.value)}
              />
              <StepIcon name={o.icon} active={checked} />
              <span>
                <span className="block text-lg font-semibold">{o.label}</span>
                <span className={`block text-sm ${checked ? "text-paper/70" : "text-muted"}`}>{o.hint}</span>
              </span>
              <span
                aria-hidden
                className={`absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full border transition-colors ${checked ? "border-lime bg-lime text-ink" : "border-line"}`}
              >
                {checked && (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-6 flex min-h-12 items-center justify-between">
        {onBack ? (
          <Button variant="ghost" onClick={onBack}>
            ← Zurück
          </Button>
        ) : (
          <span className="text-sm text-muted">Dauert etwa eine Minute.</span>
        )}
      </div>
    </fieldset>
  );
}

function Results({ answers, orientation, summary, onRestart }: { answers: FinderAnswers; orientation: OrientationKey; summary: ReactNode; onRestart: () => void }) {
  const recs = useMemo(() => recommend(answers), [answers]);
  const extras = useMemo(() => recommendAccessories(answers), [answers]);
  const [selected, setSelected] = useState(0);
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);
  const rec = recs[selected] ?? recs[0];

  const sim = useMemo(() => {
    if (!rec) return null;
    const p = rec.product;
    return simulate({
      totalWp: p.specs.totalWp ?? 880,
      orientation,
      mounting: locationToMounting[answers.location],
      withStorage: Boolean(p.specs.storageKWh),
      systemCostEUR: hasPrice(p) ? p.price : null,
      assumptions,
    });
  }, [rec, orientation, answers.location, assumptions]);

  if (!rec || !sim) {
    return (
      <div className="p-8 text-center">
        <p className="display-md text-2xl">Dafür haben wir noch kein passendes Set.</p>
        <p className="mt-2 text-muted">Schreib uns, wir beraten dich persönlich.</p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/kontakt" variant="dark" arrow>
            Beratung anfragen
          </ButtonLink>
          <Button variant="outline" onClick={onRestart}>
            Neu starten
          </Button>
        </div>
      </div>
    );
  }

  const roofNote = answers.location === "schraegdach";

  return (
    <div style={{ animation: "step-in 0.7s var(--ease-out-expo) both" }}>
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-8">
        <div>
          <p className="eyebrow">Dein Ergebnis</p>
          <h3 className="display-md mt-2 text-[28px] md:text-[38px]">Diese Lösungen passen zu dir.</h3>
        </div>
        <Button variant="outline" size="sm" onClick={onRestart}>
          Neu starten
        </Button>
      </div>
      <div className="px-5 md:px-8">{summary}</div>

      {roofNote && (
        <p className="mx-5 mt-5 rounded-2xl bg-sun-soft/70 px-4 py-3 text-sm text-[#5a3a00] md:mx-8">
          Auf dem Schrägdach sind steckerfertige Sets möglich, die Montage auf dem Dach sollte aber ein Fachbetrieb übernehmen.
          Für größere Dachanlagen über 2.000 Wp beraten wir dich gern persönlich.
        </p>
      )}

      {/* Empfehlungen */}
      <ul className={`grid gap-4 p-5 md:p-8 ${recs.length >= 3 ? "md:grid-cols-3" : recs.length === 2 ? "md:grid-cols-2 lg:max-w-[880px]" : "md:max-w-[460px]"}`} role="list">
        {recs.map((r, i) => {
          const active = i === selected;
          return (
            <li key={r.product.id}>
              <div
                className={`relative flex h-full flex-col overflow-hidden rounded-2xl border transition-[border-color,box-shadow] duration-300 ${
                  active ? "border-ink shadow-[var(--shadow-lift)]" : "border-line"
                }`}
              >
                {i === 0 && <span className="chip absolute left-4 top-4 z-[2] bg-lime text-ink">Beste Übereinstimmung</span>}
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-pressed={active}
                  className="relative block aspect-[16/10] max-w-full bg-[radial-gradient(120%_90%_at_30%_10%,#fff_0%,#e9eef0_75%)]"
                  aria-label={`${r.product.name} in der Simulation anzeigen`}
                >
                  <ProductVisual visual={r.product.visual} className="absolute inset-[10%] h-[80%] w-[80%]" />
                </button>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <DataStatusChip product={r.product} />
                  </div>
                  <p className="font-semibold leading-snug">{r.product.name}</p>
                  <ul className="space-y-1.5 text-sm">
                    {r.reasons.slice(0, 3).map((reason) => (
                      <li key={reason} className="flex gap-2">
                        <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-deep" />
                        {reason}
                      </li>
                    ))}
                    {r.caveats.map((c) => (
                      <li key={c} className="flex gap-2 text-muted">
                        <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sun" />
                        {c}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <PriceTag product={r.product} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AddToCartButton product={r.product} size="sm" />
                    <ButtonLink href={`/produkt/${r.product.slug}`} variant="outline" size="sm">
                      Details
                    </ButtonLink>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    className={`text-left text-sm font-semibold ${active ? "text-lime-deep" : "text-muted hover:text-ink"}`}
                  >
                    {active ? "● In der Simulation" : "○ In der Simulation zeigen"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {extras.length > 0 && (
        <div className="mx-5 mb-2 flex flex-wrap items-center gap-3 rounded-2xl bg-paper p-4 md:mx-8">
          <p className="text-sm font-semibold">Passendes Zubehör:</p>
          {extras.map((p) => (
            <Link key={p.id} href={`/produkt/${p.slug}`} className="chip border border-line bg-white text-ink hover:border-ink">
              {p.name}
            </Link>
          ))}
        </div>
      )}

      {/* Simulation */}
      <section aria-labelledby="sim-title" className="on-dark m-3 mt-6 rounded-[24px] bg-ink-2 p-5 text-paper md:m-4 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Stromersparnis-Simulation</p>
            <h3 id="sim-title" className="display-md mt-2 text-2xl md:text-3xl">
              {rec.product.name}
            </h3>
          </div>
          <p className="text-sm text-muted-dark">
            {solarAssumptions.orientation[orientation].label} · {solarAssumptions.mounting[locationToMounting[answers.location]].label}
          </p>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink-line lg:grid-cols-4">
          <Stat label="Geschätzte Jahresproduktion" value={<CountUp value={Math.round(sim.annualKWh)} suffix=" kWh" />} note="im ersten Jahr" />
          <Stat
            label="Geschätzte Ersparnis pro Jahr"
            value={<CountUp value={Math.round(sim.firstYearSavingsEUR)} suffix=" €" />}
            note={`bei ${formatNumber(assumptions.electricityPriceCt, 0)} ct/kWh`}
            highlight
          />
          <Stat
            label="Geschätzte Amortisation"
            value={sim.paybackYears !== null ? <CountUp value={sim.paybackYears} decimals={1} suffix=" Jahre" /> : "–"}
            note={hasPrice(rec.product) ? `bei ${formatEUR(rec.product.price, { round: true })} Anschaffung` : "Preis folgt (Demo-Produkt)"}
          />
          <Stat
            label={`Ersparnis in ${assumptions.years} Jahren`}
            value={<CountUp value={Math.round(sim.totalSavingsEUR)} suffix=" €" />}
            note="vor Abzug der Anschaffung"
          />
        </dl>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0">
            <p className="mb-3 font-semibold">Bilanz über {assumptions.years} Jahre</p>
            <CashflowChart data={sim.cashflow} paybackYears={sim.paybackYears} />
          </div>
          <div className="min-w-0">
            <p className="mb-3 font-semibold">Ertrag je Monat</p>
            <MonthlyChart values={sim.monthlyKWh} />
            <p className="mt-3 text-sm text-muted-dark">
              Davon nutzt du etwa <strong className="text-paper">{formatInt(sim.selfUsedKWh)} kWh</strong> selbst
              {sim.feedInKWh > 1 && (
                <>
                  , rund <strong className="text-paper">{formatInt(sim.feedInKWh)} kWh</strong> fließen ins Netz
                </>
              )}
              .{sim.clippingLoss > 0 && ` Durch die 800-W-Grenze gehen etwa ${formatNumber(sim.clippingLoss * 100, 0)} % des Ertrags verloren.`}
            </p>
          </div>
        </div>

        <AssumptionsPanel value={assumptions} onChange={setAssumptions} />
      </section>
    </div>
  );
}

function Stat({ label, value, note, highlight }: { label: string; value: ReactNode; note: string; highlight?: boolean }) {
  return (
    <div className="bg-ink-2 p-5">
      <dt className="text-sm text-muted-dark">{label}</dt>
      <dd className={`mt-2 font-sans text-3xl font-bold md:text-4xl ${highlight ? "text-lime" : "text-paper"}`}>{value}</dd>
      <dd className="mt-1 text-xs text-muted-dark">{note}</dd>
    </div>
  );
}
