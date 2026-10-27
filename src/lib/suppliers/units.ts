/**
 * Parser für Zahlen und Einheiten aus Lieferanten-Feeds.
 * Feeds kommen oft mit deutschen Dezimalkommas ("1,6 kWh"), Tausenderpunkten
 * ("1.209,00 €") oder gemischten Einheiten ("1600 Wh" statt "1,6 kWh").
 */

/** "1.209,00" -> 1209, "1,6" -> 1.6, "1,209.50" -> 1209.5, "440" -> 440. Ungültig -> null */
export function parseGermanNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  let s = raw.trim().replace(/[\s\u00a0\u202f']/g, "");
  if (!s) return null;
  // Nur das erste Zahlenstück verwenden ("ca. 440Wp" -> "440")
  const m = s.match(/[-+]?\d[\d.,]*/);
  if (!m) return null;
  s = m[0];

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    // Das zuletzt stehende Zeichen ist der Dezimaltrenner
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    // "1,6" -> Dezimal; "1,600,000" -> Tausender
    s = /^\d{1,3}(,\d{3}){2,}$/.test(s) ? s.replace(/,/g, "") : s.replace(/,/g, ".");
  } else if (lastDot >= 0 && /^[-+]?\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.209" -> Tausenderpunkt
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** "1.209,00 €" / "EUR 329" / "329,-" -> Euro-Betrag */
export function parsePrice(raw: unknown): number | null {
  if (typeof raw === "string") {
    const cleaned = raw.replace(/(eur|€|,-)/gi, "").trim();
    return parseGermanNumber(cleaned);
  }
  return parseGermanNumber(raw);
}

export type UnitTarget = "W" | "kWh" | "mm";

const unitFactors: Record<UnitTarget, Record<string, number>> = {
  // Leistung: W und Wp werden gleich behandelt
  W: { w: 1, wp: 1, kw: 1000, kwp: 1000 },
  kWh: { wh: 0.001, kwh: 1 },
  mm: { mm: 1, cm: 10, m: 1000 },
};

/**
 * Liest einen Wert mit Einheit und rechnet in die Zieleinheit um.
 * Ohne Einheit wird die Zahl als Zieleinheit verstanden.
 * parseQuantity("1600 Wh", "kWh") -> 1.6, parseQuantity("0,88 kWp", "W") -> 880
 */
export function parseQuantity(raw: unknown, target: UnitTarget): number | null {
  if (typeof raw !== "string") return parseGermanNumber(raw);
  const m = raw.match(/([-+]?\d[\d.,\s\u00a0]*)\s*([a-zA-Z]+)?/);
  if (!m || !m[1]) return null;
  const value = parseGermanNumber(m[1]);
  if (value === null) return null;
  const unit = (m[2] ?? "").toLowerCase();
  if (!unit) return value;
  const factor = unitFactors[target][unit];
  if (factor === undefined) return null;
  // Rundung gegen Gleitkomma-Reste (1600 * 0.001 = 1.6000000000000003)
  return Math.round(value * factor * 1e6) / 1e6;
}

/** "2 x 440 W" -> { count: 2, each: 440 } */
export function parseModuleSpec(raw: unknown): { count: number; each: number } | null {
  if (typeof raw !== "string") return null;
  const m = raw.match(/(\d+)\s*[x×*]\s*([\d.,]+)\s*(k?wp?)?/i);
  if (!m || !m[1] || !m[2]) return null;
  const count = Number(m[1]);
  const each = parseQuantity(`${m[2]} ${m[3] ?? "W"}`, "W");
  return count > 0 && each ? { count, each } : null;
}

export function parseInteger(raw: unknown): number | null {
  const n = parseGermanNumber(raw);
  return n === null ? null : Math.trunc(n);
}

export function parseBoolean(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw;
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  if (["1", "ja", "yes", "true", "wahr", "x"].includes(s)) return true;
  if (["0", "nein", "no", "false", "falsch", ""].includes(s)) return false;
  return null;
}

/** MwSt.-Satz aus "0", "0 %", "19%", "0,19" */
export function parseVatRate(raw: unknown): 0 | 19 | null {
  const n = parseGermanNumber(raw);
  if (n === null) return null;
  if (n === 0) return 0;
  if (n === 19 || n === 0.19) return 19;
  return null;
}
