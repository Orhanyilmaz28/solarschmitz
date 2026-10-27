import {
  box,
  cross,
  dot,
  groundGrid,
  lerp3,
  norm,
  project,
  projectPoint,
  scale,
  sub,
  add,
  v3,
  type Camera,
  type Face,
  type Line,
  type V3,
} from "@/lib/linework/engine";
import { attrs, itemsToSvg, mergeLines, quantize, round } from "@/lib/linework/svg";

/**
 * Kapitel 1 – Siedlung im Linienwerk-Stil.
 * Straßenansicht mit Tele-Brennweite: Einfamilienhäuser mit Modulen auf dem Dach,
 * ein Mehrfamilienhaus mit Balkonkraftwerken, ein moderner Flachbau, Bäume.
 * Ausgabe als drei deckungsgleiche SVG-Ebenen:
 *  - base: die Siedlung selbst
 *  - pv:   nur die sichtbaren Moduloberflächen (spiegeln den Himmel, Deckkraft je Tageszeit)
 *  - win:  nur die erleuchteten Fenster (morgens und abends)
 */

export type SiedlungVariant = "d" | "m";
export type SiedlungLayer = "base" | "pv" | "win";

export const SIEDLUNG_VIEW = {
  d: { w: 1600, h: 900 },
  m: { w: 900, h: 1600 },
} as const;

/** Bildraum-Geometrie für Sonnenbahn und Ertragskurve (gleiches viewBox wie die Ebenen) */
export const SIEDLUNG_LAYOUT = {
  d: { x0: 170, x1: 1430, base: 352, arc: 250, curve: 140, label: 13, sun: 30 },
  m: { x0: 120, x1: 780, base: 760, arc: 420, curve: 200, label: 24, sun: 44 },
} as const;

const SHOTS: Record<SiedlungVariant, { pos: V3; look: [number, number]; fov: number; shiftX: number; shiftY: number }> = {
  d: { pos: [2, 3.2, -80], look: [2, 0], fov: 23, shiftX: 0, shiftY: 70 },
  m: { pos: [6.5, 3.0, -64], look: [6.5, 0], fov: 38, shiftX: 0, shiftY: 190 },
};

export function siedlungCamera(variant: SiedlungVariant): Camera {
  const s = SHOTS[variant];
  const { w, h } = SIEDLUNG_VIEW[variant];
  return { pos: s.pos, target: [s.look[0], s.pos[1], s.look[1]], fov: s.fov, width: w, height: h, shiftX: s.shiftX, shiftY: s.shiftY };
}

// ---------- Material ----------

const C = {
  wall: "#0C1218",
  wallSide: "#090E13",
  wallLight: "#0F161D",
  roof: "#131B23",
  roofDark: "#0E141A",
  pv: "#0E1828",
  pvLine: "#7F9BB8",
  glass: "#111A24",
  slab: "#0D1319",
  line: "#9DB0C0",
  tree: "#0A1015",
  treeLine: "#7E93A3",
  ground: "#070A0E",
};

const LINE_OP = 0.24;

// ---------- Hilfen ----------

function newell(pts: V3[]): V3 {
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    x += (a[1] - b[1]) * (a[2] + b[2]);
    y += (a[2] - b[2]) * (a[0] + b[0]);
    z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return norm([x, y, z]);
}

/** Fläche mit nach außen zeigender Normale (Richtungshinweis statt Punktreihenfolge) */
function face(pts: V3[], fill: string, outward: V3 | null, extra: Partial<Face> = {}): Face {
  let normal: V3 | undefined;
  if (outward) {
    normal = newell(pts);
    if (dot(normal, outward) < 0) normal = scale(normal, -1);
  }
  return { pts, normal, fill, stroke: C.line, strokeOpacity: LINE_OP, strokeWidth: 1, ...extra };
}

let winCounter = 0;
let pvCounter = 0;

interface Out {
  faces: Face[];
  lines: Line[];
}

/** Fenster als leicht vorgesetzte Fläche auf einer Fassade in der Ebene z = const (Blick von -z) */
function windowFront(out: Out, x0: number, x1: number, y0: number, y1: number, z: number) {
  const pts = [v3(x0, y0, z), v3(x1, y0, z), v3(x1, y1, z), v3(x0, y1, z)];
  out.faces.push(face(pts, C.glass, [0, 0, -1], { tag: `win-${winCounter++}`, bias: -0.08, strokeOpacity: 0.3 }));
  // Fensterkreuz
  const xm = (x0 + x1) / 2;
  if (x1 - x0 > 1.2) out.lines.push({ pts: [v3(xm, y0, z - 0.01), v3(xm, y1, z - 0.01)], stroke: C.line, opacity: 0.16, bias: -0.1 });
}

/** Module auf einer Ebene a-b (unten) / d-c (oben), versetzt entlang der Normalen */
function pvField(out: Out, a: V3, b: V3, c: V3, d: V3, cols: number, rows: number, normal: V3, gap = 0.04) {
  const off = scale(normal, 0.08);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const u0 = i / cols + gap / cols, u1 = (i + 1) / cols - gap / cols;
      const v0 = j / rows + gap / rows, v1 = (j + 1) / rows - gap / rows;
      const p = (u: number, v: number) => add(lerp3(lerp3(a, b, u), lerp3(d, c, u), v), off);
      const pts = [p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1)];
      out.faces.push(face(pts, C.pv, normal, { tag: `pv-${pvCounter++}`, stroke: C.pvLine, strokeOpacity: 0.42, bias: -0.06 }));
      // angedeutetes Zellraster (3 × 5) und Halbzellen-Teilung
      for (let k = 1; k < 3; k++) out.lines.push({ pts: [p(u0 + ((u1 - u0) * k) / 3, v0), p(u0 + ((u1 - u0) * k) / 3, v1)], stroke: C.pvLine, opacity: 0.13, bias: -0.12 });
      for (let k = 1; k < 5; k++) out.lines.push({ pts: [p(u0, v0 + ((v1 - v0) * k) / 5), p(u1, v0 + ((v1 - v0) * k) / 5)], stroke: C.pvLine, opacity: k === 2 || k === 3 ? 0.13 : 0.1, bias: -0.12 });
    }
  }
}

/** Einfamilienhaus mit Satteldach, First parallel zur x-Achse, Module auf der vorderen Dachfläche */
function gableHouseX(out: Out, x0: number, x1: number, z0: number, z1: number, eave: number, ridge: number, pv: { cols: number; rows: number } | null, windows: number) {
  out.faces.push(...box(v3(x0, 0, z0), v3(x1, eave, z1), { fill: C.wall, fills: { left: C.wallSide, right: C.wallSide }, stroke: C.line, strokeOpacity: LINE_OP, skip: ["top", "bottom"] }));
  const zm = (z0 + z1) / 2;
  const o = 0.45; // Dachüberstand
  const fa = v3(x0 - o, eave - 0.25, z0 - o), fb = v3(x1 + o, eave - 0.25, z0 - o);
  const fc = v3(x1 + o, ridge, zm), fd = v3(x0 - o, ridge, zm);
  const ba = v3(x0 - o, eave - 0.25, z1 + o), bb = v3(x1 + o, eave - 0.25, z1 + o);
  out.faces.push(face([fa, fb, fc, fd], C.roof, [0, 1, -1]));
  out.faces.push(face([ba, bb, fc, fd], C.roofDark, [0, 1, 1]));
  // Giebel
  out.faces.push(face([v3(x0, eave, z0), v3(x0, eave, z1), v3(x0, ridge - 0.1, zm)], C.wallSide, [-1, 0, 0]));
  out.faces.push(face([v3(x1, eave, z0), v3(x1, eave, z1), v3(x1, ridge - 0.1, zm)], C.wallSide, [1, 0, 0]));
  if (pv) {
    const n = newell([fa, fb, fc, fd]);
    const nn: V3 = dot(n, [0, 1, -1]) < 0 ? scale(n, -1) : n;
    const m = 0.9;
    const t = (u: number, v: number) => lerp3(lerp3(fa, fb, u), lerp3(fd, fc, u), v);
    const span = x1 - x0 + 2 * o;
    const mu = m / span;
    pvField(out, t(mu, 0.16), t(1 - mu, 0.16), t(1 - mu, 0.86), t(mu, 0.86), pv.cols, pv.rows, nn);
  }
  // Fenster und Tür
  const w = x1 - x0;
  const slots = windows;
  for (let i = 0; i < slots; i++) {
    const cx = x0 + (w * (i + 0.5)) / slots;
    windowFront(out, cx - 0.65, cx + 0.65, 3.2, 4.6, z0 - 0.02);
    if (i !== Math.floor(slots / 2)) windowFront(out, cx - 0.65, cx + 0.65, 0.9, 2.3, z0 - 0.02);
  }
  const dx = x0 + (w * (Math.floor(slots / 2) + 0.5)) / slots;
  out.faces.push(face([v3(dx - 0.55, 0, z0 - 0.02), v3(dx + 0.55, 0, z0 - 0.02), v3(dx + 0.55, 2.2, z0 - 0.02), v3(dx - 0.55, 2.2, z0 - 0.02)], C.roofDark, [0, 0, -1], { bias: -0.08 }));
}

/** Satteldach mit First entlang z (Giebel zeigt zur Kamera), Module auf der linken Dachfläche */
function gableHouseZ(out: Out, x0: number, x1: number, z0: number, z1: number, eave: number, ridge: number, pv: { cols: number; rows: number } | null) {
  out.faces.push(...box(v3(x0, 0, z0), v3(x1, eave, z1), { fill: C.wallLight, fills: { left: C.wallSide, right: C.wallSide }, stroke: C.line, strokeOpacity: LINE_OP, skip: ["top", "bottom"] }));
  const xm = (x0 + x1) / 2;
  const o = 0.45;
  const la = v3(x0 - o, eave - 0.25, z0 - o), lb = v3(x0 - o, eave - 0.25, z1 + o);
  const lc = v3(xm, ridge, z1 + o), ld = v3(xm, ridge, z0 - o);
  const ra = v3(x1 + o, eave - 0.25, z0 - o), rb = v3(x1 + o, eave - 0.25, z1 + o);
  out.faces.push(face([la, lb, lc, ld], C.roof, [-1, 1, 0]));
  out.faces.push(face([ra, rb, lc, ld], C.roofDark, [1, 1, 0]));
  out.faces.push(face([v3(x0, eave, z0), v3(x1, eave, z0), v3(xm, ridge - 0.1, z0)], C.wallLight, [0, 0, -1]));
  out.faces.push(face([v3(x0, eave, z1), v3(x1, eave, z1), v3(xm, ridge - 0.1, z1)], C.wallSide, [0, 0, 1]));
  if (pv) {
    const n0 = newell([la, lb, lc, ld]);
    const nn: V3 = dot(n0, [-1, 1, 0]) < 0 ? scale(n0, -1) : n0;
    // a-b entlang der Traufe (z), d-c am First
    const t = (u: number, v: number) => lerp3(lerp3(la, lb, u), lerp3(ld, lc, u), v);
    pvField(out, t(0.1, 0.15), t(0.9, 0.15), t(0.9, 0.85), t(0.1, 0.85), pv.cols, pv.rows, nn);
  }
  // Giebelfenster und Erdgeschoss
  const w = x1 - x0;
  windowFront(out, xm - 0.6, xm + 0.6, eave + 0.5, eave + 1.7, z0 - 0.02);
  windowFront(out, x0 + w * 0.18, x0 + w * 0.42, 0.9, 2.3, z0 - 0.02);
  windowFront(out, x0 + w * 0.58, x0 + w * 0.82, 0.9, 2.3, z0 - 0.02);
  windowFront(out, x0 + w * 0.18, x0 + w * 0.42, 3.0, 4.3, z0 - 0.02);
  windowFront(out, x0 + w * 0.58, x0 + w * 0.82, 3.0, 4.3, z0 - 0.02);
}

/** Balkon mit Brüstung; optional zwei Module außen an der Brüstung (Balkonkraftwerk) */
function balcony(out: Out, x0: number, x1: number, floorY: number, z: number, depth: number, withPv: boolean) {
  out.faces.push(...box(v3(x0, floorY - 0.22, z - depth), v3(x1, floorY, z), { fill: C.slab, stroke: C.line, strokeOpacity: LINE_OP, skip: ["back", "bottom"] }));
  const rz = z - depth;
  // Brüstung als Linien
  out.lines.push({ pts: [v3(x0, floorY + 1.0, rz), v3(x1, floorY + 1.0, rz)], stroke: C.line, opacity: 0.32, bias: -0.2 });
  out.lines.push({ pts: [v3(x0, floorY + 1.0, rz), v3(x0, floorY + 1.0, z)], stroke: C.line, opacity: 0.22 });
  out.lines.push({ pts: [v3(x1, floorY + 1.0, rz), v3(x1, floorY + 1.0, z)], stroke: C.line, opacity: 0.22 });
  for (let x = x0 + 0.5; x < x1 - 0.2; x += 0.5) out.lines.push({ pts: [v3(x, floorY, rz), v3(x, floorY + 1.0, rz)], stroke: C.line, opacity: 0.1, bias: -0.15 });
  if (withPv) {
    const mw = Math.min(1.72, (x1 - x0 - 0.5) / 2);
    const cx = (x0 + x1) / 2;
    const zz = rz - 0.06;
    for (const [a, b] of [
      [cx - mw - 0.04, cx - 0.04],
      [cx + 0.04, cx + mw + 0.04],
    ] as const) {
      const top = floorY + 1.02, bot = floorY - 0.02;
      // leicht nach außen geneigt
      const pts = [v3(a, bot, zz + 0.04), v3(b, bot, zz + 0.04), v3(b, top, zz - 0.14), v3(a, top, zz - 0.14)];
      out.faces.push(face(pts, C.pv, [0, 0.2, -1], { tag: `pv-${pvCounter++}`, stroke: C.pvLine, strokeOpacity: 0.5, bias: -0.3 }));
      // Zellraster quer: 6 Spalten, 2 Reihen
      for (let k = 1; k < 6; k++) out.lines.push({ pts: [lerp3(pts[0]!, pts[1]!, k / 6), lerp3(pts[3]!, pts[2]!, k / 6)], stroke: C.pvLine, opacity: 0.14, bias: -0.35 });
      out.lines.push({ pts: [lerp3(pts[0]!, pts[3]!, 0.5), lerp3(pts[1]!, pts[2]!, 0.5)], stroke: C.pvLine, opacity: 0.2, bias: -0.35 });
    }
  }
}

/** Mehrfamilienhaus: drei Etagen, Balkone, an einigen davon Balkonkraftwerke */
function apartment(out: Out, x0: number, x1: number, z0: number, z1: number, floors: number, pvPattern: boolean[]) {
  const fh = 3;
  const h = floors * fh + 0.6;
  out.faces.push(...box(v3(x0, 0, z0), v3(x1, h, z1), { fill: C.wall, fills: { left: C.wallSide, right: C.wallSide, top: C.roofDark }, stroke: C.line, strokeOpacity: LINE_OP, skip: ["bottom"] }));
  // Attika
  out.lines.push({ pts: [v3(x0, h - 0.5, z0 - 0.01), v3(x1, h - 0.5, z0 - 0.01)], stroke: C.line, opacity: 0.14 });
  const bays = 3;
  const bw = (x1 - x0) / bays;
  let k = 0;
  for (let f = 0; f < floors; f++) {
    const y = f * fh;
    for (let b = 0; b < bays; b++) {
      const bx0 = x0 + b * bw;
      // Fensterband
      windowFront(out, bx0 + 0.6, bx0 + bw * 0.42, y + 0.95, y + 2.35, z0 - 0.02);
      windowFront(out, bx0 + bw * 0.5, bx0 + bw - 0.6, y + 0.3, y + 2.35, z0 - 0.02);
      if (f > 0) balcony(out, bx0 + bw * 0.46, bx0 + bw - 0.3, y, z0, 1.5, pvPattern[k++ % pvPattern.length]!);
    }
  }
  // Eingang
  const ex = (x0 + x1) / 2;
  out.faces.push(face([v3(ex - 0.8, 0, z0 - 0.03), v3(ex + 0.8, 0, z0 - 0.03), v3(ex + 0.8, 2.4, z0 - 0.03), v3(ex - 0.8, 2.4, z0 - 0.03)], C.roofDark, [0, 0, -1], { bias: -0.08 }));
}

/** Moderner Flachbau mit zurückgesetztem Obergeschoss und Balkonkraftwerk an der Terrasse */
function modernHouse(out: Out, x0: number, x1: number, z0: number, z1: number) {
  out.faces.push(...box(v3(x0, 0, z0), v3(x1, 3.2, z1), { fill: C.wall, fills: { left: C.wallSide, right: C.wallSide, top: C.roofDark }, stroke: C.line, strokeOpacity: LINE_OP, skip: ["bottom"] }));
  const ux0 = x0 + 2.4, ux1 = x1 - 0.2, uz0 = z0 + 1.4;
  out.faces.push(...box(v3(ux0, 3.2, uz0), v3(ux1, 6.4, z1), { fill: C.wallLight, fills: { left: C.wallSide, right: C.wallSide, top: C.roofDark }, stroke: C.line, strokeOpacity: LINE_OP, skip: ["bottom"] }));
  // große Glasflächen
  windowFront(out, x0 + 0.8, x0 + (x1 - x0) * 0.55, 0.25, 2.75, z0 - 0.02);
  windowFront(out, x0 + (x1 - x0) * 0.62, x1 - 0.8, 0.9, 2.75, z0 - 0.02);
  windowFront(out, ux0 + 0.7, ux0 + (ux1 - ux0) * 0.6, 3.5, 5.9, uz0 - 0.02);
  windowFront(out, ux0 + (ux1 - ux0) * 0.68, ux1 - 0.7, 4.2, 5.9, uz0 - 0.02);
  // Terrassengeländer mit zwei Modulen
  balcony(out, x0 + 0.3, ux0 + 3.6, 3.2, uz0, 1.25, true);
  // Holzlamellen-Akzent
  for (let x = x1 - 0.15; x > x1 - 2.2; x -= 0.28) out.lines.push({ pts: [v3(x, 0.25, z0 - 0.04), v3(x, 2.9, z0 - 0.04)], stroke: "#C9915F", opacity: 0.18, bias: -0.1 });
}

/** Baum als Scheibe zur Kamera hin (Billboard) mit Stamm */
function tree(out: Out, x: number, z: number, h: number, r: number, cam: Camera) {
  const center = v3(x, h - r * 0.9, z);
  const f = norm(sub(cam.target, cam.pos));
  const right = norm(cross([0, 1, 0], f));
  const up: V3 = [0, 1, 0];
  const seg = 18;
  const pts: V3[] = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    // leicht unregelmäßig, oben etwas schmaler
    const rr = r * (1 + 0.06 * Math.sin(a * 3 + x) + 0.04 * Math.cos(a * 5 + z));
    pts.push(add(center, add(scale(right, Math.cos(a) * rr * 0.92), scale(up, Math.sin(a) * rr))));
  }
  const trunkW = Math.max(0.18, r * 0.07);
  out.faces.push(
    face([sub(v3(x, 0, z), scale(right, trunkW)), add(v3(x, 0, z), scale(right, trunkW)), add(center, scale(right, trunkW)), sub(center, scale(right, trunkW))], C.tree, null, {
      strokeOpacity: 0.12,
      bias: 0.05,
    }),
  );
  out.faces.push(face(pts, C.tree, null, { stroke: C.treeLine, strokeOpacity: 0.26, bias: -0.02 }));
  // Astwerk andeuten
  out.lines.push({ pts: [add(center, scale(up, -r * 0.55)), add(center, add(scale(right, -r * 0.35), scale(up, r * 0.15)))], stroke: C.treeLine, opacity: 0.1, bias: -0.05 });
  out.lines.push({ pts: [add(center, scale(up, -r * 0.3)), add(center, add(scale(right, r * 0.4), scale(up, r * 0.3)))], stroke: C.treeLine, opacity: 0.1, bias: -0.05 });
}

/** Ganze Siedlung für eine Kamera aufbauen */
export function buildSiedlung(variant: SiedlungVariant) {
  winCounter = 0;
  pvCounter = 0;
  const cam = siedlungCamera(variant);
  const out: Out = { faces: [], lines: [] };

  // Hintere Reihe (Tiefe), schlichter
  out.faces.push(...box(v3(-34, 0, 30), v3(-18, 13, 42), { fill: C.wallSide, fills: { top: C.roofDark }, stroke: C.line, strokeOpacity: 0.12, skip: ["bottom"] }));
  out.faces.push(...box(v3(10, 0, 32), v3(26, 11.5, 44), { fill: C.wallSide, fills: { top: C.roofDark }, stroke: C.line, strokeOpacity: 0.12, skip: ["bottom"] }));
  out.faces.push(...box(v3(34, 0, 28), v3(46, 9.5, 40), { fill: C.wallSide, fills: { top: C.roofDark }, stroke: C.line, strokeOpacity: 0.12, skip: ["bottom"] }));
  for (const [x, z, h, r] of [
    [-12, 24, 11, 3.6],
    [-4, 28, 12.5, 4.2],
    [5, 22, 9.5, 3.2],
    [29, 24, 10.5, 3.5],
    [-40, 22, 10, 3.6],
  ] as const)
    tree(out, x, z, h, r, cam);

  // Vordere Reihe
  gableHouseX(out, -31, -20.5, 0, 9, 5.6, 9.1, { cols: 6, rows: 2 }, 3);
  apartment(out, -17, -0.5, 1.5, 13, 3, [true, false, true, false, false, true]);
  modernHouse(out, 3, 15.5, 0, 10);
  gableHouseZ(out, 19, 27.5, 0.5, 12, 5.8, 9.0, { cols: 4, rows: 3 });
  gableHouseX(out, 31, 41, 1, 9.5, 5.4, 8.6, { cols: 5, rows: 2 }, 3);

  // Bäume zwischen den Häusern und als Rahmen im Vordergrund
  tree(out, -19, 6, 7.5, 2.3, cam);
  tree(out, 17.2, -1.5, 6.8, 2.0, cam);
  tree(out, 29.2, 4, 7.2, 2.2, cam);


  // Straße: Bordsteine und Mittelmarkierung
  const sx0 = -90, sx1 = 90;
  out.lines.push({ pts: [v3(sx0, 0.01, -3.5), v3(sx1, 0.01, -3.5)], stroke: C.line, opacity: 0.34, segment: 4 });
  out.lines.push({ pts: [v3(sx0, 0.01, -13), v3(sx1, 0.01, -13)], stroke: C.line, opacity: 0.3, segment: 4 });
  for (let x = sx0; x < sx1; x += 6) out.lines.push({ pts: [v3(x, 0.01, -8.25), v3(x + 3, 0.01, -8.25)], stroke: "#FFD84D", opacity: 0.22 });

  const ground = groundGrid(-110, 110, -75, 70, 3, { stroke: C.line, opacity: 0.16, fade: [18, 150], segment: 6 }, [
    [-31.5, -20, 0, 9.5],
    [-17.5, 0, 1.5, 13.5],
    [2.5, 16, 0, 10.5],
    [18.5, 28, 0.5, 12.5],
    [30.5, 41.5, 1, 10],
    [-34, -18, 30, 42],
    [10, 26, 32, 44],
    [34, 46, 28, 40],
  ]);

  return { cam, faces: out.faces, lines: out.lines, ground };
}

// ---------- SVG-Ausgabe ----------

/** Hügelkette am Horizont (2D), deterministisch */
function hills(w: number, horizon: number, amp: number, seed: number, step = 24) {
  let d = `M-40 ${round(horizon + 2)}`;
  for (let x = -40; x <= w + 40; x += step) {
    const y = horizon - amp * (0.55 + 0.25 * Math.sin(x / 210 + seed) + 0.14 * Math.sin(x / 83 + seed * 2.1) + 0.06 * Math.sin(x / 37 + seed * 3.7));
    d += `L${round(x, 1)} ${round(y, 1)}`;
  }
  return d + `L${w + 40} ${round(horizon + 2)}Z`;
}

export function siedlungSvg(variant: SiedlungVariant, layer: SiedlungLayer): string {
  const { w, h } = SIEDLUNG_VIEW[variant];
  const scene = buildSiedlung(variant);
  const cam = scene.cam;
  const far = projectPoint(cam, [cam.pos[0], 0, cam.pos[2] + 4000]);
  const horizon = far ? far.y : h * 0.6;
  const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">`;

  const items = project({ faces: scene.faces, lines: scene.lines }, cam);

  if (layer === "base") {
    // Ganze Linien; die Tiefenwirkung übernimmt eine Maske zum Horizont hin (kleinere Datei)
    const groundItems = mergeLines(quantize(project({ faces: [], lines: scene.ground.map((l) => ({ ...l, fade: undefined, segment: undefined })) }, cam)));
    const merged = mergeLines(items);
    let s = head;
    s += `<defs><linearGradient id="g" x1="0" y1="${round(horizon)}" x2="0" y2="${h}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#11161C"/><stop offset="0.06" stop-color="${C.ground}"/><stop offset="1" stop-color="#05070A"/></linearGradient>`;
    s += `<linearGradient id="hz" x1="0" y1="${round(horizon - 70)}" x2="0" y2="${round(horizon + 8)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2A3644" stop-opacity="0"/><stop offset="1" stop-color="#2A3644" stop-opacity="0.55"/></linearGradient></defs>`;
    // Hügel: hinten heller (Luftperspektive), vorne dunkler
    s += `<path d="${hills(w, horizon, variant === "d" ? 58 : 70, 1.3)}" fill="url(#hz)"/>`;
    s += `<path d="${hills(w, horizon, variant === "d" ? 34 : 44, 4.1, 18)}" fill="#0F151C"/>`;
    s += `<path d="${hills(w, horizon, variant === "d" ? 16 : 22, 7.7, 14)}" fill="#0B1015"/>`;
    s += `<rect x="-40" y="${round(horizon)}" width="${w + 80}" height="${round(h - horizon + 40)}" fill="url(#g)"/>`;
    s += `<defs><linearGradient id="gf" gradientUnits="userSpaceOnUse" x1="0" y1="${round(horizon)}" x2="0" y2="${h}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.1" stop-color="#fff" stop-opacity="0.3"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.75"/><stop offset="1" stop-color="#fff"/></linearGradient><mask id="gm" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="url(#gf)"/></mask></defs>`;
    s += `<g fill="none" stroke-linecap="round" mask="url(#gm)">${itemsToSvg(groundItems)}</g>`;
    s += `<g stroke-linejoin="round" stroke-linecap="round" fill="none">${itemsToSvg(merged)}</g>`;
    return s + "</svg>";
  }

  // Masken-Ebenen: alle Flächen in Malreihenfolge, Zielflächen weiß, alles andere schwarz.
  // So bleiben verdeckte Teile verdeckt.
  const isTarget = (tag: string | undefined) => {
    if (!tag) return false;
    if (layer === "pv") return tag.startsWith("pv-");
    // nicht jedes Fenster ist erleuchtet: deterministisch etwa zwei Drittel
    if (!tag.startsWith("win-")) return false;
    const n = Number(tag.slice(4));
    return (n * 7 + 3) % 10 < 7;
  };
  const faceItems = items.filter((it) => it.kind === "face");
  const level = (tag: string) => {
    if (layer === "pv") return "#fff";
    const n = Number(tag.slice(4));
    return ["#fff", "#d6d6d6", "#b0b0b0", "#ececec", "#9c9c9c"][(n * 3) % 5]!;
  };
  let mask = "";
  for (const it of faceItems) {
    if (it.kind !== "face") continue;
    const t = it.face.tag;
    mask += `<path${attrs({ d: it.d, fill: t && isTarget(t) ? level(t) : "#000" })}/>`;
  }
  let s = head + "<defs>";
  if (layer === "pv") {
    // Himmelsspiegelung: oben kühl und hell, unten Sonnenlicht
    s += `<linearGradient id="r" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#E9F3FB"/><stop offset="0.45" stop-color="#8DB2D3"/><stop offset="0.8" stop-color="#4F6F92"/><stop offset="1" stop-color="#FFC36B"/></linearGradient>`;
  } else {
    s += `<linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE2B0"/><stop offset="0.5" stop-color="#F7B46A"/><stop offset="1" stop-color="#E07F3E"/></linearGradient>`;
  }
  s += `<mask id="k" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000"/>${mask}</mask></defs>`;
  s += `<rect width="${w}" height="${h}" fill="url(#r)" mask="url(#k)"/>`;
  return s + "</svg>";
}

/** Bildpunkt einer Weltkoordinate (für Platzierung von Beschriftungen) */
export function siedlungPoint(variant: SiedlungVariant, p: V3) {
  return projectPoint(siedlungCamera(variant), p);
}
