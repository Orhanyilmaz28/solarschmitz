"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { formatInt, formatKWh } from "@/lib/format";

/**
 * Systemaufbau als schematische Grafik – ausschließlich aus den Produktdaten:
 * Module (Anzahl × Leistung) → [Speicher] → Wechselrichter → Hausnetz.
 * Keine Produktabbildung, sondern eine Zeichnung des Energieflusses.
 */
export interface SystemParts {
  moduleCount: number;
  moduleWp: number | null;
  inverterW: number | null;
  storageKWh: number | null;
  /** Speicher und Wechselrichter in einem Gerät */
  integratedInverter: boolean;
  smartMeter: boolean;
}

export function systemPartsOf(p: Product): SystemParts {
  const includes = p.includes.join(" | ");
  return {
    moduleCount: p.specs.moduleCount ?? (p.specs.totalWp ? 1 : 0),
    moduleWp: p.specs.moduleWp ?? p.specs.totalWp ?? null,
    inverterW: p.specs.inverterW ?? null,
    storageKWh: p.specs.storageKWh ?? null,
    integratedInverter: /speicher mit wechselrichter/i.test(includes),
    smartMeter: /smart meter/i.test(includes),
  };
}

const VB_W = 640;
const VB_H = 300;

export function SystemDiagram({ product, size = "lg", mount = false }: { product: Product; size?: "lg" | "sm"; mount?: boolean }) {
  const parts = systemPartsOf(product);
  const uid = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => setOn(e.some((x) => x.isIntersecting)), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Knoten von links nach rechts
  const nodes: { key: string; label: string; sub: string }[] = [];
  if (parts.storageKWh && parts.integratedInverter) {
    nodes.push({ key: "storage", label: "Speicher + WR", sub: `${formatKWh(parts.storageKWh)}${parts.inverterW ? ` · ${formatInt(parts.inverterW)} W` : ""}` });
  } else {
    if (parts.storageKWh) nodes.push({ key: "storage", label: "Speicher", sub: formatKWh(parts.storageKWh) });
    if (parts.inverterW) nodes.push({ key: "inverter", label: "Wechselrichter", sub: `${formatInt(parts.inverterW)} W Einspeisung` });
  }
  nodes.push({ key: "home", label: "Hausnetz", sub: parts.smartMeter ? "230 V · Smart Meter" : "230 V Steckdose" });

  const modulesW = 228;
  const startX = 24 + modulesW + 40;
  const slot = (VB_W - startX - 16) / nodes.length;
  const cy = 150;
  const lg = size === "lg";

  // Module zeichnen: 2 nebeneinander, bei 4 zwei Reihen
  const cols = parts.moduleCount <= 2 ? Math.max(1, parts.moduleCount) : 2;
  const rows = Math.ceil(parts.moduleCount / cols) || 1;
  const mw = cols === 1 ? 84 : 96;
  const mh = rows === 1 ? 150 : 84;
  const gx = 10;
  const gy = 10;
  const totalW = cols * mw + (cols - 1) * gx;
  const totalH = rows * mh + (rows - 1) * gy;
  const mx0 = 24 + (modulesW - totalW) / 2;
  const my0 = cy - totalH / 2;

  const modules = [];
  for (let i = 0; i < parts.moduleCount; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    modules.push({ x: mx0 + c * (mw + gx), y: my0 + r * (mh + gy) });
  }

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Systemaufbau: ${parts.moduleCount} Module${parts.moduleWp ? ` à ${parts.moduleWp} Wp` : ""}${nodes.map((n) => `, ${n.label} ${n.sub}`).join("")}`}
    >
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2B4058" />
          <stop offset="1" stopColor="#0E1824" />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0.2" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#FFD84D" />
          <stop offset="1" stopColor="#FF6F1A" />
        </linearGradient>
      </defs>

      {/* Sonne */}
      <circle cx={30} cy={34} r={14} fill={`url(#${uid}s)`} />
      <path d="M48 44 L80 70" stroke="#FFA42A" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 6" />

      {/* Module */}
      {modules.map((m, i) => (
        <g key={i}>
          <rect x={m.x} y={m.y} width={mw} height={mh} rx={3} fill="#C9D1D6" />
          <rect x={m.x + 3} y={m.y + 3} width={mw - 6} height={mh - 6} fill={`url(#${uid}c)`} />
          <g stroke="#5C7590" strokeOpacity="0.45" strokeWidth="0.8">
            {[1, 2, 3, 4, 5].map((k) => (
              <line key={`c${k}`} x1={m.x + 3 + ((mw - 6) / 6) * k} y1={m.y + 3} x2={m.x + 3 + ((mw - 6) / 6) * k} y2={m.y + mh - 3} />
            ))}
            {Array.from({ length: rows === 1 ? 9 : 5 }, (_, k) => k + 1).map((k) => (
              <line key={`r${k}`} x1={m.x + 3} y1={m.y + 3 + ((mh - 6) / (rows === 1 ? 10 : 6)) * k} x2={m.x + mw - 3} y2={m.y + 3 + ((mh - 6) / (rows === 1 ? 10 : 6)) * k} />
            ))}
          </g>
        </g>
      ))}
      {mount && (
        <path d={`M${mx0 - 8} ${my0 + totalH + 10} H${mx0 + totalW + 8}`} stroke="#9AA6AE" strokeWidth="3" strokeLinecap="round" />
      )}
      {lg && (
        <text x={24 + modulesW / 2} y={my0 + totalH + 32} textAnchor="middle" fontSize="15" fill="#101820" fontFamily="var(--font-mono)">
          {parts.moduleCount} × {parts.moduleWp ? `${formatInt(parts.moduleWp)} Wp` : "Modul"}
        </text>
      )}

      {/* Leitungen */}
      {nodes.map((n, i) => {
        const x1 = i === 0 ? 24 + modulesW + 6 : startX + slot * (i - 1) + 92;
        const x2 = startX + slot * i;
        const d = `M${x1} ${cy} H${x2}`;
        return (
          <g key={`l${n.key}`}>
            <path d={d} stroke="#DCE2E5" strokeWidth="4" strokeLinecap="round" />
            <path d={d} stroke="#FFA42A" strokeWidth="4" strokeLinecap="round" pathLength={1} className={`energy-flow ${on ? "is-on" : ""}`} />
          </g>
        );
      })}

      {/* Knoten */}
      {nodes.map((n, i) => {
        const x = startX + slot * i;
        return (
          <g key={n.key}>
            <rect x={x} y={cy - 46} width={92} height={92} rx={22} fill="#FFFFFF" stroke="#DCE2E5" strokeWidth="1.5" />
            <NodeIcon kind={n.key} x={x + 46} y={cy} />
            {lg && (
              <>
                <text x={x + 46} y={cy + 74} textAnchor="middle" fontSize="14" fontWeight="600" fill="#101820" fontFamily="var(--font-sans)">
                  {n.label}
                </text>
                <text x={x + 46} y={cy + 93} textAnchor="middle" fontSize="12" fill="#56616B" fontFamily="var(--font-mono)">
                  {n.sub}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function NodeIcon({ kind, x, y }: { kind: string; x: number; y: number }) {
  if (kind === "storage")
    return (
      <g transform={`translate(${x - 18} ${y - 26})`}>
        <rect width="36" height="52" rx="7" fill="#F1F3F2" stroke="#101820" strokeWidth="2" />
        <rect x="12" y="-5" width="12" height="5" rx="1.5" fill="#101820" />
        <rect x="7" y="24" width="22" height="22" rx="3" fill="#B7F34B" />
      </g>
    );
  if (kind === "inverter")
    return (
      <g transform={`translate(${x - 22} ${y - 22})`} fill="none" stroke="#101820" strokeWidth="2" strokeLinecap="round">
        <rect width="44" height="44" rx="8" />
        <path d="M10 15h24" />
        <path d="M10 29c3.5-4 7-4 10.5 0s7 4 10.5 0" />
      </g>
    );
  return (
    <g transform={`translate(${x - 22} ${y - 22})`} fill="none" stroke="#101820" strokeWidth="2" strokeLinejoin="round">
      <path d="M4 20 22 5l18 15v19H4V20Z" />
      <circle cx="16.5" cy="28" r="1.8" fill="#101820" />
      <circle cx="27.5" cy="28" r="1.8" fill="#101820" />
    </g>
  );
}

/** Gleicher Systemaufbau als Liste – gut lesbar auf schmalen Bildschirmen */
export function SystemList({ product, mount = false }: { product: Product; mount?: boolean }) {
  const parts = systemPartsOf(product);
  const rows: { icon: ListIconName; label: string; sub: string }[] = [
    { icon: "panel", label: `${parts.moduleCount} ${parts.moduleCount === 1 ? "Solarmodul" : "Solarmodule"}`, sub: parts.moduleWp ? `je ${formatInt(parts.moduleWp)} Wp` : "" },
  ];
  if (mount) rows.push({ icon: "mount", label: "Aufständerung", sub: "separat erhältlich, siehe unten" });
  if (parts.storageKWh) rows.push({ icon: "battery", label: parts.integratedInverter ? "Speicher mit Wechselrichter" : "Speicher", sub: formatKWh(parts.storageKWh) });
  if (parts.inverterW && !parts.integratedInverter) rows.push({ icon: "inverter", label: "Wechselrichter", sub: `${formatInt(parts.inverterW)} W Einspeisung` });
  rows.push({ icon: "home", label: "Hausnetz", sub: parts.smartMeter ? "230 V, mit Smart Meter" : "230 V über die Steckdose" });
  return (
    <ol className="m-0 list-none p-0" aria-label="Systemaufbau">
      {rows.map((r, i) => (
        <li key={r.label} className="relative flex items-center gap-4 py-2.5">
          {i < rows.length - 1 && <span aria-hidden className="absolute left-[21px] top-[46px] h-[calc(100%-36px)] w-[2px] bg-sun-2/60" />}
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-ink shadow-[0_1px_0_rgb(16_24_32/0.06)]">
            <ListIcon name={r.icon} />
          </span>
          <span>
            <span className="block font-semibold">{r.label}</span>
            {r.sub && <span className="block font-mono text-xs text-muted">{r.sub}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

type ListIconName = "panel" | "mount" | "battery" | "inverter" | "home";

function ListIcon({ name }: { name: ListIconName }) {
  const d = {
    mount: "M3.5 13.5 19.5 7.5M7 12.2V19M16 8.8V19M3 19h18",
    panel: "M4.5 6h15l-2 12h-15l2-12ZM10.3 6l-1.9 12M15.7 6l-1.9 12M3.8 12h15",
    battery: "M7 6h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm3-2h4M9 15h6M9 11.5h6",
    inverter: "M5 5h14v14H5V5Zm3 4h8M8 15c1.3-1.6 2.7-1.6 4 0s2.7 1.6 4 0",
    home: "M4 11 12 4l8 7v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H4.5a.5.5 0 0 1-.5-.5V11Z",
  }[name];
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
