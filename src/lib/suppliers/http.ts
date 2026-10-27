import { NotConfiguredError, SupplierError } from "./errors";

/** Umgebungsvariablen lesen; fehlende werden gesammelt statt sofort zu scheitern. */
export function readEnv(names: string[]): { values: Record<string, string>; missing: string[] } {
  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) values[n] = v.trim();
    else missing.push(n);
  }
  return { values, missing };
}

export function requireEnv(names: string[], what: string): Record<string, string> {
  const { values, missing } = readEnv(names);
  if (missing.length) throw new NotConfiguredError(`${what}: Zugangsdaten fehlen (${missing.join(", ")}).`, missing);
  return values;
}

/** fetch mit Zeitlimit und verständlicher Fehlermeldung */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number; supplierId: string },
): Promise<Response> {
  const { timeoutMs = 15_000, supplierId, ...rest } = init;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new SupplierError(`Lieferant antwortet mit HTTP ${res.status}`, supplierId, res.status);
    return res;
  } catch (err) {
    if (err instanceof SupplierError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new SupplierError(`Zeitüberschreitung nach ${timeoutMs / 1000} s`, supplierId);
    }
    throw new SupplierError(`Verbindung fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`, supplierId);
  } finally {
    clearTimeout(timer);
  }
}

/** Antworttext lesen, aber nicht unbegrenzt */
export async function readTextLimited(res: Response, maxBytes: number): Promise<string> {
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw new Error(`Antwort zu groß (${Math.round(len / 1024 / 1024)} MB)`);
  const text = await res.text();
  if (text.length > maxBytes) throw new Error("Antwort zu groß");
  return text;
}
