import { useId } from "react";
import type { VisualKey } from "@/lib/catalog/types";

/**
 * Schematische Produktzeichnungen (isometrisch) als ehrlicher Platzhalter,
 * solange keine Originalfotos des Lieferanten vorliegen.
 * Bewusst als technische Zeichnung erkennbar – kein Rendering, das ein
 * bestimmtes Produkt vortäuscht. Beschriftet mit „Schematische Darstellung“.
 */

type P3 = [number, number, number];
type P2 = [number, number];

const COS30 = Math.cos(Math.PI / 6);
const iso = ([x, y, z]: P3): P2 => [(x - y) * COS30, (x + y) * 0.5 - z];
const add = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lerp3 = (a: P3, b: P3, t: number): P3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rad = (deg: number) => (deg * Math.PI) / 180;

type Fill = "top" | "left" | "right" | "glass" | "glassDark" | "metal" | "screen" | "shadow" | "sun" | "none";
type Stroke = "ink" | "soft" | "light" | "sun" | "none";

interface Shape {
  pts: P2[];
  closed?: boolean;
  /** pts = [Start, Kontrollpunkt 1, Kontrollpunkt 2, Ende] */
  curve?: boolean;
  fill?: Fill;
  stroke?: Stroke;
  width?: number;
  dash?: boolean;
  opacity?: number;
}

/** Benannte Ankerpunkte für Hotspots */
export type AnchorKey = "modules" | "inverter" | "storage" | "connect" | "cable" | "mppt" | "tilt" | "length" | "compat" | "frame";

class Sketch {
  shapes: Shape[] = [];
  anchors: Partial<Record<AnchorKey, P2>> = {};

  poly(pts: P3[], fill: Fill, stroke: Stroke = "ink", extra: Partial<Shape> = {}) {
    this.shapes.push({ pts: pts.map(iso), closed: true, fill, stroke, ...extra });
  }
  line(a: P3, b: P3, stroke: Stroke = "soft", extra: Partial<Shape> = {}) {
    this.shapes.push({ pts: [iso(a), iso(b)], fill: "none", stroke, ...extra });
  }
  curve(p0: P3, c1: P3, c2: P3, p1: P3, stroke: Stroke = "ink", extra: Partial<Shape> = {}) {
    this.shapes.push({ pts: [iso(p0), iso(c1), iso(c2), iso(p1)], curve: true, fill: "none", stroke, ...extra });
  }
  anchor(key: AnchorKey, p: P3) {
    this.anchors[key] = iso(p);
  }
  /** Bodenschatten als weiche, versetzte Grundfläche */
  shadow(x: number, y: number, w: number, d: number) {
    const o = 6;
    this.poly(
      [
        [x + o, y + o, 0],
        [x + w + o * 2, y + o, 0],
        [x + w + o * 2, y + d + o * 2, 0],
        [x + o, y + d + o * 2, 0],
      ],
      "shadow",
      "none",
    );
  }
  /** Quader: sichtbar sind Deckfläche, Vorderseite (+y) und rechte Seite (+x) */
  box(x: number, y: number, z: number, w: number, d: number, h: number, fills: { top?: Fill; left?: Fill; right?: Fill } = {}) {
    this.poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], fills.left ?? "left");
    this.poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], fills.right ?? "right");
    this.poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], fills.top ?? "top");
  }
  /** Kreis auf der Vorderseite (+y) eines Körpers */
  frontCircle(cx: number, y: number, cz: number, r: number, fill: Fill, stroke: Stroke = "ink") {
    const pts: P3[] = [];
    for (let i = 0; i < 28; i++) {
      const t = (i / 28) * Math.PI * 2;
      pts.push([cx + Math.cos(t) * r, y, cz + Math.sin(t) * r]);
    }
    this.poly(pts, fill, stroke);
  }
  /** Rechteck auf der Vorderseite (+y) */
  frontRect(x: number, y: number, z: number, w: number, h: number, fill: Fill, stroke: Stroke = "ink") {
    this.poly([[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]], fill, stroke);
  }
}

interface PanelOpts {
  x: number;
  y: number;
  z?: number;
  W?: number;
  L?: number;
  tilt?: number;
  cols?: number;
  rows?: number;
  dark?: boolean;
  dashed?: boolean;
  struts?: boolean;
}

/** Geneigtes Solarmodul mit Rahmen, Zellraster und sichtbarer Stärke. Gibt die vier Ecken zurück. */
function panel(sk: Sketch, o: PanelOpts) {
  const { x, y, z = 0, W = 100, L = 170, tilt = 25, cols = 6, rows = 10, dark = false, dashed = false, struts = false } = o;
  const a = rad(tilt);
  const h = L * Math.sin(a);
  const dy = L * Math.cos(a);
  const p0: P3 = [x, y, z + h];
  const p1: P3 = [x + W, y, z + h];
  const p2: P3 = [x + W, y + dy, z];
  const p3: P3 = [x, y + dy, z];
  const t = 3.2;
  const off: P3 = [0, -t * Math.sin(a), -t * Math.cos(a)];

  if (struts) {
    // Aufständerung hinten und Bodenschienen (liegen hinter dem Modul)
    sk.line([x + 6, y + 2, z], [x + 6, y + 2, z + h - 2], "ink", { width: 1 });
    sk.line([x + W - 6, y + 2, z], [x + W - 6, y + 2, z + h - 2], "ink", { width: 1 });
    sk.line([x + 6, y + 2, z], [x + 6, y + dy, z], "soft");
    sk.line([x + W - 6, y + 2, z], [x + W - 6, y + dy, z], "soft");
  }

  if (dashed) {
    sk.poly([p0, p1, p2, p3], "none", "soft", { dash: true });
    return { p0, p1, p2, p3 };
  }

  sk.poly([p1, p2, add(p2, off), add(p1, off)], dark ? "glassDark" : "right");
  sk.poly([p3, p2, add(p2, off), add(p3, off)], dark ? "glassDark" : "left");
  sk.poly([p0, p1, p2, p3], dark ? "glassDark" : "glass");

  // Rahmen innen
  const inset = 0.035;
  const q = (u: number, v: number): P3 => lerp3(lerp3(p0, p1, u), lerp3(p3, p2, u), v);
  sk.poly([q(inset, inset * 0.6), q(1 - inset, inset * 0.6), q(1 - inset, 1 - inset * 0.6), q(inset, 1 - inset * 0.6)], "none", dark ? "light" : "soft", { width: 0.8 });
  // Zellraster
  const grid: Stroke = dark ? "light" : "soft";
  for (let c = 1; c < cols; c++) {
    const u = inset + ((1 - 2 * inset) * c) / cols;
    sk.line(q(u, inset * 0.6), q(u, 1 - inset * 0.6), grid, { width: 0.6, opacity: 0.8 });
  }
  for (let r = 1; r < rows; r++) {
    const v = inset * 0.6 + ((1 - 1.2 * inset) * r) / rows;
    sk.line(q(inset, v), q(1 - inset, v), grid, { width: 0.6, opacity: 0.8 });
  }
  return { p0, p1, p2, p3, q };
}

function inverterBox(sk: Sketch, x: number, y: number, z = 0, w = 40, d = 14, h = 30) {
  sk.shadow(x, y, w, d);
  sk.box(x, y, z, w, d, h);
  // Kühlrippen auf der Oberseite
  for (let i = 1; i < 6; i++) sk.line([x + (w * i) / 6, y + 2, z + h], [x + (w * i) / 6, y + d - 2, z + h], "soft", { width: 0.7 });
  // Status-LED in Sonnenfarbe
  sk.frontCircle(x + w - 7, y + d, z + h - 7, 1.8, "sun", "none");
  sk.frontRect(x + 6, y + d, z + 6, w * 0.4, 3, "metal", "soft");
}

function batteryUnit(sk: Sketch, x: number, y: number, z: number, w: number, d: number, h: number, withLed: boolean) {
  sk.box(x, y, z, w, d, h);
  if (withLed) {
    sk.frontRect(x + w * 0.18, y + d, z + h - 14, w * 0.64, 3.4, "sun", "none");
    sk.frontCircle(x + w / 2, y + d, z + h * 0.42, Math.min(w, h) * 0.12, "none", "soft");
  } else {
    sk.frontRect(x + w * 0.3, y + d, z + h * 0.48, w * 0.4, 1.6, "metal", "none");
  }
  // Lüftungsschlitze rechts
  for (let i = 0; i < 4; i++) {
    const zz = z + h * 0.3 + i * 4;
    sk.line([x + w, y + d * 0.3, zz], [x + w, y + d * 0.7, zz], "soft", { width: 0.7 });
  }
}

function cable(sk: Sketch, from: P3, to: P3) {
  const mid1: P3 = [from[0] + 10, from[1] + 22, 0];
  const mid2: P3 = [to[0] - 18, to[1] + 18, 0];
  sk.curve(from, mid1, mid2, to, "ink", { width: 1.1 });
}

// ---------- Zeichnungen je Produkttyp ----------

const builders: Record<VisualKey, (sk: Sketch) => void> = {
  module: (sk) => buildModule(sk, false),
  "module-black": (sk) => buildModule(sk, true),
  "kit-2": (sk) => buildKit(sk, 2, false),
  "kit-4": (sk) => buildKit(sk, 4, false),
  "kit-2-storage": (sk) => buildKit(sk, 2, true),
  "kit-4-storage": (sk) => buildKit(sk, 4, true),
  battery: (sk) => buildBattery(sk, 1),
  "battery-large": (sk) => buildBattery(sk, 2),
  "battery-tower": (sk) => buildBattery(sk, 3),
  inverter: (sk) => {
    const x = 0, y = 0, w = 70, d = 24, h = 52;
    sk.shadow(x, y, w, d);
    // Gleichstrom-Eingänge links, Wechselstrom rechts
    sk.curve([x + 14, y + d, 4], [x - 6, y + d + 30, 0], [x - 30, y + d + 40, 0], [x - 46, y + d + 64, 0], "ink", { width: 1.1 });
    sk.curve([x + 28, y + d, 4], [x + 14, y + d + 34, 0], [x - 4, y + d + 50, 0], [x - 14, y + d + 74, 0], "ink", { width: 1.1 });
    sk.curve([x + w, y + d * 0.6, 6], [x + w + 30, y + d + 10, 0], [x + w + 40, y + d + 30, 0], [x + w + 54, y + d + 40, 0], "ink", { width: 1.1 });
    sk.box(x, y, 0, w, d, h);
    for (let i = 1; i < 8; i++) sk.line([x + (w * i) / 8, y + 3, h], [x + (w * i) / 8, y + d - 3, h], "soft", { width: 0.7 });
    sk.frontCircle(x + w - 9, y + d, h - 9, 2.2, "sun", "none");
    sk.frontRect(x + 8, y + d, 10, w * 0.42, 4, "metal", "soft");
    sk.anchor("inverter", [x + w * 0.42, y + d, h * 0.62]);
    sk.anchor("mppt", [x - 18, y + d + 44, 0]);
    sk.anchor("connect", [x + w - 9, y + d, h - 9]);
  },
  "mount-flat": (sk) => {
    const tilt = rad(30);
    const L = 150;
    const dy = L * Math.cos(tilt);
    const h = L * Math.sin(tilt);
    const frames = [0, 108, 216];
    // Module (nicht im Lieferumfang) gestrichelt
    panel(sk, { x: 2, y: 0, z: 6, W: 104, L: L + 6, tilt: 30, dashed: true });
    panel(sk, { x: 110, y: 0, z: 6, W: 104, L: L + 6, tilt: 30, dashed: true });
    for (const fx of frames) {
      sk.poly([[fx, 0, 0], [fx, dy, 0], [fx, 0, h]], "none", "ink", { width: 1.4 });
      sk.line([fx, dy * 0.45, 0], [fx, dy * 0.45, h * 0.55], "ink", { width: 1 });
      sk.poly([[fx - 6, -6, 0], [fx + 6, -6, 0], [fx + 6, dy + 6, 0], [fx - 6, dy + 6, 0]], "none", "soft");
    }
    // Querschienen
    for (const t of [0.25, 0.75]) {
      const a: P3 = [frames[0]!, dy * t, h * (1 - t)];
      const b: P3 = [frames[2]!, dy * t, h * (1 - t)];
      sk.line(a, b, "ink", { width: 1.6 });
    }
    sk.anchor("tilt", [frames[2]!, dy * 0.5, h * 0.5]);
    sk.anchor("length", [frames[1]!, dy * 0.25, h * 0.75]);
  },
  "mount-rail": (sk) => {
    // Balkongeländer mit Einhängehaken
    const W = 220;
    sk.line([0, 0, 110], [W, 0, 110], "ink", { width: 2 });
    for (let x = 0; x <= W; x += 22) sk.line([x, 0, 0], [x, 0, 110], "soft", { width: 0.9 });
    sk.line([0, 0, 0], [W, 0, 0], "ink", { width: 1.2 });
    panel(sk, { x: 40, y: 4, z: 8, W: 140, L: 100, tilt: 82, dashed: true });
    for (const hx of [60, 160]) {
      sk.poly([[hx, -4, 104], [hx + 10, -4, 104], [hx + 10, 8, 104], [hx + 10, 8, 80], [hx, 8, 80], [hx, 8, 104]], "sun", "ink");
    }
    sk.anchor("frame", [110, 0, 110]);
  },
  meter: (sk) => {
    const x = 0, y = 0, w = 46, d = 30, h = 66;
    sk.shadow(x, y, w, d);
    sk.box(x, y, 0, w, d, h);
    sk.frontRect(x + 7, y + d, h - 26, w - 14, 16, "screen", "ink");
    sk.frontRect(x + 11, y + d, h - 21, 10, 2, "sun", "none");
    for (let i = 0; i < 3; i++) sk.frontRect(x + 8 + i * 11, y + d, 14, 7, 4, "metal", "soft");
    sk.anchor("compat", [x + w / 2, y + d, h - 18]);
  },
  plug: (sk) => {
    const x = 0, y = 0, w = 44, d = 30, h = 56;
    sk.shadow(x, y, w, d);
    sk.box(x, y, 0, w, d, h);
    sk.frontCircle(x + w / 2, y + d, h * 0.44, 13, "top", "ink");
    sk.frontCircle(x + w / 2 - 5, y + d, h * 0.44, 1.8, "screen", "none");
    sk.frontCircle(x + w / 2 + 5, y + d, h * 0.44, 1.8, "screen", "none");
    sk.frontCircle(x + w / 2, y + d, h - 7, 1.8, "sun", "none");
    sk.anchor("connect", [x + w / 2, y + d, h - 7]);
    sk.anchor("compat", [x + w / 2 + 10, y + d, h * 0.3]);
  },
};

function buildModule(sk: Sketch, dark: boolean) {
  const tilt = 68;
  const L = 170;
  const dy = L * Math.cos(rad(tilt));
  sk.shadow(-6, -4, 112, dy + 18);
  const { q } = panel(sk, { x: 0, y: 0, z: 10, W: 100, L, tilt, cols: 6, rows: 10, dark });
  if (q) {
    // Anschlusskabel mit Steckverbindern (Sonnen-Akzent)
    const a = q(0.72, 1);
    const b = q(0.86, 1);
    for (const [start, dx] of [[a, -8], [b, 10]] as const) {
      const end: P3 = [start[0] + dx, start[1] + 18, 0];
      sk.curve(start, [start[0], start[1] + 4, start[2] - 6], [end[0], end[1] - 8, 2], end, "ink", { width: 1 });
      sk.box(end[0] - 2.5, end[1], 0, 5, 9, 4, { top: "sun", left: "sun", right: "sun" });
    }
    sk.anchor("modules", q(0.5, 0.45));
    sk.anchor("frame", q(0.97, 0.12));
  }
}

function buildKit(sk: Sketch, count: 2 | 4, storage: boolean) {
  const W = 100;
  const gap = 10;
  const L = 170;
  const tilt = 25;
  const dy = L * Math.cos(rad(tilt));
  const span = count * W + (count - 1) * gap;
  sk.shadow(-4, -4, span + 8, dy + 8);
  let center: P3 = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    const res = panel(sk, { x: i * (W + gap), y: 0, z: 0, W, L, tilt, struts: true });
    if (i === Math.floor((count - 1) / 2) && res.q) center = res.q(count === 2 ? 0.95 : 0.98, 0.5);
  }
  sk.anchor("modules", center);
  const lastFront: P3 = [span - 6, dy, 0];
  if (storage) {
    const bx = span + 26;
    const by = dy - 40;
    // Speicher mit integriertem bzw. separatem Wechselrichter
    sk.shadow(bx, by, 62, 40);
    if (count === 4) {
      batteryUnit(sk, bx, by, 0, 62, 40, 40, false);
      batteryUnit(sk, bx, by, 42, 62, 40, 48, true);
    } else {
      batteryUnit(sk, bx, by, 0, 62, 40, 84, true);
    }
    cable(sk, lastFront, [bx, by + 30, 10]);
    sk.anchor("storage", [bx + 31, by + 40, count === 4 ? 70 : 52]);
    const ix = bx + 74;
    inverterBox(sk, ix, by + 18, 0, 46, 16, 34);
    sk.anchor("inverter", [ix + 23, by + 34, 24]);
    sk.anchor("cable", lerp3(lastFront, [bx, by + 30, 10], 0.5));
  } else {
    const ix = span + 30;
    const iy = dy - 10;
    cable(sk, lastFront, [ix, iy + 9, 10]);
    inverterBox(sk, ix, iy, 0, 58, 18, 40);
    sk.anchor("inverter", [ix + 29, iy + 18, 28]);
    sk.anchor("cable", lerp3(lastFront, [ix, iy + 9, 10], 0.55));
  }
}

function buildBattery(sk: Sketch, units: 1 | 2 | 3) {
  const w = 70;
  const d = 40;
  const heights = units === 1 ? [96] : units === 2 ? [34, 70] : [40, 40, 40];
  const total = heights.reduce((a, b) => a + b, 0) + (units - 1) * 2;
  sk.shadow(0, 0, w, d);
  let z = 0;
  heights.forEach((h, i) => {
    batteryUnit(sk, 0, 0, z, w, d, h, i === heights.length - 1);
    z += h + 2;
  });
  sk.anchor("storage", [w * 0.5, d, total * 0.55]);
  sk.anchor("connect", [w, d * 0.5, total * 0.35]);
}

// ---------- Einpassen in den Bildausschnitt ----------

const VB_W = 400;
const VB_H = 300;

interface Fitted {
  shapes: Shape[];
  anchors: Partial<Record<AnchorKey, { x: number; y: number }>>;
}

const cache = new Map<VisualKey, Fitted>();

function build(visual: VisualKey): Fitted {
  const hit = cache.get(visual);
  if (hit) return hit;
  const sk = new Sketch();
  builders[visual](sk);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of sk.shapes) for (const [x, y] of s.pts) {
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  // Rahmen: links/rechts 40, oben 34, unten Platz für die Beschriftung
  const box = { x: 40, y: 34, w: VB_W - 80, h: VB_H - 34 - 48 };
  const s = Math.min(box.w / (maxX - minX), box.h / (maxY - minY));
  const tx = box.x + (box.w - (maxX - minX) * s) / 2 - minX * s;
  const ty = box.y + (box.h - (maxY - minY) * s) / 2 - minY * s;
  const f = ([x, y]: P2): P2 => [Math.round((x * s + tx) * 10) / 10, Math.round((y * s + ty) * 10) / 10];
  const out: Fitted = {
    shapes: sk.shapes.map((sh) => ({ ...sh, pts: sh.pts.map(f) })),
    anchors: Object.fromEntries(Object.entries(sk.anchors).map(([k, p]) => {
      const [x, y] = f(p as P2);
      return [k, { x, y }];
    })) as Fitted["anchors"],
  };
  cache.set(visual, out);
  return out;
}

/** Ankerpunkte in Prozent der Bildfläche (für HTML-Hotspots über der Zeichnung) */
export function getSchematicAnchors(visual: VisualKey): Partial<Record<AnchorKey, { left: number; top: number }>> {
  const { anchors } = build(visual);
  return Object.fromEntries(
    Object.entries(anchors).map(([k, p]) => [k, { left: (p!.x / VB_W) * 100, top: (p!.y / VB_H) * 100 }]),
  ) as Partial<Record<AnchorKey, { left: number; top: number }>>;
}

function toPath(sh: Shape): string {
  const p = sh.pts;
  if (sh.curve && p.length === 4) return `M${p[0]![0]} ${p[0]![1]}C${p[1]![0]} ${p[1]![1]} ${p[2]![0]} ${p[2]![1]} ${p[3]![0]} ${p[3]![1]}`;
  return `M${p.map(([x, y]) => `${x} ${y}`).join("L")}${sh.closed ? "Z" : ""}`;
}

interface Props {
  visual: VisualKey;
  className?: string;
  /** full = ausführliche Beschriftung, short = kurz, none = ohne (z. B. Miniaturen) */
  label?: "full" | "short" | "none";
  /** Punktraster im Hintergrund */
  grid?: boolean;
  title?: string;
}

export function ProductSchematic({ visual, className, label = "full", grid = true, title }: Props) {
  const uid = useId().replace(/:/g, "");
  const { shapes } = build(visual);
  const fills: Record<Fill, string> = {
    top: "#FDFDFC",
    left: "#EEF2F0",
    right: "#DEE5E2",
    glass: "#E2E9ED",
    glassDark: "#27323C",
    metal: "#C7D0D4",
    screen: "#17212B",
    shadow: "rgb(16 24 32 / 0.07)",
    sun: `url(#${uid}-sun)`,
    none: "none",
  };
  const strokes: Record<Stroke, string> = {
    ink: "#101820",
    soft: "rgb(16 24 32 / 0.38)",
    light: "rgb(255 255 255 / 0.32)",
    sun: `url(#${uid}-sun)`,
    none: "none",
  };
  const caption = label === "full" ? "SCHEMATISCHE DARSTELLUNG · PRODUKTFOTO FOLGT" : "SCHEMA · FOTO FOLGT";
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className={className} role="img" aria-label={`${title ?? "Produkt"}: schematische Darstellung, Produktfoto folgt`}>
      <defs>
        <linearGradient id={`${uid}-sun`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD84D" />
          <stop offset="0.6" stopColor="#FFA42A" />
          <stop offset="1" stopColor="#FF6F1A" />
        </linearGradient>
        {grid && (
          <pattern id={`${uid}-dots`} width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="0.65" fill="#101820" opacity="0.13" />
          </pattern>
        )}
      </defs>
      {grid && <rect width={VB_W} height={VB_H} fill={`url(#${uid}-dots)`} />}
      {shapes.map((sh, i) => {
        return (
          <path
            key={i}
            d={toPath(sh)}
            fill={fills[sh.fill ?? "none"]}
            stroke={strokes[sh.stroke ?? "ink"]}
            strokeWidth={sh.width ?? 1.15}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={sh.dash ? "4 4" : undefined}
            opacity={sh.opacity}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {label !== "none" && (
        <text x="22" y={VB_H - 18} fontFamily="var(--font-mono), ui-monospace, monospace" fontSize="9.5" letterSpacing="1.4" fill="#56616b">
          {caption}
        </text>
      )}
    </svg>
  );
}
