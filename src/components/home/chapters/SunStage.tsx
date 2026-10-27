"use client";

import { useEffect, useRef, useState } from "react";
import { withGsap } from "@/lib/motion/gsap";
import { LineReveal } from "@/components/motion/LineReveal";
import css from "./sun-chapter.module.css";

export interface SunGeometry {
  x0: number;
  x1: number;
  base: number;
  arc: number;
  curve: number;
  label: number;
  sun: number;
  /** Ertragskurve im Bildraum (gleiches viewBox wie die Siedlung) */
  xs: number[];
  ys: number[];
  /** Sonnenbahn als Pfad */
  arcPath: string;
}

export interface SunData {
  start: number;
  end: number;
  step: number;
  sunrise: number;
  sunset: number;
  noon: number;
  /** Leistung in W je Zeitschritt */
  pv: number[];
  /** erzeugte Energie seit Mitternacht in kWh je Zeitschritt */
  kwh: number[];
  dayKWh: number;
  selfUseKWh: number;
  yearKWh: number;
  priceCt: number;
  peakW: number;
  geo: { d: SunGeometry; m: SunGeometry };
  clock: { sunrise: string; noon: string; sunset: string };
}

const VIEW = { d: { w: 1600, h: 900 }, m: { w: 900, h: 1600 } } as const;
type V = keyof typeof VIEW;

const nf1 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const clock = (m: number) => {
  const mm = Math.max(0, Math.round(m)) % 1440;
  return `${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
};
const f1 = (n: number) => String(Math.round(n * 10) / 10);

/** Teilstück der Kurve bis zum Anteil s (0–1) */
function partial(g: SunGeometry, s: number) {
  const n = g.xs.length - 1;
  const pos = clamp01(s) * n;
  const i = Math.floor(pos);
  let line = `M${g.xs[0]} ${g.ys[0]}`;
  for (let k = 1; k <= i; k++) line += `L${g.xs[k]} ${g.ys[k]}`;
  let x = g.xs[i]!;
  let y = g.ys[i]!;
  if (i < n) {
    const t = pos - i;
    x = g.xs[i]! + (g.xs[i + 1]! - g.xs[i]!) * t;
    y = g.ys[i]! + (g.ys[i + 1]! - g.ys[i]!) * t;
    line += `L${f1(x)} ${f1(y)}`;
  }
  const area = `${line}L${f1(x)} ${g.base}L${g.xs[0]} ${g.base}Z`;
  return { line, area, x, y };
}

function SkySvg({ v, data, className }: { v: V; data: SunData; className: string }) {
  const g = data.geo[v];
  const { w, h } = VIEW[v];
  const p = `sun-${v}`;
  const horizon = g.base + (v === "d" ? 170 : 200);
  const stars = Array.from({ length: 38 }, (_, i) => {
    const x = ((i * 397) % 1000) / 1000;
    const y = ((i * 211 + 87) % 1000) / 1000;
    return { x: Math.round(x * w), y: Math.round(y * (g.base - 40)), r: 0.7 + ((i * 13) % 5) * 0.22 };
  });
  const full = partial(g, 1);
  const noonX = (g.x0 + g.x1) / 2;
  const noonY = g.base - g.arc;
  const peakIdx = g.ys.indexOf(Math.min(...g.ys));
  const sky = (id: string, stops: [number, string][]) => (
    <linearGradient id={`${p}-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={horizon}>
      {stops.map(([o, c]) => (
        <stop key={o} offset={o} stopColor={c} />
      ))}
    </linearGradient>
  );
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className={`${css.svg} ${className}`} aria-hidden focusable="false" data-v={v}>
      <defs>
        {sky("night", [
          [0, "#03060A"],
          [0.55, "#08101A"],
          [0.85, "#101A26"],
          [1, "#18222E"],
        ])}
        {sky("dawn", [
          [0, "#060A12"],
          [0.45, "#161A28"],
          [0.7, "#4A2F33"],
          [0.86, "#B8693F"],
          [1, "#F0A35E"],
        ])}
        {sky("day", [
          [0, "#183654"],
          [0.4, "#2C5A82"],
          [0.75, "#6B98BE"],
          [1, "#B6CFE1"],
        ])}
        {sky("dusk", [
          [0, "#07090F"],
          [0.45, "#1E1726"],
          [0.7, "#6A3530"],
          [0.86, "#D06A3A"],
          [1, "#F59A55"],
        ])}
        <radialGradient id={`${p}-bw`}>
          <stop offset="0" stopColor="#FFD58A" stopOpacity="0.9" />
          <stop offset="0.14" stopColor="#FFA42A" stopOpacity="0.45" />
          <stop offset="0.42" stopColor="#E2662A" stopOpacity="0.14" />
          <stop offset="1" stopColor="#E2662A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${p}-bd`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="0.12" stopColor="#FFF4D6" stopOpacity="0.4" />
          <stop offset="0.45" stopColor="#CFE3F2" stopOpacity="0.12" />
          <stop offset="1" stopColor="#CFE3F2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${p}-disc`} cx="0.42" cy="0.38" r="0.62">
          <stop offset="0" stopColor="#FFFBEE" />
          <stop offset="0.55" stopColor="#FFE2A3" />
          <stop offset="1" stopColor="#FFB04A" />
        </radialGradient>
        <linearGradient id={`${p}-area`} gradientUnits="userSpaceOnUse" x1="0" y1={g.base - g.curve} x2="0" y2={g.base}>
          <stop offset="0" stopColor="#FFD84D" stopOpacity="0.42" />
          <stop offset="0.6" stopColor="#FFA42A" stopOpacity="0.16" />
          <stop offset="1" stopColor="#FF6F1A" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id={`${p}-stroke`} gradientUnits="userSpaceOnUse" x1={g.x0} y1="0" x2={g.x1} y2="0">
          <stop offset="0" stopColor="#FF6F1A" />
          <stop offset="0.5" stopColor="#FFD84D" />
          <stop offset="1" stopColor="#FF6F1A" />
        </linearGradient>
      </defs>

      <rect width={w} height={h} fill={`url(#${p}-night)`} className={css.skyNight} data-sky="night" />
      <rect width={w} height={h} fill={`url(#${p}-dawn)`} className={css.skyDawn} data-sky="dawn" />
      <rect width={w} height={h} fill={`url(#${p}-day)`} className={css.skyDay} data-sky="day" />
      <rect width={w} height={h} fill={`url(#${p}-dusk)`} className={css.skyDusk} data-sky="dusk" />

      <g className={css.stars} data-stars fill="#E9F0F6">
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={0.35 + ((i * 7) % 6) * 0.1} />
        ))}
      </g>

      {/* Sonnenbahn */}
      <path d={g.arcPath} fill="none" stroke="#F8FAF7" strokeOpacity="0.22" strokeWidth={v === "d" ? 1 : 1.8} strokeDasharray={v === "d" ? "2 7" : "3 11"} />

      {/* Sonne mit Lichthof */}
      <g className={css.sun} data-sun transform={`translate(${noonX} ${noonY})`}>
        <circle r={v === "d" ? 520 : 760} fill={`url(#${p}-bw)`} data-bloom-warm opacity="0.25" />
        <circle r={v === "d" ? 480 : 700} fill={`url(#${p}-bd)`} data-bloom-day opacity="0.85" />
        <circle r={g.sun} fill={`url(#${p}-disc)`} />
      </g>

      {/* Ertragskurve: Fläche, Linie, Markierung */}
      <g className={css.curve} data-curve>
        <path d={full.area} fill={`url(#${p}-area)`} data-area />
        <path d={full.line} fill="none" stroke={`url(#${p}-stroke)`} strokeWidth={v === "d" ? 7 : 12} strokeOpacity="0.16" strokeLinecap="round" data-line />
        <path d={full.line} fill="none" stroke={`url(#${p}-stroke)`} strokeWidth={v === "d" ? 2 : 3.4} strokeLinecap="round" strokeLinejoin="round" data-line />
      </g>
      <g className={css.marker} data-marker>
        <line
          x1={noonX}
          x2={noonX}
          y1={noonY + g.sun + 8}
          y2={g.ys[peakIdx]! - 10}
          stroke="#F8FAF7"
          strokeOpacity="0.45"
          strokeWidth={v === "d" ? 1 : 1.8}
          strokeDasharray={v === "d" ? "2 4" : "3 7"}
          data-stem
        />
        <circle cx={noonX} cy={g.ys[peakIdx]} r={v === "d" ? 5 : 9} fill="#FFD84D" data-dot />
        <circle cx={noonX} cy={g.ys[peakIdx]} r={v === "d" ? 12 : 20} fill="#FFD84D" opacity="0.22" data-halo />
        <text x={noonX + (v === "d" ? 16 : 26)} y={g.ys[peakIdx]! - (v === "d" ? 12 : 20)} fontSize={g.label + (v === "d" ? 2 : 4)} className={css.markerText} data-label>
          {nf0.format(data.peakW)} W
        </text>
      </g>
    </svg>
  );
}

function Layer({ name, className = "", load }: { name: "base" | "pv" | "win"; className?: string; load: boolean }) {
  const pic = (src: boolean) => (
    <picture className={`${css.layer} ${className}`} data-layer={name}>
      {src && <source media="(max-width: 767px)" srcSet={`/art/siedlung-m-${name}.svg`} />}
      {/* Ohne src lädt der Browser nichts; die Quelle kommt erst, wenn das Kapitel näher rückt */}
      <img src={src ? `/art/siedlung-d-${name}.svg` : undefined} alt="" decoding="async" draggable={false} />
    </picture>
  );
  return (
    <>
      {pic(load)}
      {!load && <noscript>{pic(true)}</noscript>}
    </>
  );
}

export function SunStage({ id, label, data }: { id: string; label: string; data: SunData }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  // Grafiken der Siedlung nicht mit dem Hero laden, sondern beim ersten Scrollen,
  // spätestens kurz nach dem Laden der Seite (das Hero-Bild hat Vorrang)
  const [loadArt, setLoadArt] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const go = () => setLoadArt(true);
    const later = () => (timer = setTimeout(go, 2500));
    window.addEventListener("scroll", go, { once: true, passive: true });
    if (document.readyState === "complete") later();
    else window.addEventListener("load", later, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", go);
      window.removeEventListener("load", later);
    };
  }, []);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr) return;
    if (document.documentElement.dataset.motion !== "on") return;

    const q = <T extends Element>(sel: string) => Array.from(el.querySelectorAll<T>(sel));
    const variants = (["d", "m"] as V[]).map((v) => {
      const svg = el.querySelector<SVGSVGElement>(`svg[data-v="${v}"]`)!;
      const pick = <T extends Element>(sel: string) => Array.from(svg.querySelectorAll<T>(sel));
      return {
        v,
        g: data.geo[v],
        sky: {
          night: svg.querySelector<SVGRectElement>('[data-sky="night"]')!,
          dawn: svg.querySelector<SVGRectElement>('[data-sky="dawn"]')!,
          day: svg.querySelector<SVGRectElement>('[data-sky="day"]')!,
          dusk: svg.querySelector<SVGRectElement>('[data-sky="dusk"]')!,
        },
        stars: svg.querySelector<SVGGElement>("[data-stars]")!,
        sun: svg.querySelector<SVGGElement>("[data-sun]")!,
        bloomWarm: svg.querySelector<SVGCircleElement>("[data-bloom-warm]")!,
        bloomDay: svg.querySelector<SVGCircleElement>("[data-bloom-day]")!,
        curve: svg.querySelector<SVGGElement>("[data-curve]")!,
        area: svg.querySelector<SVGPathElement>("[data-area]")!,
        lines: pick<SVGPathElement>("[data-line]"),
        marker: svg.querySelector<SVGGElement>("[data-marker]")!,
        stem: svg.querySelector<SVGLineElement>("[data-stem]")!,
        dot: svg.querySelector<SVGCircleElement>("[data-dot]")!,
        halo: svg.querySelector<SVGCircleElement>("[data-halo]")!,
        label: svg.querySelector<SVGTextElement>("[data-label]")!,
      };
    });
    const pv = el.querySelector<HTMLElement>('[data-layer="pv"]')!;
    const win = el.querySelector<HTMLElement>('[data-layer="win"]')!;
    const ambient = el.querySelector<HTMLElement>("[data-ambient]")!;
    const title = el.querySelector<HTMLElement>("[data-title]")!;
    const panel = el.querySelector<HTMLElement>("[data-panel]")!;
    const beats = q<HTMLElement>("[data-beat]");
    const clockEls = q<HTMLElement>("[data-clock]");
    const powerEls = q<HTMLElement>("[data-power]");
    const energyEls = q<HTMLElement>("[data-energy]");
    const live = q<HTMLElement>("[data-live]");

    const mq = window.matchMedia("(min-width: 768px)");
    let active = variants.filter((x) => (mq.matches ? x.v === "d" : x.v === "m"));
    const onMq = () => {
      active = variants.filter((x) => (mq.matches ? x.v === "d" : x.v === "m"));
      render(cur, true);
    };
    mq.addEventListener("change", onMq);

    const { sunrise, sunset, start, end, step } = data;
    const span = sunset - sunrise;
    const b1 = sunrise + 300;
    const b2 = sunset - 230;

    // Himmel: Stützstellen [Minute, Nacht, Dämmerung früh, Tag, Abend]
    const SKY: [number, number, number, number, number][] = [
      [start, 1, 0, 0, 0],
      [sunrise - 35, 1, 0, 0, 0],
      [sunrise - 8, 0.45, 0.55, 0, 0],
      [sunrise + 25, 0, 1, 0, 0],
      [sunrise + 105, 0, 0.35, 0.65, 0],
      [sunrise + 175, 0, 0, 1, 0],
      [sunset - 125, 0, 0, 1, 0],
      [sunset - 55, 0, 0, 0.3, 0.7],
      [sunset + 5, 0, 0, 0, 1],
      [sunset + 35, 0.5, 0, 0, 0.5],
      [end, 1, 0, 0, 0],
    ];
    const skyAt = (m: number) => {
      for (let i = 1; i < SKY.length; i++) {
        const a = SKY[i - 1]!;
        const b = SKY[i]!;
        if (m <= b[0]) {
          const t = clamp01((m - a[0]) / (b[0] - a[0] || 1));
          return [1, 2, 3, 4].map((k) => a[k]! + (b[k]! - a[k]!) * t) as [number, number, number, number];
        }
      }
      return [1, 0, 0, 0] as [number, number, number, number];
    };
    const sample = (arr: number[], m: number) => {
      const pos = clamp01((m - start) / (end - start)) * (arr.length - 1);
      const i = Math.floor(pos);
      const t = pos - i;
      return arr[i]! + ((arr[Math.min(arr.length - 1, i + 1)] ?? arr[i]!) - arr[i]!) * t;
    };

    const last: Record<string, string> = {};
    const setText = (els: HTMLElement[], key: string, text: string) => {
      if (last[key] === text) return;
      last[key] = text;
      els.forEach((e) => (e.textContent = text));
    };

    function render(p: number, force = false) {
      const m = start + (end - start) * p;
      const s = (m - sunrise) / span;
      const elev = s > 0 && s < 1 ? Math.sin(Math.PI * s) : 0;
      const [night, dawn, day, dusk] = skyAt(m);
      const golden = dawn + dusk;
      const w = sample(data.pv, m);
      const e = sample(data.kwh, m);

      for (const x of active) {
        const g = x.g;
        x.sky.night.style.opacity = String(night);
        x.sky.dawn.style.opacity = String(dawn);
        x.sky.day.style.opacity = String(day);
        x.sky.dusk.style.opacity = String(dusk);
        x.stars.style.opacity = String(night * 0.9 + golden * 0.15);
        const ss = Math.max(-0.05, Math.min(1.05, s));
        const sx = g.x0 + (g.x1 - g.x0) * ss;
        const sy = g.base - g.arc * Math.sin(Math.PI * ss);
        x.sun.style.transform = `translate(${f1(sx)}px, ${f1(sy)}px)`;
        x.sun.style.opacity = String(smooth(-0.03, 0.02, s) * (1 - smooth(0.98, 1.03, s)));
        x.bloomWarm.style.opacity = String(Math.min(1, golden * 1.1 + 0.15));
        x.bloomDay.style.opacity = String(day * (0.35 + 0.65 * elev));

        const c = partial(g, s);
        x.area.setAttribute("d", c.area);
        x.lines.forEach((l) => l.setAttribute("d", c.line));
        x.curve.style.opacity = s > 0 ? "1" : "0";
        const showMarker = s > 0.01 && s < 0.995 ? 1 : 0;
        x.marker.style.opacity = String(showMarker);
        if (showMarker) {
          x.stem.setAttribute("x1", f1(sx));
          x.stem.setAttribute("x2", f1(sx));
          x.stem.setAttribute("y1", f1(sy + g.sun + (x.v === "d" ? 8 : 14)));
          x.stem.setAttribute("y2", f1(Math.max(sy + g.sun + 10, c.y - (x.v === "d" ? 10 : 18))));
          x.dot.setAttribute("cx", f1(c.x));
          x.dot.setAttribute("cy", f1(c.y));
          x.halo.setAttribute("cx", f1(c.x));
          x.halo.setAttribute("cy", f1(c.y));
          const right = s < 0.72;
          const dx = x.v === "d" ? 16 : 26;
          x.label.setAttribute("x", f1(c.x + (right ? dx : -dx)));
          x.label.setAttribute("y", f1(c.y - (x.v === "d" ? 12 : 20)));
          x.label.setAttribute("text-anchor", right ? "start" : "end");
          if (force || last[`l${x.v}`] !== String(Math.round(w))) {
            last[`l${x.v}`] = String(Math.round(w));
            x.label.textContent = `${nf0.format(Math.round(w))} W`;
          }
        }
      }

      win.style.opacity = String(clamp01(1 - smooth(sunrise + 15, sunrise + 85, m) + smooth(sunset - 80, sunset - 15, m)));
      pv.style.opacity = String(day * (0.25 + 0.75 * elev) * 0.6 + golden * 0.12);
      ambient.style.opacity = String(day * (0.4 + 0.6 * elev));

      const tOut = smooth(0.035, 0.085, p);
      title.style.opacity = String(1 - tOut);
      title.style.transform = `translate3d(0, ${-tOut * 48}px, 0)`;
      title.style.visibility = tOut >= 1 ? "hidden" : "visible";
      panel.style.opacity = String(smooth(0.06, 0.1, p));
      live.forEach((l) => (l.style.opacity = String(smooth(0.06, 0.1, p))));

      const w1 = smooth(b1 - 22, b1 + 22, m);
      const w2 = smooth(b2 - 22, b2 + 22, m);
      const weights = [1 - w1, w1 * (1 - w2), w2];
      beats.forEach((b, i) => {
        const k = weights[i]!;
        b.style.opacity = String(k);
        b.style.transform = `translate3d(0, ${(1 - k) * 14}px, 0)`;
        b.style.visibility = k < 0.01 ? "hidden" : "visible";
      });

      setText(clockEls, "c", clock(Math.round(m / 5) * 5));
      setText(powerEls, "p", `${nf0.format(Math.round(w))} W`);
      setText(energyEls, "e", `${nf2.format(e)} kWh`);
    }

    let target = 0;
    let cur = 0;
    let raf = 0;
    const tick = () => {
      cur += (target - cur) * 0.16;
      if (Math.abs(target - cur) < 0.0004) cur = target;
      render(cur);
      raf = cur !== target ? requestAnimationFrame(tick) : 0;
    };
    // Ausgangszustand sofort zeichnen, ScrollTrigger folgt nach dem Nachladen
    render(0, true);
    const stop = withGsap(({ ScrollTrigger }) => {
      const st = ScrollTrigger.create({
        trigger: tr,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          target = self.progress;
          if (!raf) raf = requestAnimationFrame(tick);
        },
      });
      target = cur = st.progress;
      render(cur, true);
      el.dataset.ready = "true";
      return () => st.kill();
    });

    return () => {
      cancelAnimationFrame(raf);
      stop();
      mq.removeEventListener("change", onMq);
      delete el.dataset.ready;
    };
  }, [data]);

  const day = nf1.format(data.dayKWh);
  const year = nf0.format(Math.round(data.yearKWh / 10) * 10);
  const beats = [
    {
      time: `${data.clock.sunrise} · Sonnenaufgang`,
      title: "Die Sonne liefert.",
      body: "Mit dem ersten Licht beginnen die Module zu arbeiten, leise und ohne bewegliche Teile. Der Wechselrichter macht daraus Strom für deine Steckdose.",
    },
    {
      time: `${data.clock.noon} · Mittag`,
      title: "Mittags am meisten.",
      body: "Jetzt laufen Kühlschrank, Router oder Spülmaschine. Was du in diesem Moment verbrauchst, kommt vom Balkon statt aus dem Netz.",
    },
    {
      time: `${data.clock.sunset} · Sonnenuntergang`,
      title: "Du profitierst.",
      body: `Rund ${day} kWh an einem durchschnittlichen Junitag, etwa ${year} kWh im Jahr. Jede Kilowattstunde, die du selbst nutzt, musst du nicht für ${data.priceCt} Cent kaufen.`,
    },
  ];

  return (
    <section id={id} ref={root} data-header="dark" className={`on-dark ${css.section}`} aria-labelledby={`${id}-title`}>
      <div ref={track} className={css.track}>
        <div className={css.stage}>
          <div className={css.visual}>
            <SkySvg v="d" data={data} className="hidden md:block" />
            <SkySvg v="m" data={data} className="md:hidden" />
            <Layer name="base" load={loadArt} />
            <div className={css.ambient} data-ambient aria-hidden />
            <Layer name="pv" className={css.pv} load={loadArt} />
            <Layer name="win" className={css.win} load={loadArt} />
            <div className={css.shade} aria-hidden />

            <div className={`container-x ${css.title}`} data-title>
              <div>
                <p className="t-label">{label} · Licht</p>
                <LineReveal as="h2" id={`${id}-title`} lines={["Die Sonne liefert.", "Du profitierst."]} className={`t-h1 m-0 mt-4 ${css.titleText}`} />
              </div>
              <p className={`max-w-[34ch] text-base leading-relaxed text-paper/70 md:text-[17px] ${css.titleLead}`}>
                Ein Junitag mit Balkonkraftwerk, von Sonnenaufgang bis Sonnenuntergang.
                <span className={css.hint}> Scroll weiter, und die Sonne zieht über die Siedlung.</span>
              </p>
            </div>

            {/* Live-Anzeige, nur mit Bewegung */}
            <div className={css.liveMobile} data-live aria-hidden>
              <span data-clock>04:30</span>
              <span className={css.sep} />
              <span data-power>0 W</span>
              <span className={css.sep} />
              <span data-energy>0,00 kWh</span>
            </div>
          </div>

          <div className={css.panel} data-panel>
            <div className={`container-x ${css.panelInner}`}>
              <ol className={css.beats}>
                {beats.map((b, i) => (
                  <li key={b.title} className={css.beat} data-beat={i}>
                    <p className="t-label !text-sun-1/90">{b.time}</p>
                    <h3 className="t-h2 m-0 mt-3">{b.title}</h3>
                    <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-paper/72 md:text-base">{b.body}</p>
                  </li>
                ))}
              </ol>

              <div className={css.readLive} data-live aria-hidden>
                <p className="t-label">Junitag · Beispiel</p>
                <p className={`t-num tabular ${css.clock}`} data-clock>
                  04:30
                </p>
                <dl className={css.stats}>
                  <div>
                    <dd className="t-num tabular" data-power>
                      0 W
                    </dd>
                    <dt>Leistung jetzt</dt>
                  </div>
                  <div>
                    <dd className="t-num tabular" data-energy>
                      0,00 kWh
                    </dd>
                    <dt>Heute erzeugt</dt>
                  </div>
                </dl>
              </div>

              <dl className={css.readStatic}>
                <div>
                  <dd className="t-num tabular">≈ {day} kWh</dd>
                  <dt>an einem durchschnittlichen Junitag</dt>
                </div>
                <div>
                  <dd className="t-num tabular">≈ {year} kWh</dd>
                  <dt>im ganzen Jahr</dt>
                </div>
                <div>
                  <dd className="t-num tabular">bis {nf0.format(data.peakW)} W</dd>
                  <dt>mittags im Tagesmittel</dt>
                </div>
              </dl>
            </div>
            <p className={`container-x ${css.note}`}>
              Beispielrechnung: 880 Wp am Südbalkon, senkrecht montiert, ohne Speicher. Durchschnittlicher Junitag einschließlich bewölkter Tage, Annahmen wie
              im Ertragsrechner. Keine Messwerte.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
