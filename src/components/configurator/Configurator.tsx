"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { FinderAnswers, Independence, Place, Priority } from "@/lib/solar/recommend";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { getLenis } from "@/components/motion/SmoothScroll";
import { PlaceScene } from "./scenes/PlaceScene";
import { DayCurve } from "./DayCurve";
import { Result } from "./Result";
import { independenceOptions, placeOptions, priorityOptions, stepTitles, type ChoiceOption } from "./options";

type Draft = Partial<FinderAnswers>;
type Step = 0 | 1 | 2 | 3;

/**
 * Solar-Konfigurator 2.0
 * Drei Fragen (Ort, Unabhängigkeit, Priorität) und ein Ergebnis, das vollständig
 * aus den Antworten und offen gelegten Annahmen abgeleitet wird.
 */
export function Configurator({ id = "produktfinder" }: { id?: string }) {
  const [draft, setDraft] = useState<Draft>({});
  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [interacted, setInteracted] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const answers: FinderAnswers | null =
    draft.place && draft.independence && draft.priority ? { place: draft.place, independence: draft.independence, priority: draft.priority } : null;

  const reached = (s: Step) => s === 0 || (s === 1 && !!draft.place) || (s === 2 && !!draft.independence) || (s === 3 && !!answers);

  const scrollIntoView = () => {
    const el = root.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    // knapp unter dem (sticky) Header ausrichten, damit der ganze Schritt sichtbar ist
    const header = document.querySelector("header")?.getBoundingClientRect().height ?? 80;
    if (top < header - 40 || top > window.innerHeight * 0.4) {
      const target = window.scrollY + top - header - 12;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(target, { duration: 0.9 });
      else window.scrollTo({ top: target, behavior: "smooth" });
    }
  };

  const goTo = (s: Step) => {
    setDirection(s < step ? -1 : 1);
    setStep(s);
    setInteracted(true);
    scrollIntoView();
  };

  const next = () => {
    if (step < 3 && reached((step + 1) as Step)) goTo((step + 1) as Step);
  };

  const set = <K extends keyof FinderAnswers>(key: K, value: FinderAnswers[K], advance: boolean) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setInteracted(true);
    if (advance) window.setTimeout(() => goTo((step + 1) as Step), 260);
  };

  return (
    <div id={id} ref={root} className="scroll-mt-28">
      <div className="overflow-hidden rounded-[32px] border border-line bg-white">
        <Progress step={step} reached={reached} onJump={goTo} />

        <div key={step} style={{ animation: `${direction === 1 ? "step-in" : "step-back"} 0.6s var(--ease-out-expo) both` }}>
          {step === 0 && (
            <StepFrame
              index={0}
              question="Wo möchtest du deine Energie erzeugen?"
              help="Der Ort bestimmt Halterung, Neigung und damit den Ertrag."
              focus={interacted}
              canNext={!!draft.place}
              onNext={next}
            >
              <PlaceChoice value={draft.place} onChange={(v, adv) => set("place", v, adv)} />
            </StepFrame>
          )}
          {step === 1 && (
            <StepFrame
              index={1}
              question="Wie unabhängig möchtest du werden?"
              help="Ein Speicher hebt Strom vom Mittag für den Abend auf. Ohne Speicher nutzt du Solarstrom, wenn er entsteht."
              focus={interacted}
              canNext={!!draft.independence}
              onBack={() => goTo(0)}
              onNext={next}
              aside={<IndependenceVisual value={draft.independence} />}
            >
              <ChoiceGroup<Independence> name="independence" options={independenceOptions} value={draft.independence} columns={1} onChange={(v, adv) => set("independence", v, adv)} />
            </StepFrame>
          )}
          {step === 2 && (
            <StepFrame
              index={2}
              question="Was ist dir besonders wichtig?"
              help="Danach gewichten wir die Vorschläge. Die Antwort kannst du jederzeit ändern."
              focus={interacted}
              canNext={!!draft.priority}
              onBack={() => goTo(1)}
              onNext={next}
              nextLabel="Ergebnis zeigen"
            >
              <ChoiceGroup<Priority> name="priority" options={priorityOptions} value={draft.priority} columns={2} onChange={(v, adv) => set("priority", v, adv)} />
            </StepFrame>
          )}
          {step === 3 && answers && (
            <Result
              answers={answers}
              onEdit={(s) => goTo(s)}
              onRestart={() => {
                setDraft({});
                goTo(0);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Fortschritt ---------------- */

function Progress({ step, reached, onJump }: { step: Step; reached: (s: Step) => boolean; onJump: (s: Step) => void }) {
  return (
    <nav aria-label="Fortschritt" className="border-b border-line px-5 py-3 sm:py-4 md:px-10">
      <p className="m-0 mb-2.5 text-sm sm:hidden" aria-hidden>
        <span className="font-mono text-xs text-muted">Schritt {step + 1} von 4 · </span>
        <span className="font-semibold">{stepTitles[step]}</span>
      </p>
      <ol className="m-0 grid list-none grid-cols-4 gap-2 p-0 md:gap-4">
        {stepTitles.map((title, i) => {
          const s = i as Step;
          const done = s < step;
          const current = s === step;
          const can = reached(s) && !current;
          return (
            <li key={title} className="min-w-0">
              <button
                type="button"
                disabled={!can}
                onClick={() => onJump(s)}
                aria-current={current ? "step" : undefined}
                aria-label={`Schritt ${i + 1}: ${title}${done ? " (erledigt)" : current ? " (aktuell)" : ""}`}
                className="group flex w-full flex-col gap-2 text-left disabled:cursor-default"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-mist">
                  <span
                    className={`block h-full rounded-full transition-[width,background-color] duration-700 ease-[var(--ease-out-expo)] ${current ? "bg-sun-2" : "bg-ink"}`}
                    style={{ width: done ? "100%" : current ? "45%" : "0%" }}
                  />
                </span>
                <span className={`hidden items-center gap-1.5 truncate text-xs sm:flex md:text-sm ${current ? "font-semibold text-ink" : done ? "text-ink group-enabled:group-hover:underline" : "text-muted"}`}>
                  <span className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span>{title}</span>
                  <span className="sr-only">{done ? " (erledigt)" : current ? " (aktuell)" : ""}</span>
                  {done && <Icon name="check" size={14} className="hidden text-lime-deep sm:inline" />}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------------- Schritt-Rahmen ---------------- */

function StepFrame({
  index,
  question,
  help,
  children,
  aside,
  focus,
  canNext,
  onBack,
  onNext,
  nextLabel = "Weiter",
}: {
  index: number;
  question: string;
  help: string;
  children: ReactNode;
  aside?: ReactNode;
  focus: boolean;
  canNext: boolean;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  // Fokus nur beim Wechsel in einen neuen Schritt setzen – nicht während man
  // im aktuellen Schritt noch mit den Pfeiltasten auswählt.
  const focusOnMount = useRef(focus);
  useEffect(() => {
    if (focusOnMount.current) heading.current?.focus({ preventScroll: true });
  }, []);
  const headingId = `cfg-step-${index}`;
  const footer = (
    <div className="mt-5 flex items-center justify-between gap-4 md:mt-7">
      {onBack ? (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-semibold text-muted hover:text-ink">
          <Icon name="arrow-right" size={16} className="rotate-180" />
          Zurück
        </button>
      ) : (
        <span className="text-sm text-muted">Drei Fragen, etwa eine Minute.</span>
      )}
      <Button variant="dark" onClick={onNext} disabled={!canNext} arrow>
        {nextLabel}
      </Button>
    </div>
  );
  return (
    <div className="px-5 py-6 md:px-10 md:py-10">
      <div className={aside ? "grid gap-8 lg:grid-cols-12 lg:gap-12" : ""}>
        <div className={aside ? "lg:col-span-6" : ""}>
          <p className="t-label m-0">Frage {index + 1} von 3</p>
          <h3 id={headingId} ref={heading} tabIndex={-1} className="t-h2 mb-0 mt-3 outline-none">
            {question}
          </h3>
          <p className="mb-5 mt-3 max-w-[58ch] text-muted md:mb-7">{help}</p>
          <div role="group" aria-labelledby={headingId}>
            {children}
          </div>
          {footer}
        </div>
        {aside && <div className="lg:col-span-6">{aside}</div>}
      </div>
    </div>
  );
}

/* ---------------- Auswahl: Ort (Bildkarten) ---------------- */

function PlaceChoice({ value, onChange }: { value?: Place; onChange: (v: Place, advance: boolean) => void }) {
  const pointer = useRef(false);
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {placeOptions.map((o, i) => {
        const checked = value === o.value;
        const inputId = `cfg-place-${o.value}`;
        return (
          <label
            key={o.value}
            htmlFor={inputId}
            onPointerDown={() => (pointer.current = true)}
            onClick={() => {
              // Klick auf die bereits gewählte Karte: weiter wie bei einer neuen Wahl
              if (checked && pointer.current) {
                pointer.current = false;
                onChange(o.value, true);
              }
            }}
            className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-[20px] border bg-white transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-sun-1/60 ${
              checked ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line hover:border-ink/30"
            }`}
            style={{ animation: `page-in 0.6s var(--ease-out-expo) ${i * 60}ms both` }}
          >
            <input
              id={inputId}
              type="radio"
              name="cfg-place"
              className="sr-only"
              checked={checked}
              onChange={() => {
                onChange(o.value, pointer.current);
                pointer.current = false;
              }}
              onKeyDown={(e) => {
                pointer.current = false;
                if (e.key === "Enter") onChange(o.value, true);
              }}
            />
            <span className="relative block aspect-[3/2] max-w-full overflow-hidden sm:aspect-[4/3]">
              <PlaceScene place={o.value} className="h-full w-full transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />
            </span>
            <span className="flex items-start gap-2 px-3.5 py-3 md:px-4 md:py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold md:text-lg">{o.label}</span>
                <span className="mt-0.5 block text-xs text-muted md:text-sm">{o.hint}</span>
              </span>
              <Check checked={checked} />
            </span>
          </label>
        );
      })}
    </div>
  );
}

/* ---------------- Auswahl: Text-Karten ---------------- */

function ChoiceGroup<V extends string>({
  name,
  options,
  value,
  columns,
  onChange,
}: {
  name: string;
  options: ChoiceOption<V>[];
  value?: V;
  columns: 1 | 2;
  onChange: (v: V, advance: boolean) => void;
}) {
  const pointer = useRef(false);
  return (
    <div className={`grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {options.map((o, i) => {
        const checked = value === o.value;
        const inputId = `cfg-${name}-${o.value}`;
        return (
          <label
            key={o.value}
            htmlFor={inputId}
            onPointerDown={() => (pointer.current = true)}
            onClick={() => {
              if (checked && pointer.current) {
                pointer.current = false;
                onChange(o.value, true);
              }
            }}
            className={`relative flex cursor-pointer items-center gap-3 rounded-[20px] border px-4 py-3.5 transition-[border-color,background-color,color] duration-300 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-sun-1/60 sm:gap-4 sm:py-4 md:p-5 ${
              checked ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/30"
            }`}
            style={{ animation: `page-in 0.6s var(--ease-out-expo) ${i * 60}ms both` }}
          >
            <input
              id={inputId}
              type="radio"
              name={`cfg-${name}`}
              className="sr-only"
              checked={checked}
              onChange={() => {
                onChange(o.value, pointer.current);
                pointer.current = false;
              }}
              onKeyDown={(e) => {
                pointer.current = false;
                if (e.key === "Enter") onChange(o.value, true);
              }}
            />
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full sm:h-12 sm:w-12 ${checked ? "bg-paper/10 text-sun-1" : "bg-stone text-ink"}`}>
              <Icon name={o.icon as IconName} size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold md:text-[17px]">{o.label}</span>
              <span className={`mt-0.5 block text-sm ${checked ? "text-paper/70" : "text-muted"}`}>{o.hint}</span>
            </span>
            <span
              aria-hidden
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors sm:h-6 sm:w-6 ${checked ? "border-sun-1 bg-sun-1 text-ink" : "border-line"}`}
            >
              {checked && <Icon name="check" size={14} strokeWidth={2.4} />}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** Auswahl-Kreis, gleich wie bei den Text-Karten */
function Check({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors duration-300 sm:h-6 sm:w-6 ${
        checked ? "border-ink bg-ink text-sun-1" : "border-line text-transparent"
      }`}
    >
      <Icon name="check" size={13} strokeWidth={2.4} />
    </span>
  );
}

/* ---------------- Visualisierung Schritt 2 ---------------- */

function IndependenceVisual({ value }: { value?: Independence }) {
  const [shown, setShown] = useState<"ohne" | "speicher">(value === "speicher" ? "speicher" : "ohne");
  useEffect(() => {
    if (value === "speicher" || value === "ohne") setShown(value);
  }, [value]);
  return (
    <div className="rounded-[24px] bg-stone p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 font-semibold">So verteilt sich dein Solarstrom über den Tag</p>
        <div className="inline-flex rounded-full bg-white p-1" role="group" aria-label="Tagesverlauf zeigen">
          {(["ohne", "speicher"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={shown === m}
              onClick={() => setShown(m)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${shown === m ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
            >
              {m === "ohne" ? "Ohne Speicher" : "Mit Speicher"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <DayCurve mode={shown} />
      </div>
      <p className="mt-4 text-sm text-muted">
        {shown === "speicher"
          ? "Der Überschuss vom Mittag lädt den Speicher. Am Abend versorgt er Licht, Fernseher und Kühlschrank."
          : "Mittags erzeugst du oft mehr, als du verbrauchst. Dieser Teil fließt ins Netz, meist ohne Vergütung."}{" "}
        Schematische Darstellung eines sonnigen Tages.
      </p>
    </div>
  );
}
