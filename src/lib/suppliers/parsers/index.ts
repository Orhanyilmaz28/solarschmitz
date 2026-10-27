import Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";
import type { FeedFormat, RawRecord } from "../types";

/** Obergrenze für Feeds, die wir im Speicher verarbeiten (10 MB) */
export const MAX_FEED_BYTES = 10 * 1024 * 1024;

export interface ParseResult {
  records: RawRecord[];
  errors: string[];
}

export function detectFormat(text: string): FeedFormat {
  const t = text.replace(/^﻿/, "").trimStart();
  if (t.startsWith("<")) return "xml";
  if (t.startsWith("{") || t.startsWith("[")) return "json";
  return "csv";
}

function assertSize(text: string) {
  if (text.length > MAX_FEED_BYTES) throw new Error(`Feed ist zu groß (max. ${MAX_FEED_BYTES / 1024 / 1024} MB).`);
}

export function parseCsv(text: string): ParseResult {
  assertSize(text);
  const result = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  const errors = result.errors.slice(0, 50).map((e) => `CSV Zeile ${(e.row ?? 0) + 1}: ${e.message}`);
  return { records: result.data, errors };
}

/** Pfad wie "katalog.artikel" in einem Objekt auflösen */
function atPath(obj: unknown, path?: string): unknown {
  if (!path) return obj;
  let cur: unknown = obj;
  for (const key of path.split(".")) {
    if (cur && typeof cur === "object" && key in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cur;
}

/** Verschachtelte Felder zu "a.b"-Schlüsseln abflachen, damit das Mapping sie findet */
export function flatten(obj: Record<string, unknown>, prefix = "", out: RawRecord = {}): RawRecord {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v as Record<string, unknown>, key, out);
    else if (Array.isArray(v)) out[key] = v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ");
    else out[key] = v;
    // Zusätzlich den kurzen Namen, falls er nicht schon belegt ist
    if (prefix && !(k in out) && (v === null || typeof v !== "object")) out[k] = v;
  }
  return out;
}

function toRecords(value: unknown): RawRecord[] {
  if (value === undefined || value === null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null).map((x) => flatten(x));
}

/** Häufige Listen-Container automatisch finden, wenn kein recordPath gesetzt ist */
function guessList(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj;
  if (!obj || typeof obj !== "object") return undefined;
  const entries = Object.values(obj as Record<string, unknown>);
  for (const v of entries) if (Array.isArray(v)) return v;
  for (const v of entries) {
    const inner = guessList(v);
    if (inner) return inner;
  }
  return entries.length === 1 ? entries[0] : undefined;
}

export function parseXml(text: string, recordPath?: string): ParseResult {
  assertSize(text);
  // Keine DOCTYPE- oder ENTITY-Deklarationen (Schutz vor Entity-Expansion)
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) {
    return { records: [], errors: ["XML mit DOCTYPE- oder ENTITY-Deklaration wird aus Sicherheitsgründen nicht verarbeitet."] };
  }
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
    ignoreDeclaration: true,
    ignorePiTags: true,
    processEntities: true,
  });
  try {
    const doc = parser.parse(text.replace(/^﻿/, "")) as unknown;
    const list = recordPath ? atPath(doc, recordPath) : guessList(doc);
    const records = toRecords(list);
    return { records, errors: records.length ? [] : ["Keine Produkte im XML gefunden. Ist der recordPath richtig?"] };
  } catch (err) {
    return { records: [], errors: [`XML nicht lesbar: ${err instanceof Error ? err.message : String(err)}`] };
  }
}

export function parseJson(text: string, recordPath?: string): ParseResult {
  assertSize(text);
  try {
    const doc = JSON.parse(text) as unknown;
    const list = recordPath ? atPath(doc, recordPath) : guessList(doc);
    return { records: toRecords(list), errors: [] };
  } catch (err) {
    return { records: [], errors: [`JSON nicht lesbar: ${err instanceof Error ? err.message : String(err)}`] };
  }
}

export function parseFeed(text: string, format: FeedFormat, recordPath?: string): ParseResult {
  if (format === "xml") return parseXml(text, recordPath);
  if (format === "json") return parseJson(text, recordPath);
  return parseCsv(text);
}
