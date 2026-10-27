import { useId, type ReactNode } from "react";
import type { Place } from "@/lib/solar/recommend";

/**
 * Szenen für die Ortswahl im Konfigurator.
 * Eine gemeinsame Bildsprache: ruhiges Tageslicht, helle Architektur,
 * Module mit feinem Zellraster, die Sonne aus dem Logo-Verlauf.
 * Raster 400 × 300, gezeichnet wie eine Architekturansicht.
 */
interface Ids {
  sky: string;
  sun: string;
  halo: string;
  cell: string;
  glass: string;
  wall: string;
  wallShade: string;
  ground: string;
  roof: string;
  wood: string;
}

export function PlaceScene({ place, className }: { place: Place; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const ids: Ids = {
    sky: `${uid}sky`,
    sun: `${uid}sun`,
    halo: `${uid}halo`,
    cell: `${uid}cell`,
    glass: `${uid}glass`,
    wall: `${uid}wall`,
    wallShade: `${uid}wsh`,
    ground: `${uid}gr`,
    roof: `${uid}roof`,
    wood: `${uid}wood`,
  };
  const scenes: Record<Place, (ids: Ids) => ReactNode> = { balkon: Balkon, hausdach: Hausdach, flachdach: Flachdach, garten: Garten };
  return (
    <svg viewBox="0 0 400 300" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false">
      <defs>
        <linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D5E3EB" />
          <stop offset="0.6" stopColor="#EAF0EF" />
          <stop offset="1" stopColor="#F6F7F2" />
        </linearGradient>
        <linearGradient id={ids.sun} x1="0.2" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#FFD84D" />
          <stop offset="1" stopColor="#FFA42A" />
        </linearGradient>
        <radialGradient id={ids.halo} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE28A" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFE28A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ids.cell} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2B4058" />
          <stop offset="0.55" stopColor="#18273A" />
          <stop offset="1" stopColor="#0E1824" />
        </linearGradient>
        <linearGradient id={ids.glass} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B9CBD6" />
          <stop offset="0.6" stopColor="#8EA5B4" />
          <stop offset="1" stopColor="#7A92A2" />
        </linearGradient>
        <linearGradient id={ids.wall} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7F6F1" />
          <stop offset="1" stopColor="#ECEAE4" />
        </linearGradient>
        <linearGradient id={ids.wallShade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E6E5DF" />
          <stop offset="1" stopColor="#DAD9D2" />
        </linearGradient>
        <linearGradient id={ids.ground} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DCE4D6" />
          <stop offset="1" stopColor="#CDD8C6" />
        </linearGradient>
        <linearGradient id={ids.roof} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4B5560" />
          <stop offset="1" stopColor="#5E6873" />
        </linearGradient>
        <linearGradient id={ids.wood} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C49B74" />
          <stop offset="1" stopColor="#B28560" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${ids.sky})`} />
      {scenes[place](ids)}
    </svg>
  );
}

/* ---------------- Bausteine ---------------- */

function Sun({ ids, x = 346, y = 56 }: { ids: Ids; x?: number; y?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={46} fill={`url(#${ids.halo})`} />
      <circle cx={x} cy={y} r={16} fill={`url(#${ids.sun})`} />
    </g>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#FFFFFF" opacity={0.75}>
      <ellipse cx="0" cy="0" rx="34" ry="7" />
      <ellipse cx="-8" cy="-5" rx="14" ry="8" />
      <ellipse cx="9" cy="-6" rx="11" ry="7" />
    </g>
  );
}

/** Solarmodul mit Rahmen, Zellraster und Lichtreflex. skew in Grad neigt das Modul optisch nach hinten. */
function Module({
  ids,
  x,
  y,
  w,
  h,
  cols,
  rows,
  skew = 0,
}: {
  ids: Ids;
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  rows: number;
  skew?: number;
}) {
  const f = Math.max(1.4, w * 0.035);
  const lines: ReactNode[] = [];
  for (let c = 1; c < cols; c++) {
    const lx = f + ((w - 2 * f) / cols) * c;
    lines.push(<line key={`c${c}`} x1={lx} y1={f} x2={lx} y2={h - f} />);
  }
  for (let r = 1; r < rows; r++) {
    const ly = f + ((h - 2 * f) / rows) * r;
    lines.push(<line key={`r${r}`} x1={f} y1={ly} x2={w - f} y2={ly} />);
  }
  return (
    <g transform={`translate(${x} ${y})${skew ? ` skewX(${skew})` : ""}`}>
      <rect width={w} height={h} rx={1.2} fill="#C9D1D6" />
      <rect x={f} y={f} width={w - 2 * f} height={h - 2 * f} fill={`url(#${ids.cell})`} />
      <g stroke="#5C7590" strokeOpacity={0.45} strokeWidth={0.7}>
        {lines}
      </g>
      <path d={`M${f} ${h * 0.62}L${w * 0.5} ${f}H${w * 0.68}L${f} ${h * 0.86}Z`} fill="#FFFFFF" opacity={0.12} />
    </g>
  );
}

function Shrub({ x, y, r, tone = "#B4C4AB" }: { x: number; y: number; r: number; tone?: string }) {
  return (
    <g fill={tone}>
      <circle cx={x} cy={y} r={r} />
      <circle cx={x - r * 0.8} cy={y + r * 0.25} r={r * 0.75} />
      <circle cx={x + r * 0.85} cy={y + r * 0.2} r={r * 0.7} />
    </g>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-2} y={-6} width={4} height={40} fill="#9B8A78" />
      <ellipse cx={0} cy={-28} rx={24} ry={32} fill="#BFCDB7" />
      <ellipse cx={-6} cy={-34} rx={14} ry={18} fill="#CAD7C2" />
    </g>
  );
}

/* ---------------- Szenen ---------------- */

function Balkon(ids: Ids) {
  const balusters = [];
  for (let x = 30; x < 292; x += 9) balusters.push(<line key={x} x1={x} y1={152} x2={x} y2={206} />);
  return (
    <>
      <Sun ids={ids} x={352} y={60} />
      <Cloud x={352} y={128} s={0.9} />
      {/* Fassade */}
      <rect x="0" y="0" width="304" height="300" fill={`url(#${ids.wall})`} />
      <rect x="300" y="0" width="4" height="300" fill="#101820" opacity="0.05" />
      {/* Obergeschoss */}
      <rect x="40" y="-10" width="230" height="64" fill={`url(#${ids.glass})`} />
      <path d="M118 -10v64M196 -10v64" stroke="#2E3A44" strokeWidth="2" />
      <rect x="34" y="54" width="242" height="5" fill="#E2E1DB" />
      {/* Fenster und Tür hinter dem Balkon */}
      <rect x="54" y="96" width="84" height="110" fill={`url(#${ids.glass})`} />
      <rect x="54" y="96" width="84" height="110" fill="none" stroke="#2E3A44" strokeWidth="2.4" />
      <path d="M96 96v110" stroke="#2E3A44" strokeWidth="1.6" />
      <path d="M64 104l18 0M64 112l10 0" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
      <rect x="158" y="106" width="116" height="100" fill={`url(#${ids.glass})`} />
      <rect x="158" y="106" width="116" height="100" fill="none" stroke="#2E3A44" strokeWidth="2.4" />
      <path d="M216 106v100" stroke="#2E3A44" strokeWidth="1.6" />
      <path d="M168 114l26 0M168 122l14 0" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
      {/* Pflanze hinter dem Geländer */}
      <g>
        <path d="M282 150c-6-14-2-26 6-32-2 10 0 20 2 30zM288 150c2-16 10-24 18-26-6 8-10 16-12 26zM276 152c-10-8-14-18-12-26 4 8 8 16 14 22z" fill="#9FB496" />
      </g>
      {/* Balkonplatte */}
      <rect x="20" y="204" width="282" height="14" fill="#E4E3DD" />
      <rect x="20" y="204" width="282" height="2" fill="#FFFFFF" opacity="0.9" />
      <rect x="20" y="218" width="282" height="9" fill="#101820" opacity="0.07" />
      {/* Geländer */}
      <g stroke="#2E3A44" strokeOpacity="0.45" strokeWidth="1.2">{balusters}</g>
      <rect x="22" y="148" width="278" height="4" rx="1" fill="#2E3A44" />
      <rect x="22" y="148" width="4" height="58" fill="#2E3A44" />
      <rect x="296" y="148" width="4" height="58" fill="#2E3A44" />
      {/* Zwei Module außen am Geländer */}
      <Module ids={ids} x={34} y={146} w={112} h={72} cols={6} rows={4} />
      <Module ids={ids} x={154} y={146} w={112} h={72} cols={6} rows={4} />
      <g fill="#AEB8BE">
        <rect x="52" y="142" width="6" height="8" rx="1" />
        <rect x="122" y="142" width="6" height="8" rx="1" />
        <rect x="172" y="142" width="6" height="8" rx="1" />
        <rect x="242" y="142" width="6" height="8" rx="1" />
      </g>
      {/* Untergeschoss */}
      <rect x="54" y="246" width="220" height="70" fill={`url(#${ids.glass})`} opacity="0.85" />
      <path d="M128 246v60M202 246v60" stroke="#2E3A44" strokeWidth="2" />
      <Tree x={366} y={292} s={1.15} />
    </>
  );
}

function Hausdach(ids: Ids) {
  const tiles = [];
  for (let y = 88; y < 152; y += 7) tiles.push(<line key={y} x1={60} y1={y} x2={340} y2={y} />);
  return (
    <>
      <Sun ids={ids} />
      <Cloud x={92} y={50} s={1} />
      <Tree x={58} y={226} s={1.25} />
      {/* Boden */}
      <rect x="0" y="232" width="400" height="68" fill={`url(#${ids.ground})`} />
      <path d="M182 300l10-64h20l10 64z" fill="#ECEDE7" />
      {/* Wand */}
      <rect x="88" y="148" width="224" height="88" fill={`url(#${ids.wall})`} />
      <rect x="88" y="230" width="224" height="6" fill="#D9DCD6" />
      {/* Dach (Walmdach, Südseite zum Betrachter) */}
      <clipPath id={`${ids.roof}c`}>
        <path d="M66 152L110 80H290L334 152Z" />
      </clipPath>
      <path d="M66 152L110 80H290L334 152Z" fill={`url(#${ids.roof})`} />
      <g clipPath={`url(#${ids.roof}c)`} stroke="#000" strokeOpacity="0.1" strokeWidth="1">
        {tiles}
      </g>
      <path d="M110 80H290" stroke="#3A434D" strokeWidth="2.5" />
      {/* Vier Module auf der Dachfläche */}
      <Module ids={ids} x={124} y={92} w={34} h={46} cols={4} rows={6} />
      <Module ids={ids} x={162} y={92} w={34} h={46} cols={4} rows={6} />
      <Module ids={ids} x={200} y={92} w={34} h={46} cols={4} rows={6} />
      <Module ids={ids} x={238} y={92} w={34} h={46} cols={4} rows={6} />
      {/* Traufe */}
      <rect x="62" y="150" width="276" height="6" fill="#EEEDE8" />
      <rect x="62" y="156" width="276" height="6" fill="#101820" opacity="0.07" />
      {/* Fenster und Tür */}
      {[108, 248].map((x) => (
        <g key={x}>
          <rect x={x} y={174} width={44} height={40} fill={`url(#${ids.glass})`} stroke="#2E3A44" strokeWidth="2.2" />
          <path d={`M${x + 22} 174v40`} stroke="#2E3A44" strokeWidth="1.4" />
          <rect x={x - 2} y={214} width={48} height={3} fill="#FFFFFF" />
        </g>
      ))}
      <rect x="184" y="178" width="32" height="54" fill={`url(#${ids.wood})`} />
      <circle cx="210" cy="206" r="1.6" fill="#2E3A44" />
      <rect x="180" y="172" width="40" height="5" fill="#E2E1DB" />
      <Shrub x={96} y={234} r={11} />
      <Shrub x={306} y={234} r={12} tone="#A9BCA0" />
    </>
  );
}

function Flachdach(ids: Ids) {
  return (
    <>
      <Sun ids={ids} />
      <Cloud x={84} y={60} s={0.9} />
      <rect x="0" y="242" width="400" height="58" fill={`url(#${ids.ground})`} />
      <Tree x={352} y={252} s={1.1} />
      {/* Obergeschoss, zurückgesetzt */}
      <rect x="150" y="116" width="156" height="58" fill={`url(#${ids.wallShade})`} />
      <rect x="168" y="132" width="118" height="24" fill={`url(#${ids.glass})`} />
      <path d="M207 132v24M246 132v24" stroke="#2E3A44" strokeWidth="1.6" />
      <rect x="146" y="110" width="164" height="7" fill="#E8E7E1" />
      {/* Erdgeschoss */}
      <rect x="54" y="170" width="282" height="74" fill={`url(#${ids.wall})`} />
      <rect x="50" y="166" width="290" height="7" fill="#E8E7E1" />
      <rect x="50" y="173" width="290" height="5" fill="#101820" opacity="0.06" />
      <rect x="82" y="188" width="132" height="54" fill={`url(#${ids.glass})`} />
      <path d="M126 188v54M170 188v54" stroke="#2E3A44" strokeWidth="1.8" />
      <path d="M90 196l22 0M90 203l12 0" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
      <rect x="234" y="184" width="84" height="58" fill={`url(#${ids.wood})`} />
      <g stroke="#8E6A4B" strokeOpacity="0.45">
        {[244, 254, 264, 274, 284, 294, 304].map((x) => (
          <line key={x} x1={x} y1={184} x2={x} y2={242} />
        ))}
      </g>
      {/* Aufgeständerte Module auf dem Dach (nach hinten geneigt) */}
      {[160, 196, 232, 268].map((x) => (
        <g key={x}>
          <path d={`M${x + 4} 110l-2 -12M${x + 30} 110l-2 -12`} stroke="#AEB8BE" strokeWidth="2" />
          <Module ids={ids} x={x} y={92} w={32} h={17} cols={4} rows={2} skew={-22} />
        </g>
      ))}
      <Shrub x={60} y={244} r={10} />
      <Shrub x={226} y={246} r={8} tone="#A9BCA0" />
    </>
  );
}

function Garten(ids: Ids) {
  return (
    <>
      <Sun ids={ids} />
      <Cloud x={196} y={46} s={1.1} />
      {/* Hintergrund: Haus-Ecke und Hecke */}
      <rect x="0" y="104" width="96" height="104" fill={`url(#${ids.wall})`} />
      <path d="M-10 108L44 70L106 108Z" fill={`url(#${ids.roof})`} />
      <rect x="24" y="136" width="40" height="36" fill={`url(#${ids.glass})`} stroke="#2E3A44" strokeWidth="2" />
      <rect x="96" y="104" width="6" height="104" fill="#101820" opacity="0.05" />
      <Tree x={338} y={204} s={1.35} />
      <rect x="96" y="186" width="304" height="22" rx="10" fill="#B2C3A9" />
      <rect x="0" y="200" width="400" height="100" fill={`url(#${ids.ground})`} />
      {/* Trittsteine */}
      <g fill="#ECEDE7">
        <ellipse cx="74" cy="236" rx="16" ry="5" />
        <ellipse cx="62" cy="256" rx="18" ry="6" />
        <ellipse cx="50" cy="280" rx="20" ry="7" />
      </g>
      {/* Schatten der Anlage */}
      <path d="M150 262L340 262L320 278L132 278Z" fill="#101820" opacity="0.08" />
      {/* Gestell */}
      <g stroke="#9AA6AE" strokeWidth="3" strokeLinecap="round">
        <path d="M160 258L172 214M248 258L260 214M332 258L344 214" />
        <path d="M150 258H340" />
      </g>
      <g stroke="#B9C2C8" strokeWidth="2.4" strokeLinecap="round">
        <path d="M162 258V238M250 258V238M334 258V238" />
      </g>
      {/* Zwei Module, nach hinten geneigt */}
      <Module ids={ids} x={162} y={212} w={86} h={36} cols={6} rows={3} skew={-18} />
      <Module ids={ids} x={252} y={212} w={86} h={36} cols={6} rows={3} skew={-18} />
      <Shrub x={128} y={210} r={9} tone="#A9BCA0" />
      <g fill="#FFFFFF" opacity="0.8">
        <circle cx="112" cy="268" r="2" />
        <circle cx="120" cy="274" r="1.6" />
        <circle cx="104" cy="278" r="1.8" />
      </g>
    </>
  );
}
