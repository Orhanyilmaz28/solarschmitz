"use client";

import type { CSSProperties } from "react";
import type { SimStep } from "@/lib/energy-sim";
import { Icon } from "@/components/ui/Icon";
import styles from "./dashboard.module.css";
import { fmtW } from "./format";

/**
 * Energiefluss zur aktuellen Uhrzeit: Sonne → Haus, Sonne → Speicher,
 * Speicher → Haus, Netz ↔ Haus. Linienstärke und Tempo folgen der Leistung.
 */
interface Props {
  step: SimStep;
  withStorage: boolean;
  running: boolean;
}

const SUN = "#FFA42A";
const SUN_LIGHT = "#FFD84D";
const LIME = "#B7F34B";
const GRID = "#8D9AA5";
const BASE = "#26323D";

const PATHS = {
  pvHouse: "M180 80 L180 138",
  pvStorage: "M160 64 C 104 82, 66 150, 58 222",
  storageHouse: "M84 248 C 118 244, 146 224, 158 200",
  houseGrid: "M202 200 C 216 224, 246 244, 276 248",
};

function flowStyle(watts: number): CSSProperties {
  const dur = Math.max(0.9, 3.4 - watts / 220);
  return { ["--flow-dur" as string]: `${dur.toFixed(2)}s`, opacity: watts > 4 ? 1 : 0, strokeWidth: Math.min(7, 2 + watts / 110) };
}

function Edge({ d, watts, color, reverse = false }: { d: string; watts: number; color: string; reverse?: boolean }) {
  return (
    <g>
      <path d={d} fill="none" stroke={BASE} strokeWidth={2} strokeLinecap="round" />
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        className={`${styles.flow} ${reverse ? styles.reverse : ""}`}
        style={flowStyle(watts)}
      />
    </g>
  );
}

function NodeLabel({ x, y, title, value, anchor = "middle" }: { x: number; y: number; title: string; value: string; anchor?: "start" | "middle" | "end" }) {
  return (
    <g>
      <text x={x} y={y} textAnchor={anchor} fontSize={13} fill="#8D9AA5" fontFamily="var(--font-sans)">
        {title}
      </text>
      <text x={x} y={y + 20} textAnchor={anchor} fontSize={17} fontWeight={600} fill="#F8FAF7" fontFamily="var(--font-sans)" className="tabular">
        {value}
      </text>
    </g>
  );
}

export function FlowDiagram({ step, withStorage, running }: Props) {
  const pvToHouse = step.directW;
  const pvToStorage = step.chargeW;
  const storageToHouse = step.dischargeW;
  const gridImport = step.importW;
  const gridExport = step.exportW;
  const soc = step.socPct ?? 0;
  const socH = Math.max(0, Math.min(1, soc / 100)) * 29;

  const storageTitle = !withStorage ? "Kein Speicher" : `Speicher · ${Math.round(soc)} %`;
  const storageValue = !withStorage
    ? "–"
    : pvToStorage > 4
      ? `lädt ${fmtW(pvToStorage)}`
      : storageToHouse > 4
        ? `gibt ${fmtW(storageToHouse)} ab`
        : "0 W";
  const gridTitle = gridImport > 4 ? "Netz · Bezug" : gridExport > 4 ? "Netz · Einspeisung" : "Netz";
  const gridValue = fmtW(gridImport > 4 ? gridImport : gridExport);

  return (
    <figure className={`m-0 ${running ? "" : styles.paused}`}>
      <svg viewBox="0 0 360 326" className="mx-auto block h-auto w-full max-w-[460px]" role="img" aria-label="Energiefluss zur gewählten Uhrzeit">
        <defs>
          <radialGradient id="dash-sun-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFA42A" stopOpacity="0.45" />
            <stop offset="1" stopColor="#FFA42A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="dash-sun-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFD84D" />
            <stop offset="1" stopColor="#FF6F1A" />
          </linearGradient>
        </defs>

        <Edge d={PATHS.pvHouse} watts={pvToHouse} color={SUN} />
        {withStorage && <Edge d={PATHS.pvStorage} watts={pvToStorage} color={SUN} />}
        {withStorage && <Edge d={PATHS.storageHouse} watts={storageToHouse} color={LIME} />}
        <Edge d={PATHS.houseGrid} watts={gridImport > 4 ? gridImport : gridExport} color={gridImport > 4 ? GRID : SUN_LIGHT} reverse={gridImport > 4} />

        {/* Sonne / Solarmodule */}
        <g>
          <circle cx="180" cy="48" r={32 + Math.min(18, step.pvW / 25)} fill="url(#dash-sun-glow)" style={{ transition: "r 0.4s ease" }} />
          <circle cx="180" cy="48" r="28" fill={step.pvW > 4 ? "url(#dash-sun-fill)" : "#1E2833"} stroke={step.pvW > 4 ? "none" : BASE} strokeWidth={2} />
          <g transform="translate(168 36)" color={step.pvW > 4 ? "#101820" : "#8D9AA5"}>
            <Icon name="sun" size={24} strokeWidth={1.8} />
          </g>
          <NodeLabel x={222} y={42} title="Solar" value={fmtW(step.pvW)} anchor="start" />
        </g>

        {/* Haus */}
        <g>
          <circle cx="180" cy="170" r="30" fill="#1E2833" stroke="#3A4856" strokeWidth={1.5} />
          <g transform="translate(167 157)" color="#F8FAF7">
            <Icon name="home" size={26} strokeWidth={1.7} />
          </g>
          <NodeLabel x={180} y={222} title="Haushalt" value={fmtW(step.loadW)} />
        </g>

        {/* Speicher mit Füllstand */}
        <g opacity={withStorage ? 1 : 0.35}>
          <circle cx="56" cy="252" r="28" fill="#1E2833" stroke="#3A4856" strokeWidth={1.5} />
          <rect x="46" y="236" width="20" height="33" rx="4" fill="none" stroke="#F8FAF7" strokeWidth={1.6} />
          <rect x="51" y="232.5" width="10" height="3.5" rx="1.2" fill="#F8FAF7" />
          {withStorage && <rect x="49" y={267 - socH} width="14" height={socH} rx="2" fill={LIME} />}
          <NodeLabel x={56} y={298} title={storageTitle} value={storageValue} />
        </g>

        {/* Stromnetz */}
        <g>
          <circle cx="304" cy="252" r="28" fill="#1E2833" stroke="#3A4856" strokeWidth={1.5} />
          <path d="M304 236 l-9 32 M304 236 l9 32 M297 248 h14 M294 258 h20 M299 242 h10" fill="none" stroke="#F8FAF7" strokeWidth={1.6} strokeLinecap="round" />
          <NodeLabel x={304} y={298} title={gridTitle} value={gridValue} />
        </g>
      </svg>
    </figure>
  );
}
