"use client";

import { useState } from "react";
import type { SyncSummary } from "@/app/api/admin/_summary";
import type { ConnectionStatus } from "@/lib/suppliers/types";
import { SyncSummaryView } from "./SyncSummaryView";
import { Pill, formatDateTime, type Tone } from "./ui";

const connTone: Record<ConnectionStatus["state"], Tone> = {
  connected: "ok",
  manual: "ok",
  not_configured: "neutral",
  error: "error",
};
const connLabel: Record<ConnectionStatus["state"], string> = {
  connected: "Erreichbar",
  manual: "Erreichbar (manuelle Bestellung)",
  not_configured: "Nicht eingerichtet",
  error: "Fehler",
};

type Busy = null | "test" | "preview" | "commit";

export function SupplierActions({ supplierId }: { supplierId: string }) {
  const [busy, setBusy] = useState<Busy>(null);
  const [conn, setConn] = useState<ConnectionStatus | null>(null);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call<T>(url: string, kind: Exclude<Busy, null>): Promise<T | null> {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST" });
      const data = (await res.json()) as T & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Fehler ${res.status}`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anfrage fehlgeschlagen.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  const base = `/api/admin`;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            const d = await call<{ status: ConnectionStatus }>(`${base}/suppliers/${supplierId}/test`, "test");
            if (d) setConn(d.status);
          }}
          className="rounded-full border border-ink px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {busy === "test" ? "Prüfe…" : "Verbindung testen"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            const d = await call<SyncSummary>(`${base}/sync/${supplierId}`, "preview");
            if (d) setSummary(d);
          }}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
        >
          {busy === "preview" ? "Lade Katalog…" : "Testlauf (Vorschau)"}
        </button>
        {summary?.dryRun && summary.counts.valid > 0 && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              const d = await call<SyncSummary>(`${base}/sync/${supplierId}?commit=1`, "commit");
              if (d) setSummary(d);
            }}
            className="rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {busy === "commit" ? "Übernehme…" : `${summary.counts.valid} gültige Datensätze übernehmen`}
          </button>
        )}
      </div>

      <div aria-live="polite" className="space-y-4">
        {error && <p className="m-0 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        {conn && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-paper px-4 py-3 text-sm">
            <Pill tone={connTone[conn.state]}>{connLabel[conn.state]}</Pill>
            <span>{conn.message}</span>
            {conn.missing && conn.missing.length > 0 && (
              <span className="text-muted">
                Fehlt: <code className="font-mono text-xs">{conn.missing.join(", ")}</code>
              </span>
            )}
            <span className="text-muted">{formatDateTime(conn.checkedAt)}</span>
          </div>
        )}
        {summary && <SyncSummaryView summary={summary} />}
      </div>
    </div>
  );
}
