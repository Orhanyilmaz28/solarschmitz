import type { ReactNode } from "react";
import { project, projectPath, projectPoint, type Camera, type V3 } from "@/lib/linework/engine";
import { mergeLines, quantize } from "@/lib/linework/svg";
import { buildStorageScene, type FlowKey } from "./storageScene";
import type { Visuals } from "./storageModel";

/**
 * Rendert das Systemmodell von Kapitel 3 auf dem Server als SVG.
 * Bewegliche Teile (Flüsse, Ladestand, Fensterlicht, Modulreflex) tragen
 * data-Attribute, über die die Bühne sie im Browser ansteuert.
 */
export const K3_VIEW = { w: 1000, h: 760 } as const;

const SHOT = { pos: [-13, 11, -23] as V3, look: [6, 4] as const, fov: 28, shiftX: 0, shiftY: -290 };

function camera(): Camera {
  return {
    pos: SHOT.pos,
    target: [SHOT.look[0], SHOT.pos[1], SHOT.look[1]],
    fov: SHOT.fov,
    width: K3_VIEW.w,
    height: K3_VIEW.h,
    shiftX: SHOT.shiftX,
    shiftY: SHOT.shiftY,
  };
}


export type AnchorKey = "module" | "house" | "battery" | "grid";
export interface StorageArtResult {
  art: ReactNode;
  /** Ankerpunkte in Prozent der Bildfläche */
  anchors: Record<AnchorKey | "hub", { x: number; y: number }>;
}

const FLOW_STYLE: Record<FlowKey, { stroke: string; base: string }> = {
  pvHouse: { stroke: "url(#k3-solar)", base: "#FFB347" },
  pvBattery: { stroke: "url(#k3-solar)", base: "#FFB347" },
  batteryHouse: { stroke: "#B7F34B", base: "#B7F34B" },
  gridHouse: { stroke: "#C9D3DA", base: "#C9D3DA" },
  houseGrid: { stroke: "url(#k3-solar)", base: "#FFB347" },
};

/** Länge eines projizierten Pfads in Bildpunkten (für gleich große Punkte auf allen Flüssen) */
function screenLength(cam: Camera, pts: V3[]): number {
  let total = 0;
  let prev: { x: number; y: number } | null = null;
  for (const p of pts) {
    const q = projectPoint(cam, p);
    if (!q) continue;
    if (prev) total += Math.hypot(q.x - prev.x, q.y - prev.y);
    prev = q;
  }
  return total;
}

/** @param initial Zustand, den der Server ausliefert (ohne Bewegung bleibt er stehen) */
export function renderStorageArt(initial: Visuals): StorageArtResult {
  const scene = buildStorageScene();
  const cam = camera();
  const { w, h } = K3_VIEW;
  const items = mergeLines(project({ faces: scene.faces, lines: scene.lines }, cam));
  // Bodenraster als ganze Linien; die Tiefe übernimmt eine Maske zum Horizont hin (spart viel Markup)
  const groundItems = mergeLines(
    quantize(project({ faces: [], lines: scene.ground.map((l) => ({ ...l, fade: undefined, segment: undefined })) }, cam)),
  );
  const far = projectPoint(cam, [cam.pos[0] + (cam.target[0] - cam.pos[0]) * 400, 0, cam.pos[2] + (cam.target[2] - cam.pos[2]) * 400]);
  const horizon = far ? Math.round(far.y) : Math.round(K3_VIEW.h * 0.4);

  const pct = (p: V3) => {
    const q = projectPoint(cam, p) ?? { x: w / 2, y: h / 2 };
    return { x: +((q.x / w) * 100).toFixed(2), y: +((q.y / h) * 100).toFixed(2) };
  };
  const pt = (p: V3) => projectPoint(cam, p) ?? { x: 0, y: 0 };

  // Ladestandsanzeige als projiziertes Viereck
  const bar = scene.socBar.map(pt);
  const barD = `M${bar.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L")}Z`;
  const hub = pt(scene.anchors.hub);

  const flowKeys = Object.keys(scene.flows) as FlowKey[];

  const art = (
    <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" aria-hidden focusable="false">
      <defs>
        <linearGradient id="k3-facade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2="0">
          <stop offset="0" stopColor="#0C1218" />
          <stop offset="1" stopColor="#121A22" />
        </linearGradient>
        <linearGradient id="k3-side" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2="0">
          <stop offset="0" stopColor="#080C10" />
          <stop offset="1" stopColor="#0F151B" />
        </linearGradient>
        <linearGradient id="k3-top" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2="0">
          <stop offset="0" stopColor="#151D25" />
          <stop offset="1" stopColor="#1C252E" />
        </linearGradient>
        <linearGradient id="k3-pv" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2={h * 0.5}>
          <stop offset="0" stopColor="#111C2E" />
          <stop offset="0.6" stopColor="#1C2B45" />
          <stop offset="1" stopColor="#2B3A55" />
        </linearGradient>
        <linearGradient id="k3-battery" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={h}>
          <stop offset="0" stopColor="#1D2832" />
          <stop offset="1" stopColor="#121A22" />
        </linearGradient>
        <linearGradient id="k3-glint" x1="0" y1="1" x2="0.6" y2="0">
          <stop offset="0" stopColor="#FF8A2A" stopOpacity="0.15" />
          <stop offset="0.55" stopColor="#FFC24D" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFF1C9" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="k3-window" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#5C4A45" />
          <stop offset="0.5" stopColor="#D88A4E" />
          <stop offset="1" stopColor="#F6B36B" />
        </linearGradient>
        <linearGradient id="k3-solar" gradientUnits="userSpaceOnUse" x1="0" y1={h * 0.15} x2="0" y2={h * 0.85}>
          <stop offset="0" stopColor="#FFE08A" />
          <stop offset="0.5" stopColor="#FFA42A" />
          <stop offset="1" stopColor="#FF7A1F" />
        </linearGradient>
        <linearGradient id="k3-soc" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#7FB52A" />
          <stop offset="1" stopColor="#D4FF7A" />
        </linearGradient>
        <radialGradient id="k3-hub" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF6DD" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFC24D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="k3-groundfade" gradientUnits="userSpaceOnUse" x1="0" y1={horizon} x2="0" y2={h}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.65" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <linearGradient id="k3-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.72" stopColor="#0A0F14" stopOpacity="0" />
          <stop offset="1" stopColor="#0A0F14" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Bodenraster */}
      <mask id="k3-groundmask" maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
        <rect width={w} height={h} fill="url(#k3-groundfade)" />
      </mask>
      <g fill="none" strokeLinecap="round" mask="url(#k3-groundmask)">
        {groundItems.map((it, i) =>
          it.kind === "line" ? <path key={i} d={it.d} stroke={it.line.stroke} strokeOpacity={it.opacity} strokeWidth={it.line.width ?? 1} vectorEffect="non-scaling-stroke" /> : null,
        )}
      </g>

      {/* Haus, Module, Speicher, Mast – tiefensortiert */}
      <g strokeLinejoin="round" strokeLinecap="round">
        {items.map((it, i) => {
          if (it.kind === "line") {
            return <path key={i} d={it.d} fill="none" stroke={it.line.stroke} strokeOpacity={it.opacity} strokeWidth={it.line.width ?? 1} vectorEffect="non-scaling-stroke" />;
          }
          const f = it.face;
          if (f.tag && scene.windowTags.has(f.tag)) {
            return (
              <g key={i}>
                <path d={it.d} fill="#111922" />
                <path d={it.d} fill="url(#k3-window)" data-k3="window" style={{ opacity: "var(--k3-window, 0.35)" }} />
                <path d={it.d} fill="none" stroke={f.stroke} strokeOpacity={f.strokeOpacity} vectorEffect="non-scaling-stroke" />
              </g>
            );
          }
          if (f.tag && scene.moduleTags.has(f.tag)) {
            return (
              <g key={i}>
                <path d={it.d} fill={f.fill} stroke={f.stroke} strokeOpacity={f.strokeOpacity} vectorEffect="non-scaling-stroke" />
                <path d={it.d} fill="url(#k3-glint)" style={{ opacity: "var(--k3-glint, 0.4)" }} />
              </g>
            );
          }
          return (
            <path
              key={i}
              d={it.d}
              fill={f.fill}
              fillOpacity={f.fillOpacity}
              stroke={f.stroke}
              strokeOpacity={f.strokeOpacity}
              strokeWidth={f.strokeWidth ?? 1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>

      {/* Ladestand */}
      <g>
        <path d={barD} fill="#0A0F14" stroke="#F3F5F1" strokeOpacity="0.35" vectorEffect="non-scaling-stroke" />
        <path
          d={barD}
          fill="url(#k3-soc)"
          data-k3="soc"
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%", transform: "scaleY(var(--k3-soc, 0.35))", filter: "drop-shadow(0 0 5px rgb(183 243 75 / 0.55))" }}
        />
      </g>

      {/* Energieflüsse */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {flowKeys.map((k) => {
          const d = projectPath(cam, scene.flows[k]);
          // Punktabstand ≈ 16 Bildpunkte auf jedem Fluss
          const unit = Math.max(1, Math.round(screenLength(cam, scene.flows[k]) / 16));
          const st = FLOW_STYLE[k];
          const v = initial.flows[k];
          return (
            <g key={k} data-flow={k} style={{ opacity: v.opacity }}>
              <path d={d} stroke={st.base} strokeOpacity="0.28" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path d={d} pathLength={unit} stroke={st.stroke} style={{ strokeWidth: v.width }} vectorEffect="non-scaling-stroke" data-k3="dots" />
            </g>
          );
        })}
      </g>

      {/* Hausanschluss: hier treffen sich die Flüsse */}
      <g>
        <circle cx={hub.x} cy={hub.y} r="22" fill="url(#k3-hub)" data-k3="hub" style={{ opacity: initial.hub }} />
        <circle cx={hub.x} cy={hub.y} r="3.2" fill="#FFF6DD" />
      </g>

      <rect width={w} height={h} fill="url(#k3-fade)" />
    </svg>
  );

  return {
    art,
    anchors: {
      module: pct(scene.anchors.module),
      house: pct(scene.anchors.house),
      battery: pct(scene.anchors.battery),
      grid: pct(scene.anchors.grid),
      hub: pct(scene.anchors.hub),
    },
  };
}
