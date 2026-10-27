#!/usr/bin/env node
/**
 * Erzeugt die Logo-Dateien in /public/brand aus dem Markennamen in src/config/brand.ts.
 * Die Wortmarke wird in Pfade umgewandelt, damit die SVGs ohne installierte Schrift funktionieren.
 *
 *   npm run logo
 *
 * Braucht Internet (lädt die Schrift Archivo von Google Fonts, SIL Open Font License).
 * Hinter einem Proxy: NODE_USE_ENV_PROXY=1 npm run logo
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "brand");

const INK = "#101820";
const PAPER = "#F8FAF7";
const SUN_TOP = "#FFCB3D";
const SUN_BOTTOM = "#F5841F";

async function readBrand() {
  const src = await readFile(path.join(root, "src/config/brand.ts"), "utf8");
  const m = src.match(/wordmark:\s*\{\s*primary:\s*"([^"]+)",\s*secondary:\s*"([^"]*)"(?:,\s*joined:\s*(true|false))?\s*\}/);
  if (!m) throw new Error("Wortmarke in src/config/brand.ts nicht gefunden.");
  return { primary: m[1], secondary: m[2], joined: m[3] === "true" };
}

/** Holt eine statische TTF-Instanz (Breite 125 %, gewünschte Stärke) über die Google-Fonts-CSS-API */
async function loadFont(weight) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,${weight}`;
  const css = await (await fetch(cssUrl, { headers: { "User-Agent": "Mozilla/4.0" } })).text();
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error(`Keine TTF-Datei für Gewicht ${weight} gefunden.`);
  const buf = await (await fetch(url)).arrayBuffer();
  return opentype.parse(buf);
}

/** Setzt Text mit Laufweite (in em) und gibt Pfad + Breite zurück */
function textPath(font, text, x, baseline, size, tracking) {
  let cursor = x;
  const parts = [];
  const glyphs = font.stringToGlyphs(text);
  glyphs.forEach((g, i) => {
    parts.push(g.getPath(cursor, baseline, size).toPathData(2));
    const next = glyphs[i + 1];
    const kern = next ? font.getKerningValue(g, next) : 0;
    cursor += ((g.advanceWidth + kern) / font.unitsPerEm) * size + (next ? tracking * size : 0);
  });
  return { d: parts.join(""), width: cursor - x };
}

function iconGroup(panelColor, id) {
  return `<defs>
    <linearGradient id="sungrad-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SUN_TOP}"/><stop offset="1" stop-color="${SUN_BOTTOM}"/></linearGradient>
    <mask id="sun-${id}" maskUnits="userSpaceOnUse"><rect width="64" height="64" fill="#fff"/><polygon points="6,55 17,29 59,29 48,55" fill="#000" stroke="#000" stroke-width="6" stroke-linejoin="round"/></mask>
    <mask id="panel-${id}" maskUnits="userSpaceOnUse"><polygon points="6,55 17,29 59,29 48,55" fill="#fff" stroke="#fff" stroke-width="1" stroke-linejoin="round"/><line x1="38" y1="27" x2="27" y2="57" stroke="#000" stroke-width="3"/><line x1="2" y1="42" x2="62" y2="42" stroke="#000" stroke-width="3"/></mask>
  </defs>
  <circle cx="41" cy="21" r="13" fill="url(#sungrad-${id})" mask="url(#sun-${id})"/>
  <rect width="64" height="64" fill="${panelColor}" mask="url(#panel-${id})"/>`;
}

async function main() {
  const { primary, secondary, joined } = await readBrand();
  const label = joined ? `${primary}${secondary}` : `${primary} ${secondary}`;
  const [bold, regular] = await Promise.all([loadFont(800), loadFont(400)]);
  await mkdir(out, { recursive: true });

  // Wortmarke: Icon 64 hoch, Schrift mit Versalhöhe ~ 26
  const size = 32;
  const baseline = 44;
  const gap = 18;
  const startX = 64 + gap;
  const a = textPath(bold, primary, startX, baseline, size, 0.02);
  // Zusammengeschrieben: nur die normale Laufweite als Abstand, sonst ein Wortzwischenraum
  const space = joined ? size * 0.02 : size * 0.32;
  const b = secondary ? textPath(regular, secondary, startX + a.width + space, baseline, size, 0.02) : { d: "", width: 0 };
  const width = Math.ceil(startX + a.width + (secondary ? space + b.width : 0) + 2);

  const wordmark = (textColor, panelColor, id) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 64" width="${width}" height="64" role="img" aria-label="${label}">
  <title>${label}</title>
  ${iconGroup(panelColor, id)}
  <path d="${a.d}" fill="${textColor}"/>
  <path d="${b.d}" fill="${textColor}"/>
</svg>
`;
  const icon = (panelColor, id, tile) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${label}">
  ${tile ? `<rect width="64" height="64" rx="14" fill="${tile}"/><g transform="translate(4 3) scale(0.875)">` : ""}${iconGroup(panelColor, id)}${tile ? "</g>" : ""}
</svg>
`;

  const files = {
    "logo-light-bg.svg": wordmark(INK, INK, "l"),
    "logo-dark-bg.svg": wordmark(PAPER, PAPER, "d"),
    "icon-light-bg.svg": icon(INK, "il"),
    "icon-dark-bg.svg": icon(PAPER, "id"),
    "icon-app.svg": icon(PAPER, "ia", INK),
  };
  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(out, name), content);
    console.log(`geschrieben: public/brand/${name}`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
