import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NotConfiguredError } from "../errors";
import { fetchWithTimeout, readEnv, readTextLimited, requireEnv } from "../http";
import { MAX_FEED_BYTES, parseFeed } from "../parsers";
import type { CatalogFetchResult, CatalogSource, ConnectionStatus } from "../types";

/** Beispiel- und Test-Feeds dürfen nur aus diesem Ordner gelesen werden */
export const FEED_DIR = path.join(process.cwd(), "data", "supplier-feeds");

export function resolveFeedPath(p: string): string {
  const abs = path.resolve(process.cwd(), p);
  const rel = path.relative(FEED_DIR, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Feed-Dateien müssen unter data/supplier-feeds liegen: ${p}`);
  }
  return abs;
}

function parseOrThrow(text: string, format: CatalogFetchResult["format"], source: string, recordPath?: string): CatalogFetchResult {
  const parsed = parseFeed(text, format, recordPath);
  if (!parsed.records.length && parsed.errors.length) throw new Error(parsed.errors.join(" "));
  return { records: parsed.records, format, source };
}

export async function fetchCatalogFrom(src: CatalogSource, supplierId: string): Promise<CatalogFetchResult> {
  switch (src.kind) {
    case "file": {
      const file = resolveFeedPath(src.path);
      const text = await readFile(file, "utf8");
      return parseOrThrow(text, src.format, path.relative(process.cwd(), file), src.recordPath);
    }
    case "url": {
      const env = requireEnv([src.urlEnv], "Feed-URL");
      const url = env[src.urlEnv]!;
      const headers: Record<string, string> = {};
      if (src.authEnv) {
        const key = process.env[src.authEnv];
        if (key) headers.Authorization = `Bearer ${key}`;
      }
      const res = await fetchWithTimeout(url, { supplierId, headers, timeoutMs: 30_000 });
      const text = await readTextLimited(res, MAX_FEED_BYTES);
      return parseOrThrow(text, src.format, new URL(url).host, src.recordPath);
    }
    case "rest": {
      const env = requireEnv([src.baseUrlEnv, src.apiKeyEnv], "Lieferanten-API");
      const url = joinUrl(env[src.baseUrlEnv]!, src.productsPath);
      const res = await fetchWithTimeout(url, {
        supplierId,
        headers: { Authorization: `Bearer ${env[src.apiKeyEnv]}`, Accept: "application/json" },
        timeoutMs: 30_000,
      });
      const text = await readTextLimited(res, MAX_FEED_BYTES);
      return parseOrThrow(text, "json", new URL(url).host, src.recordPath);
    }
    case "none":
      throw new NotConfiguredError("Für diesen Lieferanten ist keine Katalogquelle eingerichtet.");
  }
}

export function joinUrl(base: string, p: string): string {
  return `${base.replace(/\/+$/, "")}/${p.replace(/^\/+/, "")}`;
}

/** Prüft, ob die Katalogquelle erreichbar ist. Lädt keine Daten in den Shop. */
export async function testCatalogSource(src: CatalogSource, supplierId: string): Promise<ConnectionStatus> {
  const checkedAt = new Date().toISOString();
  try {
    switch (src.kind) {
      case "file": {
        const info = await stat(resolveFeedPath(src.path));
        return { state: "connected", message: `Datei gefunden (${Math.round(info.size / 1024)} KB).`, checkedAt };
      }
      case "url": {
        const { missing } = readEnv([src.urlEnv]);
        if (missing.length) return { state: "not_configured", message: "Feed-URL fehlt.", missing, checkedAt };
        const res = await fetchWithTimeout(process.env[src.urlEnv]!, { supplierId, method: "HEAD", timeoutMs: 10_000 });
        return { state: "connected", message: `Feed erreichbar (HTTP ${res.status}).`, checkedAt };
      }
      case "rest": {
        const { missing } = readEnv([src.baseUrlEnv, src.apiKeyEnv]);
        if (missing.length) return { state: "not_configured", message: "API-Zugang fehlt.", missing, checkedAt };
        const url = joinUrl(process.env[src.baseUrlEnv]!, src.productsPath);
        const res = await fetchWithTimeout(url, {
          supplierId,
          headers: { Authorization: `Bearer ${process.env[src.apiKeyEnv]}` },
          timeoutMs: 10_000,
        });
        return { state: "connected", message: `API erreichbar (HTTP ${res.status}).`, checkedAt };
      }
      case "none":
        return { state: "not_configured", message: "Keine Katalogquelle eingerichtet.", checkedAt };
    }
  } catch (err) {
    return { state: "error", message: err instanceof Error ? err.message : String(err), checkedAt };
  }
}
