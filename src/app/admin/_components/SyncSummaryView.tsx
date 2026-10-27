"use client";

import { useMemo, useState } from "react";
import type { SyncSummary } from "@/app/api/admin/_summary";
import { formatEUR } from "@/lib/format";
import { priceFlagLabel, stockLabel, stockTone, syncStatusLabel, syncTone } from "./labels";
import { Pill, TableWrap, td, th } from "./ui";

const changeLabel = { new: "neu", changed: "geändert", unchanged: "unverändert", removed: "entfernt" } as const;
const fieldLabel: Record<string, string> = {
  name: "Name",
  price: "Preis",
  vatRate: "MwSt.",
  category: "Kategorie",
  specs: "Technik",
  stock: "Bestand",
  "supplier.costPrice": "EK",
  images: "Bilder",
  brand: "Marke",
};

type Filter = "alle" | "fehler" | "aenderungen";

export function SyncSummaryView({ summary }: { summary: SyncSummary }) {
  const [filter, setFilter] = useState<Filter>("alle");
  const rows = useMemo(() => {
    if (filter === "fehler") return summary.rows.filter((r) => r.status !== "ok");
    if (filter === "aenderungen") return summary.rows.filter((r) => r.change === "new" || r.change === "changed");
    return summary.rows;
  }, [filter, summary.rows]);
  const c = summary.counts;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Pill tone={syncTone(summary.status)}>{syncStatusLabel[summary.status]}</Pill>
        <Pill tone={summary.dryRun ? "info" : "ok"}>{summary.dryRun ? "Vorschau – nichts gespeichert" : "Übernommen"}</Pill>
        <span className="text-sm text-muted">Quelle: {summary.source}</span>
      </div>

      <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {(
          [
            ["Datensätze", c.received],
            ["Gültig", c.valid],
            ["Fehlerhaft", c.invalid],
            ["Neu", c.created],
            ["Geändert", c.updated],
            ["Unverändert", c.unchanged],
            ["Entfernt", summary.dryRun ? summary.removed.length : c.removed],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl bg-paper px-3 py-2">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="m-0 font-display text-xl font-bold tabular">{value}</dd>
          </div>
        ))}
      </dl>

      {summary.removed.length > 0 && (
        <p className="m-0 rounded-xl bg-sun-soft px-4 py-3 text-sm">
          {summary.removed.length} Produkte dieses Lieferanten stehen nicht mehr im Feed
          {summary.dryRun || c.removed === 0 ? " und bleiben unverändert (Entfernen nur mit Option „Fehlende entfernen“)." : " und wurden entfernt."}
        </p>
      )}

      {summary.rows.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Zeilen filtern">
            {(
              [
                ["alle", "Alle"],
                ["fehler", "Fehler & Hinweise"],
                ["aenderungen", "Nur Änderungen"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${filter === key ? "border-ink bg-ink text-paper" : "border-line bg-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Zeile</th>
                <th className={th}>Artikel</th>
                <th className={th}>Kategorie</th>
                <th className={`${th} text-right`}>EK netto</th>
                <th className={`${th} text-right`}>VK brutto</th>
                <th className={`${th} text-right`}>Marge</th>
                <th className={th}>Bestand</th>
                <th className={th}>Änderung</th>
                <th className={th}>Hinweise</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.row} className={r.status === "error" ? "bg-danger/5" : undefined}>
                  <td className={`${td} tabular text-muted`}>{r.row}</td>
                  <td className={`${td} min-w-[220px]`}>
                    <span className="font-semibold">{r.name ?? "–"}</span>
                    <br />
                    <span className="font-mono text-xs text-muted">{r.supplierSku ?? "ohne Artikelnummer"}</span>
                  </td>
                  <td className={td}>{r.category ?? "–"}</td>
                  <td className={`${td} text-right tabular`}>{r.costPrice !== undefined ? formatEUR(r.costPrice) : "–"}</td>
                  <td className={`${td} text-right tabular`}>
                    {r.price ? formatEUR(r.price) : "–"}
                    {r.vatRate !== undefined && <span className="block text-xs text-muted">{r.vatRate} % MwSt.</span>}
                  </td>
                  <td className={`${td} text-right tabular`}>{r.marginEUR !== null ? formatEUR(r.marginEUR) : "–"}</td>
                  <td className={td}>{r.stock ? <Pill tone={stockTone[r.stock.status]}>{stockLabel[r.stock.status]}{r.stock.quantity !== undefined ? ` (${r.stock.quantity})` : ""}</Pill> : "–"}</td>
                  <td className={td}>
                    {r.change ? changeLabel[r.change] : <Pill tone="error">nicht importiert</Pill>}
                    {r.changedFields && r.changedFields.length > 0 && (
                      <span className="block text-xs text-muted">{r.changedFields.map((f) => fieldLabel[f] ?? f).join(", ")}</span>
                    )}
                  </td>
                  <td className={`${td} min-w-[220px]`}>
                    {r.priceFlags.filter((f) => f !== "no_cost_price").map((f) => (
                      <span key={f} className="mr-1 inline-block">
                        <Pill tone={f === "below_min_margin" ? "warn" : "neutral"}>{priceFlagLabel[f] ?? f}</Pill>
                      </span>
                    ))}
                    {r.issues.length > 0 && (
                      <ul className="m-0 mt-1 list-none p-0 text-xs text-danger">
                        {r.issues.map((i, n) => (
                          <li key={n}>{i.message}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {summary.truncated && <p className="m-0 text-sm text-muted">Es werden nur die ersten Zeilen angezeigt.</p>}
        </>
      )}

      {summary.rows.length === 0 && summary.errors.length > 0 && (
        <div className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {summary.errors.map((e, i) => (
            <p key={i} className="m-0">
              {e}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
