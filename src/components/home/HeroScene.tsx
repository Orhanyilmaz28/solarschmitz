/**
 * Gezeichnete Hero-Szene: modernes Haus mit Solardach und Balkonkraftwerk
 * im warmen Abendlicht. Jede Ebene trägt data-layer, damit Hero.tsx sie
 * für Parallax getrennt bewegen kann.
 * Wird durch ein Foto ersetzt, sobald brand.media.hero gesetzt ist.
 */

// Deterministischer Zufall, damit Server und Browser identisch zeichnen
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const grass = (() => {
  const r = rng(42);
  const blades: string[] = [];
  for (let i = 0; i < 220; i++) {
    const x = r() * 1640 - 20;
    const h = 18 + r() * 46;
    const lean = (r() - 0.5) * 22;
    const base = 1000 - r() * 34;
    blades.push(`M${x.toFixed(1)} ${base.toFixed(1)}q${(lean / 2).toFixed(1)} ${(-h / 2).toFixed(1)} ${lean.toFixed(1)} ${(-h).toFixed(1)}`);
  }
  return blades.join("");
})();

/** Perspektivisches Raster für das Solardach (Trapez) */
function roofPanels(cols: number, rows: number) {
  // Dachfläche: vorne breit (y=548), hinten schmaler (y=472)
  const front = { y: 548, x1: 742, x2: 1298 };
  const back = { y: 472, x1: 790, x2: 1252 };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const cells: { d: string; key: string }[] = [];
  const gapT = 0.012;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t0 = r / rows + gapT, t1 = (r + 1) / rows - gapT;
      const u0 = c / cols + gapT * 0.5, u1 = (c + 1) / cols - gapT * 0.5;
      const pt = (u: number, t: number) => {
        const y = lerp(front.y, back.y, t);
        const xl = lerp(front.x1, back.x1, t);
        const xr = lerp(front.x2, back.x2, t);
        return `${lerp(xl, xr, u).toFixed(1)} ${y.toFixed(1)}`;
      };
      cells.push({ key: `${r}-${c}`, d: `M${pt(u0, t0)} L${pt(u1, t0)} L${pt(u1, t1)} L${pt(u0, t1)} Z` });
    }
  }
  return cells;
}
const panels = roofPanels(9, 3);

export function HeroScene({
  viewBox = "0 0 1600 1000",
  className = "",
  align = "xMidYMid slice",
  idPrefix = "d",
}: {
  viewBox?: string;
  className?: string;
  align?: string;
  /** Eindeutiges Präfix für Verlaufs-IDs, falls die Szene mehrfach auf der Seite ist */
  idPrefix?: string;
}) {
  const p = `${idPrefix}-`;
  return (
    <svg viewBox={viewBox} preserveAspectRatio={align} className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${p}hs-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A1118" />
          <stop offset="0.38" stopColor="#17212B" />
          <stop offset="0.58" stopColor="#4A3B3D" />
          <stop offset="0.68" stopColor="#B86F4B" />
          <stop offset="0.76" stopColor="#F2A15E" />
          <stop offset="0.82" stopColor="#FFD39A" />
        </linearGradient>
        <radialGradient id={`${p}hs-sunglow`} cx="1190" cy="560" r="760" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE2A8" stopOpacity="0.95" />
          <stop offset="0.12" stopColor="#FFB547" stopOpacity="0.65" />
          <stop offset="0.4" stopColor="#E7864A" stopOpacity="0.22" />
          <stop offset="1" stopColor="#E7864A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${p}hs-sun`} cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#FFFBEF" />
          <stop offset="0.6" stopColor="#FFE7B5" />
          <stop offset="1" stopColor="#FFC877" />
        </radialGradient>
        <linearGradient id={`${p}hs-hill-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6A4B45" />
          <stop offset="1" stopColor="#3A2E30" />
        </linearGradient>
        <linearGradient id={`${p}hs-hill-mid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E2A2E" />
          <stop offset="1" stopColor="#1A1B20" />
        </linearGradient>
        <linearGradient id={`${p}hs-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1C1E22" />
          <stop offset="1" stopColor="#0A0D11" />
        </linearGradient>
        <linearGradient id={`${p}hs-facade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1A2129" />
          <stop offset="0.75" stopColor="#262E37" />
          <stop offset="1" stopColor="#4A3A33" />
        </linearGradient>
        <linearGradient id={`${p}hs-facade-upper`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#212A33" />
          <stop offset="1" stopColor="#3D3532" />
        </linearGradient>
        <linearGradient id={`${p}hs-wood`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5B4232" />
          <stop offset="1" stopColor="#8A5E3F" />
        </linearGradient>
        <linearGradient id={`${p}hs-window`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE0A6" />
          <stop offset="0.7" stopColor="#F7B064" />
          <stop offset="1" stopColor="#D9823F" />
        </linearGradient>
        <linearGradient id={`${p}hs-panel`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#E9A066" />
          <stop offset="0.35" stopColor="#7A5A63" />
          <stop offset="1" stopColor="#1D2B44" />
        </linearGradient>
        <linearGradient id={`${p}hs-balcony-panel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2B3B52" />
          <stop offset="0.7" stopColor="#152031" />
          <stop offset="1" stopColor="#C98557" />
        </linearGradient>
        <linearGradient id={`${p}hs-sweep`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF4DA" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFF4DA" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFF4DA" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${p}hs-spill`} cx="0.5" cy="0" r="0.8">
          <stop offset="0" stopColor="#FFB45E" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFB45E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}hs-vignette`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.7" stopColor="#101820" stopOpacity="0" />
          <stop offset="1" stopColor="#101820" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={`${p}hs-textshade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0A1118" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#0A1118" stopOpacity="0.15" />
          <stop offset="0.6" stopColor="#0A1118" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${p}hs-roof-clip`}>
          <path d="M742 548 L1298 548 L1252 472 L790 472 Z" />
        </clipPath>
      </defs>

      {/* Himmel */}
      <g data-layer="sky">
        <rect x="-200" y="-200" width="2000" height="1400" fill={`url(#${p}hs-sky)`} />
        <rect x="-200" y="-200" width="2000" height="1400" fill={`url(#${p}hs-sunglow)`} />
      </g>

      {/* Sonne */}
      <g data-layer="sun">
        <circle cx="1190" cy="540" r="64" fill={`url(#${p}hs-sun)`} />
        <circle cx="1190" cy="540" r="110" fill="#FFE7B5" opacity="0.18" />
      </g>

      {/* Ferne Hügel */}
      <g data-layer="far">
        <path d="M-200 742 C 80 690, 300 700, 520 726 S 900 690, 1120 708 S 1500 676, 1800 716 V 1100 H -200 Z" fill={`url(#${p}hs-hill-far)`} />
      </g>

      {/* Mittlere Hügel und Bäume */}
      <g data-layer="mid">
        <path d="M-200 790 C 120 752, 360 770, 600 790 S 1000 760, 1300 784 S 1600 770, 1800 790 V 1100 H -200 Z" fill={`url(#${p}hs-hill-mid)`} />
        {[
          [1560, 784, 26], [1620, 790, 20],
        ].map(([x, y, r]) => (
          <g key={`${x}`} fill="#15171B">
            <ellipse cx={x} cy={y! - r! * 1.6} rx={r! * 0.8} ry={r! * 1.8} />
            <rect x={x! - 2} y={y! - r!} width="4" height={r! * 1.2} />
          </g>
        ))}
      </g>

      {/* Haus */}
      <g data-layer="house">
        <g transform="translate(406 172) scale(0.8)">
        {/* Lichtschein am Boden */}
        <ellipse cx="1080" cy="872" rx="360" ry="46" fill={`url(#${p}hs-spill)`} />

        {/* Erdgeschoss */}
        <rect x="880" y="640" width="600" height="222" fill={`url(#${p}hs-facade)`} />
        <g data-window>
          <rect x="912" y="672" width="300" height="172" fill={`url(#${p}hs-window)`} />
          <path d="M987 672v172M1062 672v172M1137 672v172M912 758h300" stroke="#2A2420" strokeWidth="4" opacity="0.7" />
          {/* Silhouette Pflanze und Lampe innen */}
          <path d="M950 844c-6-30 4-52 22-60-10 18-8 40-4 60z" fill="#8C5A35" opacity="0.55" />
          <path d="M1150 690v54" stroke="#6E4B33" strokeWidth="2" opacity="0.6" />
          <circle cx="1150" cy="748" r="9" fill="#FFF1CC" />
        </g>
        <g data-window>
          <rect x="1250" y="690" width="96" height="172" fill={`url(#${p}hs-window)`} opacity="0.92" />
          <path d="M1298 690v172" stroke="#2A2420" strokeWidth="3" opacity="0.6" />
        </g>
        <rect x="1376" y="680" width="80" height="182" fill={`url(#${p}hs-wood)`} opacity="0.9" />
        <path d="M1386 680v182M1396 680v182M1406 680v182M1416 680v182M1426 680v182M1436 680v182M1446 680v182" stroke="#3A2A20" strokeWidth="1.5" opacity="0.6" />

        {/* Terrasse auf dem Erdgeschoss mit Balkonkraftwerk am Geländer */}
        <rect x="1268" y="632" width="216" height="10" fill="#0F1419" />
        <path d="M1278 586h196" stroke="#AEB8BE" strokeWidth="3" />
        <path d="M1278 586v48M1316 586v48M1356 586v48M1396 586v48M1436 586v48M1474 586v48" stroke="#8E9AA2" strokeWidth="2" />
        <g data-layer-balcony>
          <rect x="1300" y="590" width="74" height="40" rx="2" fill={`url(#${p}hs-balcony-panel)`} stroke="#C0C9CF" strokeWidth="2" />
          <rect x="1382" y="590" width="74" height="40" rx="2" fill={`url(#${p}hs-balcony-panel)`} stroke="#C0C9CF" strokeWidth="2" />
          <path d="M1312 590v40M1325 590v40M1337 590v40M1349 590v40M1361 590v40M1300 610h74M1394 590v40M1407 590v40M1419 590v40M1431 590v40M1443 590v40M1382 610h74" stroke="#6F8AA3" strokeWidth="0.8" opacity="0.5" />
        </g>

        {/* Obergeschoss, auskragend */}
        <rect x="742" y="548" width="556" height="96" fill={`url(#${p}hs-facade-upper)`} />
        <rect x="1060" y="548" width="238" height="96" fill={`url(#${p}hs-wood)`} />
        <path d="M1072 548v96M1084 548v96M1096 548v96M1108 548v96M1120 548v96M1132 548v96M1144 548v96M1156 548v96M1168 548v96M1180 548v96M1192 548v96M1204 548v96M1216 548v96M1228 548v96M1240 548v96M1252 548v96M1264 548v96M1276 548v96M1288 548v96" stroke="#3A2A20" strokeWidth="1.2" opacity="0.55" />
        <g data-window>
          <rect x="772" y="572" width="262" height="52" fill={`url(#${p}hs-window)`} />
          <path d="M859 572v52M946 572v52" stroke="#2A2420" strokeWidth="3" opacity="0.7" />
        </g>
        <rect x="742" y="640" width="556" height="6" fill="#0C1015" />

        {/* Solardach */}
        <path d="M736 552 L1304 552 L1256 468 L784 468 Z" fill="#0E141B" />
        <g clipPath={`url(#${p}hs-roof-clip)`}>
          {panels.map((p) => (
            <path key={p.key} d={p.d} fill={`url(#${p}hs-panel)`} stroke="#0E141B" strokeWidth="1" />
          ))}
          <rect data-sweep x="560" y="440" width="160" height="140" fill={`url(#${p}hs-sweep)`} opacity="0.55" transform="skewX(-24)" />
        </g>
        <path d="M736 552 L1304 552" stroke="#C7CFD4" strokeWidth="2.5" opacity="0.65" />
        {/* Lichtkante der Sonne */}
        <path d="M1298 548v96M1480 640v222" stroke="#FFD39A" strokeWidth="3" opacity="0.5" />
        </g>
      </g>

      {/* Vordergrund */}
      <g data-layer="front">
        <path d="M-200 858 C 300 846, 900 852, 1800 860 V 1200 H -200 Z" fill={`url(#${p}hs-ground)`} />
        <path d="M-200 858 C 300 846, 900 852, 1800 860" stroke="#FFC98A" strokeWidth="1.5" opacity="0.35" fill="none" />
        {/* schlanke Bäume links */}
        <g fill="#0D1014">
          <ellipse cx="930" cy="742" rx="34" ry="100" />
          <rect x="927" y="792" width="6" height="72" />
          <ellipse cx="972" cy="770" rx="22" ry="70" />
          <rect x="970" y="806" width="4" height="56" />
        </g>
        <path d={grass} stroke="#07090C" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>

      {/* Schatten für Lesbarkeit des Textes und weicher Übergang */}
      <rect x="-200" y="-200" width="2000" height="1400" fill={`url(#${p}hs-textshade)`} />
      <rect x="-200" y="-200" width="2000" height="1400" fill={`url(#${p}hs-vignette)`} />
    </svg>
  );
}
