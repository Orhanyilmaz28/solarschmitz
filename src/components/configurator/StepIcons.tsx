/** Kleine Piktogramme für die Antworten im Produktfinder (Linienstil, 48 × 48). */
export function StepIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "#F8FAF7" : "#101820";
  const accent = "#B7F34B";
  const common = { fill: "none", stroke, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const panel = (x: number, y: number, w: number, h: number, key?: string) => (
    <g key={key}>
      <rect x={x} y={y} width={w} height={h} rx={1.5} fill={active ? "#22303B" : "#E9EEF0"} stroke={stroke} strokeWidth={1.6} />
      <path d={`M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}`} stroke={stroke} strokeWidth={1} opacity={0.6} />
    </g>
  );
  const sun = <circle cx={38} cy={10} r={5} fill={accent} />;
  const icons: Record<string, React.ReactNode> = {
    balkon: (
      <>
        {sun}
        <path {...common} d="M6 30h36M8 30v12M16 30v12M24 30v12M32 30v12M40 30v12M6 42h36" />
        {panel(12, 14, 11, 15)}
        {panel(25, 14, 11, 15)}
      </>
    ),
    flachdach: (
      <>
        {sun}
        <path {...common} d="M6 42V26h36v16" />
        <path {...common} d="M10 26l8-8M24 26l8-8" />
        <path d="M10 26l8-8h4l-8 8zM24 26l8-8h4l-8 8z" fill={active ? "#22303B" : "#E9EEF0"} stroke={stroke} strokeWidth={1.4} strokeLinejoin="round" />
      </>
    ),
    schraegdach: (
      <>
        {sun}
        <path {...common} d="M6 26L24 10l18 16M10 23v19h28V23" />
        <path d="M13 22l9-8 4 3.5-9 8z" fill={active ? "#22303B" : "#E9EEF0"} stroke={stroke} strokeWidth={1.4} strokeLinejoin="round" />
      </>
    ),
    garten: (
      <>
        {sun}
        <path {...common} d="M4 42h40M9 42l8-10h12l-8 10" />
        <path d="M17 32h12l-8 10H9z" fill={active ? "#22303B" : "#E9EEF0"} stroke={stroke} strokeWidth={1.4} strokeLinejoin="round" />
        <path {...common} d="M38 42V30m0 0c-4 0-5-6 0-8 5 2 4 8 0 8z" />
      </>
    ),
    sued: <Compass active={active} rot={180} />,
    suedwest: <Compass active={active} rot={135} />,
    ostwest: <Compass active={active} rot={90} double />,
    nord: <Compass active={active} rot={0} />,
    speicher: (
      <>
        <rect x={14} y={8} width={20} height={34} rx={4} {...common} />
        <rect x={19} y={4} width={10} height={4} rx={1} fill={stroke} />
        <rect x={18} y={24} width={12} height={14} rx={1.5} fill={accent} />
      </>
    ),
    ohne: (
      <>
        {sun}
        {panel(10, 16, 13, 20)}
        {panel(25, 16, 13, 20)}
      </>
    ),
    offen: (
      <>
        <circle cx={24} cy={24} r={16} {...common} />
        <path {...common} d="M19 19a5 5 0 1 1 7 4.6c-1.3.6-2 1.6-2 3V28" />
        <circle cx={24} cy={33} r={1.4} fill={stroke} />
      </>
    ),
    m1: <>{panel(17, 8, 14, 32)}</>,
    m2: (
      <>
        {panel(9, 8, 14, 32)}
        {panel(25, 8, 14, 32)}
      </>
    ),
    m4: <>{[3, 14, 25, 36].map((x) => panel(x, 12, 9.5, 24, String(x)))}</>,
    "p-klein": <Bars n={1} active={active} />,
    "p-mittel": <Bars n={2} active={active} />,
    "p-gross": <Bars n={3} active={active} />,
    b1: <Coins n={1} active={active} />,
    b2: <Coins n={2} active={active} />,
    b3: <Coins n={3} active={active} />,
    b4: (
      <>
        <path {...common} d="M10 24c0-4 3-7 7-7 6 0 8 14 14 14 4 0 7-3 7-7s-3-7-7-7c-6 0-8 14-14 14-4 0-7-3-7-7z" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden>
      {icons[name] ?? null}
    </svg>
  );
}

function Compass({ active, rot, double }: { active: boolean; rot: number; double?: boolean }) {
  const stroke = active ? "#F8FAF7" : "#101820";
  return (
    <>
      <circle cx={24} cy={24} r={17} fill="none" stroke={stroke} strokeWidth={1.6} />
      <text x={24} y={11.5} textAnchor="middle" fontSize={6} fill={stroke} fontFamily="var(--font-mono)">
        N
      </text>
      <g transform={`rotate(${rot} 24 24)`}>
        <path d="M24 10l4 14h-8z" fill="#B7F34B" />
        <path d="M24 38l4-14h-8z" fill={double ? "#B7F34B" : stroke} opacity={double ? 1 : 0.25} />
      </g>
    </>
  );
}

function Bars({ n, active }: { n: number; active: boolean }) {
  const stroke = active ? "#F8FAF7" : "#101820";
  return (
    <>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={10 + i * 11} y={34 - (i + 1) * 8} width={8} height={(i + 1) * 8 + 4} rx={2} fill={i < n ? "#B7F34B" : "none"} stroke={stroke} strokeWidth={1.4} />
      ))}
    </>
  );
}

function Coins({ n, active }: { n: number; active: boolean }) {
  const stroke = active ? "#F8FAF7" : "#101820";
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <ellipse key={i} cx={24} cy={34 - i * 7} rx={12} ry={4.5} fill={i === n - 1 ? "#B7F34B" : active ? "#22303B" : "#E9EEF0"} stroke={stroke} strokeWidth={1.4} />
      ))}
    </>
  );
}
