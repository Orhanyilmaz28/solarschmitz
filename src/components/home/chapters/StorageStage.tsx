"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { withGsap } from "@/lib/motion/gsap";
import { LineReveal } from "@/components/motion/LineReveal";
import { ARC, arcPath, beatAt, minuteAt, visualsAt, type StageData, type Visuals } from "./storageModel";
import type { FlowKey } from "./storageScene";
import styles from "./storage-chapter.module.css";

/**
 * Bühne von Kapitel 3: Beim Scrollen läuft ein Beispieltag von 10 Uhr bis 10 Uhr am
 * nächsten Morgen. Pro Bild werden nur Deckkraft, Linienstärke, Transformationen und
 * Texte über Refs gesetzt, kein React-State.
 */
export interface Beat {
  kicker: string;
  title: string;
  body: string;
  facts: { text: string; tone: "sun" | "lime" | "mist" }[];
}

type Anchor = { x: number; y: number };

interface Props {
  id: string;
  label: string;
  art: ReactNode;
  anchors: Record<"module" | "house" | "battery" | "grid" | "hub", Anchor>;
  data: StageData;
  beats: Beat[];
  /** Zustand im Abend (Server-Ausgabe und Darstellung ohne Bewegung) */
  initial: Visuals;
  initialBeat: number;
  footnote: string;
}

const FLOW_KEYS: FlowKey[] = ["pvHouse", "pvBattery", "batteryHouse", "gridHouse", "houseGrid"];
const TEXT_KEYS = ["clock", "phase", "pv", "load", "soc", "socSub", "grid", "gridSub"] as const;
type TextKey = (typeof TEXT_KEYS)[number];

const toneColor = { sun: "var(--color-sun-2)", lime: "var(--color-lime)", mist: "#C9D3DA" } as const;

export function StorageStage({ id, label, art, anchors, data, beats, initial, initialBeat, footnote }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;
    if (document.documentElement.dataset.motion !== "on") return;

    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
    const art = q<HTMLElement>("[data-k3-art]");
    const flows = FLOW_KEYS.map((k) => ({ group: q<SVGGElement>(`[data-flow="${k}"]`), dots: q<SVGPathElement>(`[data-flow="${k}"] [data-k3="dots"]`) }));
    const hub = q<SVGCircleElement>('[data-k3="hub"]');
    const sun = q<SVGGElement>("[data-k3-sun]");
    const moon = q<SVGGElement>("[data-k3-moon]");
    const sky = { day: q<HTMLElement>("[data-k3-sky='day']"), dusk: q<HTMLElement>("[data-k3-sky='dusk']"), night: q<HTMLElement>("[data-k3-sky='night']") };
    const texts = new Map<TextKey, HTMLElement[]>(TEXT_KEYS.map((k) => [k, Array.from(root.querySelectorAll<HTMLElement>(`[data-k3-text="${k}"]`))]));
    const beatEls = Array.from(root.querySelectorAll<HTMLElement>("[data-k3-beat]"));
    const fills = Array.from(root.querySelectorAll<HTMLElement>("[data-k3-fill]"));
    const last = new Map<string, string>();

    let activeBeat = -1;
    const render = (p: number) => {
      const v = visualsAt(data, minuteAt(data, p));
      FLOW_KEYS.forEach((k, i) => {
        const f = flows[i]!;
        if (f.group) f.group.style.opacity = String(v.flows[k].opacity);
        if (f.dots) f.dots.style.strokeWidth = String(v.flows[k].width);
      });
      if (art) {
        art.style.setProperty("--k3-soc", String(v.soc));
        art.style.setProperty("--k3-window", String(v.window));
        art.style.setProperty("--k3-glint", String(v.glint));
      }
      if (hub) hub.style.opacity = String(v.hub);
      if (sun) {
        sun.style.transform = `translate(${v.sun.x}px, ${v.sun.y}px)`;
        sun.style.opacity = String(v.sun.opacity);
      }
      if (moon) moon.style.opacity = String(v.moon);
      if (sky.day) sky.day.style.opacity = String(v.sky.day);
      if (sky.dusk) sky.dusk.style.opacity = String(v.sky.dusk);
      if (sky.night) sky.night.style.opacity = String(v.sky.night);
      for (const k of TEXT_KEYS) {
        const val = v.text[k];
        if (last.get(k) === val) continue;
        last.set(k, val);
        for (const el of texts.get(k) ?? []) el.textContent = val;
      }
      data.beatRanges.forEach(([a, b], i) => {
        const el = fills[i];
        if (el) el.style.transform = `scaleX(${Math.min(1, Math.max(0, (p - a) / (b - a))).toFixed(4)})`;
      });
      const beat = beatAt(data, p);
      if (beat !== activeBeat) {
        activeBeat = beat;
        beatEls.forEach((el, i) => el.setAttribute("data-active", String(i === beat)));
      }
    };

    // Punkte-Animation nur laufen lassen, solange das Kapitel sichtbar ist
    const io = new IntersectionObserver((entries) => {
      root.dataset.run = entries.some((e) => e.isIntersecting) ? "1" : "0";
    });
    io.observe(track);

    const state = { p: 0 };
    render(0);
    const stop = withGsap(({ gsap }) => {
      const ctx = gsap.context(() => {
        gsap.to(state, {
          p: 1,
          ease: "none",
          scrollTrigger: { trigger: track, start: "top top", end: "bottom bottom", scrub: 0.6 },
          onUpdate: () => render(state.p),
        });
      }, root);
      return () => ctx.revert();
    });
    return () => {
      io.disconnect();
      stop();
    };
  }, [data]);

  const t = initial.text;
  const artVars = { "--k3-soc": initial.soc, "--k3-window": initial.window, "--k3-glint": initial.glint } as CSSProperties;

  return (
    <div ref={trackRef} className={styles.track}>
      <div ref={rootRef} className={styles.stage}>
        <div className="container-x grid w-full grid-cols-1 content-start gap-y-5 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:content-center lg:gap-x-10 lg:gap-y-0">
          {/* Überschrift */}
          <div className="min-w-0 lg:col-span-5 lg:row-start-1 lg:self-end">
            <p className="t-label">{label}</p>
            <LineReveal as="h2" id={`${id}-title`} lines={["Die Sonne geht.", "Dein Strom bleibt."]} className="t-h1 m-0 mt-3 max-lg:!text-[clamp(1.9rem,8.4vw,2.6rem)] lg:mt-5 lg:!text-[clamp(2.5rem,4.2vw,3.75rem)]" />
          </div>

          {/* Schaubild */}
          <figure className={`${styles.figure} min-w-0 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-center`} aria-label="Schaubild: Energiefluss zwischen Modulen, Speicher, Haus und Netz im Tagesverlauf (Beispielrechnung)">
            <div data-k3-art className={styles.art} style={artVars}>
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div data-k3-sky="day" className={`${styles.sky} ${styles.skyDay}`} style={{ opacity: initial.sky.day }} />
                <div data-k3-sky="dusk" className={`${styles.sky} ${styles.skyDusk}`} style={{ opacity: initial.sky.dusk }} />
                <div data-k3-sky="night" className={`${styles.sky} ${styles.skyNight}`} style={{ opacity: initial.sky.night }} />
              </div>

              {art}

              {/* Sonnenbogen mit Auf- und Untergang */}
              <svg aria-hidden viewBox="0 0 1000 760" className={styles.arc}>
                <defs>
                  <radialGradient id="k3-sun-glow" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#FFE7A8" stopOpacity="0.9" />
                    <stop offset="0.35" stopColor="#FFA42A" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#FF6F1A" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="k3-sun-disc" cx="0.42" cy="0.38" r="0.62">
                    <stop offset="0" stopColor="#FFFBEE" />
                    <stop offset="0.55" stopColor="#FFE2A3" />
                    <stop offset="1" stopColor="#FFB04A" />
                  </radialGradient>
                </defs>
                <path d={arcPath()} fill="none" stroke="#F3F5F1" strokeOpacity="0.22" strokeDasharray="2 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <line x1={ARC.x0 - 14} x2={ARC.x1 + 14} y1={ARC.yBase} y2={ARC.yBase} stroke="#F3F5F1" strokeOpacity="0.18" vectorEffect="non-scaling-stroke" />
                <g data-k3-moon style={{ opacity: initial.moon }}>
                  <circle cx={(ARC.x0 + ARC.x1) / 2} cy={ARC.yTop + 6} r="11" fill="#DDE5EE" fillOpacity="0.85" />
                  <circle cx={(ARC.x0 + ARC.x1) / 2 + 5} cy={ARC.yTop + 2} r="10" fill="#0A0F14" />
                </g>
                <g data-k3-sun style={{ transform: `translate(${initial.sun.x}px, ${initial.sun.y}px)`, opacity: initial.sun.opacity }}>
                  <circle r="46" fill="url(#k3-sun-glow)" />
                  <circle r="11" fill="url(#k3-sun-disc)" />
                </g>
              </svg>
              <div aria-hidden className="pointer-events-none absolute font-mono text-[10px] uppercase tracking-[0.14em] text-paper/45 max-sm:hidden" style={{ left: `${ARC.x0 / 10}%`, top: `${(ARC.yBase / 760) * 100}%`, transform: "translate(-50%, 8px)" }}>
                {fmtMinutes(data.sunrise)}
              </div>
              <div aria-hidden className="pointer-events-none absolute font-mono text-[10px] uppercase tracking-[0.14em] text-paper/45 max-sm:hidden" style={{ left: `${ARC.x1 / 10}%`, top: `${(ARC.yBase / 760) * 100}%`, transform: "translate(-50%, 8px)" }}>
                {fmtMinutes(data.sunset)}
              </div>

              {/* Uhr */}
              <div aria-hidden className={styles.clock}>
                <p className="t-label !text-paper/50">Beispieltag im Juni</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span data-k3-text="clock" className={styles.clockTime}>
                    {t.clock}
                  </span>
                  <span className="text-sm text-paper/55">Uhr</span>
                </p>
                <p data-k3-text="phase" className="mt-1 text-sm text-paper/60">
                  {t.phase}
                </p>
              </div>

              {/* Beschriftungen */}
              <div aria-hidden>
                <Callout at={anchors.module} side="up" name="Module" valueKey="pv" value={t.pv} sub="Erzeugung" />
                <Callout at={anchors.house} side="right" name="Haus" valueKey="load" value={t.load} sub="Verbrauch" />
                <Callout at={anchors.battery} side="left" name="Speicher" valueKey="soc" value={t.soc} subKey="socSub" sub={t.socSub} />
                <Callout at={anchors.grid} side="left" name="Netz" valueKey="grid" value={t.grid} subKey="gridSub" sub={t.gridSub} />
              </div>
            </div>
            <figcaption className="mx-auto mt-3 max-w-[64ch] text-[12px] leading-snug text-paper/45 lg:mt-4 lg:text-[13px]">{footnote}</figcaption>
          </figure>

          {/* Abschnitte */}
          <div className="min-w-0 lg:col-span-5 lg:row-start-2 lg:self-start">
            <div className={`${styles.beats} lg:mt-12`}>
              {beats.map((b, i) => (
                <article key={b.title} data-k3-beat={i} data-active={String(i === initialBeat)} className={styles.beat}>
                  <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-sun-1/80">{b.kicker}</p>
                  <h3 className="t-h2 m-0 mt-2 max-w-[18ch] !text-[clamp(1.35rem,2.6vw,2.4rem)] lg:mt-3">{b.title}</h3>
                  <p className={`${styles.beatBody} mt-2 max-w-[46ch] text-[17px] leading-relaxed text-paper/70 lg:mt-4`}>{b.body}</p>
                  <ul className={`${styles.facts} mt-3 flex flex-wrap gap-2 lg:mt-6`}>
                    {b.facts.map((f) => (
                      <li key={f.text} className={styles.fact}>
                        <span aria-hidden className={styles.factDot} style={{ background: toneColor[f.tone] }} />
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div aria-hidden className={`${styles.progress} mt-5 lg:mt-8`}>
              {beats.map((b) => (
                <span key={b.title} className={styles.progressBar}>
                  <span data-k3-fill className={`${styles.progressFill} block`} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtMinutes(min: number): string {
  const m = Math.round(min);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function Callout({
  at,
  side,
  name,
  valueKey,
  value,
  subKey,
  sub,
}: {
  at: Anchor;
  side: "left" | "right" | "up";
  name: string;
  valueKey: TextKey;
  value: string;
  subKey?: TextKey;
  sub: string;
}) {
  return (
    <div className={`${styles.callout} ${styles[side]}`} style={{ left: `${at.x}%`, top: `${at.y}%` }}>
      <span className={styles.calloutDot} />
      <span className={styles.calloutBox}>
        <span className={styles.calloutName}>{name}</span>
        <span data-k3-text={valueKey} className={styles.calloutValue}>
          {value}
        </span>
        <span data-k3-text={subKey} className={styles.calloutSub}>
          {sub}
        </span>
      </span>
    </div>
  );
}
