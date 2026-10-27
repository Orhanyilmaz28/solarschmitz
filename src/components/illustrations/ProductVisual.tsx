import { useId, type ReactNode } from "react";
import type { VisualKey } from "@/lib/catalog/types";

/**
 * Gezeichnete Produktgrafiken als Platzhalter, bis lizenzierte Fotos vorliegen.
 * Einheitlicher Stil: weiches Studiolicht von oben links, Bodenschatten,
 * keine Herstellerlogos.
 */
interface Props {
  visual: VisualKey;
  className?: string;
  title?: string;
}

export function ProductVisual({ visual, className, title }: Props) {
  const uid = useId().replace(/:/g, "");
  const ids = {
    cell: `cell-${uid}`,
    cellBlack: `cellb-${uid}`,
    frame: `frame-${uid}`,
    sheen: `sheen-${uid}`,
    body: `body-${uid}`,
    bodyDark: `bodyd-${uid}`,
    shadow: `shadow-${uid}`,
    alu: `alu-${uid}`,
  };
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label={title ?? "Produktgrafik"}>
      <defs>
        <linearGradient id={ids.cell} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2A3B4C" />
          <stop offset="0.55" stopColor="#152230" />
          <stop offset="1" stopColor="#0C141C" />
        </linearGradient>
        <linearGradient id={ids.cellBlack} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1E252C" />
          <stop offset="1" stopColor="#07090C" />
        </linearGradient>
        <linearGradient id={ids.frame} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E6EBEE" />
          <stop offset="0.5" stopColor="#B9C3C9" />
          <stop offset="1" stopColor="#8E9AA2" />
        </linearGradient>
        <linearGradient id={ids.sheen} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.body} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBFCFC" />
          <stop offset="0.6" stopColor="#E4E9EC" />
          <stop offset="1" stopColor="#C9D1D6" />
        </linearGradient>
        <linearGradient id={ids.bodyDark} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3A4752" />
          <stop offset="1" stopColor="#141C23" />
        </linearGradient>
        <linearGradient id={ids.alu} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C7CFD4" />
          <stop offset="0.5" stopColor="#EEF2F4" />
          <stop offset="1" stopColor="#A9B3BA" />
        </linearGradient>
        <radialGradient id={ids.shadow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#101820" stopOpacity="0.28" />
          <stop offset="1" stopColor="#101820" stopOpacity="0" />
        </radialGradient>
      </defs>
      {SCENES[visual](ids)}
    </svg>
  );
}

type Ids = Record<"cell" | "cellBlack" | "frame" | "sheen" | "body" | "bodyDark" | "shadow" | "alu", string>;

function Shadow({ ids, cx = 200, cy = 272, rx = 150, ry = 14 }: { ids: Ids; cx?: number; cy?: number; rx?: number; ry?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${ids.shadow})`} />;
}

function Module({
  ids, x, y, w, h, cols = 6, rows = 10, black = false,
}: { ids: Ids; x: number; y: number; w: number; h: number; cols?: number; rows?: number; black?: boolean }) {
  const inset = Math.max(3, w * 0.035);
  const gx = x + inset, gy = y + inset, gw = w - inset * 2, gh = h - inset * 2;
  const lines: ReactNode[] = [];
  for (let c = 1; c < cols; c++) {
    const lx = gx + (gw / cols) * c;
    lines.push(<line key={`c${c}`} x1={lx} y1={gy} x2={lx} y2={gy + gh} />);
  }
  for (let r = 1; r < rows; r++) {
    const ly = gy + (gh / rows) * r;
    lines.push(<line key={`r${r}`} x1={gx} y1={ly} x2={gx + gw} y2={ly} />);
  }
  return (
    <g>
      {/* Modultiefe */}
      <path d={`M${x + w} ${y + 3} l5 4 v${h - 6} l-5 2z`} fill={black ? "#05070A" : "#7D8A93"} />
      <rect x={x} y={y} width={w} height={h} rx={3} fill={black ? "#14191E" : `url(#${ids.frame})`} />
      <rect x={gx} y={gy} width={gw} height={gh} rx={1.5} fill={`url(#${black ? ids.cellBlack : ids.cell})`} />
      <g stroke={black ? "#2A323A" : "#6F8AA3"} strokeOpacity={black ? 0.9 : 0.35} strokeWidth={0.9}>
        {lines}
      </g>
      <rect x={gx} y={gy} width={gw} height={gh} fill={`url(#${ids.sheen})`} />
    </g>
  );
}

function Inverter({ ids, x, y, w = 78, h = 50 }: { ids: Ids; x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={`url(#${ids.bodyDark})`} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={x + 8 + i * ((w - 16) / 7)} y={y + 6} width={(w - 16) / 7 - 3} height={h * 0.42} rx={1.5} fill="#55636E" opacity={0.6} />
      ))}
      <circle cx={x + w - 12} cy={y + h - 11} r={3.2} fill="#B7F34B" />
      <rect x={x + 10} y={y + h - 14} width={w * 0.35} height={5} rx={2.5} fill="#2E3A44" />
    </g>
  );
}

function Battery({ ids, x, y, w, h, units = 1 }: { ids: Ids; x: number; y: number; w: number; h: number; units?: number }) {
  const uh = h / units;
  return (
    <g>
      {Array.from({ length: units }, (_, i) => {
        const uy = y + i * uh;
        const top = i === 0;
        return (
          <g key={i}>
            <rect x={x} y={uy + (top ? 0 : 3)} width={w} height={uh - (top ? 0 : 3)} rx={14} fill={`url(#${ids.body})`} />
            <rect x={x + 1} y={uy + (top ? 1 : 4)} width={w - 2} height={10} rx={9} fill="#fff" opacity={0.7} />
            {top ? (
              <>
                <rect x={x + w * 0.18} y={uy + uh * 0.32} width={w * 0.64} height={6} rx={3} fill="#C9D1D6" />
                <rect x={x + w * 0.18} y={uy + uh * 0.32} width={w * 0.46} height={6} rx={3} fill="#B7F34B" />
                <circle cx={x + w / 2} cy={uy + uh * 0.66} r={Math.min(w, uh) * 0.12} fill="none" stroke="#AEB8BE" strokeWidth={2} />
              </>
            ) : (
              <rect x={x + w * 0.25} y={uy + uh * 0.5} width={w * 0.5} height={3} rx={1.5} fill="#AEB8BE" />
            )}
          </g>
        );
      })}
    </g>
  );
}

function Cable({ d }: { d: string }) {
  return <path d={d} fill="none" stroke="#101820" strokeWidth={3} strokeLinecap="round" opacity={0.85} />;
}

const SCENES: Record<VisualKey, (ids: Ids) => ReactNode> = {
  "kit-2": (ids) => (
    <>
      <Shadow ids={ids} rx={160} />
      <Module ids={ids} x={74} y={34} w={116} h={228} />
      <Module ids={ids} x={204} y={34} w={116} h={228} />
      <Cable d="M262 262 C 262 278, 300 282, 318 270" />
      <Inverter ids={ids} x={296} y={226} />
    </>
  ),
  "kit-4": (ids) => (
    <>
      <Shadow ids={ids} rx={180} />
      {[34, 116, 198, 280].map((x) => (
        <Module key={x} ids={ids} x={x} y={62} w={76} h={150} cols={5} rows={9} />
      ))}
      <Cable d="M200 212 C 200 240, 250 250, 268 238" />
      <Inverter ids={ids} x={250} y={222} w={88} h={52} />
    </>
  ),
  "kit-2-storage": (ids) => (
    <>
      <Shadow ids={ids} rx={170} />
      <Module ids={ids} x={46} y={40} w={104} h={208} />
      <Module ids={ids} x={162} y={40} w={104} h={208} />
      <Cable d="M214 248 C 214 268, 270 272, 288 262" />
      <Battery ids={ids} x={266} y={132} w={98} h={136} />
    </>
  ),
  "kit-4-storage": (ids) => (
    <>
      <Shadow ids={ids} rx={180} />
      {[22, 90, 158, 226].map((x) => (
        <Module key={x} ids={ids} x={x} y={58} w={62} h={128} cols={4} rows={8} />
      ))}
      <Cable d="M180 186 C 180 220, 270 236, 290 226" />
      <Battery ids={ids} x={278} y={112} w={100} h={160} units={2} />
    </>
  ),
  module: (ids) => (
    <>
      <Shadow ids={ids} rx={110} />
      <g transform="rotate(-4 200 150)">
        <Module ids={ids} x={136} y={20} w={128} h={248} />
      </g>
    </>
  ),
  "module-black": (ids) => (
    <>
      <Shadow ids={ids} rx={110} />
      <g transform="rotate(-4 200 150)">
        <Module ids={ids} x={136} y={20} w={128} h={248} black />
      </g>
    </>
  ),
  battery: (ids) => (
    <>
      <Shadow ids={ids} rx={110} />
      <Battery ids={ids} x={130} y={70} w={140} h={198} />
    </>
  ),
  "battery-large": (ids) => (
    <>
      <Shadow ids={ids} rx={130} />
      <Battery ids={ids} x={118} y={36} w={164} h={232} units={2} />
    </>
  ),
  "battery-tower": (ids) => (
    <>
      <Shadow ids={ids} rx={120} />
      <Battery ids={ids} x={136} y={20} w={128} h={250} units={3} />
    </>
  ),
  inverter: (ids) => (
    <>
      <Shadow ids={ids} rx={120} />
      <Cable d="M170 236 C 170 262, 120 266, 96 256" />
      <Cable d="M230 236 C 230 262, 280 266, 304 256" />
      <Inverter ids={ids} x={110} y={86} w={180} h={152} />
    </>
  ),
  "mount-flat": (ids) => (
    <>
      <Shadow ids={ids} rx={170} />
      <g stroke={`url(#${ids.alu})`} strokeWidth={9} strokeLinecap="round" fill="none">
        <path d="M70 262 L330 262" />
        <path d="M96 262 L292 120" />
        <path d="M292 120 L292 262" />
        <path d="M194 191 L194 262" />
      </g>
      <g transform="rotate(-36 194 186)">
        <Module ids={ids} x={60} y={160} w={268} h={54} cols={10} rows={2} />
      </g>
    </>
  ),
  "mount-rail": (ids) => (
    <>
      <Shadow ids={ids} rx={170} />
      <rect x={40} y={70} width={320} height={9} rx={4.5} fill={`url(#${ids.alu})`} />
      {[60, 110, 160, 210, 260, 310, 350].map((x) => (
        <rect key={x} x={x - 3} y={78} width={6} height={186} fill="#AEB8BE" />
      ))}
      <g transform="rotate(-8 200 160)">
        <Module ids={ids} x={86} y={86} w={228} h={150} cols={10} rows={6} />
      </g>
      <rect x={120} y={62} width={16} height={34} rx={4} fill="#B7F34B" />
      <rect x={264} y={62} width={16} height={34} rx={4} fill="#B7F34B" />
    </>
  ),
  meter: (ids) => (
    <>
      <Shadow ids={ids} rx={100} />
      <rect x={140} y={40} width={120} height={226} rx={14} fill={`url(#${ids.body})`} />
      <rect x={156} y={66} width={88} height={52} rx={6} fill="#101820" />
      <text x={200} y={100} textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize={18} fill="#B7F34B">
        0,48 kW
      </text>
      <circle cx={200} cy={168} r={20} fill="none" stroke="#AEB8BE" strokeWidth={3} />
      <circle cx={200} cy={168} r={6} fill="#B7F34B" />
      {[212, 228, 244].map((y) => (
        <rect key={y} x={160} y={y} width={80} height={6} rx={3} fill="#C9D1D6" />
      ))}
    </>
  ),
  plug: (ids) => (
    <>
      <Shadow ids={ids} rx={100} />
      <rect x={128} y={60} width={144} height={190} rx={36} fill={`url(#${ids.body})`} />
      <circle cx={200} cy={160} r={46} fill="#E2E8EB" stroke="#C9D1D6" strokeWidth={2} />
      <circle cx={184} cy={160} r={7} fill="#5B6670" />
      <circle cx={216} cy={160} r={7} fill="#5B6670" />
      <circle cx={200} cy={92} r={5} fill="#B7F34B" />
    </>
  ),
};
