import { project, projectPath, projectPoint, type Camera, type V3 } from "@/lib/linework/engine";
import { attrs, itemsToSvg, mergeLines, quantize } from "@/lib/linework/svg";
import { buildHouseScene } from "./houseScene";

/**
 * Hero im Linienwerk-Stil: gemeinsame Kamera und die schweren, unbewegten Ebenen
 * (Boden, Haus, erleuchtete Fenster) als eigene SVG-Dateien unter /art/.
 * So bleiben HTML und React-Daten der Startseite schlank; Himmel, Sonne und
 * Energielinie werden inline gezeichnet (klein, animiert).
 */
export type HeroVariant = "desktop" | "mobile";
export type HeroLayer = "ground" | "house" | "win";

export const HERO_VIEW = {
  desktop: { w: 1600, h: 1000 },
  mobile: { w: 900, h: 1100 },
} as const;

/** desktop mittig beschnitten, mobil unten verankert */
export const HERO_ASPECT = { desktop: "xMidYMid slice", mobile: "xMidYMax slice" } as const;

/**
 * Architektur-Kamera: waagerecht (senkrechte Kanten bleiben senkrecht),
 * Bildausschnitt über Shift wie bei einem Shift-Objektiv.
 */
const SHOTS = {
  desktop: { pos: [-25, 11, -40] as V3, look: [6, 4.5] as const, fov: 30, shiftX: 455, shiftY: -95, sun: { yaw: 4.6, pitch: 6.2 } },
  mobile: { pos: [-17, 9.5, -31] as V3, look: [5.4, 4.6] as const, fov: 36, shiftX: 10, shiftY: -40, sun: { yaw: 5, pitch: 7.5 } },
};

export function heroCamera(variant: HeroVariant): Camera {
  const { w, h } = HERO_VIEW[variant];
  const s = SHOTS[variant];
  return { pos: s.pos, target: [s.look[0], s.pos[1], s.look[1]], fov: s.fov, width: w, height: h, shiftX: s.shiftX, shiftY: s.shiftY };
}

/** Sonne relativ zur Blickrichtung (Gierwinkel nach rechts, Höhe über Horizont) */
export function heroSun(variant: HeroVariant): V3 {
  const s = SHOTS[variant];
  const fx = s.look[0] - s.pos[0];
  const fz = s.look[1] - s.pos[2];
  const base = Math.atan2(fx, fz);
  const yaw = base + (s.sun.yaw * Math.PI) / 180;
  const pitch = (s.sun.pitch * Math.PI) / 180;
  const dist = 900;
  return [s.pos[0] + Math.sin(yaw) * dist, s.pos[1] + Math.tan(pitch) * dist, s.pos[2] + Math.cos(yaw) * dist];
}

/** Bildraum-Werte für die Inline-Ebenen */
export function heroLayout(variant: HeroVariant) {
  const cam = heroCamera(variant);
  const { w, h } = HERO_VIEW[variant];
  const scene = buildHouseScene(heroSun(variant));
  const far = projectPoint(cam, [cam.pos[0] + (cam.target[0] - cam.pos[0]) * 400, 0, cam.pos[2] + (cam.target[2] - cam.pos[2]) * 400]);
  const horizon = far ? far.y : h * 0.45;
  const sunPt = projectPoint(cam, scene.sun) ?? { x: w * 0.82, y: horizon - 60 };
  return { w, h, horizon, sun: { x: sunPt.x, y: sunPt.y }, energy: projectPath(cam, scene.energyPath) };
}

/** Materialien im Bildraum: Licht kommt von der Sonne rechts */
function materials(w: number, h: number) {
  return `<linearGradient id="lw-facade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="0"><stop offset="0" stop-color="#0B1117"/><stop offset="0.6" stop-color="#111820"/><stop offset="1" stop-color="#2A221E"/></linearGradient>
<linearGradient id="lw-facade-side" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="0"><stop offset="0" stop-color="#080C10"/><stop offset="1" stop-color="#141A20"/></linearGradient>
<linearGradient id="lw-top" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="0"><stop offset="0" stop-color="#141C24"/><stop offset="1" stop-color="#3A2C24"/></linearGradient>
<linearGradient id="lw-pv" gradientUnits="userSpaceOnUse" x1="${w * 0.2}" y1="0" x2="${w}" y2="${h * 0.6}"><stop offset="0" stop-color="#111C2E"/><stop offset="0.55" stop-color="#1C2B45"/><stop offset="0.85" stop-color="#4A3747"/><stop offset="1" stop-color="#B86A3F"/></linearGradient>
<linearGradient id="lw-wood" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="0"><stop offset="0" stop-color="#2A1E16"/><stop offset="1" stop-color="#5A3C28"/></linearGradient>`;
}

/** Eine Ebene als vollständige SVG-Datei */
export function heroLayerSvg(variant: HeroVariant, layer: HeroLayer): string {
  const cam = heroCamera(variant);
  const { w, h } = HERO_VIEW[variant];
  const scene = buildHouseScene(heroSun(variant));
  const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="${HERO_ASPECT[variant]}">`;

  if (layer === "ground") {
    // Ganze Linien statt vieler Teilstücke; die Tiefenwirkung übernimmt eine Maske,
    // die zum Horizont hin ausblendet. Das hält die Datei klein.
    const lines = scene.ground.map((l) => ({ ...l, fade: undefined, segment: undefined }));
    const items = mergeLines(quantize(project({ faces: [], lines }, cam)));
    const far = projectPoint(cam, [cam.pos[0] + (cam.target[0] - cam.pos[0]) * 400, 0, cam.pos[2] + (cam.target[2] - cam.pos[2]) * 400]);
    const hz = far ? far.y : h * 0.45;
    return `${head}<defs><linearGradient id="f" gradientUnits="userSpaceOnUse" x1="0" y1="${Math.round(hz)}" x2="0" y2="${h}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.12" stop-color="#fff" stop-opacity="0.25"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.7"/><stop offset="1" stop-color="#fff"/></linearGradient><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="url(#f)"/></mask></defs><g fill="none" stroke-linecap="round" mask="url(#m)">${itemsToSvg(items)}</g></svg>`;
  }

  const items = project({ faces: scene.faces, lines: scene.lines }, cam);
  const windowTags = new Map(scene.windows.map((x) => [x.face.tag, x.index]));

  if (layer === "house") {
    const merged = mergeLines(items);
    let body = "";
    for (const it of merged) {
      if (it.kind === "line") {
        body += itemsToSvg([it]);
        continue;
      }
      const f = it.face;
      if (f.tag && windowTags.has(f.tag)) {
        // Fenster: dunkles Glas mit Kontur; das Licht kommt aus der Ebene „win“
        body += `<path${attrs({ d: it.d, fill: "#121A23" })}/><path${attrs({ d: it.d, fill: "none", stroke: f.stroke, "stroke-opacity": f.strokeOpacity })}/>`;
        continue;
      }
      body += `<path${attrs({
        d: it.d,
        fill: f.fill,
        "fill-opacity": f.fillOpacity,
        stroke: f.stroke,
        "stroke-opacity": f.strokeOpacity,
        "stroke-width": f.strokeWidth && f.strokeWidth !== 1 ? f.strokeWidth : undefined,
      })}/>`;
    }
    return `${head}<defs>${materials(w, h)}</defs><g stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
  }

  // Erleuchtete Fenster: alle Flächen in Malreihenfolge als Maske (Fenster weiß, Rest schwarz),
  // darüber die Fenster mit eigenem Glasverlauf. Sie gehen nacheinander an.
  // Für die Maske zählen nur Flächen, die nach einem Fenster gemalt werden und es überlappen
  // (Verdeckung). Das hält die Maske klein und das Bild schnell gezeichnet.
  const faces = items.filter((it) => it.kind === "face");
  const bbox = (d: string) => {
    const n = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i + 1 < n.length; i += 2) {
      x0 = Math.min(x0, n[i]!); x1 = Math.max(x1, n[i]!);
      y0 = Math.min(y0, n[i + 1]!); y1 = Math.max(y1, n[i + 1]!);
    }
    return { x0, y0, x1, y1 };
  };
  const overlap = (a: ReturnType<typeof bbox>, b: ReturnType<typeof bbox>) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const winBoxes: { i: number; box: ReturnType<typeof bbox> }[] = [];
  let mask = "";
  let glass = "";
  faces.forEach((it, i) => {
    if (it.kind !== "face") return;
    const idx = it.face.tag ? windowTags.get(it.face.tag) : undefined;
    const box = bbox(it.d);
    if (idx !== undefined) {
      winBoxes.push({ i, box });
      mask += `<path${attrs({ d: it.d, fill: "#fff" })}/>`;
      glass += `<path class="w" style="--i:${idx}"${attrs({ d: it.d, fill: "url(#g)", "fill-opacity": 0.92 })}/>`;
    } else if (winBoxes.some((w) => w.i < i && overlap(w.box, box))) {
      mask += `<path${attrs({ d: it.d, fill: "#000" })}/>`;
    }
  });
  const style = `<style>.w{animation:a .9s steps(1,end) both,b 1.4s ease-out both;animation-delay:calc(1.25s + var(--i)*.22s)}@keyframes a{0%{opacity:0}30%{opacity:.5}45%{opacity:.1}60%,100%{opacity:1}}@keyframes b{from{filter:brightness(.6)}to{filter:none}}@media (prefers-reduced-motion:reduce){.w{animation:none}}</style>`;
  return `${head}${style}<defs><linearGradient id="g" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#2B3646"/><stop offset="0.32" stop-color="#5C4A45"/><stop offset="0.68" stop-color="#D88A4E"/><stop offset="1" stop-color="#F6B36B"/></linearGradient><mask id="k" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000"/>${mask}</mask></defs><g mask="url(#k)">${glass}</g></svg>`;
}
