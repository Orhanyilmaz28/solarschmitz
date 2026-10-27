import { HERO_ASPECT, heroLayout, type HeroVariant } from "./heroSvg";

/**
 * Hero-Bild im Linienwerk-Stil.
 * Boden, Haus und erleuchtete Fenster kommen als eigene, cachebare SVG-Dateien (/art/hero-*.svg),
 * Himmel, Sonne und Energielinie sind klein und werden inline gezeichnet.
 * Eigener Bildausschnitt für Desktop und Handy; die jeweils andere Fassung lädt nur ein 1-px-Bild.
 */
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function Layer({ variant, name, priority }: { variant: HeroVariant; name: "ground" | "house" | "win"; priority?: boolean }) {
  const v = variant === "desktop" ? "d" : "m";
  // Die andere Bildschirmgröße bekommt ein leeres Bild, damit nichts doppelt geladen wird
  const other = variant === "desktop" ? "(max-width: 767px)" : "(min-width: 768px)";
  return (
    <picture>
      <source media={other} srcSet={BLANK} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/art/hero-${v}-${name}.svg`}
        alt=""
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover"
        style={{ objectPosition: variant === "mobile" ? "center bottom" : "center center" }}
      />
    </picture>
  );
}

export function HeroArt({ variant, className = "" }: { variant: HeroVariant; className?: string }) {
  const L = heroLayout(variant);
  const { w, h, horizon, sun } = L;
  const p = variant === "mobile" ? "m" : "d";
  const sunR = variant === "mobile" ? 30 : 34;
  const id = (n: string) => `${p}-${n}`;
  const url = (n: string) => `url(#${id(n)})`;
  const r = (n: number) => Math.round(n * 10) / 10;

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div
        aria-hidden
        className="hero-rays pointer-events-none absolute inset-0 z-[1]"
        style={{ ["--sx" as string]: `${((sun.x / w) * 100).toFixed(1)}%`, ["--sy" as string]: `${((sun.y / h) * 100).toFixed(1)}%` }}
      />
      {/* Himmel und Sonne */}
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio={HERO_ASPECT[variant]} className="absolute inset-0 h-full w-full" aria-hidden focusable="false">
        <defs>
          <linearGradient id={id("sky")} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={r(horizon)}>
            <stop offset="0" stopColor="#04070A" />
            <stop offset="0.45" stopColor="#0B121A" />
            <stop offset="0.72" stopColor="#231F28" />
            <stop offset="0.86" stopColor="#5E3A31" />
            <stop offset="0.95" stopColor="#C2703F" />
            <stop offset="1" stopColor="#F2A45C" />
          </linearGradient>
          <linearGradient id={id("ground")} gradientUnits="userSpaceOnUse" x1="0" y1={r(horizon)} x2="0" y2={h}>
            <stop offset="0" stopColor="#1A1514" />
            <stop offset="0.12" stopColor="#0B0F13" />
            <stop offset="1" stopColor="#06090C" />
          </linearGradient>
          <radialGradient id={id("bloom")} gradientUnits="userSpaceOnUse" cx={r(sun.x)} cy={r(sun.y)} r={variant === "mobile" ? 520 : 760}>
            <stop offset="0" stopColor="#FFD58A" stopOpacity="0.85" />
            <stop offset="0.12" stopColor="#FFA42A" stopOpacity="0.45" />
            <stop offset="0.38" stopColor="#E2662A" stopOpacity="0.16" />
            <stop offset="1" stopColor="#E2662A" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id("sun")} cx="0.42" cy="0.38" r="0.62">
            <stop offset="0" stopColor="#FFFBEE" />
            <stop offset="0.55" stopColor="#FFE2A3" />
            <stop offset="1" stopColor="#FFB04A" />
          </radialGradient>
          <linearGradient id={id("haze")} gradientUnits="userSpaceOnUse" x1="0" y1={r(horizon - 120)} x2="0" y2={r(horizon + 60)}>
            <stop offset="0" stopColor="#F2A45C" stopOpacity="0" />
            <stop offset="0.7" stopColor="#F2A45C" stopOpacity="0.14" />
            <stop offset="1" stopColor="#F2A45C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g data-layer="sky">
          <rect x="-200" y="-200" width={w + 400} height={r(horizon + 200)} fill={url("sky")} />
          <rect x="-200" y={r(horizon - 1)} width={w + 400} height={r(h - horizon + 200)} fill={url("ground")} />
          <rect x="-200" y="-200" width={w + 400} height={h + 400} fill={url("bloom")} />
          <rect x="-200" y={r(horizon - 120)} width={w + 400} height="180" fill={url("haze")} />
        </g>
        <g data-layer="sun">
          <circle cx={r(sun.x)} cy={r(sun.y)} r={sunR} fill={url("sun")} />
        </g>
      </svg>

      <div data-layer="ground" className="absolute inset-0">
        <Layer variant={variant} name="ground" />
      </div>
      <div data-layer="house" className="absolute inset-0">
        <Layer variant={variant} name="house" priority />
        <Layer variant={variant} name="win" priority />
      </div>

      {/* Energielinie: Sonne → Module → Fassade → Speicher → Haus, dazu Textschatten und Vignette */}
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio={HERO_ASPECT[variant]} className="absolute inset-0 h-full w-full" aria-hidden focusable="false">
        <defs>
          <linearGradient id={id("energy")} gradientUnits="userSpaceOnUse" x1={r(sun.x)} y1={r(sun.y)} x2={w * 0.3} y2={h}>
            <stop offset="0" stopColor="#FFF1C9" />
            <stop offset="0.5" stopColor="#FFC24D" />
            <stop offset="1" stopColor="#FF7A1F" />
          </linearGradient>
          <linearGradient id={id("vignette")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.6" stopColor="#0A0F14" stopOpacity="0" />
            <stop offset="1" stopColor="#0A0F14" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={id("textshade")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#05080B" stopOpacity={variant === "mobile" ? 0 : 0.78} />
            <stop offset="0.42" stopColor="#05080B" stopOpacity={variant === "mobile" ? 0 : 0.28} />
            <stop offset="0.62" stopColor="#05080B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g data-layer="energy" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={L.energy} stroke={url("energy")} strokeOpacity="0.16" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={L.energy} pathLength={1} stroke={url("energy")} strokeWidth="5" opacity="0.28" className="lw-energy" vectorEffect="non-scaling-stroke" />
          <path d={L.energy} pathLength={1} stroke={url("energy")} strokeWidth="1.6" className="lw-energy" vectorEffect="non-scaling-stroke" />
        </g>
        <rect width={w} height={h} fill={url("textshade")} />
        <rect width={w} height={h} fill={url("vignette")} />
      </svg>
    </div>
  );
}
