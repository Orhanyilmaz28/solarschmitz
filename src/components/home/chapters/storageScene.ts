import { box, groundGrid, lerp3, quadGrid, v3, type Face, type Line, type V3 } from "@/lib/linework/engine";

/**
 * Kapitel 3 – Systemmodell im Linienwerk-Stil.
 * Kompaktes Haus mit zwei aufgeständerten Modulen auf dem Flachdach,
 * Speicher an der linken Hauswand, Netzanschluss über einen Mast rechts.
 * Topologie wie ein Schaltbild: Sonne oben, Speicher links, Netz rechts, Haus in der Mitte.
 * Maße in Metern, x rechts, y oben, z in die Tiefe (Kamera bei kleinem z).
 */
export const K3_PAINT = {
  facade: "url(#k3-facade)",
  side: "url(#k3-side)",
  top: "url(#k3-top)",
  pv: "url(#k3-pv)",
  battery: "url(#k3-battery)",
  batterySide: "#0E151C",
  batteryTop: "#1F2A35",
  glass: "#111922",
} as const;

const EDGE = "#F3F5F1";

export type FlowKey = "pvHouse" | "pvBattery" | "batteryHouse" | "gridHouse" | "houseGrid";

export interface StorageScene {
  faces: Face[];
  lines: Line[];
  ground: Line[];
  /** Fensterflächen (leuchten abends, Helligkeit folgt dem Verbrauch) */
  windowTags: Set<string>;
  /** Modulflächen (Lichtreflex folgt der Erzeugung) */
  moduleTags: Set<string>;
  /** Ladestandsanzeige auf der Speicherfront: unten links, unten rechts, oben rechts, oben links */
  socBar: [V3, V3, V3, V3];
  /** Weg der Energie je Fluss */
  flows: Record<FlowKey, V3[]>;
  /** Punkte für Beschriftungen */
  anchors: { module: V3; house: V3; battery: V3; grid: V3; hub: V3 };
}

function quad(a: V3, b: V3, c: V3, d: V3, fill: string, extra: Partial<Face> = {}): Face {
  return { pts: [a, b, c, d], fill, stroke: EDGE, strokeOpacity: 0.5, ...extra };
}

/** Durchhängende Leitung zwischen zwei Punkten */
function wire(a: V3, b: V3, sag: number, n = 10): V3[] {
  const pts: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = lerp3(a, b, t);
    pts.push(v3(p[0], p[1] - sag * 4 * t * (1 - t), p[2]));
  }
  return pts;
}

export function buildStorageScene(): StorageScene {
  const faces: Face[] = [];
  const lines: Line[] = [];
  const ground: Line[] = [];
  const windowTags = new Set<string>();
  const moduleTags = new Set<string>();
  const edge = { stroke: EDGE, strokeOpacity: 0.5 };

  // ---------- Haus ----------
  const W = 7.5;
  const H = 6.0;
  const D = 7.0;
  faces.push(...box(v3(0, 0, 0), v3(W, H, D), { fill: K3_PAINT.facade, fills: { left: K3_PAINT.side, top: K3_PAINT.top }, ...edge, skip: ["bottom"], tag: "haus" }));
  // Attika und Geschosslinie
  lines.push({ pts: [v3(0.22, H + 0.02, 0.22), v3(W - 0.22, H + 0.02, 0.22), v3(W - 0.22, H + 0.02, D - 0.22), v3(0.22, H + 0.02, D - 0.22), v3(0.22, H + 0.02, 0.22)], stroke: EDGE, opacity: 0.2, bias: -0.05 });
  lines.push({ pts: [v3(0, 3.05, -0.012), v3(W, 3.05, -0.012)], stroke: EDGE, opacity: 0.1, bias: -0.02 });
  lines.push({ pts: [v3(-0.012, 3.05, 0), v3(-0.012, 3.05, D)], stroke: EDGE, opacity: 0.08, bias: -0.02 });

  // ---------- Fenster ----------
  let wi = 0;
  // Fenster liegen in der Fassadenebene: großer Tiefenversatz, damit sie immer vor ihrer Wand gezeichnet werden
  const mull = (a: V3, b: V3): Line => ({ pts: [a, b], stroke: "#0B1016", opacity: 0.9, width: 1.2, bias: -3.1 });
  const addWindow = (pts: [V3, V3, V3, V3], mullions: Line[] = []) => {
    const tag = `k3-win-${wi++}`;
    faces.push(quad(...pts, K3_PAINT.glass, { bias: -3, strokeOpacity: 0.62, tag }));
    windowTags.add(tag);
    lines.push(...mullions);
  };
  const zf = -0.012;
  // Erdgeschoss vorne: große Verglasung, Tür, kleines Fenster
  addWindow([v3(0.6, 0.3, zf), v3(3.3, 0.3, zf), v3(3.3, 2.5, zf), v3(0.6, 2.5, zf)], [mull(v3(1.95, 0.3, zf - 0.01), v3(1.95, 2.5, zf - 0.01))]);
  addWindow([v3(4.55, 0, zf), v3(5.45, 0, zf), v3(5.45, 2.35, zf), v3(4.55, 2.35, zf)]);
  addWindow([v3(6.1, 1.0, zf), v3(7.0, 1.0, zf), v3(7.0, 2.35, zf), v3(6.1, 2.35, zf)]);
  // Fensterband Obergeschoss
  addWindow([v3(0.6, 3.55, zf), v3(7.0, 3.55, zf), v3(7.0, 5.3, zf), v3(0.6, 5.3, zf)], [
    mull(v3(2.35, 3.55, zf - 0.01), v3(2.35, 5.3, zf - 0.01)),
    mull(v3(4.35, 3.55, zf - 0.01), v3(4.35, 5.3, zf - 0.01)),
    mull(v3(5.75, 3.55, zf - 0.01), v3(5.75, 5.3, zf - 0.01)),
  ]);
  // Linke Seite
  const xl = -0.012;
  addWindow([v3(xl, 0.9, 5.7), v3(xl, 0.9, 2.6), v3(xl, 2.4, 2.6), v3(xl, 2.4, 5.7)], [mull(v3(xl - 0.01, 0.9, 4.15), v3(xl - 0.01, 2.4, 4.15))]);
  addWindow([v3(xl, 3.55, 4.6), v3(xl, 3.55, 1.5), v3(xl, 5.3, 1.5), v3(xl, 5.3, 4.6)]);

  // ---------- Zwei Module, aufgeständert auf dem Flachdach (nach Süden zur Kamera) ----------
  const tilt = (20 * Math.PI) / 180;
  const modW = 1.72;
  const modD = 1.13;
  const dz = modD * Math.cos(tilt);
  const dy = modD * Math.sin(tilt);
  const y0 = H + 0.25;
  const zFront = 1.0;
  const modX = [2.08, 3.92];
  modX.forEach((x0, i) => {
    const a = v3(x0, y0, zFront);
    const b = v3(x0 + modW, y0, zFront);
    const c = v3(x0 + modW, y0 + dy, zFront + dz);
    const d = v3(x0, y0 + dy, zFront + dz);
    const tag = `k3-pv-${i}`;
    faces.push(quad(a, b, c, d, K3_PAINT.pv, { strokeOpacity: 0.7, bias: -0.2, tag }));
    moduleTags.add(tag);
    lines.push(...quadGrid(a, b, c, d, 6, 3, { stroke: "#A9C3DA", opacity: 0.2, bias: -0.25 }));
    lines.push({ pts: [d, c], stroke: "#FFC56B", opacity: 0.8, width: 1.1, bias: -0.26 });
    // Aufständerung
    for (const x of [x0 + 0.15, x0 + modW - 0.15]) {
      lines.push({ pts: [v3(x, y0 + dy, zFront + dz), v3(x, H, zFront + dz)], stroke: EDGE, opacity: 0.32, bias: -0.15 });
      lines.push({ pts: [v3(x, y0, zFront), v3(x, H, zFront)], stroke: EDGE, opacity: 0.32, bias: -0.15 });
    }
  });

  // ---------- Speicher an der linken Hauswand ----------
  const bx0 = -1.32;
  const bx1 = -0.24;
  const bz0 = 0.45;
  const bz1 = 1.1;
  const bh = 1.8;
  faces.push(
    ...box(v3(bx0, 0, bz0), v3(bx1, bh, bz1), {
      fill: K3_PAINT.battery,
      fills: { left: K3_PAINT.batterySide, top: K3_PAINT.batteryTop },
      ...edge,
      strokeOpacity: 0.85,
      skip: ["bottom"],
      tag: "k3-akku",
      bias: -4,
    }),
  );
  const barX0 = -1.06;
  const barX1 = -0.5;
  const socBar: [V3, V3, V3, V3] = [
    v3(barX0, 0.22, bz0 - 0.01),
    v3(barX1, 0.22, bz0 - 0.01),
    v3(barX1, 1.42, bz0 - 0.01),
    v3(barX0, 1.42, bz0 - 0.01),
  ];
  // Fuge im Deckel und Statuslicht
  lines.push({ pts: [v3(bx0, bh - 0.2, bz0 - 0.005), v3(bx1, bh - 0.2, bz0 - 0.005)], stroke: EDGE, opacity: 0.22, bias: -4.2 });
  lines.push({ pts: [v3(barX0, bh - 0.1, bz0 - 0.008), v3(barX1, bh - 0.1, bz0 - 0.008)], stroke: "#B7F34B", opacity: 0.9, width: 1.6, bias: -4.3 });

  // ---------- Netz: Mast mit Leitungen ----------
  const mx = 11.2;
  const mz = -1.6;
  const mh = 7.6;
  lines.push({ pts: [v3(mx, 0, mz), v3(mx, mh, mz)], stroke: EDGE, opacity: 0.75, width: 1.6, bias: -0.05 });
  lines.push({ pts: [v3(mx - 0.95, mh - 0.45, mz), v3(mx + 0.95, mh - 0.45, mz)], stroke: EDGE, opacity: 0.7, width: 1.3 });
  lines.push({ pts: [v3(mx - 0.55, mh - 0.45, mz), v3(mx, mh - 1.1, mz), v3(mx + 0.55, mh - 0.45, mz)], stroke: EDGE, opacity: 0.35 });
  const insul = [mx - 0.8, mx, mx + 0.8];
  for (const x of insul) lines.push({ pts: [v3(x, mh - 0.45, mz), v3(x, mh - 0.2, mz)], stroke: EDGE, opacity: 0.6, width: 1.4 });
  // zweiter Mast in der Ferne
  const fx = 30;
  const fz = 10;
  lines.push({ pts: [v3(fx, 0, fz), v3(fx, mh, fz)], stroke: EDGE, opacity: 0.4, width: 1.3, fade: [20, 70] });
  lines.push({ pts: [v3(fx - 0.95, mh - 0.45, fz), v3(fx + 0.95, mh - 0.45, fz)], stroke: EDGE, opacity: 0.4, fade: [20, 70] });
  for (const x of insul) {
    const dx = x - mx;
    lines.push({ pts: wire(v3(x, mh - 0.2, mz), v3(fx + dx, mh - 0.2, fz), 0.9, 14), stroke: EDGE, opacity: 0.32, fade: [14, 60] });
    lines.push({ pts: wire(v3(fx + dx, mh - 0.2, fz), v3(fx + 19 + dx, mh - 0.2, fz + 12), 0.9, 14), stroke: EDGE, opacity: 0.25, fade: [20, 75] });
  }
  // Erdkabel vom Mast zum Haus (gestrichelt angedeutet)
  for (let x = 4.3; x < mx - 0.2; x += 0.6) ground.push({ pts: [v3(x, 0.01, -0.7), v3(Math.min(x + 0.3, mx - 0.1), 0.01, -0.7)], stroke: EDGE, opacity: 0.2 });

  // ---------- Gelände ----------
  ground.push(
    ...groundGrid(-40, 60, -30, 80, 2, { stroke: EDGE, opacity: 0.15, segment: 2, fade: [12, 62] }, [
      [0, W, 0, D],
      [bx0, bx1, bz0, bz1],
    ]),
  );

  // ---------- Energieflüsse ----------
  const hubX = 3.9;
  const hubY = 1.3;
  const hub = v3(hubX, hubY, -0.03);
  const modJoint = (modX[0]! + modW + modX[1]!) / 2;
  const flows: Record<FlowKey, V3[]> = {
    pvHouse: [v3(modJoint, y0 + 0.02, zFront), v3(modJoint, H + 0.03, 0), v3(hubX, H, -0.03), v3(hubX, hubY + 0.1, -0.03)],
    pvBattery: [v3(modX[0]! + 0.05, y0 + 0.02, zFront), v3(0.0, H + 0.03, 0.78), v3(-0.03, bh + 0.25, 0.78), v3(-0.78, bh + 0.02, 0.78)],
    batteryHouse: [v3(-0.12, 0.3, 0.78), v3(-0.12, 0.03, 0.78), v3(-0.12, 0.03, -0.35), v3(hubX - 0.15, 0.03, -0.35), v3(hubX - 0.15, hubY - 0.08, -0.03)],
    gridHouse: [v3(mx, mh - 0.5, mz), v3(mx, 0.05, mz), v3(mx, 0.03, -0.7), v3(hubX + 0.15, 0.03, -0.7), v3(hubX + 0.15, hubY - 0.08, -0.03)],
    houseGrid: [],
  };
  flows.houseGrid = [...flows.gridHouse].reverse();

  return {
    faces,
    lines,
    ground,
    windowTags,
    moduleTags,
    socBar,
    flows,
    anchors: {
      module: v3(modJoint, y0 + dy + 0.12, zFront + dz),
      house: v3(W, 4.4, 0),
      battery: v3((bx0 + bx1) / 2, bh, (bz0 + bz1) / 2),
      grid: v3(mx, mh, mz),
      hub,
    },
  };
}
