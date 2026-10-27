"use client";

import { useId, useMemo, useState } from "react";
import { formatEUR, formatInt, formatNumber } from "@/lib/format";
import { monthLabels } from "@/config/solar-assumptions";

/* Gemeinsame Maße: Plot + Achsenband passen immer in die Box */
const W = 640;
const H = 280;
const PAD = { top: 20, right: 20, bottom: 36, left: 64 };

function niceStep(range: number, ticks = 5) {
  const raw = range / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

interface CashflowPoint {
  year: number;
  cumulativeEUR: number;
}

/**
 * Kumulierte Bilanz über die Jahre (eine Reihe, eine Achse).
 * Unter der Nulllinie grau (Anschaffung noch nicht zurück), darüber grün.
 */
export function CashflowChart({ data, paybackYears }: { data: CashflowPoint[]; paybackYears: number | null }) {
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { x, y, ticks, minV, path, area } = useMemo(() => {
    const values = data.map((d) => d.cumulativeEUR);
    const rawMin = Math.min(0, ...values);
    const rawMax = Math.max(0, ...values);
    const step = niceStep(rawMax - rawMin || 1);
    const minV = Math.floor(rawMin / step) * step;
    const maxV = Math.ceil(rawMax / step) * step;
    const maxYear = data[data.length - 1]?.year ?? 1;
    const x = (year: number) => PAD.left + (year / maxYear) * (W - PAD.left - PAD.right);
    const y = (v: number) => PAD.top + (1 - (v - minV) / (maxV - minV || 1)) * (H - PAD.top - PAD.bottom);
    const ticks: number[] = [];
    for (let v = minV; v <= maxV + 1e-9; v += step) ticks.push(v);
    const path = data.map((d, i) => `${i ? "L" : "M"}${x(d.year).toFixed(1)} ${y(d.cumulativeEUR).toFixed(1)}`).join(" ");
    const area = `${path} L${x(maxYear)} ${y(0)} L${x(0)} ${y(0)} Z`;
    return { x, y, ticks, minV, maxV, path, area };
  }, [data]);

  const zeroY = y(0);
  const h = hover !== null ? data[hover] : null;
  const last = data[data.length - 1];

  return (
    <figure className="m-0">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-pan-y"
          role="img"
          aria-label={`Kumulierte Bilanz über ${last?.year ?? 0} Jahre. Endstand ${formatEUR(last?.cumulativeEUR ?? 0, { round: true })}.`}
          onPointerLeave={() => setHover(null)}
          onPointerMove={(e) => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * W;
            const maxYear = last?.year ?? 1;
            const year = Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * maxYear);
            setHover(Math.max(0, Math.min(data.length - 1, year)));
          }}
        >
          <defs>
            <clipPath id={`above-${uid}`}>
              <rect x={0} y={0} width={W} height={zeroY} />
            </clipPath>
            <clipPath id={`below-${uid}`}>
              <rect x={0} y={zeroY} width={W} height={H - zeroY} />
            </clipPath>
            <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#B7F34B" stopOpacity="0.28" />
              <stop offset="1" stopColor="#B7F34B" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Raster und y-Achse */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#2B3A46" strokeWidth={t === 0 ? 1.5 : 1} />
              <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" fontSize={12} fill="#9AA7B1" className="tabular" fontFamily="var(--font-mono)">
                {formatInt(t)} €
              </text>
            </g>
          ))}
          {/* x-Achse */}
          {data
            .filter((d) => d.year % 5 === 0)
            .map((d) => (
              <text key={d.year} x={x(d.year)} y={H - 12} textAnchor={d.year === 0 ? "start" : d.year === last?.year ? "end" : "middle"} fontSize={12} fill="#9AA7B1" fontFamily="var(--font-mono)">
                {d.year === 0 ? "Kauf" : `Jahr ${d.year}`}
              </text>
            ))}

          <path d={area} fill={`url(#fill-${uid})`} clipPath={`url(#above-${uid})`} />
          <path d={path} fill="none" stroke="#B7F34B" strokeWidth={2.5} strokeLinejoin="round" clipPath={`url(#above-${uid})`} />
          <path d={path} fill="none" stroke="#9AA7B1" strokeWidth={2.5} strokeLinejoin="round" clipPath={`url(#below-${uid})`} />

          {/* Amortisationspunkt */}
          {paybackYears !== null && paybackYears <= (last?.year ?? 0) && (
            <g>
              <line x1={x(paybackYears)} x2={x(paybackYears)} y1={PAD.top} y2={H - PAD.bottom} stroke="#B7F34B" strokeOpacity={0.35} />
              <circle cx={x(paybackYears)} cy={zeroY} r={6} fill="#B7F34B" stroke="#17222C" strokeWidth={2} />
              <text
                x={Math.min(x(paybackYears) + 10, W - PAD.right - 4)}
                y={zeroY + 22}
                textAnchor={x(paybackYears) > W - 170 ? "end" : "start"}
                fontSize={13}
                fontWeight={600}
                fill="#F8FAF7"
                stroke="#17222C"
                strokeWidth={5}
                paintOrder="stroke"
              >
                Amortisiert nach {formatNumber(paybackYears, 1)} Jahren
              </text>
            </g>
          )}
          {/* Endwert direkt beschriftet */}
          {last && (
            <circle cx={x(last.year)} cy={y(last.cumulativeEUR)} r={4.5} fill={last.cumulativeEUR >= 0 ? "#B7F34B" : "#9AA7B1"} stroke="#17222C" strokeWidth={2} />
          )}

          {/* Fadenkreuz */}
          {h && (
            <g pointerEvents="none">
              <line x1={x(h.year)} x2={x(h.year)} y1={PAD.top} y2={H - PAD.bottom} stroke="#F8FAF7" strokeOpacity={0.4} />
              <circle cx={x(h.year)} cy={y(h.cumulativeEUR)} r={5} fill="#F8FAF7" stroke="#17222C" strokeWidth={2} />
            </g>
          )}
          <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} fill="transparent" />
          {minV < 0 && (
            <text x={PAD.left + 8} y={PAD.top + 14} fontSize={12} fill="#9AA7B1" stroke="#17222C" strokeWidth={4} paintOrder="stroke">
              Grau: Anschaffung noch nicht zurückverdient
            </text>
          )}
        </svg>
        {h && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl bg-paper px-3 py-2 text-sm text-ink shadow-[var(--shadow-lift)]"
            style={{ left: `${(x(h.year) / W) * 100}%`, transform: `translateX(${x(h.year) > W * 0.6 ? "-105%" : "8%"})` }}
          >
            <p className="font-semibold">{h.year === 0 ? "Kauf" : `Nach ${h.year} ${h.year === 1 ? "Jahr" : "Jahren"}`}</p>
            <p className="tabular">{formatEUR(h.cumulativeEUR, { round: true })}</p>
          </div>
        )}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-dark">
        <span>Bilanz = eingesparte Stromkosten minus Anschaffungspreis, Jahr für Jahr aufsummiert.</span>
        <button type="button" onClick={() => setShowTable((s) => !s)} aria-expanded={showTable} className="font-semibold text-paper underline decoration-paper/30 underline-offset-4 hover:decoration-lime">
          {showTable ? "Tabelle ausblenden" : "Als Tabelle anzeigen"}
        </button>
      </figcaption>
      {showTable && (
        <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-ink-line" data-lenis-prevent>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-ink-3 text-left text-muted-dark">
              <tr>
                <th className="px-3 py-2 font-medium">Jahr</th>
                <th className="px-3 py-2 text-right font-medium">Bilanz</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.year} className="border-t border-ink-line">
                  <td className="px-3 py-1.5">{d.year === 0 ? "Kauf" : d.year}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular">{formatEUR(d.cumulativeEUR, { round: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}

/** Monatlicher Ertrag als Balken (eine Reihe, eine Farbe). */
export function MonthlyChart({ values }: { values: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 640;
  const h = 200;
  const pad = { top: 16, right: 8, bottom: 30, left: 44 };
  const max = Math.max(...values, 1);
  const step = niceStep(max, 3);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const slot = plotW / values.length;
  const barW = Math.min(30, slot - 6);
  const yv = (v: number) => pad.top + plotH - (v / top) * plotH;
  const peak = values.indexOf(Math.max(...values));

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Geschätzter Ertrag je Monat in kWh" onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={w - pad.right} y1={yv(t)} y2={yv(t)} stroke="#2B3A46" />
            <text x={pad.left - 8} y={yv(t) + 4} textAnchor="end" fontSize={11} fill="#9AA7B1" fontFamily="var(--font-mono)">
              {formatInt(t)}
            </text>
          </g>
        ))}
        {values.map((v, i) => {
          const cx = pad.left + slot * i + slot / 2;
          const bh = Math.max(0, (v / top) * plotH);
          const isHover = hover === i;
          return (
            <g key={i} onPointerEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${monthLabels[i]}: ${formatInt(v)} kWh`}>
              <rect x={cx - slot / 2} y={pad.top} width={slot} height={plotH} fill="transparent" />
              {/* Daten-Ende abgerundet, an der Grundlinie gerade */}
              <path
                d={`M${cx - barW / 2} ${pad.top + plotH} V${pad.top + plotH - bh + 4} q0 -4 4 -4 h${barW - 8} q4 0 4 4 V${pad.top + plotH} Z`}
                fill="#B7F34B"
                opacity={hover === null || isHover ? 1 : 0.45}
              />
              <text x={cx} y={h - 10} textAnchor="middle" fontSize={11} fill="#9AA7B1">
                {monthLabels[i]}
              </text>
              {(isHover || (hover === null && i === peak)) && (
                <text x={cx} y={yv(v) - 8} textAnchor="middle" fontSize={12} fontWeight={600} fill="#F8FAF7" className="tabular">
                  {formatInt(v)} kWh
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
