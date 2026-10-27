import { box, groundGrid, lerp3, quadGrid, v3, type Face, type Line, type Scene, type V3 } from "@/lib/linework/engine";

/**
 * Hero-Modell: modernes Einfamilienhaus mit PV-Dach, Balkonkraftwerk am
 * Terrassengeländer und Speicher am Eingang. Maße in Metern.
 *
 * Farben sind Paint-Namen; der Renderer ersetzt sie durch Verläufe im Bildraum
 * (z. B. Himmelsspiegelung in den Modulen), damit die Szene filmisch wirkt.
 */
export const PAINT = {
  facade: "url(#lw-facade)",
  facadeSide: "url(#lw-facade-side)",
  top: "url(#lw-top)",
  soffit: "#0B1016",
  glass: "url(#lw-glass)",
  glassDark: "#141D27",
  pv: "url(#lw-pv)",
  wood: "url(#lw-wood)",
  battery: "#1B2531",
  wall: "#10171E",
} as const;

const EDGE = "#F3F5F1";
const EDGE_SOFT = 0.5;

export interface HouseScene extends Scene {
  /** Bodenlinien (eigene Ebene für Parallaxe) */
  ground: Line[];
  /** Fenster in der Reihenfolge, in der sie aufleuchten */
  windows: { face: Face; index: number }[];
  /** Weg der Energielinie: Sonne → Module → Fassade → Speicher → Haus */
  energyPath: V3[];
  /** Punkt, an dem die Sonne steht (weit entfernt) */
  sun: V3;
  /** Grundriss-Mittelpunkt (für Kamera-Ziele) */
  center: V3;
}

/** Zweiseitige Fläche (ohne Rückseiten-Verwerfung); Verdeckung regelt die Tiefensortierung */
function quad(a: V3, b: V3, c: V3, d: V3, fill: string, extra: Partial<Face> = {}): Face {
  return { pts: [a, b, c, d], fill, stroke: EDGE, strokeOpacity: EDGE_SOFT, ...extra };
}

export function buildHouseScene(sun: V3): HouseScene {
  const faces: Face[] = [];
  const lines: Line[] = [];
  const ground: Line[] = [];
  const windows: { face: Face; index: number }[] = [];
  const edge = { stroke: EDGE, strokeOpacity: EDGE_SOFT };

  // ---------- Baukörper ----------
  // Erdgeschoss
  faces.push(...box(v3(0, 0, 0), v3(14, 3.1, 9), { fill: PAINT.facade, fills: { left: PAINT.facadeSide, top: PAINT.top }, ...edge, skip: ["bottom"], tag: "eg" }));
  // Obergeschoss, links auskragend
  faces.push(
    ...box(v3(-3.5, 3.1, 1.2), v3(9.5, 6.3, 8.2), {
      fill: PAINT.facade,
      fills: { left: PAINT.facadeSide, top: PAINT.top, bottom: PAINT.soffit },
      ...edge,
      tag: "og",
    }),
  );
  // Attika-Linie auf dem Dach
  lines.push({ pts: [v3(-3.3, 6.32, 1.4), v3(9.3, 6.32, 1.4), v3(9.3, 6.32, 8.0), v3(-3.3, 6.32, 8.0), v3(-3.3, 6.32, 1.4)], stroke: EDGE, opacity: 0.22, bias: -0.05 });

  // Holzlamellen rechts am Obergeschoss (Front)
  for (let x = 5.9; x < 9.45; x += 0.28) lines.push({ pts: [v3(x, 3.15, 1.19), v3(x, 6.25, 1.19)], stroke: "#E9B98A", opacity: 0.22, bias: -0.02 });
  faces.push(quad(v3(5.75, 3.1, 1.185), v3(9.5, 3.1, 1.185), v3(9.5, 6.3, 1.185), v3(5.75, 6.3, 1.185), PAINT.wood, { bias: -0.01, strokeOpacity: 0.3 }));
  // Holzlamellen rechts am Erdgeschoss
  faces.push(quad(v3(11.9, 0, -0.005), v3(14, 0, -0.005), v3(14, 3.1, -0.005), v3(11.9, 3.1, -0.005), PAINT.wood, { bias: -0.01, strokeOpacity: 0.3 }));
  for (let x = 12.1; x < 13.95; x += 0.28) lines.push({ pts: [v3(x, 0.05, -0.01), v3(x, 3.05, -0.01)], stroke: "#E9B98A", opacity: 0.2, bias: -0.02 });

  // ---------- Fenster (leuchten nacheinander auf) ----------
  let wi = 0;
  const addWindow = (pts: [V3, V3, V3, V3], mullions: Line[] = []) => {
    const f = quad(...pts, PAINT.glass, { bias: -0.03, strokeOpacity: 0.7, tag: `win-${wi}` });
    faces.push(f);
    windows.push({ face: f, index: wi++ });
    lines.push(...mullions);
  };
  const mull = (a: V3, b: V3) => ({ pts: [a, b], stroke: "#0D131A", opacity: 0.85, width: 1.2, bias: -0.06 }) as Line;
  // Große Verglasung EG
  addWindow([v3(0.8, 0.25, -0.01), v3(8.6, 0.25, -0.01), v3(8.6, 2.85, -0.01), v3(0.8, 2.85, -0.01)], [
    mull(v3(2.75, 0.25, -0.02), v3(2.75, 2.85, -0.02)),
    mull(v3(4.7, 0.25, -0.02), v3(4.7, 2.85, -0.02)),
    mull(v3(6.65, 0.25, -0.02), v3(6.65, 2.85, -0.02)),
  ]);
  // Eingangstür
  addWindow([v3(9.6, 0, -0.01), v3(11.4, 0, -0.01), v3(11.4, 2.6, -0.01), v3(9.6, 2.6, -0.01)], [mull(v3(10.5, 0, -0.02), v3(10.5, 2.6, -0.02))]);
  // Fensterband OG
  addWindow([v3(-2.7, 3.75, 1.19), v3(5.3, 3.75, 1.19), v3(5.3, 5.75, 1.19), v3(-2.7, 5.75, 1.19)], [
    mull(v3(-0.05, 3.75, 1.18), v3(-0.05, 5.75, 1.18)),
    mull(v3(2.6, 3.75, 1.18), v3(2.6, 5.75, 1.18)),
  ]);
  // Eckfenster OG links (läuft um die Ecke)
  addWindow([v3(-3.51, 3.75, 4.6), v3(-3.51, 3.75, 1.9), v3(-3.51, 5.75, 1.9), v3(-3.51, 5.75, 4.6)]);
  // Seitenfenster EG links
  addWindow([v3(-0.01, 0.9, 6.8), v3(-0.01, 0.9, 2.2), v3(-0.01, 2.6, 2.2), v3(-0.01, 2.6, 6.8)], [mull(v3(-0.02, 0.9, 4.5), v3(-0.02, 2.6, 4.5))]);

  // ---------- PV-Reihen auf dem Obergeschoss (nach Süden zur Kamera geneigt) ----------
  const tilt = (15 * Math.PI) / 180;
  const modLen = 1.72;
  const dz = modLen * Math.cos(tilt);
  const dy = modLen * Math.sin(tilt);
  const pvRows = [1.75, 3.95, 6.15];
  const modW = 1.13;
  const gap = 0.03;
  pvRows.forEach((zr, row) => {
    for (let m = 0; m < 10; m++) {
      const x0 = -3.0 + m * (modW + gap);
      const x1 = x0 + modW;
      const y0 = 6.55;
      const a = v3(x0, y0, zr);
      const b = v3(x1, y0, zr);
      const c = v3(x1, y0 + dy, zr + dz);
      const d = v3(x0, y0 + dy, zr + dz);
      faces.push(quad(a, b, c, d, PAINT.pv, { strokeOpacity: 0.55, bias: -0.2, tag: `pv-${row}-${m}` }));
      lines.push(...quadGrid(a, b, c, d, 3, 5, { stroke: "#A9C3DA", opacity: 0.16, bias: -0.25 }));
      // Lichtkante oben
      lines.push({ pts: [d, c], stroke: "#FFC56B", opacity: 0.75, width: 1.1, bias: -0.26 });
      // Aufständerung hinten
      if (m % 2 === 0) lines.push({ pts: [d, v3(x0, 6.3, zr + dz)], stroke: EDGE, opacity: 0.25, bias: -0.15 });
    }
  });

  // ---------- Terrasse auf dem EG mit Glasgeländer und Balkonkraftwerk ----------
  const railY = 3.1;
  const railTop = 4.15;
  lines.push({ pts: [v3(9.6, railTop, 0.1), v3(13.9, railTop, 0.1), v3(13.9, railTop, 8.9)], stroke: EDGE, opacity: 0.6, bias: -0.1 });
  for (const x of [9.6, 11.75, 13.9]) lines.push({ pts: [v3(x, railY, 0.1), v3(x, railTop, 0.1)], stroke: EDGE, opacity: 0.45, bias: -0.1 });
  // Zwei Module am Geländer, leicht nach vorne geneigt
  [[9.75, 11.6], [11.9, 13.75]].forEach(([x0, x1], i) => {
    const a = v3(x0!, 3.2, -0.32);
    const b = v3(x1!, 3.2, -0.32);
    const c = v3(x1!, 4.1, -0.06);
    const d = v3(x0!, 4.1, -0.06);
    faces.push(quad(a, b, c, d, PAINT.pv, { strokeOpacity: 0.75, bias: -0.3, tag: `bkw-${i}` }));
    lines.push(...quadGrid(a, b, c, d, 6, 3, { stroke: "#A9C3DA", opacity: 0.22, bias: -0.35 }));
    lines.push({ pts: [d, c], stroke: "#FFC56B", opacity: 0.85, width: 1.1, bias: -0.36 });
  });

  // ---------- Speicher am Eingang ----------
  faces.push(...box(v3(11.55, 0, -0.75), v3(12.15, 1.05, -0.35), { fill: PAINT.battery, ...edge, strokeOpacity: 0.75, skip: ["bottom"], tag: "akku", bias: -0.1 }));
  lines.push({ pts: [v3(11.68, 0.82, -0.76), v3(12.02, 0.82, -0.76)], stroke: "#B7F34B", opacity: 0.9, width: 1.6, bias: -0.4 });

  // ---------- Gelände ----------
  // Niedrige Gartenmauer links
  faces.push(...box(v3(-13, 0, -3.6), v3(-5.5, 0.65, -3.2), { fill: PAINT.wall, ...edge, strokeOpacity: 0.4, skip: ["bottom"], tag: "mauer" }));
  // Weg zur Tür
  for (const x of [9.7, 11.3]) ground.push({ pts: [v3(x, 0.01, -0.1), v3(x, 0.01, -9)], stroke: EDGE, opacity: 0.3, segment: 1.5, fade: [10, 40] });
  // Bodenraster
  ground.push(
    ...groundGrid(-60, 70, -40, 90, 2, { stroke: EDGE, opacity: 0.16, segment: 2, fade: [14, 85] }, [
      [0, 14, 0, 9],
      [-13, -5.5, -3.6, -3.2],
      [9.7, 11.3, -9, 0],
    ]),
  );

  // ---------- Energielinie ----------
  const roofHit = v3(4.6, 6.75, 4.6);
  const energyPath: V3[] = [
    lerp3(roofHit, sun, 0.05),
    roofHit,
    v3(9.3, 6.4, 4.6),
    v3(9.5, 6.3, 1.25),
    v3(9.5, 3.12, 1.2),
    v3(9.5, 3.12, 0.02),
    v3(9.15, 0.05, 0.02),
    v3(9.15, 0.03, -0.55),
    v3(11.5, 0.03, -0.55),
    v3(11.55, 0.6, -0.56),
    v3(11.4, 1.3, -0.02),
    v3(10.5, 1.4, -0.02),
  ];

  return { faces, lines, ground, windows, energyPath, sun, center: v3(5, 3, 4.5) };
}
