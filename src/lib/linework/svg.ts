import type { DrawItem } from "./engine";

/**
 * Hilfen, um Linienwerk-Zeichenlisten kompakt als SVG auszugeben.
 * Für große, unbewegte Ebenen als eigene Datei (siehe src/app/art), damit sie
 * nicht doppelt im HTML und in den React-Daten der Seite landen.
 */

export type MergedItem = DrawItem;

/**
 * Fasst aufeinanderfolgende Linien gleichen Stils zu einem Pfad zusammen.
 * Schließt ein Stück direkt an das vorige an, entfällt das erneute „M“.
 */
export function mergeLines(items: DrawItem[]): DrawItem[] {
  const out: DrawItem[] = [];
  let lastEnd = "";
  for (const it of items) {
    const prev = out[out.length - 1];
    if (
      it.kind === "line" &&
      prev?.kind === "line" &&
      prev.line.stroke === it.line.stroke &&
      Math.abs(prev.opacity - it.opacity) < 0.025 &&
      (prev.line.width ?? 1) === (it.line.width ?? 1)
    ) {
      // "M x y L x y" – Anfang des neuen Stücks
      const m = /^M([^L]+)L(.+)$/.exec(it.d);
      if (m && m[1] === lastEnd) {
        out[out.length - 1] = { ...prev, d: `${prev.d}L${m[2]}` };
      } else {
        out[out.length - 1] = { ...prev, d: prev.d + it.d };
      }
      lastEnd = m ? m[2]! : "";
      continue;
    }
    out.push(it);
    if (it.kind === "line") {
      const m = /L([^L]+)$/.exec(it.d);
      lastEnd = m ? m[1]! : "";
    } else lastEnd = "";
  }
  return out;
}

/** Deckkraft in Stufen runden, damit mehr Linien zu einem Pfad zusammenfallen (kleinere Dateien) */
export function quantize(items: DrawItem[], step = 0.04): DrawItem[] {
  return items.map((it) => (it.kind === "line" ? { ...it, opacity: Math.max(step, Math.round(it.opacity / step) * step) } : it));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Attribute als Zeichenkette; undefined wird weggelassen */
export function attrs(a: Record<string, string | number | undefined | null>): string {
  let s = "";
  for (const [k, v] of Object.entries(a)) {
    if (v === undefined || v === null || v === "") continue;
    s += ` ${k}="${typeof v === "number" ? round(v) : esc(v)}"`;
  }
  return s;
}

export const round = (n: number, d = 2) => {
  const f = 10 ** d;
  return String(Math.round(n * f) / f);
};

/** Zeichnet Flächen und Linien als SVG-Elemente (Text) */
export function itemsToSvg(
  items: DrawItem[],
  opts: { faceFill?: (it: Extract<DrawItem, { kind: "face" }>) => string | null; lineStroke?: (it: Extract<DrawItem, { kind: "line" }>) => string | null } = {},
): string {
  let s = "";
  for (const it of items) {
    if (it.kind === "line") {
      const stroke = opts.lineStroke ? opts.lineStroke(it) : it.line.stroke;
      if (stroke === null) continue;
      s += `<path${attrs({ d: it.d, stroke, "stroke-opacity": it.opacity < 1 ? it.opacity : undefined, "stroke-width": it.line.width && it.line.width !== 1 ? it.line.width : undefined })}/>`;
    } else {
      const f = it.face;
      const fill = opts.faceFill ? opts.faceFill(it) : f.fill;
      if (fill === null) continue;
      s += `<path${attrs({
        d: it.d,
        fill,
        "fill-opacity": f.fillOpacity,
        stroke: opts.faceFill ? undefined : f.stroke,
        "stroke-opacity": opts.faceFill ? undefined : f.strokeOpacity,
        "stroke-width": opts.faceFill ? undefined : f.strokeWidth && f.strokeWidth !== 1 ? f.strokeWidth : undefined,
      })}/>`;
    }
  }
  return s;
}
