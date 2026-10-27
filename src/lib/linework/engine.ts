/**
 * Linienwerk – kleine Perspektiv-Engine für die Sonnenwerk-Bildsprache.
 *
 * Szenen bestehen aus Flächen (Polygonen) und Linien im 3D-Raum.
 * Die Engine projiziert sie mit einer Lochkamera auf 2D, entfernt
 * Rückseiten und sortiert Flächen und Linienstücke gemeinsam nach Tiefe
 * (Maleralgorithmus). Ausgabe als SVG-Pfade oder direkt auf ein Canvas.
 *
 * Koordinaten: x rechts, y oben, z in die Tiefe. Einheiten: Meter.
 */
export type V3 = readonly [number, number, number];

export const v3 = (x: number, y: number, z: number): V3 => [x, y, z];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export interface Camera {
  pos: V3;
  target: V3;
  /** vertikales Sichtfeld in Grad */
  fov: number;
  width: number;
  height: number;
  /** Verschiebung des Bildmittelpunkts in px (Komposition ohne Kippen der Kamera) */
  shiftX?: number;
  shiftY?: number;
}

export interface Face {
  pts: V3[];
  /** Außennormale; ohne Normale wird die Fläche nie verworfen (zweiseitig) */
  normal?: V3;
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  /** Verschiebt die Sortiertiefe in Metern (negativ = weiter vorne zeichnen) */
  bias?: number;
  tag?: string;
}

export interface Line {
  pts: V3[];
  stroke: string;
  opacity?: number;
  width?: number;
  /** Deckkraft nimmt mit der Entfernung ab: [voll bis, unsichtbar ab] in Metern */
  fade?: [number, number];
  /** Linie in Stücke dieser Länge teilen (bessere Tiefensortierung) */
  segment?: number;
  bias?: number;
  tag?: string;
}

export interface Scene {
  faces: Face[];
  lines: Line[];
}

export type DrawItem =
  | { kind: "face"; d: string; depth: number; face: Face }
  | { kind: "line"; d: string; depth: number; opacity: number; line: Line };

const NEAR = 0.3;

interface Basis {
  pos: V3;
  r: V3;
  u: V3;
  f: V3;
  focal: number;
  cx: number;
  cy: number;
}

function basis(cam: Camera): Basis {
  const f = norm(sub(cam.target, cam.pos));
  // Rechtssystem mit y oben: rechts = oben × vorne, oben = vorne × rechts
  const r = norm(cross([0, 1, 0], f));
  const u = cross(f, r);
  const focal = cam.height / 2 / Math.tan((cam.fov * Math.PI) / 180 / 2);
  return { pos: cam.pos, r, u, f, focal, cx: cam.width / 2 + (cam.shiftX ?? 0), cy: cam.height / 2 + (cam.shiftY ?? 0) };
}

function toCam(b: Basis, p: V3): V3 {
  const d = sub(p, b.pos);
  return [dot(d, b.r), dot(d, b.u), dot(d, b.f)];
}

function toScreen(b: Basis, c: V3): [number, number] {
  return [b.cx + (c[0] / c[2]) * b.focal, b.cy - (c[1] / c[2]) * b.focal];
}

/** Projiziert einen Punkt (z. B. für Hotspots); null, wenn hinter der Kamera */
export function projectPoint(cam: Camera, p: V3): { x: number; y: number; depth: number } | null {
  const b = basis(cam);
  const c = toCam(b, p);
  if (c[2] < NEAR) return null;
  const [x, y] = toScreen(b, c);
  return { x, y, depth: c[2] };
}

function clipNear(poly: V3[]): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const ain = a[2] >= NEAR;
    const bin = b[2] >= NEAR;
    if (ain) out.push(a);
    if (ain !== bin) out.push(lerp3(a, b, (NEAR - a[2]) / (b[2] - a[2])));
  }
  return out;
}

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

/** Erzeugt die tiefensortierte Zeichenliste. */
export function project(scene: Scene, cam: Camera): DrawItem[] {
  const b = basis(cam);
  const items: DrawItem[] = [];

  for (const face of scene.faces) {
    if (face.normal) {
      let cx = 0, cy = 0, cz = 0;
      for (const p of face.pts) { cx += p[0]; cy += p[1]; cz += p[2]; }
      const n = face.pts.length;
      if (dot(face.normal, sub(cam.pos, [cx / n, cy / n, cz / n])) <= 0) continue;
    }
    const camPts = clipNear(face.pts.map((p) => toCam(b, p)));
    if (camPts.length < 3) continue;
    let depth = 0;
    let d = "M";
    camPts.forEach((c, i) => {
      depth += c[2];
      const [x, y] = toScreen(b, c);
      d += (i ? "L" : "") + fmt(x) + " " + fmt(y);
    });
    items.push({ kind: "face", d: d + "Z", depth: depth / camPts.length + (face.bias ?? 0), face });
  }

  for (const line of scene.lines) {
    for (let i = 0; i < line.pts.length - 1; i++) {
      const p0 = line.pts[i]!;
      const p1 = line.pts[i + 1]!;
      const pieces = line.segment ? Math.max(1, Math.ceil(len(sub(p1, p0)) / line.segment)) : 1;
      for (let k = 0; k < pieces; k++) {
        let a = toCam(b, lerp3(p0, p1, k / pieces));
        let c = toCam(b, lerp3(p0, p1, (k + 1) / pieces));
        if (a[2] < NEAR && c[2] < NEAR) continue;
        if (a[2] < NEAR) a = lerp3(a, c, (NEAR - a[2]) / (c[2] - a[2]));
        if (c[2] < NEAR) c = lerp3(c, a, (NEAR - c[2]) / (a[2] - c[2]));
        const depth = (a[2] + c[2]) / 2;
        let opacity = line.opacity ?? 1;
        if (line.fade) {
          const [d0, d1] = line.fade;
          opacity *= Math.max(0, Math.min(1, 1 - (depth - d0) / (d1 - d0)));
          if (opacity < 0.015) continue;
        }
        const [x1, y1] = toScreen(b, a);
        const [x2, y2] = toScreen(b, c);
        items.push({ kind: "line", d: `M${fmt(x1)} ${fmt(y1)}L${fmt(x2)} ${fmt(y2)}`, depth: depth + (line.bias ?? 0), opacity, line });
      }
    }
  }

  items.sort((x, y) => y.depth - x.depth);
  return items;
}

/** Projiziert eine Polylinie als zusammenhängenden SVG-Pfad (für animierte Linien) */
export function projectPath(cam: Camera, pts: V3[]): string {
  const b = basis(cam);
  const out: string[] = [];
  for (const p of pts) {
    const c = toCam(b, p);
    if (c[2] < NEAR) continue;
    const [x, y] = toScreen(b, c);
    out.push(`${fmt(x)} ${fmt(y)}`);
  }
  return out.length ? "M" + out.join("L") : "";
}

// ---------- Bausteine ----------

type Side = "top" | "bottom" | "front" | "back" | "left" | "right";

export interface BoxStyle {
  fill: string;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  skip?: Side[];
  fills?: Partial<Record<Side, string>>;
  tag?: string;
  bias?: number;
}

/** Quader zwischen min und max. front = Seite zur Kamera hin (kleines z). */
export function box(min: V3, max: V3, style: BoxStyle): Face[] {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const a = v3(x0, y0, z0), b = v3(x1, y0, z0), c = v3(x1, y1, z0), d = v3(x0, y1, z0);
  const e = v3(x0, y0, z1), f = v3(x1, y0, z1), g = v3(x1, y1, z1), h = v3(x0, y1, z1);
  const sides: [Side, V3[], V3][] = [
    ["front", [a, b, c, d], [0, 0, -1]],
    ["back", [f, e, h, g], [0, 0, 1]],
    ["left", [e, a, d, h], [-1, 0, 0]],
    ["right", [b, f, g, c], [1, 0, 0]],
    ["top", [d, c, g, h], [0, 1, 0]],
    ["bottom", [e, f, b, a], [0, -1, 0]],
  ];
  return sides
    .filter(([name]) => !style.skip?.includes(name))
    .map(([name, pts, normal]) => ({
      pts,
      normal,
      fill: style.fills?.[name] ?? style.fill,
      stroke: style.stroke,
      strokeOpacity: style.strokeOpacity,
      strokeWidth: style.strokeWidth,
      bias: style.bias,
      tag: style.tag ? `${style.tag}-${name}` : name,
    }));
}

/** Gitterlinien innerhalb eines Vierecks a-b-c-d (a→b Spalten, a→d Zeilen) */
export function quadGrid(a: V3, b: V3, c: V3, d: V3, cols: number, rows: number, style: Omit<Line, "pts">): Line[] {
  const out: Line[] = [];
  for (let i = 1; i < cols; i++) out.push({ ...style, pts: [lerp3(a, b, i / cols), lerp3(d, c, i / cols)] });
  for (let j = 1; j < rows; j++) out.push({ ...style, pts: [lerp3(a, d, j / rows), lerp3(b, c, j / rows)] });
  return out;
}

/** Bodenraster in der Ebene y = 0; Rechtecke in `exclude` bleiben frei (z. B. unter Gebäuden). */
export function groundGrid(
  xMin: number,
  xMax: number,
  zMin: number,
  zMax: number,
  step: number,
  style: Omit<Line, "pts">,
  exclude: [number, number, number, number][] = [],
): Line[] {
  const out: Line[] = [];
  const cut = (from: number, to: number, fixed: number, axis: "x" | "z") => {
    // Intervalle entlang der Linie, die von Ausschlussflächen verdeckt sind
    let segs: [number, number][] = [[from, to]];
    for (const [ex0, ex1, ez0, ez1] of exclude) {
      const inFixed = axis === "x" ? fixed >= ex0 && fixed <= ex1 : fixed >= ez0 && fixed <= ez1;
      if (!inFixed) continue;
      const [c0, c1] = axis === "x" ? [ez0, ez1] : [ex0, ex1];
      segs = segs.flatMap(([s0, s1]) => {
        if (c1 <= s0 || c0 >= s1) return [[s0, s1]] as [number, number][];
        const parts: [number, number][] = [];
        if (c0 > s0) parts.push([s0, c0]);
        if (c1 < s1) parts.push([c1, s1]);
        return parts;
      });
    }
    return segs;
  };
  for (let x = Math.ceil(xMin / step) * step; x <= xMax + 1e-9; x += step)
    for (const [s0, s1] of cut(zMin, zMax, x, "x")) out.push({ ...style, pts: [v3(x, 0, s0), v3(x, 0, s1)] });
  for (let z = Math.ceil(zMin / step) * step; z <= zMax + 1e-9; z += step)
    for (const [s0, s1] of cut(xMin, xMax, z, "z")) out.push({ ...style, pts: [v3(s0, 0, z), v3(s1, 0, z)] });
  return out;
}

// ---------- Canvas-Renderer (für bewegte Kameras) ----------

export function drawToCanvas(ctx: CanvasRenderingContext2D, scene: Scene, cam: Camera, dpr = 1) {
  const items = project(scene, cam);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const it of items) {
    const p = new Path2D(it.d);
    if (it.kind === "line") {
      ctx.globalAlpha = it.opacity;
      ctx.strokeStyle = it.line.stroke;
      ctx.lineWidth = it.line.width ?? 1;
      ctx.stroke(p);
    } else {
      ctx.globalAlpha = it.face.fillOpacity ?? 1;
      ctx.fillStyle = it.face.fill;
      ctx.fill(p);
      if (it.face.stroke) {
        ctx.globalAlpha = it.face.strokeOpacity ?? 1;
        ctx.strokeStyle = it.face.stroke;
        ctx.lineWidth = it.face.strokeWidth ?? 1;
        ctx.stroke(p);
      }
    }
  }
  ctx.restore();
}
