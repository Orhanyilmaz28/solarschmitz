"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { withGsap } from "@/lib/motion/gsap";
import styles from "./module-chapter.module.css";

/**
 * Bühne für Kapitel 2: ein Glas-Glas-Modul in CSS-3D.
 * Scrollen dreht das Modul aus der Frontansicht in die Dreiviertelansicht,
 * zerlegt es in seine Bauteile und führt dann durch fünf Hotspots.
 * Alles läuft über Transformationen und Deckkraft; Positionen der Beschriftungen
 * werden mit derselben Projektion berechnet, die der Browser für CSS-3D nutzt.
 */

export interface ModuleHotspot {
  key: string;
  title: string;
  body: string;
  fact?: { value: string; label: string; href?: string; linkLabel?: string };
  note?: string;
  /** Bauteile, die bei diesem Hotspot hervorgehoben werden (Index in LAYERS) */
  layers: number[];
  /** Ankerpunkt: Bauteil und Lage auf dem Modul (0–1 in Breite und Höhe) */
  anchor: { layer: number; u: number; v: number };
}

/** Bauteile von oben nach unten; z = Stufe in der Explosionsansicht */
export const LAYERS = [
  { key: "rahmen", label: "Rahmen", z: 3, z0: 2.4, dim: 0.34 },
  { key: "frontglas", label: "Frontglas", z: 2, z0: 1.6, dim: 0.34 },
  { key: "verkapselung-oben", label: "Verkapselung", z: 1, z0: 0.8, dim: 0.3 },
  { key: "zellen", label: "Halbzellen", z: 0, z0: 0, dim: 0.78 },
  {
    key: "verkapselung-unten",
    label: "Verkapselung",
    z: -1,
    z0: -0.8,
    dim: 0.3,
  },
  { key: "rueckglas", label: "Rückglas", z: -2, z0: -1.6, dim: 0.34 },
  { key: "anschlussdose", label: "Anschlussdose", z: -3, z0: -2.4, dim: 0.6 },
] as const;

const SHADOW_Z = { z: -4.4, z0: -3.2 };
/** Abstand der Stufen relativ zur Modulbreite (muss zur CSS-Regel .layer passen) */
const GAP = 0.2;
/** Perspektive relativ zur Modulbreite (muss zu .viewport passen) */
const PERSPECTIVE = 5;
const ASPECT = 1.5;

/** Ecken, an denen die Beschriftung eines Bauteils ansetzt (u, v) */
const LABEL_CORNERS: Record<string, [number, number][]> = {
  default: [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ],
  film: [
    [0.016, 0.016],
    [0.984, 0.016],
    [0.984, 0.984],
    [0.016, 0.984],
  ],
  jbox: [
    [0.52, 0.835],
    [0.76, 0.835],
    [0.76, 0.925],
    [0.52, 0.925],
  ],
};
const cornersFor = (i: number) => (i === 2 || i === 4 ? LABEL_CORNERS.film! : i === 6 ? LABEL_CORNERS.jbox! : LABEL_CORNERS.default!);

// ---------- Ablauf ----------
const TURN_END = 0.18;
const EXPLODE_END = 0.44;

interface Pose {
  rx: number;
  rz: number;
  e: number;
  sheen: number;
}
/** Ruhelage ohne Bewegung (muss zu den CSS-Standardwerten in .stage passen) */
const STATIC_POSE: Pose = { rx: 56, rz: 30, e: 1, sheen: 0.55 };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function poseAt(p: number): Pose {
  const a = easeInOut(clamp01(p / TURN_END));
  const b = easeOut(clamp01((p - TURN_END) / (EXPLODE_END - TURN_END)));
  const c = clamp01((p - EXPLODE_END) / (1 - EXPLODE_END));
  return {
    rx: 58 * a - 3 * c,
    rz: 34 * a - 6 * c,
    e: b,
    sheen: clamp01(p / 0.34),
  };
}

function stepAt(p: number, steps: number): number {
  if (p < EXPLODE_END) return -1;
  return Math.min(steps - 1, Math.floor((p - EXPLODE_END) / ((1 - EXPLODE_END) / steps)));
}

interface Geo {
  w: number;
  h: number;
  cx: number;
  cy: number;
  sceneW: number;
  desktop: boolean;
}

/** Projektion wie CSS: rotateX(rx) rotateZ(rz), Perspektive um die Modulmitte */
function project(x: number, y: number, z: number, pose: Pose, g: Geo) {
  const rx = (pose.rx * Math.PI) / 180;
  const rz = (pose.rz * Math.PI) / 180;
  const x1 = x * Math.cos(rz) - y * Math.sin(rz);
  const y1 = x * Math.sin(rz) + y * Math.cos(rz);
  const y2 = y1 * Math.cos(rx) - z * Math.sin(rx);
  const z2 = y1 * Math.sin(rx) + z * Math.cos(rx);
  const P = g.w * PERSPECTIVE;
  const s = P / (P - z2);
  return { x: g.cx + x1 * s, y: g.cy + y2 * s };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function ModuleStage({ hotspots, legendTitle }: { hotspots: ModuleHotspot[]; legendTitle: string }) {
  // nur Buchstaben und Ziffern, damit url(#…) in SVG in jedem Browser greift
  const uid = `mc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [active, setActive] = useState(-1);
  const [ready, setReady] = useState(false);
  const [motion, setMotion] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leaderRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const hotspotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hotspotsWrap = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLElement | null)[]>([]);

  const progress = useRef(0);
  const motionRef = useRef(false);
  const activeRef = useRef(-1);
  const scrollStep = useRef(-1);
  /** Anhebung je Bauteil in px (Objekt statt Array, damit GSAP die Werte tweenen kann) */
  const lifts = useRef<Record<string, number>>(Object.fromEntries(LAYERS.map((_, i) => [String(i), 0])));
  const geo = useRef<Geo | null>(null);
  const hotspotsOn = useRef(true);

  const measure = useCallback(() => {
    const scene = sceneRef.current;
    const mod = moduleRef.current;
    if (!scene || !mod) return;
    const w = mod.offsetWidth;
    const h = mod.offsetHeight || w * ASPECT;
    geo.current = {
      w,
      h,
      cx: mod.offsetLeft + w / 2,
      cy: mod.offsetTop + h / 2,
      sceneW: scene.clientWidth,
      desktop: window.matchMedia("(min-width: 1024px)").matches,
    };
  }, []);

  const render = useCallback(() => {
    const stage = stageRef.current;
    const g = geo.current;
    if (!stage || !g) return;
    const p = progress.current;
    const isMotion = motionRef.current;
    const pose = isMotion ? poseAt(p) : STATIC_POSE;

    if (isMotion) {
      stage.style.setProperty("--rx", `${pose.rx.toFixed(3)}deg`);
      stage.style.setProperty("--rz", `${pose.rz.toFixed(3)}deg`);
      stage.style.setProperty("--e", pose.e.toFixed(4));
      stage.style.setProperty("--sheen", pose.sheen.toFixed(4));
    }
    layerRefs.current.forEach((el, i) => el?.style.setProperty("--lift", `${(lifts.current[i] ?? 0).toFixed(2)}px`));

    const gap = g.w * GAP * pose.e;
    const zOf = (i: number) => LAYERS[i]!.z * gap + LAYERS[i]!.z0 + (lifts.current[i] ?? 0);
    const act = activeRef.current;
    const activeLayers = act >= 0 ? (hotspots[act]?.layers ?? []) : [];

    // Beschriftungen: rechte Ecke jedes Bauteils, ausgerichtet an einer Spalte
    const corners = LAYERS.map((_, i) => {
      const z = zOf(i);
      let best = { x: -Infinity, y: 0 };
      for (const [u, v] of cornersFor(i)) {
        const pt = project((u - 0.5) * g.w, (v - 0.5) * g.h, z, pose, g);
        if (pt.x > best.x) best = pt;
      }
      return best;
    });
    const colX = Math.max(...corners.map((c) => c.x)) + (g.desktop ? 30 : 12);
    corners.forEach((c, i) => {
      const label = labelRefs.current[i];
      const leader = leaderRefs.current[i];
      if (!label || !leader) return;
      const appear = isMotion ? smooth(0.32 + i * 0.05, 0.62 + i * 0.05, pose.e) : 1;
      const focus = act >= 0 ? (activeLayers.includes(i) ? 1 : 0.18) : 1;
      const o = appear * focus;
      label.style.transform = `translate3d(${(colX + 6).toFixed(1)}px, ${(c.y - 10).toFixed(1)}px, 0)`;
      label.style.opacity = o.toFixed(3);
      const len = Math.max(0, colX - c.x);
      leader.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0) scaleX(${len.toFixed(1)})`;
      leader.style.opacity = o.toFixed(3);
    });

    // Hotspots
    hotspots.forEach((h, i) => {
      const el = hotspotRefs.current[i];
      if (!el) return;
      const { layer, u, v } = h.anchor;
      const pt = project((u - 0.5) * g.w, (v - 0.5) * g.h, zOf(layer), pose, g);
      el.style.transform = `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0)`;
    });
    const wrap = hotspotsWrap.current;
    if (wrap) {
      const hv = isMotion ? smooth(EXPLODE_END - 0.06, EXPLODE_END + 0.01, p) : 1;
      wrap.style.opacity = hv.toFixed(3);
      const on = hv > 0.5;
      if (on !== hotspotsOn.current) {
        hotspotsOn.current = on;
        if (on) wrap.removeAttribute("data-off");
        else wrap.setAttribute("data-off", "");
      }
    }

    // Schritt aus der Scrollposition (nur beim Überschreiten einer Grenze)
    if (isMotion) {
      const s = stepAt(p, hotspots.length);
      if (s !== scrollStep.current) {
        scrollStep.current = s;
        setActive(s);
      }
    }
  }, [hotspots]);

  // Handy: Karte schmiegt sich an den aktiven Text (oberer Rand per clip-path)
  const fitCard = useCallback(() => {
    const panel = panelRef.current;
    const block = blockRefs.current[activeRef.current + 1];
    if (!panel || !block) return;
    // offsetTop statt getBoundingClientRect: unabhängig von der laufenden Einblend-Verschiebung
    const pad = parseFloat(getComputedStyle(panel).paddingTop) || 0;
    const top = block.offsetTop - pad;
    panel.style.setProperty("--clip-top", `${Math.max(0, Math.round(top))}px`);
  }, []);

  // Hervorhebung: aktives Bauteil hebt sich leicht ab
  useEffect(() => {
    activeRef.current = active;
    const g = geo.current;
    const target = LAYERS.map((_, i) => (active >= 0 && hotspots[active]?.layers.includes(i) && g ? g.w * 0.07 : 0));
    const reduce = !motionRef.current;
    render();
    fitCard();
    return withGsap(({ gsap }) => {
      const tween = gsap.to(lifts.current, {
        ...Object.fromEntries(target.map((t, i) => [String(i), t])),
        duration: reduce ? 0 : 0.7,
        ease: "expo.out",
        onUpdate: render,
        onComplete: render,
      });
      return () => {
        tween.kill();
      };
    });
  }, [active, hotspots, render, fitCard]);

  useEffect(() => {
    const isMotion = document.documentElement.dataset.motion === "on";
    motionRef.current = isMotion;
    setMotion(isMotion);
    measure();
    setReady(true);
    render();

    const scene = sceneRef.current;
    const ro = new ResizeObserver(() => {
      measure();
      render();
      fitCard();
    });
    if (scene) ro.observe(scene);
    if (panelRef.current) ro.observe(panelRef.current);

    if (!isMotion) return () => ro.disconnect();

    const proxy = { p: 0 };
    const stop = withGsap(({ gsap }) => {
    const ctx = gsap.context(() => {
      gsap.to(proxy, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: trackRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          progress.current = proxy.p;
          render();
        },
      });
    });
    return () => ctx.revert();
    });
    return () => {
      ro.disconnect();
      stop();
    };
  }, [measure, render, fitCard]);

  const select = (i: number) => {
    const next = activeRef.current === i && !motionRef.current ? -1 : i;
    setActive(next);
    // Ohne Bewegung stehen die Texte als Liste da: passende Karte ins Bild holen
    if (!motionRef.current && next >= 0) document.getElementById(`${uid}-hs-${next}`)?.scrollIntoView({ block: "nearest" });
  };

  const interactive = !motion || active >= 0;

  return (
    <div ref={trackRef} className={styles.track}>
      <div ref={stageRef} className={`container-x ${styles.stage}`}>
        {/* Text */}
        <div className={styles.panelWrap}>
          <div ref={panelRef} className={styles.panel}>
            <div className={styles.meta} aria-hidden>
              <span className="t-label">{active < 0 ? "Aufbau" : `${pad(active + 1)} / ${pad(hotspots.length)}`}</span>
              <span className={styles.ticks}>
                {hotspots.map((h, i) => (
                  <span key={h.key} data-on={i === active || undefined} data-done={(active >= 0 && i < active) || undefined} />
                ))}
              </span>
            </div>

            <div className={styles.blocks}>
              <div
                ref={(el) => {
                  blockRefs.current[0] = el;
                }}
                className={`${styles.block} ${styles.intro}`}
                data-active={active < 0 || undefined}
              >
                <h3 className={`t-h2 ${styles.blockTitle}`}>Ein Modul, sieben Bauteile.</h3>
                <p className={styles.body}>
                  Von vorn wirkt ein Solarmodul schlicht. Innen liegen die Zellen eingebettet zwischen zwei Glasscheiben.
                  <span className={styles.scrollHint}> Scroll weiter, wir nehmen es Schicht für Schicht auseinander.</span>
                </p>
                <ol className={styles.legend} aria-label={legendTitle}>
                  {LAYERS.map((l, i) => (
                    <li key={l.key}>
                      <span className={styles.labelNum} aria-hidden>
                        {i + 1}
                      </span>
                      {l.label}
                    </li>
                  ))}
                </ol>
              </div>
              {hotspots.map((h, i) => (
                <article
                  key={h.key}
                  ref={(el) => {
                    blockRefs.current[i + 1] = el;
                  }}
                  id={`${uid}-hs-${i}`}
                  className={styles.block}
                  data-active={active === i || undefined}
                  aria-labelledby={`${uid}-hs-${i}-t`}
                >
                  <p className={styles.stepNum}>{pad(i + 1)}</p>
                  <h3 id={`${uid}-hs-${i}-t`} className={`t-h2 ${styles.blockTitle}`}>
                    {h.title}
                  </h3>
                  <p className={styles.body}>{h.body}</p>
                  {h.fact && (
                    <p className={styles.fact}>
                      <span className={styles.factValue}>{h.fact.value}</span>
                      <span>
                        {h.fact.label}
                        {h.fact.href && (
                          <>
                            {" · "}
                            <Link href={h.fact.href} className={styles.factLink}>
                              {h.fact.linkLabel ?? "Zum Produkt"}
                            </Link>
                          </>
                        )}
                      </span>
                    </p>
                  )}
                  {h.note && <p className={styles.note}>{h.note}</p>}
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Szene */}
        <div ref={sceneRef} className={styles.scene}>
          <div className={styles.ambient} aria-hidden />
          <div className={styles.viewport} aria-hidden>
            <div ref={moduleRef} className={styles.module}>
              {/* Schatten */}
              <div className={styles.layer} style={layerStyle(SHADOW_Z.z, SHADOW_Z.z0, 1)}>
                <div className={styles.shadow} />
              </div>
              {LAYERS.map((l, i) => {
                const dim = active >= 0 && !hotspots[active]?.layers.includes(i);
                return (
                  <div
                    key={l.key}
                    ref={(el) => {
                      layerRefs.current[i] = el;
                    }}
                    className={`${styles.layer} ${i === 0 ? styles.frame : i === 1 || i === 5 ? styles.glassSlab : ""}`}
                    style={layerStyle(l.z, l.z0, dim ? l.dim : 1)}
                  >
                    <LayerArt index={i} uid={uid} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Beschriftungen */}
          <div className={styles.overlay} data-ready={ready || undefined} aria-hidden>
            {LAYERS.map((l, i) => (
              <span
                key={`leader-${l.key}`}
                ref={(el) => {
                  leaderRefs.current[i] = el;
                }}
                className={styles.leader}
              />
            ))}
            {LAYERS.map((l, i) => (
              <div
                key={`label-${l.key}`}
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className={styles.label}
              >
                <span className={styles.labelNum}>{i + 1}</span>
                <span className={styles.labelText}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Hotspots */}
          <div className={styles.overlay} data-ready={ready || undefined}>
            <div ref={hotspotsWrap} className={styles.hotspots} role="group" aria-label="Details zum Modul">
              {hotspots.map((h, i) => (
                <button
                  key={h.key}
                  ref={(el) => {
                    hotspotRefs.current[i] = el;
                  }}
                  type="button"
                  className={styles.hotspot}
                  aria-pressed={active === i}
                  aria-controls={`${uid}-hs-${i}`}
                  aria-label={`${pad(i + 1)} ${h.title}`}
                  tabIndex={interactive ? 0 : -1}
                  onClick={() => select(i)}
                >
                  <span className={styles.glow} aria-hidden />
                  <span className={styles.dot} aria-hidden />
                  <span className={styles.tag} aria-hidden>
                    <span>{pad(i + 1)}</span>
                    {h.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function layerStyle(z: number, z0: number, lo: number): CSSProperties {
  return {
    ["--z" as string]: z,
    ["--z0" as string]: `${z0}px`,
    ["--lo" as string]: lo,
  };
}

// ---------- Bauteile ----------

function LayerArt({ index, uid }: { index: number; uid: string }) {
  switch (index) {
    case 0:
      return (
        <>
          <FrameFace uid={uid} />
          <div className={`${styles.side} ${styles.sideB}`} />
          <div className={`${styles.side} ${styles.sideR}`} />
        </>
      );
    case 1:
      return (
        <>
          <div className={`${styles.face} ${styles.glass}`} />
          <div className={`${styles.side} ${styles.sideB}`} />
          <div className={`${styles.side} ${styles.sideR}`} />
        </>
      );
    case 2:
    case 4:
      return <div className={`${styles.face} ${styles.film}`} />;
    case 3:
      return <CellsFace uid={uid} />;
    case 5:
      return (
        <>
          <div className={`${styles.face} ${styles.glass} ${styles.glassRear}`} />
          <div className={`${styles.side} ${styles.sideB}`} />
          <div className={`${styles.side} ${styles.sideR}`} />
        </>
      );
    case 6:
      return <JunctionBox uid={uid} />;
    default:
      return null;
  }
}

/** Aluminiumrahmen mit Gehrungsfugen */
function FrameFace({ uid }: { uid: string }) {
  return (
    <svg className={`${styles.face} ${styles.svgFill}`} viewBox="0 0 300 450" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${uid}-alu`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f8f9" />
          <stop offset="0.3" stopColor="#cdd5da" />
          <stop offset="0.52" stopColor="#f0f3f4" />
          <stop offset="0.78" stopColor="#c3ccd2" />
          <stop offset="1" stopColor="#aab4bb" />
        </linearGradient>
      </defs>
      <path fillRule="evenodd" d="M0 0H300V450H0Z M9 9V441H291V9Z" fill={`url(#${uid}-alu)`} />
      <rect x="9" y="9" width="282" height="432" fill="none" stroke="#7f8b94" strokeWidth="0.9" />
      <rect x="0.5" y="0.5" width="299" height="449" fill="none" stroke="#ffffff" strokeOpacity="0.95" strokeWidth="0.9" />
      <path d="M0.5 0.5L9 9M299.5 0.5L291 9M299.5 449.5L291 441M0.5 449.5L9 441" stroke="#8e99a1" strokeWidth="0.6" />
    </svg>
  );
}

/** 6 × 18 Halbzellen mit feinen Busbars; Zwischenräume bleiben durchsichtig (bifazial) */
function CellsFace({ uid }: { uid: string }) {
  const bars = Array.from({ length: 10 }, (_, k) => 2.6 + k * 4.31);
  return (
    <svg className={`${styles.face} ${styles.svgFill} ${styles.cells}`} viewBox="0 0 300 450" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${uid}-cell`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b4468" />
          <stop offset="0.5" stopColor="#172a45" />
          <stop offset="1" stopColor="#0e1b2e" />
        </linearGradient>
        <pattern id={`${uid}-hc`} x="12" y="14" width="46" height="23" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="44.7" height="21.9" rx="0.9" fill={`url(#${uid}-cell)`} />
          {bars.map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="23" stroke="#d9e2ea" strokeOpacity="0.3" strokeWidth="0.32" />
          ))}
        </pattern>
        <linearGradient id={`${uid}-csheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.28" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.44" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="12" y="14" width="276" height="207" fill={`url(#${uid}-hc)`} />
      <rect x="12" y="229" width="276" height="207" fill={`url(#${uid}-hc)`} />
      <g stroke="#dfe5e9" strokeWidth="1.2" strokeLinecap="round">
        <line x1="13" y1="10.5" x2="287" y2="10.5" />
        <line x1="13" y1="225" x2="287" y2="225" />
        <line x1="13" y1="439.5" x2="287" y2="439.5" />
      </g>
      <rect x="12" y="10" width="276" height="430" fill={`url(#${uid}-csheen)`} />
    </svg>
  );
}

/** Anschlussdose mit zwei Solarkabeln und Steckverbindern */
function JunctionBox({ uid }: { uid: string }) {
  return (
    <>
      <svg className={`${styles.face} ${styles.svgFill} ${styles.cables}`} viewBox="0 0 300 450" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${uid}-plug`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3c4650" />
            <stop offset="1" stopColor="#11171c" />
          </linearGradient>
        </defs>
        <g fill="none" strokeLinecap="round">
          <path d="M228 400 C 262 398, 286 384, 322 370" stroke="#141a1f" strokeWidth="3.4" />
          <path d="M228 400 C 262 398, 286 384, 322 370" stroke="#55616b" strokeWidth="0.8" strokeOpacity="0.7" />
          <path d="M184 415 C 196 444, 226 462, 262 470" stroke="#141a1f" strokeWidth="3.4" />
          <path d="M184 415 C 196 444, 226 462, 262 470" stroke="#55616b" strokeWidth="0.8" strokeOpacity="0.7" />
        </g>
        <g transform="translate(322 370) rotate(-21)">
          <rect x="0" y="-4.6" width="22" height="9.2" rx="2.4" fill={`url(#${uid}-plug)`} />
          <rect x="22" y="-3.2" width="7" height="6.4" rx="1.6" fill="#2a3239" />
          <line x1="6" y1="-4.6" x2="6" y2="4.6" stroke="#6b7680" strokeWidth="0.6" />
        </g>
        <g transform="translate(262 470) rotate(12)">
          <rect x="0" y="-4.6" width="22" height="9.2" rx="2.4" fill={`url(#${uid}-plug)`} />
          <rect x="22" y="-3.2" width="7" height="6.4" rx="1.6" fill="#2a3239" />
          <line x1="6" y1="-4.6" x2="6" y2="4.6" stroke="#6b7680" strokeWidth="0.6" />
        </g>
      </svg>
      <div className={styles.jbox}>
        <div className={styles.jboxTop} />
        <div className={`${styles.side} ${styles.sideB}`} />
        <div className={`${styles.side} ${styles.sideR}`} />
      </div>
    </>
  );
}
