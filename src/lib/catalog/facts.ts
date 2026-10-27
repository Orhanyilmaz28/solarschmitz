import type { Product } from "./types";
import { mountCapacity } from "./index";
import { formatInt, formatNumber } from "@/lib/format";

/**
 * Aufbereitete Produktfakten für die Produktseite.
 * Alles wird ausschließlich aus vorhandenen Produktdaten abgeleitet: Fehlt ein Wert,
 * entfällt die Angabe, statt etwas zu schätzen.
 */

const kWh = (n: number) => formatNumber(n, n % 1 === 0 ? 0 : 1);
const isSetCategory = (p: Product) => p.category === "balkonkraftwerke" || p.category === "balkonkraftwerke-mit-speicher";

// ---------- Auf einen Blick ----------

export interface KeyFigure {
  value: string;
  unit: string;
  label: string;
  /** Textwert statt Zahl (kleiner gesetzt) */
  text?: boolean;
}

/** Bis zu `max` große Kennzahlen. Textwerte nur, wenn mindestens eine Zahl vorhanden ist. */
export function keyFigures(p: Product, max = 3): KeyFigure[] {
  const s = p.specs;
  const nums: KeyFigure[] = [];
  if (s.totalWp) nums.push({ value: formatInt(s.totalWp), unit: "Wp", label: "Modulleistung" });
  if (s.storageKWh) nums.push({ value: kWh(s.storageKWh), unit: "kWh", label: "Speicher" });
  if (s.inverterW) nums.push({ value: formatInt(s.inverterW), unit: "W", label: isSetCategory(p) ? "Wechselrichter" : "Ausgangsleistung" });
  if (s.storageMaxKWh) nums.push({ value: kWh(s.storageMaxKWh), unit: "kWh", label: "Erweiterbar bis" });
  if (s.moduleCount && s.moduleCount > 1 && s.moduleWp) nums.push({ value: String(s.moduleCount), unit: `× ${formatInt(s.moduleWp)} Wp`, label: "Solarmodule" });
  if (s.mppt) nums.push({ value: String(s.mppt), unit: "", label: "MPP-Tracker" });
  const cap = p.category === "montage-zubehoer" ? mountCapacity(p) : undefined;
  if (cap) nums.push({ value: String(cap), unit: cap === 1 ? "Modul" : "Module", label: "Aufnahme" });
  if (s.tiltRange) nums.push({ value: s.tiltRange.replace(/°\s*$/, ""), unit: "°", label: "Neigungswinkel" });
  if (s.maxLengthMm) nums.push({ value: formatInt(s.maxLengthMm), unit: "mm", label: "Max. Modulbreite" });
  if (!nums.length) return [];

  const texts: KeyFigure[] = [];
  if (s.moduleType) texts.push({ value: s.moduleType, unit: "", label: "Modultyp", text: true });
  if (s.connectivity) texts.push({ value: s.connectivity, unit: "", label: "Verbindung", text: true });
  return [...nums, ...texts].slice(0, max);
}

// ---------- Hotspots auf der Schemazeichnung ----------

export type HotspotAnchor = "modules" | "inverter" | "storage" | "connect" | "cable" | "mppt" | "tilt" | "length" | "compat" | "frame";

export interface Hotspot {
  anchor: HotspotAnchor;
  title: string;
  text: string;
}

const findInclude = (p: Product, re: RegExp) => p.includes.find((i) => re.test(i));
const joinParts = (parts: (string | number | null | undefined | false)[]) =>
  parts.filter((x): x is string => typeof x === "string" && x.length > 0).join(" · ");

/**
 * Erläuterungen für die Ankerpunkte der Zeichnung, nur aus Produktdaten.
 * Welche Anker eine Zeichnung tatsächlich hat, entscheidet die Darstellung.
 */
export function hotspotsFor(p: Product): Hotspot[] {
  const s = p.specs;
  const out: Hotspot[] = [];
  const push = (anchor: HotspotAnchor, title: string, text: string) => {
    if (text.trim()) out.push({ anchor, title, text });
  };
  const singleModule = p.visual === "module" || p.visual === "module-black";
  const set = isSetCategory(p);

  // Module
  const wp = s.moduleCount && s.moduleCount > 1 && s.moduleWp ? `${s.moduleCount} × ${formatInt(s.moduleWp)} Wp` : s.moduleWp ? `${formatInt(s.moduleWp)} Wp` : s.totalWp ? `${formatInt(s.totalWp)} Wp` : null;
  push("modules", (s.moduleCount ?? 1) > 1 ? "Solarmodule" : "Solarmodul", joinParts([wp, !singleModule && s.moduleType]));
  if (singleModule) push("frame", "Aufbau", joinParts([s.moduleType, s.cellType]));

  // Wechselrichter
  const inv = set ? p.includes.find((i) => /wechselrichter/i.test(i) && !/speicher|solarbank|batterie/i.test(i)) : undefined;
  const invPower = s.inverterW && !(inv && inv.includes(String(s.inverterW))) ? `${formatInt(s.inverterW)} W Ausgangsleistung` : null;
  if (p.visual === "inverter") {
    push("inverter", "Ausgangsleistung", s.inverterW ? `${formatInt(s.inverterW)} W` : "");
    push("mppt", "Eingänge", s.mppt ? `${s.mppt} MPP-Tracker` : "");
    push("connect", "Verbindung", s.connectivity ?? "");
  } else {
    push("inverter", "Wechselrichter", joinParts([inv, invPower]));
  }

  // Speicher
  const storageInclude = set ? findInclude(p, /solarbank|speicher|batterie/i) : undefined;
  push(
    "storage",
    "Speicher",
    joinParts([s.storageKWh && `${kWh(s.storageKWh)} kWh Kapazität`, s.storageMaxKWh && `erweiterbar bis ${kWh(s.storageMaxKWh)} kWh`, storageInclude]),
  );
  if (p.visual.startsWith("battery")) {
    if (s.connectivity) push("connect", "Steuerung", `per ${s.connectivity}`);
    else if (s.inverterW) push("connect", "Ausgangsleistung", `${formatInt(s.inverterW)} W`);
  }

  // Kabel
  const cable = findInclude(p, /kabel/i);
  if (cable) push("cable", "Anschluss", cable);

  // Montage
  const cap = p.category === "montage-zubehoer" ? mountCapacity(p) : undefined;
  if (s.tiltRange) push("tilt", "Neigungswinkel", s.tiltRange);
  if (s.maxLengthMm || cap) push("length", "Module", joinParts([cap && `für ${cap} ${cap === 1 ? "Modul" : "Module"}`, s.maxLengthMm && `bis ${formatInt(s.maxLengthMm)} mm Breite`]));

  // Zubehör
  if (s.compatibleWith) push("compat", "Kompatibel mit", s.compatibleWith);
  if (p.visual === "plug" && s.connectivity) push("connect", "Verbindung", s.connectivity);

  // Jeder Anker nur einmal
  return out.filter((h, i) => out.findIndex((o) => o.anchor === h.anchor) === i);
}

// ---------- Lieferumfang ----------

export type IncludeIcon = "panel" | "inverter" | "battery" | "chart" | "plug" | "bolt" | "tool" | "check";

/** Passendes Symbol für einen Eintrag im Lieferumfang */
export function includeIcon(item: string): IncludeIcon {
  const t = item.toLowerCase();
  if (/halterung|befestigung|montage|schiene|haken/.test(t)) return "tool";
  if (/smart meter|zähler|zaehler|meter/.test(t)) return "chart";
  if (/smart plug|steckdose/.test(t)) return "plug";
  if (/solarbank|speicher|batterie|akku|solarflow|stream/.test(t)) return "battery";
  if (/wechselrichter|inverter/.test(t)) return "inverter";
  if (/modul|panel/.test(t)) return "panel";
  if (/kabel|stecker|leitung/.test(t)) return "bolt";
  return "check";
}

// ---------- Rücknahme und Entsorgung ----------

export function hasBattery(p: Product): boolean {
  return p.category === "batteriespeicher" || p.category === "balkonkraftwerke-mit-speicher" || Boolean(p.specs.storageKWh);
}

/** Elektro- und Elektronikgerät im Sinne des ElektroG (auch Solarmodule). Reine Halterungen nicht. */
export function isElectrical(p: Product): boolean {
  return p.visual !== "mount-flat" && p.visual !== "mount-rail";
}

export interface ComplianceNote {
  id: "battdg" | "elektrog";
  title: string;
  paragraphs: string[];
}

/**
 * Sachliche Hinweise zu Rücknahme und Entsorgung. Die konkreten Rücknahmewege
 * hängen vom Lieferanten ab und müssen vor dem Verkaufsstart geprüft werden.
 */
export function complianceNotes(p: Product): ComplianceNote[] {
  const out: ComplianceNote[] = [];
  if (hasBattery(p)) {
    out.push({
      id: "battdg",
      title: "Batterien (BattDG)",
      paragraphs: [
        "Batterien und Akkus gehören nicht in den Hausmüll. Darauf weist das Symbol der durchgestrichenen Mülltonne hin.",
        "Für Altbatterien gelten Rücknahmepflichten für Hersteller und Handel. Wie du diesen Speicher am Ende der Nutzung zurückgibst, etwa per Abholung oder Versand, ergänzen wir vor dem Verkaufsstart.",
      ],
    });
  }
  if (isElectrical(p)) {
    out.push({
      id: "elektrog",
      title: "Elektro- und Elektronikgeräte (ElektroG)",
      paragraphs: [
        "Altgeräte gehören nicht in den Hausmüll (Symbol der durchgestrichenen Mülltonne). Du kannst sie kostenlos bei den Sammelstellen deiner Stadt oder Gemeinde abgeben.",
        ...(p.specs.connectivity
          ? ["Lösche vor der Rückgabe persönliche Daten auf dem Gerät, zum Beispiel App-Verknüpfungen und WLAN-Zugangsdaten. Dafür bist du selbst verantwortlich."]
          : []),
        "Ob und wie wir als Händler Altgeräte zurücknehmen, ergänzen wir vor dem Verkaufsstart.",
      ],
    });
  }
  return out;
}

// ---------- Herstellerangaben (GPSR) ----------

export interface GpsrRow {
  label: string;
  /** null = fehlt noch und wird als „wird ergänzt“ markiert */
  value: string | null;
  hint?: string;
}

/** Angaben nach Art. 19 der EU-Produktsicherheitsverordnung (VO (EU) 2023/988) */
export function gpsrRows(p: Product): GpsrRow[] {
  const m = p.manufacturer;
  return [
    { label: "Hersteller", value: m.name ?? null },
    { label: "Postanschrift", value: m.address ?? null },
    { label: "Elektronische Adresse", value: m.email ?? null },
    { label: "Verantwortliche Person in der EU", value: m.euResponsible ?? null, hint: "nur nötig, wenn der Hersteller außerhalb der EU sitzt" },
    { label: "Produktkennung", value: `${p.name}, Art.\u2011Nr.\u00a0${p.sku}` },
  ];
}
