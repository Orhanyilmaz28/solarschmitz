import { useId, type CSSProperties } from "react";
import { brand } from "@/config/brand";
import { logoData } from "./logo-data";

/**
 * Sonnenwerk-Logo.
 * Hauptlogo ist die Signatur: Im Schriftzug ist das „o“ die Sonne.
 * Bildmarke: drei Viertel Sonne, ein Viertel Solarmodul – aus Sonne wird Strom.
 * Alle Pfade kommen aus logo-data.ts (erzeugt mit `npm run logo`).
 *
 * tone:  light = für helle Hintergründe, dark = für dunkle, mono = einfarbig (currentColor)
 * animated: Auftritt beim Laden (Sonne geht auf, Zellen laden, Schrift steigt auf)
 */
type Tone = "light" | "dark" | "mono";

const INK = "var(--color-ink, #101820)";
const PAPER = "var(--color-paper, #F8FAF7)";

interface MarkProps {
  tone?: Tone;
  /** Kantenlänge in px (nur für die eigenständige Bildmarke) */
  size?: number;
  animated?: boolean;
  className?: string;
  title?: string;
}

/** Die Bildmarke als eigenes <svg>. */
export function LogoMark({ tone = "light", size = 40, animated = false, className, title }: MarkProps) {
  return (
    <svg
      viewBox="8 8 104 104"
      width={size}
      height={size}
      className={`${animated ? "sw-anim" : ""} ${className ?? ""}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ overflow: "visible" }}
    >
      <MarkShapes tone={tone} animated={animated} />
    </svg>
  );
}

/** Formen der Bildmarke im 120er-Raster (sichtbar 8–112). */
function MarkShapes({ tone, animated, glow = false }: { tone: Tone; animated: boolean; glow?: boolean }) {
  const id = useId().replace(/:/g, "");
  const { mark } = logoData;

  if (tone === "mono") {
    return (
      <g fill="currentColor">
        <path d={mark.sun} />
        {mark.cells.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    );
  }

  const glassFrom = tone === "light" ? "#2A3A4A" : "#FFFFFF";
  const glassTo = tone === "light" ? "#0B121A" : "#D9E0E5";
  return (
    <g>
      <defs>
        <linearGradient id={`${id}s`} x1="0.15" y1="0" x2="0.55" y2="1">
          {mark.sunStops.map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={glassFrom} />
          <stop offset="1" stopColor={glassTo} />
        </linearGradient>
        {glow && (
          <radialGradient id={`${id}g`} cx="60" cy="60" r="120" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF9A2E" stopOpacity="0.5" />
            <stop offset="0.45" stopColor="#FF8A1F" stopOpacity="0.14" />
            <stop offset="1" stopColor="#FF8A1F" stopOpacity="0" />
          </radialGradient>
        )}
        <clipPath id={`${id}mc`}>
          <rect x={mark.module.x} y={mark.module.y} width={mark.module.size} height={mark.module.size} />
        </clipPath>
        {animated && (
          // Kreisförmiges Aufdecken: beginnt bei 6 Uhr und läuft über 9 und 12 nach 3 Uhr
          <mask id={`${id}sw`} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
            <circle
              className="sw-sweep"
              cx="60"
              cy="60"
              r="26"
              fill="none"
              stroke="#fff"
              strokeWidth="53"
              pathLength={100}
              strokeDasharray="100 100"
              transform="rotate(90 60 60)"
            />
          </mask>
        )}
      </defs>
      {glow && <circle cx="60" cy="60" r="120" fill={`url(#${id}g)`} className="sw-glow" />}
      <path d={mark.sun} fill={`url(#${id}s)`} mask={animated ? `url(#${id}sw)` : undefined} />
      <g>
        {mark.cells.map((d, i) => (
          <path key={i} d={d} fill={`url(#${id}m)`} className="sw-cell" style={{ "--i": i } as CSSProperties} />
        ))}
      </g>
      <g clipPath={`url(#${id}mc)`} style={{ pointerEvents: "none" }}>
        <path d={mark.glint} fill="#fff" opacity={tone === "light" ? 0.14 : 0.22} className="sw-glint" />
      </g>
    </g>
  );
}

type Variant = "lockup" | "signature" | "stacked" | "monogram";

function dataFor(variant: Variant) {
  if (variant === "signature" && logoData.signature) return logoData.signature;
  if (variant === "stacked") return logoData.stacked;
  if (variant === "monogram") return logoData.monogram;
  return logoData.lockup;
}

interface LogoProps {
  tone?: Tone;
  /** Höhe in px. Die Breite ergibt sich aus dem Seitenverhältnis. */
  height?: number;
  /** signature = Sonnen-„o“ (Hauptlogo), lockup = Zeichen + Schrift, stacked = Zeichen über Schrift, monogram = „S☀“ */
  variant?: Variant;
  animated?: boolean;
  className?: string;
  /** Farbe der Schrift überschreiben (z. B. für dezente Großdarstellungen) */
  textColor?: string;
  /** Größe per CSS steuern statt über height (Breite 100 %) */
  fluid?: boolean;
  /** Warmes Leuchten hinter der Sonne (für dunkle Hintergründe) */
  glow?: boolean;
}

/** Wort-Bild-Marke. Der Name kommt aus src/config/brand.ts. */
export function Logo({
  tone = "light",
  height = 32,
  variant = "signature",
  animated = false,
  className = "",
  textColor,
  fluid = false,
  glow = false,
}: LogoProps) {
  const data = dataFor(variant);
  const ink = textColor ?? (tone === "dark" ? PAPER : tone === "mono" ? "currentColor" : INK);
  const s = data.mark.size / 104;
  const width = (data.width / data.height) * height;
  let glyph = 0;
  return (
    <svg
      viewBox={`0 0 ${data.width} ${data.height}`}
      width={fluid ? undefined : width}
      height={fluid ? undefined : height}
      className={`${animated ? "sw-anim" : ""} ${fluid ? "h-auto w-full" : ""} ${className}`}
      role="img"
      aria-label={brand.name}
      style={{ overflow: "visible" }}
    >
      <g transform={`translate(${data.mark.x - 8 * s} ${data.mark.y - 8 * s}) scale(${s})`}>
        <MarkShapes tone={tone} animated={animated} glow={glow} />
      </g>
      <g fill={ink}>
        {data.bold.map((d) => {
          const i = glyph++;
          return <path key={`g${i}`} d={d} className="sw-glyph" style={{ "--i": i } as CSSProperties} />;
        })}
        {data.light.map((d) => {
          const i = glyph++;
          return <path key={`g${i}`} d={d} className="sw-glyph" style={{ "--i": i } as CSSProperties} />;
        })}
      </g>
    </svg>
  );
}

/** Seitenverhältnis (Breite / Höhe) einer Logo-Variante. */
export function logoAspect(variant: Variant = "signature") {
  const d = dataFor(variant);
  return d.width / d.height;
}

/** Früherer Name der Bildmarke */
export const LogoIcon = LogoMark;
