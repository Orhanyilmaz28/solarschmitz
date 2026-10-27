import { useId } from "react";
import { brand } from "@/config/brand";

type Tone = "light" | "dark";

interface IconProps {
  /** light = für helle Hintergründe, dark = für dunkle Hintergründe */
  tone?: Tone;
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Bildmarke: Eine Sonne geht hinter einem geneigten Solarmodul auf.
 * Die Fugen zwischen den Zellen und der Spalt zur Sonne sind ausgestanzt,
 * damit das Zeichen auf jedem Hintergrund sauber steht.
 * Geometrie identisch mit /public/brand/*.svg und src/app/icon.svg.
 */
export function LogoIcon({ tone = "light", size = 40, className, title }: IconProps) {
  const id = useId().replace(/:/g, "");
  const panel = tone === "light" ? "var(--color-ink, #101820)" : "var(--color-paper, #F8FAF7)";
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <mask id={`sun-${id}`} maskUnits="userSpaceOnUse">
          <rect width="64" height="64" fill="#fff" />
          <polygon points="6,55 17,29 59,29 48,55" fill="#000" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
        </mask>
        <mask id={`panel-${id}`} maskUnits="userSpaceOnUse">
          <polygon points="6,55 17,29 59,29 48,55" fill="#fff" strokeLinejoin="round" stroke="#fff" strokeWidth="1" />
          <line x1="38" y1="27" x2="27" y2="57" stroke="#000" strokeWidth="3" />
          <line x1="2" y1="42" x2="62" y2="42" stroke="#000" strokeWidth="3" />
        </mask>
      </defs>
      <circle cx="41" cy="21" r="13" fill="var(--color-lime, #B7F34B)" mask={`url(#sun-${id})`} />
      <rect width="64" height="64" fill={panel} mask={`url(#panel-${id})`} />
    </svg>
  );
}

interface LogoProps {
  tone?: Tone;
  className?: string;
  /** Höhe der Bildmarke in px; die Schrift skaliert mit */
  size?: number;
  showWordmark?: boolean;
}

/** Wort-Bild-Marke. Der Name kommt aus src/config/brand.ts. */
export function Logo({ tone = "light", className = "", size = 36, showWordmark = true }: LogoProps) {
  const color = tone === "light" ? "text-ink" : "text-paper";
  return (
    <span className={`inline-flex items-center gap-[0.55em] ${color} ${className}`} style={{ fontSize: size * 0.5 }}>
      <LogoIcon tone={tone} size={size} />
      {showWordmark && (
        <span className="font-display leading-none whitespace-nowrap" style={{ fontStretch: "125%", letterSpacing: "0.02em" }}>
          <span style={{ fontWeight: 800 }}>{brand.wordmark.primary}</span>
          <span style={{ fontWeight: 400 }}>
            {brand.wordmark.joined ? "" : " "}
            {brand.wordmark.secondary}
          </span>
        </span>
      )}
      {!showWordmark && <span className="sr-only">{brand.name}</span>}
    </span>
  );
}
