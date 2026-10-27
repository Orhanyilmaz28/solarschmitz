"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  SEASONS,
  exampleConfig,
  formatClock,
  simulateSeason,
  simulateYear,
  stepAt,
  totalsUntil,
  type Season,
} from "@/lib/energy-sim";
import { LogoMark } from "@/components/brand/Logo";
import { DayChart, CHART_PAD } from "./DayChart";
import { FlowDiagram } from "./FlowDiagram";
import { PlayButton, Segmented, Toggle } from "./Controls";
import { fmtEUR, fmtKWh, fmtNum, fmtPct, fmtW } from "./format";
import styles from "./dashboard.module.css";

const HOUSEHOLDS = [
  { value: "1500", label: "1 Person · 1.500 kWh/Jahr" },
  { value: "2500", label: "2 Personen · 2.500 kWh/Jahr" },
  { value: "4000", label: "4 Personen · 4.000 kWh/Jahr" },
] as const;

/** Simulierte Minuten pro Sekunde beim Abspielen (ganzer Tag ≈ 18 s) */
const SPEED = 80;
const START_MINUTE = 13 * 60;

export function DashboardApp() {
  const [season, setSeason] = useState<Season>("sommer");
  const [withStorage, setWithStorage] = useState(true);
  const [household, setHousehold] = useState<string>("2500");
  const [minute, setMinute] = useState(START_MINUTE);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const userPaused = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef(START_MINUTE);

  const cfg = useMemo(() => ({ ...exampleConfig, householdKWhPerYear: Number(household) }), [household]);
  const day = useMemo(() => simulateSeason(season, withStorage, cfg), [season, withStorage, cfg]);
  const year = useMemo(() => simulateYear(withStorage, cfg), [withStorage, cfg]);
  const yearOther = useMemo(() => simulateYear(!withStorage, cfg), [withStorage, cfg]);

  const step = stepAt(day, minute);
  const sofar = totalsUntil(day, minute + day.stepMinutes);

  // Automatisch abspielen, solange der Abschnitt sichtbar ist (nicht bei reduzierter Bewegung)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setVisible(entries.some((e) => e.isIntersecting && e.intersectionRatio > 0.3)), {
      threshold: [0, 0.3, 0.6],
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (visible && !reduce && !userPaused.current) setPlaying(true);
    if (!visible) setPlaying(false);
  }, [visible]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      minuteRef.current = (minuteRef.current + dt * SPEED) % 1440;
      acc += dt;
      // ca. 30 Aktualisierungen pro Sekunde reichen für eine flüssige Anzeige
      if (acc >= 1 / 30) {
        acc = 0;
        setMinute(Math.floor(minuteRef.current));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const select = useCallback((m: number) => {
    userPaused.current = true;
    setPlaying(false);
    minuteRef.current = m;
    setMinute(m);
  }, []);

  const togglePlay = () => {
    setPlaying((p) => {
      userPaused.current = p;
      return !p;
    });
  };

  const soc = step.socPct ?? 0;
  const minSoc = cfg.storage?.minSocPct ?? 0;
  const storageState = !withStorage
    ? { value: "–", note: "Speicher ausgeschaltet" }
    : {
        value: fmtPct(soc / 100),
        note:
          step.chargeW > 4
            ? `lädt mit ${fmtW(step.chargeW)}`
            : step.dischargeW > 4
              ? `gibt ${fmtW(step.dischargeW)} ab`
              : soc <= minSoc + 0.5
                ? "Reserve erreicht, das Netz übernimmt"
                : soc >= 99.5
                  ? "voll geladen"
                  : "wartet auf Überschuss",
      };
  const diffYear = withStorage ? year.savingsEUR - yearOther.savingsEUR : yearOther.savingsEUR - year.savingsEUR;
  const clock = formatClock(minute);
  const progress = `${((minute / 1435) * 100).toFixed(2)}%`;

  return (
    <div ref={rootRef} className="overflow-hidden rounded-[28px] border border-ink-line bg-[linear-gradient(180deg,#151E27_0%,#111921_100%)] shadow-[0_60px_120px_-60px_rgb(0_0_0/0.8)]">
      {/* App-Kopf */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-line px-5 py-4 md:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <LogoMark tone="dark" size={28} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-paper">Mein Sonnenwerk</p>
            <p className="truncate text-[12px] text-muted-dark">
              Beispielanlage · {fmtNum(exampleConfig.peakWp)} Wp · {withStorage ? `${fmtNum(exampleConfig.storage!.capacityKWh, 1)} kWh Speicher` : "ohne Speicher"}
            </p>
          </div>
        </div>
        <span className="chip border border-sun/40 bg-sun/10 text-sun-1">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sun-1" />
          Simulation mit Beispieldaten – keine Messwerte
        </span>
      </div>

      {/* Bedienung */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-ink-line px-5 py-4 md:px-7">
        <Segmented
          label="Jahreszeit"
          value={season}
          onChange={setSeason}
          options={(Object.keys(SEASONS) as Season[]).map((k) => ({ value: k, label: SEASONS[k].label }))}
        />
        <Toggle label="Speicher" checked={withStorage} onChange={setWithStorage} />
        <div className="ml-auto flex items-center gap-3">
          <p className="text-right">
            <span className="block text-[11px] uppercase tracking-[0.14em] text-muted-dark">{SEASONS[season].monthLabel} · Beispieltag</span>
            <span className="t-num block text-[28px] text-paper tabular" aria-hidden>
              {clock}
            </span>
          </p>
          <PlayButton playing={playing} onToggle={togglePlay} />
        </div>
      </div>

      {/* Fluss und Kennzahlen */}
      <div className="grid gap-0 lg:grid-cols-12">
        <div className="border-b border-ink-line px-5 py-6 md:px-7 lg:col-span-5 lg:border-b-0 lg:border-r">
          <p className="t-label mb-2">Jetzt um {clock} Uhr</p>
          <FlowDiagram step={step} withStorage={withStorage} running={playing} />
        </div>
        <dl className="m-0 grid grid-cols-2 gap-px bg-ink-line sm:grid-cols-3 lg:col-span-7 lg:grid-cols-2">
          <Kpi label="Stromerzeugung" value={fmtKWh(sofar.pvKWh)} note={`bis ${clock} · jetzt ${fmtW(step.pvW)}`} accent="sun" />
          <Kpi label="Eigenverbrauch" value={fmtKWh(sofar.selfUseKWh)} note={sofar.pvKWh > 0.01 ? `${fmtPct(sofar.selfConsumptionRate)} des Solarstroms selbst genutzt` : "noch kein Solarstrom"} />
          <Kpi label="Batteriestand" value={storageState.value} note={storageState.note} accent={withStorage ? "lime" : undefined} />
          <Kpi label="Netzbezug" value={fmtKWh(sofar.importKWh)} note={`bis ${clock} · jetzt ${fmtW(step.importW)}`} />
          <Kpi label="Geschätzte Einsparung" value={fmtEUR(sofar.savingsEUR)} note={`bis ${clock} · bei ${fmtNum(cfg.electricityPriceCt)} ct/kWh`} />
          <Kpi
            label="Hochgerechnet aufs Jahr"
            value={`≈ ${fmtEUR(year.savingsEUR, 0)}`}
            note={withStorage ? `${fmtEUR(diffYear, 0)} mehr als ohne Speicher` : `mit Speicher ${fmtEUR(diffYear, 0)} mehr`}
          />
        </dl>
      </div>

      {/* Tagesverlauf mit Zeitregler */}
      <div className="border-t border-ink-line px-5 pb-6 pt-6 md:px-7">
        <DayChart day={day} minute={minute} withStorage={withStorage} onSelect={select} />
        <div className="mt-3" style={{ paddingLeft: CHART_PAD.left, paddingRight: CHART_PAD.right }}>
          <label htmlFor="dash-time" className="sr-only">
            Uhrzeit des Beispieltags
          </label>
          <input
            id="dash-time"
            type="range"
            min={0}
            max={1435}
            step={5}
            value={minute}
            onChange={(e) => select(Number(e.target.value))}
            aria-valuetext={`${clock} Uhr`}
            className={styles.scrubber}
            style={{ ["--progress" as string]: progress }}
          />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-muted-dark">
            <span>Sonnenaufgang {formatClock(Math.round(day.sunrise * 60))}</span>
            <span>Sonnenuntergang {formatClock(Math.round(day.sunset * 60))}</span>
          </div>
        </div>
      </div>

      {/* Kurzfassung für Screenreader, nur wenn nicht abgespielt wird */}
      <p className="sr-only" aria-live={playing ? "off" : "polite"}>
        {`${clock} Uhr: Erzeugung ${fmtW(step.pvW)}, Verbrauch ${fmtW(step.loadW)}, Netzbezug ${fmtW(step.importW)}${
          withStorage ? `, Speicher ${fmtPct((step.socPct ?? 0) / 100)}` : ""
        }.`}
      </p>

      {/* Annahmen */}
      <details className="group border-t border-ink-line">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[14px] font-semibold text-paper md:px-7 [&::-webkit-details-marker]:hidden">
          <span>
            Annahmen der Simulation
            <span className="block text-[12px] font-normal text-muted-dark">Beispieldaten aus einem vereinfachten Modell. Echte Werte hängen von Wetter, Standort und Verbrauch ab.</span>
          </span>
          <span aria-hidden className="text-xl text-muted-dark transition-transform duration-300 group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="grid gap-6 px-5 pb-6 text-[13.5px] text-muted-dark md:grid-cols-2 md:px-7">
          <ul className="m-0 list-none space-y-2 p-0">
            <Assumption>
              Beispielanlage {fmtNum(exampleConfig.peakWp)} Wp, Südausrichtung, aufgeständert; der Wechselrichter speist höchstens {fmtNum(exampleConfig.inverterMaxW)} W ein.
            </Assumption>
            <Assumption>
              Ertrag {fmtNum(exampleConfig.specificYieldKWhPerKWp)} kWh je kWp im Jahr, verteilt nach Monatsanteilen. Der Tag ist ein Durchschnittstag ohne Wolkenwechsel.
            </Assumption>
            <Assumption>Verbrauch als vereinfachtes Haushaltsprofil: Grundlast nachts, Spitzen morgens, mittags und abends; im Winter etwas höher als im Sommer.</Assumption>
          </ul>
          <ul className="m-0 list-none space-y-2 p-0">
            <Assumption>
              Speicher {fmtNum(exampleConfig.storage!.capacityKWh, 1)} kWh, nutzbar ab {exampleConfig.storage!.minSocPct} %, Wirkungsgrad je Richtung{" "}
              {fmtNum(exampleConfig.storage!.efficiency * 100)} %. Er gibt nur so viel ab, wie der Haushalt gerade braucht.
            </Assumption>
            <Assumption>Strompreis {fmtNum(cfg.electricityPriceCt)} ct/kWh, keine Vergütung für eingespeisten Strom.</Assumption>
            <li>
              <label htmlFor="dash-household" className="mb-1.5 block text-[13px] font-semibold text-paper">
                Haushalt
              </label>
              <select
                id="dash-household"
                value={household}
                onChange={(e) => setHousehold(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-ink-line bg-night px-3 py-2.5 text-[14px] text-paper"
              >
                {HOUSEHOLDS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </li>
          </ul>
        </div>
      </details>
    </div>
  );
}

function Kpi({ label, value, note, accent }: { label: string; value: string; note: string; accent?: "sun" | "lime" }) {
  const color = accent === "sun" ? "text-sun-1" : accent === "lime" ? "text-lime" : "text-paper";
  return (
    <div className="flex min-w-0 flex-col justify-between gap-3 bg-[#131C25] px-5 py-5 lg:px-6">
      <dt className="text-[12.5px] text-muted-dark">{label}</dt>
      <dd className="m-0">
        <span className={`t-num block text-[26px] tabular sm:text-[30px] ${color} ${styles.value}`}>{value}</span>
        <span className="mt-1.5 block text-[12px] leading-snug text-muted-dark">{note}</span>
      </dd>
    </div>
  );
}

function Assumption({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span aria-hidden className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-muted-dark" />
      <span>{children}</span>
    </li>
  );
}
