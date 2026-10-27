"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { solarAssumptions, type OrientationKey } from "@/config/solar-assumptions";
import {
  accessoriesFor,
  independenceLabels,
  placeLabels,
  placeNotes,
  placeToMounting,
  priorityLabels,
  recommend,
  type FinderAnswers,
  type Recommendation,
} from "@/lib/solar/recommend";
import { defaultAssumptions, simulate, type Assumptions, type SimulationResult } from "@/lib/solar/calc";
import { getCategory, hasPrice } from "@/lib/catalog";
import { formatEUR, formatInt, formatNumber } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CountUp } from "@/components/motion/CountUp";
import { PriceTag, DataStatusChip } from "@/components/shop/DataStatus";
import { AddToCartButton } from "@/components/shop/ProductActions";
import { CashflowChart, MonthlyChart } from "./SavingsChart";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { SystemDiagram, SystemList } from "./SystemDiagram";

const DEFAULT_HOUSEHOLD = 2500;
const orientationKeys = Object.keys(solarAssumptions.orientation) as OrientationKey[];

interface Props {
  answers: FinderAnswers;
  onEdit: (step: 0 | 1 | 2) => void;
  onRestart: () => void;
}

export function Result({ answers, onEdit, onRestart }: Props) {
  const recs = useMemo(() => recommend(answers), [answers]);
  const [selected, setSelected] = useState(0);
  const [orientation, setOrientation] = useState<OrientationKey>("sued");
  const [household, setHousehold] = useState(DEFAULT_HOUSEHOLD);
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);
  const rec = recs[selected] ?? recs[0];
  const notes = placeNotes(answers.place);

  const simFor = (r: Recommendation): SimulationResult =>
    simulate({
      totalWp: r.product.specs.totalWp ?? 0,
      orientation,
      mounting: placeToMounting[answers.place],
      withStorage: Boolean(r.product.specs.storageKWh),
      systemCostEUR: hasPrice(r.product) ? r.product.price : null,
      assumptions,
      householdKWh: household,
    });

  const sim = useMemo(() => (rec ? simFor(rec) : null), [rec, orientation, household, assumptions, answers.place]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vergleich mit / ohne Speicher (nur wer unsicher ist und wenn beide Wege Preise haben)
  const comparison = useMemo(() => {
    if (answers.independence !== "unsicher") return null;
    const withS = recs.find((r) => (r.product.specs.storageKWh ?? 0) > 0 && hasPrice(r.product));
    const without = recs.find((r) => !(r.product.specs.storageKWh ?? 0) && hasPrice(r.product));
    if (!withS || !without) return null;
    return { withS: { r: withS, s: simFor(withS) }, without: { r: without, s: simFor(without) } };
  }, [answers.independence, recs, orientation, household, assumptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const extras = useMemo(() => (rec ? accessoriesFor(answers, rec.product) : []), [answers, rec]);

  const chips: { step: 0 | 1 | 2; label: string; value: string }[] = [
    { step: 0, label: "Ort", value: placeLabels[answers.place] },
    { step: 1, label: "Unabhängigkeit", value: independenceLabels[answers.independence] },
    { step: 2, label: "Priorität", value: priorityLabels[answers.priority] },
  ];

  if (!rec || !sim) {
    return (
      <div className="px-6 py-16 text-center md:px-10">
        <p className="t-h2 m-0">Dafür haben wir gerade kein passendes Komplettset.</p>
        <p className="t-lead mx-auto mt-4 max-w-xl">Schreib uns, wir beraten dich persönlich zu deinem Vorhaben.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
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

  const category = getCategory(rec.product.category);

  return (
    <div style={{ animation: "step-in 0.7s var(--ease-out-expo) both" }}>
      {/* Kopf */}
      <div className="flex flex-col gap-6 px-5 pt-8 md:px-10 md:pt-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="t-label">Dein Ergebnis</p>
          <h3 className="t-h1 mt-3 mb-0" aria-live="polite">
            So sieht deine Anlage aus.
          </h3>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Deine Antworten">
          {chips.map((c) => (
            <li key={c.step}>
              <button
                type="button"
                onClick={() => onEdit(c.step)}
                className="group inline-flex items-center gap-2 rounded-full border border-line bg-paper py-1.5 pl-3 pr-2 text-sm transition-colors hover:border-ink"
                aria-label={`${c.label}: ${c.value} – ändern`}
              >
                <span className="text-muted">{c.label}</span>
                <span className="font-semibold">{c.value}</span>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-muted group-hover:text-ink">
                  <Icon name="arrow-up-right" size={13} />
                </span>
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={onRestart} className="inline-flex h-full items-center rounded-full px-3 py-1.5 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
              Neu starten
            </button>
          </li>
        </ul>
      </div>

      {notes.length > 0 && (
        <div className="mx-5 mt-6 flex gap-3 rounded-2xl bg-sun-soft/60 px-4 py-3 text-sm text-[#5a3a00] md:mx-10">
          <Icon name="info" size={18} className="mt-0.5 shrink-0" />
          <div className="space-y-1">
            {notes.map((n) => (
              <p key={n} className="m-0">
                {n}
              </p>
            ))}
            {answers.place === "hausdach" && (
              <p className="m-0 pt-1">
                <Link href="/kontakt" className="font-semibold underline decoration-[#5a3a00]/40 underline-offset-4 hover:decoration-[#5a3a00]">
                  Beratung für dein Dach anfragen
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hauptempfehlung */}
      <div className="grid gap-8 px-5 py-8 md:px-10 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <div className="rounded-[24px] bg-stone px-4 pb-4 pt-5 md:px-8 md:pt-8">
            <div className="hidden sm:block">
              <SystemDiagram key={rec.product.id} product={rec.product} mount={extras.some((e) => e.kind === "montage")} />
            </div>
            <div className="sm:hidden">
              <SystemList product={rec.product} mount={extras.some((e) => e.kind === "montage")} />
            </div>
            <p className="mt-2 text-center text-xs text-muted">Systemaufbau, abgeleitet aus den Produktdaten · schematische Darstellung</p>
          </div>
        </div>
        <div className="flex flex-col gap-5 lg:col-span-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip bg-ink text-paper">{selected === 0 ? "Beste Übereinstimmung" : `Alternative ${selected}`}</span>
            <DataStatusChip product={rec.product} />
          </div>
          <h4 className="t-h2 m-0">{rec.product.name}</h4>
          <ul className="m-0 list-none space-y-2.5 p-0 text-[15px]">
            {rec.reasons.map((r) => (
              <li key={r} className="flex gap-2.5">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-lime-deep" />
                {r}
              </li>
            ))}
            {rec.caveats.map((c) => (
              <li key={c} className="flex gap-2.5 text-muted">
                <Icon name="info" size={18} className="mt-0.5 shrink-0 text-sun-3" />
                {c}
              </li>
            ))}
          </ul>
          <div className="border-t border-line pt-5">
            <PriceTag product={rec.product} size="lg" />
          </div>
          <div className="flex flex-wrap gap-3">
            <AddToCartButton product={rec.product} />
            <ButtonLink href={`/produkt/${rec.product.slug}`} variant="outline">
              Produkt ansehen
            </ButtonLink>
          </div>
          {category && (
            <Link href={`/kategorie/${category.slug}`} className="text-sm font-semibold text-muted underline decoration-line underline-offset-4 hover:text-ink">
              Alle {category.name} ansehen
            </Link>
          )}
        </div>
      </div>

      {/* Alternativen */}
      {recs.length > 1 && (
        <div className="px-5 pb-8 md:px-10">
          <p className="t-label mb-4">Weitere passende Sets</p>
          <ul className="grid list-none gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
            {recs.map((r, i) => (
              <li key={r.product.id}>
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-pressed={i === selected}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition-colors ${
                    i === selected ? "border-ink bg-white" : "border-line bg-paper hover:border-ink/40"
                  }`}
                >
                  <span className="w-28 shrink-0 rounded-xl bg-stone p-1.5">
                    <SystemDiagram product={r.product} size="sm" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-snug">{r.product.name}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {hasPrice(r.product) ? formatEUR(r.product.price) : "Preis folgt"}
                      {i === selected ? " · wird angezeigt" : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Vergleich mit / ohne Speicher */}
      {comparison && (
        <div className="mx-5 mb-8 rounded-[24px] border border-line p-5 md:mx-10 md:p-8">
          <p className="t-label">Mit oder ohne Speicher?</p>
          <p className="t-h3 mt-3 mb-0">
            Der Speicher kostet {formatEUR(comparison.withS.r.product.price - comparison.without.r.product.price, { round: true })} mehr und spart im ersten Jahr etwa{" "}
            {formatEUR(Math.max(0, comparison.withS.s.firstYearSavingsEUR - comparison.without.s.firstYearSavingsEUR), { round: true })} zusätzlich.
          </p>
          <div className="mt-6 grid sm:grid-cols-2">
            {[
              { label: "Ohne Speicher", r: comparison.without.r, s: comparison.without.s },
              { label: "Mit Speicher", r: comparison.withS.r, s: comparison.withS.s },
            ].map((c, i) => (
              <div key={c.label} className={i === 0 ? "pb-5 sm:pb-0 sm:pr-8" : "border-t border-line pt-5 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0"}>
                <p className="m-0 font-semibold">{c.label}</p>
                <p className="m-0 mt-1 text-sm text-muted">{c.r.product.name}</p>
                <dl className="m-0 mt-4 grid grid-cols-3 gap-3 text-sm">
                  <Kv k="Preis" v={formatEUR(c.r.product.price, { round: true })} />
                  <Kv k="Ersparnis/Jahr" v={formatEUR(c.s.firstYearSavingsEUR, { round: true })} />
                  <Kv k="Amortisation" v={c.s.paybackYears !== null ? `${formatNumber(c.s.paybackYears, 1)} Jahre` : "–"} />
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation */}
      <section aria-labelledby="sim-title" className="on-dark m-2 rounded-[26px] bg-ink-2 p-5 text-paper md:m-3 md:p-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="t-label">Ertrag und Ersparnis</p>
            <h4 id="sim-title" className="t-h2 mt-3 mb-0">
              Was {rec.product.specs.moduleCount ?? ""} {rec.product.specs.moduleCount === 1 ? "Modul" : "Module"} bei dir bringen
            </h4>
          </div>
          <p className="text-sm text-muted-dark">{solarAssumptions.mounting[placeToMounting[answers.place]].label}</p>
        </div>

        {/* Wichtigste Eingaben direkt sichtbar */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-3 p-0 text-sm font-semibold">Ausrichtung der Module</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {orientationKeys.map((k) => (
                <label
                  key={k}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sun-1 ${
                    orientation === k ? "border-paper bg-paper text-ink" : "border-ink-line hover:border-paper/40"
                  }`}
                >
                  <input type="radio" name="sim-orientation" className="sr-only" checked={orientation === k} onChange={() => setOrientation(k)} />
                  {solarAssumptions.orientation[k].label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="sim-household" className="mb-3 flex items-baseline justify-between gap-3 text-sm font-semibold">
              Stromverbrauch deines Haushalts
              <span className="font-mono font-normal text-sun-1 tabular">{formatInt(household)} kWh/Jahr</span>
            </label>
            <input
              id="sim-household"
              type="range"
              min={1000}
              max={8000}
              step={100}
              value={household}
              onChange={(e) => setHousehold(Number(e.target.value))}
              className="w-full accent-[#FFA42A]"
            />
            <p className="mt-1 text-xs text-muted-dark">Steht auf deiner Jahresabrechnung. Zwei Personen verbrauchen oft 2.000 bis 3.000 kWh.</p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink-line lg:grid-cols-4">
          <Stat label="Solarstrom pro Jahr" value={<CountUp value={Math.round(sim.annualKWh)} />} unit="kWh" note="geschätzt, erstes Jahr" />
          <Stat
            label="Ersparnis pro Jahr"
            value={<CountUp value={Math.round(sim.firstYearSavingsEUR)} />}
            unit="€"
            note={`bei ${formatNumber(assumptions.electricityPriceCt, 0)} ct/kWh`}
            highlight
          />
          <Stat
            label="Amortisation"
            value={sim.paybackYears !== null ? <CountUp value={sim.paybackYears} decimals={1} /> : "–"}
            unit={sim.paybackYears !== null ? "Jahre" : undefined}
            note={
              hasPrice(rec.product)
                ? sim.paybackYears !== null
                  ? `bei ${formatEUR(rec.product.price, { round: true })} Anschaffung`
                  : `nicht innerhalb von ${assumptions.years} Jahren`
                : "Preis folgt (Demo-Produkt)"
            }
          />
          <Stat
            label="Deckt deinen Verbrauch"
            value={sim.coverage !== null ? <CountUp value={Math.round(sim.coverage * 100)} /> : "–"}
            unit={sim.coverage !== null ? "%" : undefined}
            note={`von ${formatInt(household)} kWh im Jahr`}
          />
        </dl>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0">
            <p className="mb-3 font-semibold">
              {hasPrice(rec.product) ? "Bilanz" : "Ersparnis"} über {assumptions.years} Jahre
            </p>
            <CashflowChart
              data={sim.cashflow}
              paybackYears={sim.paybackYears}
              caption={
                hasPrice(rec.product)
                  ? undefined
                  : "Eingesparte Stromkosten, Jahr für Jahr aufsummiert. Ohne Anschaffungspreis gerechnet, weil der Preis für dieses Produkt noch folgt."
              }
            />
          </div>
          <div className="min-w-0">
            <p className="mb-3 font-semibold">Solarstrom je Monat</p>
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

      {/* Zubehör und Nachrüstung */}
      {extras.length > 0 && (
        <div className="px-5 py-8 md:px-10">
          <p className="t-label mb-4">Passt dazu</p>
          <ul className="grid list-none gap-3 p-0 md:grid-cols-2">
            {extras.map((e) => (
              <li key={e.product.id} className="flex items-start gap-4 rounded-2xl border border-line p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stone">
                  <Icon name={e.kind === "montage" ? "tool" : "battery"} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{e.kind === "montage" ? "Montage" : "Später nachrüsten"}</span>
                  <Link href={`/produkt/${e.product.slug}`} className="mt-1 block font-semibold hover:underline">
                    {e.product.name}
                  </Link>
                  <span className="mt-1 block text-sm text-muted">{e.note}</span>
                  {hasPrice(e.product) && <span className="mt-1.5 block text-sm font-semibold tabular sm:hidden">{formatEUR(e.product.price)}</span>}
                </span>
                {hasPrice(e.product) && <span className="hidden shrink-0 text-sm font-semibold tabular sm:block">{formatEUR(e.product.price)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, unit, note, highlight }: { label: string; value: ReactNode; unit?: string; note: string; highlight?: boolean }) {
  return (
    <div className="bg-ink-2 p-4 sm:p-5">
      <dt className="text-sm text-muted-dark">{label}</dt>
      <dd className={`m-0 mt-2 flex flex-wrap items-baseline gap-x-1.5 font-sans font-bold leading-tight ${highlight ? "text-lime" : "text-paper"}`}>
        <span className="tabular text-[1.6rem] sm:text-3xl md:text-[2.5rem]">{value}</span>
        {unit && <span className="text-sm font-semibold sm:text-base md:text-xl">{unit}</span>}
      </dd>
      <dd className="m-0 mt-1 text-xs text-muted-dark">{note}</dd>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="m-0 mt-1 font-semibold tabular">{v}</dd>
    </div>
  );
}
