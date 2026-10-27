"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { formatClock, type DayResult } from "@/lib/energy-sim";
import { fmtPct, fmtW } from "./format";

/**
 * Tagesverlauf: Erzeugung und Verbrauch (eine Achse, Watt),
 * darunter der Ladestand als eigenes kleines Diagramm (Prozent).
 */
interface Props {
  day: DayResult;
  minute: number;
  withStorage: boolean;
  onSelect: (minute: number) => void;
}

const PAD = { left: 52, right: 16, top: 16, bottom: 28 };
const MAIN_H = 230;
const SOC_H = 64;
const LOAD_COLOR = "#C9D2D9";
const SUN = "#FFA42A";
const LIME = "#B7F34B";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(720);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width;
      if (cw) setW(Math.round(cw));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Runde Teilung der y-Achse (1, 2, 2,5, 5 × 10ⁿ) */
function niceTicks(max: number) {
  const raw = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  return { top, ticks };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function DayChart({ day, minute, withStorage, onSelect }: Props) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const compact = width < 560;

  const geo = useMemo(() => {
    const plotW = Math.max(100, width - PAD.left - PAD.right);
    const { top: maxV, ticks } = niceTicks(Math.max(...day.steps.map((s) => Math.max(s.pvW, s.loadW))) * 1.05);
    const x = (m: number) => PAD.left + (m / 1440) * plotW;
    const y = (w: number) => PAD.top + (1 - w / maxV) * (MAIN_H - PAD.top - PAD.bottom);
    const ys = (p: number) => 8 + (1 - p / 100) * (SOC_H - 16);
    const half = day.stepMinutes / 2;
    const linePath = (get: (i: number) => number) =>
      day.steps.map((s, i) => `${i ? "L" : "M"}${r1(x(s.minute + half))} ${r1(y(get(i)))}`).join("");
    const pvLine = linePath((i) => day.steps[i]!.pvW);
    const loadLine = linePath((i) => day.steps[i]!.loadW);
    const pvArea = `${pvLine}L${r1(x(1440))} ${r1(y(0))}L${r1(x(0))} ${r1(y(0))}Z`;
    const socLine = withStorage
      ? day.steps.map((s, i) => `${i ? "L" : "M"}${r1(x(s.minute + half))} ${r1(ys(s.socPct ?? 0))}`).join("")
      : "";
    const socArea = withStorage ? `${socLine}L${r1(x(1440))} ${r1(ys(0))}L${r1(x(0))} ${r1(ys(0))}Z` : "";
    return { plotW, maxV, x, y, ys, pvLine, loadLine, pvArea, socLine, socArea, ticks };
  }, [day, width, withStorage]);

  const at = (m: number) => day.steps[Math.min(day.steps.length - 1, Math.max(0, Math.floor(m / day.stepMinutes)))]!;
  const shown = hover ?? minute;
  const s = at(shown);
  const xHours = compact ? [0, 6, 12, 18, 24] : [0, 3, 6, 9, 12, 15, 18, 21, 24];

  const minuteFromEvent = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left;
    const m = ((px - PAD.left) / geo.plotW) * 1440;
    return Math.max(0, Math.min(1435, Math.round(m / day.stepMinutes) * day.stepMinutes));
  };

  const tipLeft = geo.x(shown);
  const tipRight = tipLeft > width * 0.62;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-dark" aria-label="Legende">
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-[3px] w-5 rounded-full" style={{ background: SUN }} /> Erzeugung
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-[3px] w-5 rounded-full" style={{ background: LOAD_COLOR }} /> Verbrauch
          </li>
          {withStorage && (
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-[3px] w-5 rounded-full" style={{ background: LIME }} /> Ladestand Speicher
            </li>
          )}
        </ul>
        <button
          type="button"
          onClick={() => setTable((t) => !t)}
          aria-expanded={table}
          className="text-[13px] font-semibold text-paper underline decoration-paper/25 underline-offset-4 hover:decoration-sun-1"
        >
          {table ? "Diagramm zeigen" : "Als Tabelle zeigen"}
        </button>
      </div>

      <div ref={wrapRef} className={table ? "hidden" : "relative"}>
        <svg
          width={width}
          height={MAIN_H}
          viewBox={`0 0 ${width} ${MAIN_H}`}
          className="block h-auto max-w-full touch-pan-y select-none"
          role="img"
          aria-label={`Tagesverlauf von Erzeugung und Verbrauch. Tagessumme Erzeugung ${day.totals.pvKWh.toFixed(1)} kWh, Verbrauch ${day.totals.loadKWh.toFixed(1)} kWh.`}
          onPointerMove={(e) => setHover(minuteFromEvent(e.clientX, e.currentTarget.getBoundingClientRect()))}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => onSelect(minuteFromEvent(e.clientX, e.currentTarget.getBoundingClientRect()))}
        >
          <defs>
            <linearGradient id="dash-pv-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFA42A" stopOpacity="0.32" />
              <stop offset="1" stopColor="#FFA42A" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Nacht leicht abdunkeln */}
          <rect x={geo.x(0)} y={PAD.top} width={Math.max(0, geo.x(day.sunrise * 60) - geo.x(0))} height={MAIN_H - PAD.top - PAD.bottom} fill="#0A0F14" opacity={0.45} />
          <rect
            x={geo.x(day.sunset * 60)}
            y={PAD.top}
            width={Math.max(0, geo.x(1440) - geo.x(day.sunset * 60))}
            height={MAIN_H - PAD.top - PAD.bottom}
            fill="#0A0F14"
            opacity={0.45}
          />
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={r1(geo.y(t))} y2={r1(geo.y(t))} stroke="#26323D" strokeWidth={1} />
              <text x={PAD.left - 8} y={r1(geo.y(t)) + 4} textAnchor="end" fontSize={11} fill="#8D9AA5" fontFamily="var(--font-mono)">
                {Math.round(t)} W
              </text>
            </g>
          ))}
          {xHours.map((h) => (
            <text
              key={h}
              x={r1(geo.x(h * 60))}
              y={MAIN_H - 8}
              textAnchor={h === 0 ? "start" : h === 24 ? "end" : "middle"}
              fontSize={11}
              fill="#8D9AA5"
              fontFamily="var(--font-mono)"
            >
              {h === 24 && !compact ? "24 Uhr" : `${h}`}
            </text>
          ))}
          <path d={geo.pvArea} fill="url(#dash-pv-area)" />
          <MemoLine d={geo.loadLine} color={LOAD_COLOR} />
          <MemoLine d={geo.pvLine} color={SUN} />

          {/* Fadenkreuz */}
          <line x1={r1(geo.x(shown))} x2={r1(geo.x(shown))} y1={PAD.top} y2={MAIN_H - PAD.bottom} stroke="#F8FAF7" strokeOpacity={hover !== null ? 0.35 : 0.6} />
          <circle cx={r1(geo.x(shown))} cy={r1(geo.y(s.loadW))} r={4.5} fill={LOAD_COLOR} stroke="#151E27" strokeWidth={2} />
          <circle cx={r1(geo.x(shown))} cy={r1(geo.y(s.pvW))} r={4.5} fill={SUN} stroke="#151E27" strokeWidth={2} />
          <rect x={PAD.left} y={PAD.top} width={geo.plotW} height={MAIN_H - PAD.top - PAD.bottom} fill="transparent" />
        </svg>

        {/* Tooltip nur beim Zeigen; die aktuelle Uhrzeit steht in den Kennzahlen */}
        {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-[1] min-w-[150px] rounded-xl border border-ink-line bg-ink/95 px-3 py-2 text-[12.5px] text-paper shadow-[0_12px_30px_-12px_rgb(0_0_0/0.6)]"
          style={{ left: tipLeft, transform: `translateX(${tipRight ? "calc(-100% - 12px)" : "12px"})` }}
          aria-hidden
        >
          <p className="font-mono text-[11px] text-muted-dark">{formatClock(shown)} Uhr</p>
          <p className="mt-1 flex justify-between gap-4">
            <span className="text-muted-dark">Erzeugung</span>
            <span className="tabular font-semibold">{fmtW(s.pvW)}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-dark">Verbrauch</span>
            <span className="tabular font-semibold">{fmtW(s.loadW)}</span>
          </p>
          {withStorage && (
            <p className="flex justify-between gap-4">
              <span className="text-muted-dark">Speicher</span>
              <span className="tabular font-semibold">{fmtPct((s.socPct ?? 0) / 100)}</span>
            </p>
          )}
        </div>
        )}

        {/* Ladestand als eigenes kleines Diagramm (eigene Skala, keine zweite Achse) */}
        {withStorage ? (
          <svg width={width} height={SOC_H} viewBox={`0 0 ${width} ${SOC_H}`} className="mt-2 block h-auto max-w-full" role="img" aria-label="Ladestand des Speichers über den Tag">
            <line x1={PAD.left} x2={width - PAD.right} y1={r1(geo.ys(0))} y2={r1(geo.ys(0))} stroke="#26323D" />
            <line x1={PAD.left} x2={width - PAD.right} y1={r1(geo.ys(100))} y2={r1(geo.ys(100))} stroke="#26323D" />
            <text x={PAD.left - 8} y={r1(geo.ys(100)) + 4} textAnchor="end" fontSize={11} fill="#8D9AA5" fontFamily="var(--font-mono)">
              100 %
            </text>
            <text x={PAD.left - 8} y={r1(geo.ys(0)) + 4} textAnchor="end" fontSize={11} fill="#8D9AA5" fontFamily="var(--font-mono)">
              0 %
            </text>
            <path d={geo.socArea} fill={LIME} opacity={0.16} />
            <path d={geo.socLine} fill="none" stroke={LIME} strokeWidth={1.75} strokeLinejoin="round" />
            <line x1={r1(geo.x(shown))} x2={r1(geo.x(shown))} y1={4} y2={SOC_H - 4} stroke="#F8FAF7" strokeOpacity={0.45} />
            <circle cx={r1(geo.x(shown))} cy={r1(geo.ys(s.socPct ?? 0))} r={4} fill={LIME} stroke="#151E27" strokeWidth={2} />
          </svg>
        ) : (
          <p className="mt-3 pl-[52px] text-[13px] text-muted-dark">Ohne Speicher: Überschuss am Mittag fließt ins Netz.</p>
        )}
      </div>

      {table && (
        <div className="max-h-80 overflow-auto rounded-xl border border-ink-line" data-lenis-prevent>
          <table className="w-full text-[13px]">
            <caption className="sr-only">Stündliche Werte des Beispieltags</caption>
            <thead className="sticky top-0 bg-ink-3 text-left text-muted-dark">
              <tr>
                <th className="px-3 py-2 font-medium">Uhrzeit</th>
                <th className="px-3 py-2 text-right font-medium">Erzeugung</th>
                <th className="px-3 py-2 text-right font-medium">Verbrauch</th>
                <th className="px-3 py-2 text-right font-medium">Netzbezug</th>
                {withStorage && <th className="px-3 py-2 text-right font-medium">Speicher</th>}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, h) => {
                const slice = day.steps.filter((x) => x.minute >= h * 60 && x.minute < (h + 1) * 60);
                const avg = (k: "pvW" | "loadW" | "importW") => slice.reduce((a, b) => a + b[k], 0) / slice.length;
                const last = slice[slice.length - 1]!;
                return (
                  <tr key={h} className="border-t border-ink-line text-paper">
                    <td className="px-3 py-1.5 font-mono">{String(h).padStart(2, "0")}:00</td>
                    <td className="tabular px-3 py-1.5 text-right">{fmtW(avg("pvW"))}</td>
                    <td className="tabular px-3 py-1.5 text-right">{fmtW(avg("loadW"))}</td>
                    <td className="tabular px-3 py-1.5 text-right">{fmtW(avg("importW"))}</td>
                    {withStorage && <td className="tabular px-3 py-1.5 text-right">{fmtPct((last.socPct ?? 0) / 100)}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-ink-line px-3 py-2 text-[12px] text-muted-dark">Mittelwerte je Stunde, Ladestand am Ende der Stunde. Simulation mit Beispieldaten.</p>
        </div>
      )}
    </div>
  );
}

const MemoLine = memo(function MemoLine({ d, color }: { d: string; color: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />;
});

export { PAD as CHART_PAD };
