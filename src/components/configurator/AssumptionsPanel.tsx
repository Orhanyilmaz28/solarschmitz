"use client";

import { useId, useState } from "react";
import { defaultAssumptions, type Assumptions } from "@/lib/solar/calc";

interface FieldDef {
  key: keyof Assumptions;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  /** Anzeige in Prozent statt Anteil (0,6 -> 60) */
  percent?: boolean;
  hint: string;
}

const fields: FieldDef[] = [
  { key: "electricityPriceCt", label: "Strompreis", unit: "ct/kWh", min: 15, max: 70, step: 1, hint: "Steht auf deiner Stromrechnung (Arbeitspreis)." },
  { key: "priceIncreasePct", label: "Strompreis-Steigerung", unit: "% pro Jahr", min: 0, max: 8, step: 0.5, hint: "Annahme für die Zukunft, 0 = gleichbleibend." },
  { key: "selfConsumptionWithout", label: "Eigenverbrauch ohne Speicher", unit: "%", min: 20, max: 100, step: 5, percent: true, hint: "Anteil des Solarstroms, den du direkt verbrauchst." },
  { key: "selfConsumptionWith", label: "Eigenverbrauch mit Speicher", unit: "%", min: 30, max: 100, step: 5, percent: true, hint: "Mit Speicher nutzt du mehr selbst." },
  { key: "specificYieldKWhPerKWp", label: "Spezifischer Ertrag", unit: "kWh/kWp", min: 700, max: 1200, step: 10, hint: "Mittel in Deutschland bei Südausrichtung: ca. 900–1.000." },
  { key: "degradationPct", label: "Leistungsverlust der Module", unit: "% pro Jahr", min: 0, max: 1.5, step: 0.1, hint: "Übliche Herstellerangaben liegen bei 0,4–0,6 %." },
  { key: "feedInTariffCt", label: "Vergütung für eingespeisten Strom", unit: "ct/kWh", min: 0, max: 10, step: 0.1, hint: "Bei Balkonkraftwerken meist 0." },
  { key: "years", label: "Betrachtungszeitraum", unit: "Jahre", min: 5, max: 30, step: 1, hint: "Wie weit die Bilanz in die Zukunft rechnet." },
];

/** Alle Rechenannahmen offen und änderbar. */
export function AssumptionsPanel({ value, onChange }: { value: Assumptions; onChange: (a: Assumptions) => void }) {
  const [open, setOpen] = useState(false);
  const uid = useId();
  const changed = (Object.keys(defaultAssumptions) as (keyof Assumptions)[]).some((k) => value[k] !== defaultAssumptions[k]);
  return (
    <div className="mt-8 rounded-2xl border border-ink-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${uid}-panel`}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span>
          <span className="block font-semibold">Annahmen der Berechnung {changed && <span className="chip ml-2 bg-lime text-ink">angepasst</span>}</span>
          <span className="block text-sm text-muted-dark">Alle Werte sind Schätzungen. Passe sie an deine Situation an.</span>
        </span>
        <span aria-hidden className={`text-xl transition-transform duration-500 ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      <div id={`${uid}-panel`} className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="grid gap-x-8 gap-y-6 border-t border-ink-line p-5 md:grid-cols-2">
            {fields.map((f) => {
              const raw = value[f.key];
              const display = f.percent ? Math.round(raw * 100) : raw;
              const id = `${uid}-${f.key}`;
              return (
                <div key={f.key}>
                  <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-semibold">
                    {f.label}
                    <span className="font-mono font-normal tabular text-lime">
                      {String(display).replace(".", ",")} {f.unit}
                    </span>
                  </label>
                  <input
                    id={id}
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={display}
                    tabIndex={open ? 0 : -1}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      onChange({ ...value, [f.key]: f.percent ? n / 100 : n });
                    }}
                    className="mt-3 w-full accent-[#B7F34B]"
                  />
                  <p className="mt-1 text-xs text-muted-dark">{f.hint}</p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-line px-5 py-4 text-xs text-muted-dark">
            <p className="max-w-2xl">
              Die Simulation ist eine Schätzung und keine Ertragsgarantie. Verschattung, Wetter, Standort und dein Verbrauchsverhalten können das Ergebnis deutlich verändern.
            </p>
            <button type="button" tabIndex={open ? 0 : -1} onClick={() => onChange(defaultAssumptions)} className="font-semibold text-paper underline decoration-paper/30 underline-offset-4 hover:decoration-lime">
              Standardwerte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
