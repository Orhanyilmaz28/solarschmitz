#!/usr/bin/env node
/**
 * Erzeugt das komplette Sonnenwerk-Logo aus dem Markennamen in src/config/brand.ts:
 *  - src/components/brand/logo-data.ts  (Pfade für die React-Komponenten)
 *  - public/brand/*.svg                  (Logo-Dateien für Druck, Social, Partner)
 *  - src/app/icon.svg                    (Favicon)
 *
 *   npm run logo
 *
 * Hauptlogo ist die Signatur: Im Schriftzug ist das „o“ die Sonne (mit Solarmodul).
 * Schrift: Sora (SIL Open Font License), wird von Google Fonts geladen und in Pfade umgewandelt.
 * Hinter einem Proxy: NODE_USE_ENV_PROXY=1 npm run logo
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---------- Farben ----------
const INK = "#101820";
const PAPER = "#F8FAF7";
const SUN_STOPS = [
  [0, "#FFD84D"],
  [0.6, "#FFA42A"],
  [1, "#FF6F1A"],
];

// ---------- Bildmarke (Raster 120, sichtbar 8–112) ----------
// Drei Viertel Sonne, ein Viertel Solarmodul mit 3 × 3 Zellen.
const GAP = 4.5; // Abstand Sonne ↔ Modul
const Q0 = 60 + GAP;
const QS = 112 - Q0;
const K = 3;
const CELL_GAP = 2.2;
const CHAMFER = 1.4; // abgeschrägte Ecken wie bei monokristallinen Zellen
const CELL = (QS - CELL_GAP * (K - 1)) / K;

const r2 = (n) => Math.round(n * 100) / 100;
const cham = (x, y, s, c) =>
  `M${r2(x + c)} ${r2(y)}H${r2(x + s - c)}L${r2(x + s)} ${r2(y + c)}V${r2(y + s - c)}L${r2(x + s - c)} ${r2(y + s)}H${r2(x + c)}L${r2(x)} ${r2(y + s - c)}V${r2(y + c)}Z`;

const SUN_PATH = "M60 60H112A52 52 0 1 0 60 112Z";
// Zellen in diagonaler Reihenfolge (von der Sonne weg) – wichtig für die Animation
const CELLS = [];
for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) CELLS.push({ i, j, d: cham(Q0 + i * (CELL + CELL_GAP), Q0 + j * (CELL + CELL_GAP), CELL, CHAMFER) });
CELLS.sort((a, b) => a.i + a.j - (b.i + b.j) || a.j - b.j);
const MODULE = { x: Q0, y: Q0, size: r2(QS) };
const GLINT = `M${r2(Q0)} ${r2(Q0 + QS * 0.62)}L${r2(Q0 + QS * 0.62)} ${r2(Q0)}H${r2(Q0 + QS * 0.82)}L${r2(Q0)} ${r2(Q0 + QS * 0.82)}Z`;

// ---------- Schrift ----------
async function readBrand() {
  const src = await readFile(path.join(root, "src/config/brand.ts"), "utf8");
  const m = src.match(/wordmark:\s*\{\s*primary:\s*"([^"]+)",\s*secondary:\s*"([^"]*)"/);
  if (!m) throw new Error("Wortmarke in src/config/brand.ts nicht gefunden.");
  return { primary: m[1], secondary: m[2] };
}

async function loadFont(weight) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Sora:wght@${weight}`, { headers: { "User-Agent": "Mozilla/4.0" } })).text();
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error(`Sora ${weight} nicht gefunden.`);
  return opentype.parse(await (await fetch(url)).arrayBuffer());
}

const TRACK = -0.03; // Laufweite in em
const F = 100; // Schriftgröße im Logo-Raster

/** Setzt Text Glyphe für Glyphe; liefert Pfade, Begrenzungsrahmen und Endposition. */
function setText(font, text, x, baseline) {
  const glyphs = font.stringToGlyphs(text);
  const paths = [];
  const box = emptyBox();
  let cursor = x;
  glyphs.forEach((g, i) => {
    const p = g.getPath(cursor, baseline, F);
    const b = p.getBoundingBox();
    if (Number.isFinite(b.x1)) grow(box, b.x1, b.y1, b.x2, b.y2);
    paths.push(p.toPathData(2));
    const next = glyphs[i + 1];
    const kern = next ? font.getKerningValue(g, next) : 0;
    cursor += ((g.advanceWidth + kern) / font.unitsPerEm) * F + TRACK * F;
  });
  return { paths, box, end: cursor };
}

const emptyBox = () => ({ x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity });
function grow(b, x1, y1, x2, y2) {
  b.x1 = Math.min(b.x1, x1);
  b.y1 = Math.min(b.y1, y1);
  b.x2 = Math.max(b.x2, x2);
  b.y2 = Math.max(b.y2, y2);
}

/** Verschiebt eine Komposition so, dass ihr Rahmen bei (pad, pad) beginnt. */
function normalize(comp, pad = 1) {
  const b = emptyBox();
  grow(b, comp.mark.x, comp.mark.y, comp.mark.x + comp.mark.size, comp.mark.y + comp.mark.size);
  for (const part of comp.parts) grow(b, part.box.x1, part.box.y1, part.box.x2, part.box.y2);
  const dx = pad - b.x1;
  const dy = pad - b.y1;
  return { dx, dy, width: r2(b.x2 - b.x1 + 2 * pad), height: r2(b.y2 - b.y1 + 2 * pad) };
}

// ---------- SVG-Bausteine ----------
const sunGradient = (id) =>
  `<linearGradient id="${id}" x1="0.15" y1="0" x2="0.55" y2="1">${SUN_STOPS.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;

/** Bildmarke als SVG-Gruppe in einem Feld (x, y, Kantenlänge). tone: light | dark | mono */
function markGroup({ x, y, size, tone, id, monoColor = INK, glow = false }) {
  const s = size / 104;
  const t = `translate(${r2(x - 8 * s)} ${r2(y - 8 * s)}) scale(${r2(s * 10000) / 10000})`;
  const cells = CELLS.map((c) => c.d).join("");
  if (tone === "mono") return `<g transform="${t}" fill="${monoColor}"><path d="${SUN_PATH}"/><path d="${cells}"/></g>`;
  const glass =
    tone === "light"
      ? `<linearGradient id="${id}-m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A3A4A"/><stop offset="1" stop-color="#0B121A"/></linearGradient>`
      : `<linearGradient id="${id}-m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D9E0E5"/></linearGradient>`;
  const glowDefs = glow
    ? `<radialGradient id="${id}-g" cx="60" cy="60" r="120" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FF9A2E" stop-opacity="0.55"/><stop offset="0.45" stop-color="#FF8A1F" stop-opacity="0.16"/><stop offset="1" stop-color="#FF8A1F" stop-opacity="0"/></radialGradient>`
    : "";
  return `<defs>${sunGradient(`${id}-s`)}${glass}${glowDefs}<mask id="${id}-c" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120"><path d="${cells}" fill="#fff"/></mask></defs>
  <g transform="${t}">${glow ? `<circle cx="60" cy="60" r="120" fill="url(#${id}-g)"/>` : ""}<path d="${SUN_PATH}" fill="url(#${id}-s)"/><g mask="url(#${id}-c)"><rect x="${MODULE.x}" y="${MODULE.y}" width="${MODULE.size}" height="${MODULE.size}" fill="url(#${id}-m)"/><path d="${GLINT}" fill="#fff" opacity="${tone === "light" ? 0.14 : 0.22}"/></g></g>`;
}

const svgDoc = (w, h, label, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(w)} ${r2(h)}" width="${Math.round(w)}" height="${Math.round(h)}" role="img" aria-label="${label}">
<title>${label}</title>
${body}
</svg>
`;

async function main() {
  const { primary, secondary } = await readBrand();
  const label = `${primary}${secondary}`;
  const [bold, light] = await Promise.all([loadFont(800), loadFont(400)]);
  const os2 = bold.tables.os2;
  const cap = (os2.sCapHeight / bold.unitsPerEm) * F;

  // ---- Kompositionen (erst setzen, dann auf 0/0 normalisieren) ----

  /** Signatur: das „o“ im Schriftzug ist die Sonne */
  function signature(ox = 0, oy = 0) {
    const oIndex = primary.toLowerCase().indexOf("o");
    if (oIndex < 0) throw new Error("Für die Signatur braucht der erste Wortteil ein „o“.");
    const oGlyph = bold.charToGlyph("o");
    const ob = oGlyph.getBoundingBox();
    const sc = F / bold.unitsPerEm;
    const base = oy + cap;
    const before = setText(bold, primary.slice(0, oIndex), ox, base);
    const oH = (ob.y2 - ob.y1) * sc; // Höhe des „o“ inkl. Überhang
    const mark = { x: before.end + ob.x1 * sc + ((ob.x2 - ob.x1) * sc - oH) / 2, y: base - ob.y2 * sc, size: oH };
    const after = setText(bold, primary.slice(oIndex + 1), before.end + oGlyph.advanceWidth * sc + TRACK * F, base);
    const rest = setText(light, secondary, after.end, base);
    return { mark, parts: [before, after, rest], bold: [...before.paths, ...after.paths], light: rest.paths };
  }

  /** Zeichen links, Schriftzug rechts */
  function lockup(ox = 0, oy = 0) {
    const size = cap * 1.62;
    const base = oy + size / 2 + cap / 2;
    const b = setText(bold, primary, ox + size * 1.27, base);
    const l = setText(light, secondary, b.end, base);
    return { mark: { x: ox, y: oy, size }, parts: [b, l], bold: b.paths, light: l.paths };
  }

  /** Zeichen über Schriftzug */
  function stacked(ox = 0, oy = 0) {
    const probeB = setText(bold, primary, 0, 0);
    const probeL = setText(light, secondary, probeB.end, 0);
    const textW = probeL.box.x2 - probeB.box.x1;
    const size = cap * 2.6;
    const w = Math.max(size, textW);
    const base = oy + size + cap * 0.9 + cap;
    const b = setText(bold, primary, ox + (w - textW) / 2 - probeB.box.x1, base);
    const l = setText(light, secondary, b.end, base);
    return { mark: { x: ox + (w - size) / 2, y: oy, size }, parts: [b, l], bold: b.paths, light: l.paths };
  }

  const finish = (fn) => {
    const n = normalize(fn(0, 0));
    const c = fn(n.dx, n.dy);
    const m = c.mark;
    return { width: n.width, height: n.height, mark: { x: r2(m.x), y: r2(m.y), size: r2(m.size) }, bold: c.bold, light: c.light };
  };
  const sig = finish(signature);
  const lock = finish(lockup);
  const stack = finish(stacked);

  // ---- TypeScript-Daten für die React-Komponenten ----
  const data = {
    text: label,
    font: "Sora 800 / 400",
    mark: { sun: SUN_PATH, cells: CELLS.map((c) => c.d), module: MODULE, glint: GLINT, sunStops: SUN_STOPS },
    signature: sig,
    lockup: lock,
    stacked: stack,
  };
  await writeFile(
    path.join(root, "src/components/brand/logo-data.ts"),
    `// Automatisch erzeugt von scripts/build-logo.mjs – nicht von Hand bearbeiten.\n// Neu erzeugen mit: npm run logo\n\nexport const logoData = ${JSON.stringify(data, null, 2)} as const;\n`,
  );

  // ---- SVG-Dateien ----
  const out = path.join(root, "public", "brand");
  await mkdir(out, { recursive: true });
  const textPaths = (d, color) => `<path fill="${color}" d="${d.bold.join("")}"/><path fill="${color}" d="${d.light.join("")}"/>`;
  const comp = (d, tone, id, ink, glow = false) => markGroup({ ...d.mark, tone, id, monoColor: ink, glow }) + textPaths(d, ink);
  const files = {
    // Hauptlogo: Signatur
    "sonnenwerk-logo.svg": svgDoc(sig.width, sig.height, label, comp(sig, "light", "a", INK)),
    "sonnenwerk-logo-dark.svg": svgDoc(sig.width, sig.height, label, comp(sig, "dark", "b", PAPER)),
    "sonnenwerk-logo-mono.svg": svgDoc(sig.width, sig.height, label, comp(sig, "mono", "c", INK)),
    "sonnenwerk-logo-mono-white.svg": svgDoc(sig.width, sig.height, label, comp(sig, "mono", "d", PAPER)),
    // Zweitversionen
    "sonnenwerk-logo-mit-zeichen.svg": svgDoc(lock.width, lock.height, label, comp(lock, "light", "e", INK)),
    "sonnenwerk-logo-mit-zeichen-dark.svg": svgDoc(lock.width, lock.height, label, comp(lock, "dark", "f", PAPER)),
    "sonnenwerk-stacked.svg": svgDoc(stack.width, stack.height, label, comp(stack, "light", "g", INK)),
    "sonnenwerk-stacked-dark.svg": svgDoc(stack.width, stack.height, label, comp(stack, "dark", "h", PAPER)),
    // Bildmarke allein
    "sonnenwerk-zeichen.svg": svgDoc(104, 104, label, markGroup({ x: 0, y: 0, size: 104, tone: "light", id: "i" })),
    "sonnenwerk-zeichen-dark.svg": svgDoc(104, 104, label, markGroup({ x: 0, y: 0, size: 104, tone: "dark", id: "j" })),
    "sonnenwerk-zeichen-mono.svg": svgDoc(104, 104, label, markGroup({ x: 0, y: 0, size: 104, tone: "mono", id: "k", monoColor: INK })),
  };

  // App-Icon / Favicon: dunkle Kachel mit Sonnenschein
  const appIcon = svgDoc(
    64,
    64,
    label,
    `<defs><radialGradient id="glow" cx="0.36" cy="0.34" r="0.55"><stop offset="0" stop-color="#FF9F2E" stop-opacity="0.55"/><stop offset="1" stop-color="#FF9F2E" stop-opacity="0"/></radialGradient></defs>
<rect width="64" height="64" rx="14" fill="${INK}"/><rect width="64" height="64" rx="14" fill="url(#glow)"/>
${markGroup({ x: 13, y: 13, size: 38, tone: "dark", id: "a" })}`,
  );
  files["sonnenwerk-app-icon.svg"] = appIcon;

  // Banner 1200 × 630 (Link-Vorschau, Social Media): Signatur leuchtet auf Anthrazit
  const bw = 1200;
  const bh = 630;
  const scale = 860 / sig.width;
  const bx = (bw - sig.width * scale) / 2;
  const by = (bh - sig.height * scale) / 2 - 20;
  files["sonnenwerk-banner.svg"] = svgDoc(
    bw,
    bh,
    label,
    `<defs><radialGradient id="bg" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#1B2733"/><stop offset="1" stop-color="${INK}"/></radialGradient></defs>
<rect width="${bw}" height="${bh}" fill="url(#bg)"/>
<g transform="translate(${r2(bx)} ${r2(by)}) scale(${r2(scale * 10000) / 10000})">${comp(sig, "dark", "z", PAPER, true)}</g>
<text x="${bw / 2}" y="${bh - 92}" text-anchor="middle" font-family="Sora, Arial, sans-serif" font-size="30" fill="#9AA7B1" letter-spacing="1">Balkonkraftwerke · Speicher · Solarmodule</text>`,
  );

  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(out, name), content);
    console.log(`geschrieben: public/brand/${name}`);
  }
  await writeFile(path.join(root, "src/app/icon.svg"), appIcon);
  console.log("geschrieben: src/app/icon.svg");
  console.log("geschrieben: src/components/brand/logo-data.ts");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
