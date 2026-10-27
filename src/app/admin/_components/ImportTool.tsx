"use client";

import { useRef, useState } from "react";
import type { SyncSummary } from "@/app/api/admin/_summary";
import { SyncSummaryView } from "./SyncSummaryView";

interface SupplierOption {
  id: string;
  name: string;
}

type State = { kind: "idle" } | { kind: "loading"; commit: boolean } | { kind: "error"; message: string } | { kind: "done"; summary: SyncSummary };

export function ImportTool({ suppliers }: { suppliers: SupplierOption[] }) {
  const [supplierId, setSupplierId] = useState(suppliers.find((s) => s.id === "demo-feed")?.id ?? suppliers[0]?.id ?? "");
  const [format, setFormat] = useState("");
  const [recordPath, setRecordPath] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [removeMissing, setRemoveMissing] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [previewOk, setPreviewOk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function run(commit: boolean) {
    if (!file && !text.trim()) {
      setState({ kind: "error", message: "Bitte eine Datei wählen oder den Feed-Inhalt einfügen." });
      return;
    }
    setState({ kind: "loading", commit });
    const form = new FormData();
    form.set("supplierId", supplierId);
    if (format) form.set("format", format);
    if (recordPath.trim()) form.set("recordPath", recordPath.trim());
    if (file) form.set("file", file);
    else form.set("text", text);
    const params = new URLSearchParams();
    if (commit) params.set("commit", "1");
    if (removeMissing) params.set("removeMissing", "1");
    try {
      const res = await fetch(`/api/admin/import?${params}`, { method: "POST", body: form });
      const data = (await res.json()) as SyncSummary & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Fehler ${res.status}`);
      setState({ kind: "done", summary: data });
      setPreviewOk(!commit && data.counts.valid > 0);
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Import fehlgeschlagen." });
    }
  }

  function resetSource() {
    setPreviewOk(false);
    if (state.kind === "done") setState({ kind: "idle" });
  }

  const loading = state.kind === "loading";

  return (
    <div className="space-y-6">
      <form
        className="grid gap-5 rounded-2xl border border-line bg-white p-5 md:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void run(false);
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="imp-supplier">
              Lieferant
            </label>
            <select id="imp-supplier" className="field-input" value={supplierId} onChange={(e) => { setSupplierId(e.target.value); resetSource(); }}>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="imp-format">
              Format
            </label>
            <select id="imp-format" className="field-input" value={format} onChange={(e) => { setFormat(e.target.value); resetSource(); }}>
              <option value="">Automatisch erkennen</option>
              <option value="csv">CSV</option>
              <option value="xml">XML</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="imp-path">
              Pfad zur Produktliste <span className="font-normal text-muted">(optional, XML/JSON)</span>
            </label>
            <input id="imp-path" className="field-input" placeholder="z. B. katalog.artikel" value={recordPath} onChange={(e) => { setRecordPath(e.target.value); resetSource(); }} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="imp-file">
              Datei hochladen
            </label>
            <input
              ref={fileRef}
              id="imp-file"
              type="file"
              accept=".csv,.xml,.json,.txt,text/csv,application/xml,text/xml,application/json"
              className="field-input file:mr-3 file:rounded-full file:border-0 file:bg-mist file:px-3 file:py-1 file:font-semibold"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                resetSource();
              }}
            />
            {file && (
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-lime-deep"
                onClick={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                  resetSource();
                }}
              >
                Datei entfernen
              </button>
            )}
          </div>
          <div>
            <label className="field-label" htmlFor="imp-text">
              Oder Inhalt einfügen
            </label>
            <textarea
              id="imp-text"
              className="field-input min-h-[120px] font-mono text-xs"
              placeholder={"Artikelnummer;Bezeichnung;Kategorie;Einkaufspreis netto;UVP brutto;Bestand\n…"}
              value={text}
              disabled={Boolean(file)}
              onChange={(e) => {
                setText(e.target.value);
                resetSource();
              }}
            />
          </div>
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-ink" checked={removeMissing} onChange={(e) => setRemoveMissing(e.target.checked)} />
          <span>
            <strong>Fehlende entfernen:</strong> Produkte dieses Lieferanten, die nicht mehr im Feed stehen, beim Übernehmen löschen.
          </span>
        </label>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={loading} className="rounded-full bg-ink px-5 py-2.5 font-semibold text-paper disabled:opacity-50">
            {loading && !state.commit ? "Prüfe…" : "Vorschau erstellen"}
          </button>
          <button
            type="button"
            disabled={loading || !previewOk}
            onClick={() => void run(true)}
            className="rounded-full bg-lime px-5 py-2.5 font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
            title={previewOk ? undefined : "Erst eine Vorschau mit gültigen Datensätzen erstellen"}
          >
            {loading && state.commit ? "Übernehme…" : "Gültige Datensätze übernehmen"}
          </button>
        </div>
        <p className="m-0 text-sm text-muted">
          Die Vorschau speichert nichts. Beim Übernehmen werden nur gültige Datensätze gespeichert; fehlerhafte Zeilen werden übersprungen.
        </p>
      </form>

      <div aria-live="polite">
        {state.kind === "error" && <p className="m-0 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.message}</p>}
        {state.kind === "done" && (
          <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
            <SyncSummaryView summary={state.summary} />
          </div>
        )}
      </div>
    </div>
  );
}
