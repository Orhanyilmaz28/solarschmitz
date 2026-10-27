"use client";

import { useId, useMemo, useState } from "react";
import { formatEUR, formatInt, formatNumber } from "@/lib/format";
import { monthLabels } from "@/config/solar-assumptions";
import { clamp, useChartWidth } from "./useChartWidth";

function niceStep(range: number, ticks = 5) {
  const raw = range / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

/** Rundungsreste und -0 als glatte 0 behandeln */
const tidy = (v: number) => (Math.abs(v) < 1e-9 ? 0 : v);

interface CashflowPoint {
  year: number;
  cumulativeEUR: number;
}

/**
 * Kumulierte Bilanz über die Jahre (eine Reihe, eine Achse).
 * Unter der Nulllinie grau (Anschaffung noch nicht zurück), darüber grün.
 * Zeichnet in der gemessenen Breite, damit die Achsen auch mobil lesbar bleiben.
 */
export function CashflowChart({ data, paybackYears, caption }: { data: CashflowPoint[]; paybackYears: number | null; caption?: string }) {
  const uid = useId().replace(/:/g, "");
  const [box, W] = useChartWidth(640);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const narrow = W < 480;
  const H = Math.round(clamp(W * 0.44, 230, 300));
  const PAD = useMemo(() => ({ top: 20, right: narrow ? 12 : 20, bottom: 34, left: narrow ? 62 : 68 }), [narrow]);

  const { x, y, ticks, minV } = useMemo(() => {
    const values = data.map((d) => d.cumulativeEUR);
    const rawMin = tidy(Math.min(0, ...values));
    const rawMax = tidy(Math.max(0, ...values));
    const step = niceStep(rawMax - rawMin || 1, narrow ? 4 : 5);
    const minV = tidy(Math.floor(rawMin / step) * step);
    const maxV = tidy(Math.ceil(rawMax / step) * step);
    const maxYear = data[data.length - 1]?.year ?? 1;
    const x = (year: number) => PAD.left + (year / maxYear) * (W - PAD.left - PAD.right);
    const y = (v: number) => PAD.top + (1 - (v - minV) / (maxV - minV || 1)) * (H - PAD.top - PAD.bottom);
    const ticks: number[] = [];
    for (let v = minV; v <= maxV + 1e-9; v += step) ticks.push(tidy(v));
    return { x, y, ticks, minV };
  }, [data, W, H, PAD, narrow]);

  const path = data.map((d, i) => `${i ? "L" : "M"}${x(d.year).toFixed(1)} ${y(d.cumulativeEUR).toFixed(1)}`).join(" ");
  const last = data[data.length - 1];
  const maxYear = last?.year ?? 1;
  const area = `${path} L${x(maxYear)} ${y(0)} L${x(0)} ${y(0)} Z`;
  const zeroY = y(0);
  const h = hover !== null ? data[hover] : null;
  const yearStep = narrow ? 10 : 5;
  const showPayback = paybackYears !== null && paybackYears <= maxYear;
  // Beschriftung des Amortisationspunkts: immer vollständig innerhalb der Fläche
  const pbLabel = paybackYears !== null ? `Amortisiert nach ${formatNumber(paybackYears, 1)} Jahren` : "";
  const pbFont = narrow ? 12 : 13;
  const pbX = paybackYears !== null ? clamp(x(paybackYears) + 10, PAD.left + 4, W - PAD.right - pbLabel.length * pbFont * 0.56) : 0;

  return (
    <figure className="m-0">
      <div ref={box} className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          className="block h-auto w-full touch-pan-y"
          role="img"
          aria-label={`Kumulierte Bilanz über ${maxYear} Jahre. Endstand ${formatEUR(tidy(last?.cumulativeEUR ?? 0), { round: true })}.${
            showPayback ? ` Amortisiert nach ${formatNumber(paybackYears!, 1)} Jahren.` : ""
          }`}
          onPointerLeave={() => setHover(null)}
          onPointerMove={(e) => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * W;
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
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={narrow ? 11 : 12} fill="#9AA7B1" className="tabular" fontFamily="var(--font-mono)">
                {formatInt(t)} €
              </text>
            </g>
          ))}
          {/* x-Achse */}
          {data
            .filter((d) => d.year % yearStep === 0)
            .map((d) => (
              <text
                key={d.year}
                x={x(d.year)}
                y={H - 10}
                textAnchor={d.year === 0 ? "start" : d.year === maxYear ? "end" : "middle"}
                fontSize={narrow ? 11 : 12}
                fill="#9AA7B1"
                fontFamily="var(--font-mono)"
              >
                {d.year === 0 ? "Kauf" : `Jahr ${d.year}`}
              </text>
            ))}

          <path d={area} fill={`url(#fill-${uid})`} clipPath={`url(#above-${uid})`} />
          <path d={path} fill="none" stroke="#B7F34B" strokeWidth={2.5} strokeLinejoin="round" clipPath={`url(#above-${uid})`} />
          <path d={path} fill="none" stroke="#9AA7B1" strokeWidth={2.5} strokeLinejoin="round" clipPath={`url(#below-${uid})`} />

          {/* Amortisationspunkt */}
          {showPayback && (
            <g>
              <line x1={x(paybackYears!)} x2={x(paybackYears!)} y1={PAD.top} y2={H - PAD.bottom} stroke="#B7F34B" strokeOpacity={0.35} />
              <circle cx={x(paybackYears!)} cy={zeroY} r={6} fill="#B7F34B" stroke="#17222C" strokeWidth={2} />
              <text
                x={pbX}
                y={Math.min(zeroY + 22, H - PAD.bottom - 6)}
                fontSize={pbFont}
                fontWeight={600}
                fill="#F8FAF7"
                stroke="#17222C"
                strokeWidth={5}
                paintOrder="stroke"
              >
                {pbLabel}
              </text>
            </g>
          )}
          {/* Endwert markiert */}
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
          {minV < 0 && !narrow && (
            <text x={PAD.left + 8} y={PAD.top + 14} fontSize={12} fill="#9AA7B1" stroke="#17222C" strokeWidth={4} paintOrder="stroke">
              Grau: Anschaffung noch nicht zurückverdient
            </text>
          )}
        </svg>
        {h && (
          <div
            className="pointer-events-none absolute top-2 whitespace-nowrap rounded-xl bg-paper px-3 py-2 text-sm text-ink shadow-[var(--shadow-lift)]"
            style={{ left: `${(x(h.year) / W) * 100}%`, transform: `translateX(${x(h.year) > W * 0.6 ? "-105%" : "8%"})` }}
          >
            <p className="m-0 font-semibold">{h.year === 0 ? "Kauf" : `Nach ${h.year} ${h.year === 1 ? "Jahr" : "Jahren"}`}</p>
            <p className="m-0 tabular">{formatEUR(tidy(h.cumulativeEUR), { round: true })}</p>
          </div>
        )}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-dark">
        <span>
          {minV < 0 && narrow && (
            <span className="mb-1 flex items-center gap-2">
              <span aria-hidden className="inline-block h-[3px] w-4 shrink-0 rounded-full bg-[#9AA7B1]" />
              Anschaffung noch nicht zurückverdient
            </span>
          )}
          {caption ?? "Bilanz = eingesparte Stromkosten minus Anschaffungspreis, Jahr für Jahr aufsummiert."}
        </span>
        <button
          type="button"
          onClick={() => setShowTable((s) => !s)}
          aria-expanded={showTable}
          className="font-semibold text-paper underline decoration-paper/30 underline-offset-4 hover:decoration-lime"
        >
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
                  <td className="px-3 py-1.5 text-right font-mono tabular">{formatEUR(tidy(d.cumulativeEUR), { round: true })}</td>
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
  const [box, w] = useChartWidth(640);
  const [hover, setHover] = useState<number | null>(null);
  const narrow = w < 480;
  const h = Math.round(clamp(w * 0.32, 170, 210));
  const pad = { top: 24, right: 4, bottom: 28, left: narrow ? 36 : 44 };
  const max = Math.max(...values, 1);
  const step = niceStep(max, 3);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const slot = plotW / values.length;
  const barW = Math.max(6, Math.min(30, slot - 6));
  const yv = (v: number) => pad.top + plotH - (v / top) * plotH;
  const peak = values.indexOf(Math.max(...values));
  const short = slot < 30;

  return (
    <figure className="m-0">
      <div ref={box}>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width={w}
          height={h}
          className="block h-auto w-full touch-pan-y"
          role="img"
          aria-label={`Geschätzter Ertrag je Monat: ${values.map((v, i) => `${monthLabels[i]} ${formatInt(v)} kWh`).join(", ")}`}
          onPointerLeave={() => setHover(null)}
        >
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
            const r = Math.min(4, barW / 2, bh);
            const isHover = hover === i;
            return (
              <g key={i} onPointerEnter={() => setHover(i)}>
                <rect x={cx - slot / 2} y={pad.top} width={slot} height={plotH} fill="transparent" />
                {/* Daten-Ende abgerundet, an der Grundlinie gerade */}
                <path
                  d={`M${cx - barW / 2} ${pad.top + plotH} V${pad.top + plotH - bh + r} q0 -${r} ${r} -${r} h${barW - 2 * r} q${r} 0 ${r} ${r} V${pad.top + plotH} Z`}
                  fill="#FFA42A"
                  opacity={hover === null || isHover ? 1 : 0.45}
                />
                <text x={cx} y={h - 9} textAnchor="middle" fontSize={11} fill="#9AA7B1">
                  {short ? monthLabels[i]!.charAt(0) : monthLabels[i]}
                </text>
                {(isHover || (hover === null && i === peak)) && (
                  <text
                    x={clamp(cx, pad.left + 26, w - pad.right - 26)}
                    y={yv(v) - 8}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="#F8FAF7"
                    stroke="#17222C"
                    strokeWidth={4}
                    paintOrder="stroke"
                    className="tabular"
                  >
                    {formatInt(v)} kWh
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
