"use client";

import { useEffect, useRef, useState } from "react";

const phases = [
  {
    title: "Sonnenlicht trifft auf das Solarmodul.",
    body: "Die Solarzellen wandeln Licht direkt in Gleichstrom um. Auch bei bewölktem Himmel entsteht Strom, nur weniger.",
    fact: "Licht → Gleichstrom",
  },
  {
    title: "Das System wandelt die Energie in nutzbaren Strom um.",
    body: "Der Wechselrichter macht aus dem Gleichstrom Haushaltsstrom mit 230 Volt. Bei Balkonkraftwerken speist er bis zu 800 W ins Hausnetz ein.",
    fact: "bis 800 W, 230 V",
  },
  {
    title: "Dein Haushalt verwendet die erzeugte Energie.",
    body: "Kühlschrank, Router, Licht: Geräte, die gerade laufen, nutzen zuerst deinen Solarstrom. Nur was fehlt, kommt noch aus dem Netz.",
    fact: "Eigenverbrauch zuerst",
  },
  {
    title: "Ein optionaler Speicher stellt Überschüsse später bereit.",
    body: "Mittags erzeugst du oft mehr, als du brauchst. Ein Batteriespeicher hebt diesen Strom auf und gibt ihn am Abend wieder ab.",
    fact: "Strom für den Abend",
  },
];

export function EnergyStory() {
  const [phase, setPhase] = useState(-1);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (document.documentElement.dataset.motion !== "on") {
      setPhase(3);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setPhase(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="on-dark relative bg-ink text-paper" aria-labelledby="story-title">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_181_71/0.16),transparent)]" />
      </div>
      <div className="container-x relative pt-24 md:pt-32">
        <p className="eyebrow">Vom Licht zur Steckdose</p>
        <h2 id="story-title" className="display-lg mt-4 max-w-4xl text-[36px] md:text-[64px]">
          So einfach wird aus Sonnenlicht dein eigener Strom.
        </h2>
      </div>

      <div className="container-x relative grid gap-6 pb-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 md:pb-32">
        {/* Grafik: bleibt stehen, während die Schritte vorbeiziehen */}
        <div className="sticky top-[84px] z-[1] order-first h-[min(46svh,420px)] lg:order-last lg:top-[calc(50svh-260px)] lg:h-[520px]">
          <div className="relative h-full rounded-[28px] border border-ink-line bg-[radial-gradient(120%_100%_at_20%_0%,#22303b_0%,#17222c_55%,#101820_100%)] p-3 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)]">
            <EnergyDiagram phase={phase} />
            <ol className="absolute bottom-4 left-4 flex gap-1.5" aria-hidden>
              {phases.map((_, i) => (
                <li key={i} className={`h-1.5 rounded-full transition-all duration-700 ease-[var(--ease-out-expo)] ${i <= phase ? "w-8 bg-lime" : "w-3 bg-paper/20"}`} />
              ))}
            </ol>
          </div>
        </div>

        <ol className="relative lg:py-[12svh]">
          {phases.map((p, i) => (
            <li
              key={p.title}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              data-index={i}
              className="flex min-h-[62svh] items-center lg:min-h-[76svh]"
            >
              <div className={`max-w-lg transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${phase === i || phase === -1 ? "opacity-100" : "opacity-35"} ${phase === i ? "translate-x-0" : "lg:translate-x-0"}`}>
                <p className="flex items-center gap-3 font-mono text-sm text-lime">
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-lime/50 tabular">{i + 1}</span>
                  {p.fact}
                </p>
                <h3 className="display-md mt-5 text-[28px] md:text-[40px]">{p.title}</h3>
                <p className="mt-4 text-lg text-muted-dark">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Schema: Sonne → Modul → Wechselrichter → Haus, optional → Speicher */
function EnergyDiagram({ phase }: { phase: number }) {
  const on = (n: number) => phase >= n;
  const line = (n: number) =>
    ({
      pathLength: 1,
      strokeDasharray: 1,
      strokeDashoffset: on(n) ? 0 : 1,
      style: { transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)" },
    }) as const;
  const flow = (n: number) => ({ pathLength: 1, className: `energy-flow ${on(n) ? "is-on" : ""}` });

  return (
    <svg viewBox="0 0 800 560" className="h-full w-full" role="img" aria-label="Energiefluss von der Sonne über Solarmodul und Wechselrichter in den Haushalt und optional in einen Speicher">
      <defs>
        <radialGradient id="es-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF4D6" />
          <stop offset="0.55" stopColor="#FFC66B" />
          <stop offset="1" stopColor="#FFB547" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="es-cell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2A3B4C" />
          <stop offset="1" stopColor="#0C141C" />
        </linearGradient>
        <linearGradient id="es-cell-on" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3D5A35" />
          <stop offset="1" stopColor="#1A2A17" />
        </linearGradient>
      </defs>

      {/* Sonne */}
      <g style={{ transition: "opacity 1s", opacity: phase >= 0 ? 1 : 0.45 }}>
        <circle cx="120" cy="96" r="110" fill="url(#es-sun)" opacity="0.6" />
        <circle cx="120" cy="96" r="40" fill="#FFE2A8" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const r = (n: number) => Math.round(n * 100) / 100;
          return <line key={i} x1={r(120 + Math.cos(a) * 54)} y1={r(96 + Math.sin(a) * 54)} x2={r(120 + Math.cos(a) * 70)} y2={r(96 + Math.sin(a) * 70)} stroke="#FFC66B" strokeWidth="3" strokeLinecap="round" />;
        })}
      </g>

      {/* Lichtstrahlen zum Modul */}
      {[0, 1, 2].map((i) => {
        const d = `M${160 + i * 10} ${130 + i * 6} L${250 + i * 70} ${214 - i * 4}`;
        return (
          <g key={i}>
            <path d={d} stroke="#FFC66B" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity={0.85} {...line(0)} />
            <path d={d} stroke="#FFF1CC" strokeWidth="3" fill="none" strokeLinecap="round" {...flow(0)} />
          </g>
        );
      })}

      {/* Solarmodul (geneigt) */}
      <g>
        <path d="M200 330 L248 210 L468 210 L420 330 Z" fill="#AEB8BE" />
        <path d="M206 324 L251 216 L462 216 L416 324 Z" fill={on(0) ? "url(#es-cell-on)" : "url(#es-cell)"} style={{ transition: "fill 0.8s" }} />
        {[1, 2, 3, 4, 5].map((c) => {
          const t = c / 6;
          return <line key={`c${c}`} x1={206 + (416 - 206) * t} y1="324" x2={251 + (462 - 251) * t} y2="216" stroke="#6F8AA3" strokeOpacity="0.35" />;
        })}
        {[1, 2].map((r) => {
          const t = r / 3;
          const y = 324 - 108 * t;
          return <line key={`r${r}`} x1={206 + 45 * t} y1={y} x2={416 + 46 * t} y2={y} stroke="#6F8AA3" strokeOpacity="0.35" />;
        })}
        <path d="M206 324 L251 216 L300 216 L255 324 Z" fill="#B7F34B" opacity={on(0) ? 0.22 : 0} style={{ transition: "opacity 1s" }} />
        <line x1="300" y1="330" x2="300" y2="362" stroke="#AEB8BE" strokeWidth="5" />
        <text x="480" y="232" fill="#9AA7B1" fontSize="15" fontFamily="var(--font-mono)">Solarmodul</text>
      </g>

      {/* DC-Leitung */}
      <path d="M300 362 L300 410" stroke="#2B3A46" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M300 362 L300 410" stroke="#B7F34B" strokeWidth="6" fill="none" strokeLinecap="round" {...line(1)} />
      <path d="M300 362 L300 410" stroke="#101820" strokeWidth="3" fill="none" strokeLinecap="round" {...flow(1)} />

      {/* Wechselrichter */}
      <g>
        <rect x="236" y="410" width="128" height="76" rx="12" fill="#22303B" stroke={on(1) ? "#B7F34B" : "#2B3A46"} strokeWidth="2" style={{ transition: "stroke 0.6s" }} />
        <text x="300" y="444" textAnchor="middle" fill="#F8FAF7" fontSize="15" fontWeight="600">Wechselrichter</text>
        <text x="300" y="468" textAnchor="middle" fill="#9AA7B1" fontSize="13" fontFamily="var(--font-mono)">DC → AC</text>
        <circle cx="348" cy="424" r="5" fill={on(1) ? "#B7F34B" : "#3A4752"} style={{ transition: "fill 0.4s" }} />
      </g>

      {/* AC-Leitung ins Haus */}
      <path d="M364 448 L520 448" stroke="#2B3A46" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M364 448 L520 448" stroke="#B7F34B" strokeWidth="6" fill="none" strokeLinecap="round" {...line(2)} />
      <path d="M364 448 L520 448" stroke="#101820" strokeWidth="3" fill="none" strokeLinecap="round" {...flow(2)} />
      <text x="442" y="432" textAnchor="middle" fill="#9AA7B1" fontSize="13" fontFamily="var(--font-mono)">230 V</text>

      {/* Haus */}
      <g>
        <path d="M520 300 L630 214 L740 300 V 490 H 520 Z" fill="#17222C" stroke={on(2) ? "#B7F34B" : "#2B3A46"} strokeWidth="2" strokeLinejoin="round" style={{ transition: "stroke 0.6s" }} />
        {[
          [548, 320],
          [652, 320],
          [548, 400],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="62" height="52" rx="4" fill={on(2) ? "#FFD08A" : "#22303B"} style={{ transition: `fill 0.6s ${i * 0.15}s` }} />
        ))}
        <rect x="660" y="400" width="48" height="90" rx="4" fill="#22303B" />
        {/* Steckdose */}
        <g transform="translate(676 430)">
          <rect x="-2" y="0" width="20" height="20" rx="5" fill={on(2) ? "#B7F34B" : "#3A4752"} style={{ transition: "fill 0.5s 0.3s" }} />
          <circle cx="4.5" cy="10" r="1.8" fill="#101820" />
          <circle cx="11.5" cy="10" r="1.8" fill="#101820" />
        </g>
        <text x="630" y="196" textAnchor="middle" fill="#9AA7B1" fontSize="15" fontFamily="var(--font-mono)">Haushalt</text>
      </g>

      {/* Speicher */}
      <path d="M300 486 L300 528 L470 528" stroke="#2B3A46" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 10" opacity={on(3) ? 0 : 1} />
      <path d="M300 486 L300 528 L470 528" stroke="#B7F34B" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" {...line(3)} />
      <path d="M300 486 L300 528 L470 528" stroke="#101820" strokeWidth="3" fill="none" strokeLinecap="round" {...flow(3)} />
      <g style={{ transition: "opacity 0.8s", opacity: on(3) ? 1 : 0.45 }}>
        <rect x="470" y="500" width="34" height="56" rx="7" fill="#E4E9EC" />
        <rect x="477" y="508" width="20" height="40" rx="3" fill="#C9D1D6" />
        <rect
          x="477"
          y="516"
          width="20"
          height="32"
          rx="3"
          fill="#B7F34B"
          style={{
            transformBox: "fill-box",
            transformOrigin: "50% 100%",
            transform: `scaleY(${on(3) ? 1 : 0.06})`,
            transition: "transform 1.4s cubic-bezier(0.16,1,0.3,1) 0.5s",
          }}
        />
        <text x="516" y="534" fill="#9AA7B1" fontSize="15" fontFamily="var(--font-mono)">Speicher (optional)</text>
      </g>
    </svg>
  );
}
