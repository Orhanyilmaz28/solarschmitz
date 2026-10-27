"use client";

import { useId, useMemo } from "react";
import { simulateDay, type DayPoint } from "@/lib/solar/dayCurve";
import { clamp, useChartWidth } from "./useChartWidth";

/**
 * Schematischer Tagesverlauf: Solarertrag vs. Verbrauch, mit oder ohne Speicher.
 * Keine Zahlen – die Grafik erklärt das Prinzip, sie prognostiziert nichts.
 */
type Mode = "ohne" | "speicher";

const PAD = { l: 4, r: 4, t: 14, b: 30 };

export function DayCurve({ mode, compact = false }: { mode: Mode; compact?: boolean }) {
  const points = useMemo(() => simulateDay(1.15, mode === "speicher" ? 2.6 : 0), [mode]);
  // in echter Breite zeichnen, damit die Zeitachse auch mobil lesbar bleibt
  const [box, W] = useChartWidth(560);
  const H = Math.round(clamp(W * 0.42, 170, 240));
  const hatch = `hatch-${useId().replace(/:/g, "")}`;
  const max = 1.25;
  const x = (h: number) => PAD.l + (h / 24) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const base = y(0);

  // Flächen als Pfade
  const area = (top: (p: DayPoint) => number, bottom: (p: DayPoint) => number) => {
    const up = points.map((p, i) => `${i ? "L" : "M"}${x(p.h).toFixed(1)} ${y(top(p)).toFixed(1)}`).join("");
    const down = [...points].reverse().map((p) => `L${x(p.h).toFixed(1)} ${y(bottom(p)).toFixed(1)}`).join("");
    return `${up}${down}Z`;
  };
  const line = (fn: (p: DayPoint) => number) => points.map((p, i) => `${i ? "L" : "M"}${x(p.h).toFixed(1)} ${y(fn(p)).toFixed(1)}`).join("");

  // Schichten: direkt genutzt (unten), in den Speicher, ins Netz (oben bis zur Solarkurve)
  const directArea = area((p) => p.direct, () => 0);
  const chargeArea = area((p) => p.direct + p.toBattery, (p) => p.direct);
  const gridArea = area((p) => p.pv, (p) => p.direct + p.toBattery);
  const dischargeArea = area((p) => p.direct + p.fromBattery, (p) => p.direct);

  return (
    <figure className="m-0">
      <div ref={box}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block h-auto w-full" role="img" aria-label={mode === "speicher" ? "Mit Speicher wird Mittagsstrom am Abend genutzt" : "Ohne Speicher fließt Mittagsstrom ins Netz"}>
          <defs>
            <pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#B7F34B" opacity="0.35" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#3E6A00" strokeWidth="2" opacity="0.5" />
            </pattern>
          </defs>
          {/* Nacht-Bereiche */}
          <rect x={x(0)} y={PAD.t} width={x(5.5) - x(0)} height={base - PAD.t} fill="#101820" opacity="0.035" />
          <rect x={x(21)} y={PAD.t} width={x(24) - x(21)} height={base - PAD.t} fill="#101820" opacity="0.035" />
          <line x1={PAD.l} x2={W - PAD.r} y1={base} y2={base} stroke="#DCE2E5" />

          <path d={gridArea} fill="#C9D1D6" opacity="0.55" className="transition-[d] duration-700" />
          <path d={directArea} fill="#FFA42A" opacity="0.85" />
          {mode === "speicher" && (
            <>
              <path d={chargeArea} fill="#B7F34B" opacity="0.9" />
              <path d={dischargeArea} fill={`url(#${hatch})`} />
            </>
          )}
          <path d={line((p) => p.pv)} fill="none" stroke="#FF6F1A" strokeWidth="2" />
          <path d={line((p) => p.load)} fill="none" stroke="#101820" strokeWidth="2" strokeDasharray="0" />

          {[0, 6, 12, 18, 24].map((h) => (
            <text key={h} x={x(h)} y={H - 8} textAnchor={h === 0 ? "start" : h === 24 ? "end" : "middle"} fontSize="12" fill="#56616B" fontFamily="var(--font-mono)">
              {String(h).padStart(2, "0")}:00
            </text>
          ))}
        </svg>
      </div>
      <figcaption className={`mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted ${compact ? "" : "sm:text-[13px]"}`}>
        <Legend swatch="bg-[#FFA42A]" label="Solarstrom direkt genutzt" />
        {mode === "speicher" && <Legend swatch="bg-[#B7F34B]" label="lädt den Speicher" />}
        {mode === "speicher" && <Legend swatch="bg-[repeating-linear-gradient(45deg,#B7F34B_0_3px,#3E6A00_3px_5px)]" label="aus dem Speicher am Abend" />}
        <Legend swatch="bg-[#C9D1D6]" label="fließt ins Netz" />
        <Legend swatch="bg-ink h-[2px] !w-4 self-center" label="Verbrauch" />
      </figcaption>
    </figure>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}
