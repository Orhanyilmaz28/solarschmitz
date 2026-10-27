# Marke: Sonnenwerk

Design-DNA **„Licht & Präzision“**: ruhige Flächen, Nacht für filmische Momente, Sonnenfarben nur für Licht und Energie, Grün nur für die eine Haupthandlung. Alles auf einen Blick, mit Downloads: **`/marke`** (nicht indexiert).

## Name ändern

Der Name steht nur in `src/config/brand.ts` (`name`, `wordmark.primary`, `wordmark.secondary`). Danach das Logo neu erzeugen:

```bash
npm run logo            # hinter einem Proxy: NODE_USE_ENV_PROXY=1 npm run logo
```

Das Skript `scripts/build-logo.mjs` lädt Sora (SIL Open Font License) von Google Fonts, wandelt die Buchstaben in Pfade um und schreibt:
- `src/components/brand/logo-data.ts` für die React-Komponenten
- alle Dateien in `public/brand/`
- `src/app/icon.svg` (Favicon)

Für die Signatur braucht der erste Wortteil ein „o“.

## Logo-Paket

**Zeichen („Werksonne“):** drei Viertel Sonne, ein Viertel Solarmodul mit 3 × 3 Zellen und abgeschrägten Ecken wie bei monokristallinen Zellen.

**Hauptlogo (Signatur):** Im Schriftzug ist das „o“ die Sonne, mit Modul. Schrift Sora: „Sonnen“ in 800, „werk“ in 400, Laufweite −3 %.

| Fassung | Dateien in `public/brand/` | Einsatz |
|---|---|---|
| Hauptlogo | `sonnenwerk-logo.svg`, `-dark.svg` | Website, Drucksachen, Fahrzeuge |
| Kompakt | `sonnenwerk-logo-kompakt.svg`, `-dark.svg` | Kleine Größen (16–20 px Höhe): Laufweite 0, Zeichen mit 2 × 2 Zellen |
| Monogramm „S☀“ | `sonnenwerk-monogramm.svg`, `-dark.svg`, `-kachel.svg` (512 × 512) | Knappe Flächen, Stempel, Profilbild |
| Zeichen | `sonnenwerk-zeichen.svg`, `-dark.svg`, `-mono.svg` | Muster, Social, Wasserzeichen |
| App-Icon / Favicon | `sonnenwerk-app-icon.svg`, `src/app/icon.svg`, `src/app/apple-icon.png` | Browser-Tab, Startbildschirm |
| Mit Zeichen | `sonnenwerk-logo-mit-zeichen.svg`, `-dark.svg` | Zeichen links, Schrift rechts, z. B. Schilder |
| Gestapelt | `sonnenwerk-stacked.svg`, `-dark.svg` | Quadratische, zentrierte Layouts |
| Einfarbig | `sonnenwerk-logo-mono.svg`, `-mono-white.svg` | Prägung, Gravur, Folie |
| Animiert | `sonnenwerk-logo-animiert.svg` | Eigenständige SVG mit Auftritt; bei „Bewegung reduzieren“ sofort fertig |
| Link-Vorschau | `sonnenwerk-banner.svg`, `src/app/opengraph-image.png` | 1200 × 630 |

**React:** `src/components/brand/Logo.tsx`
- `<Logo variant="signature" | "lockup" | "stacked" | "monogram" tone="light" | "dark" | "mono" animated glow />`
- `<LogoMark size={40} />`

**Auftritt (animated):**
1. Die Sonne geht im Kreis auf (Maske).
2. Die Zellen laden diagonal nacheinander.
3. Ein Lichtreflex gleitet über das Modul.
4. Die Buchstaben steigen auf.

Dauer etwa 1,8 s, nur CSS, ohne JavaScript.

### Regeln

- **Schutzzone:** rundum mindestens die Höhe der Sonne.
- **Mindestgrößen:**
  - Signatur ab 20 px Höhe
  - darunter die Kompakt-Fassung ab 16 px
  - Zeichen ab 16 px
- **Nicht erlaubt:**
  - Sonne umfärben
  - Zellen weglassen
  - Schrift verzerren oder neu setzen
  - Schatten oder Konturen
  - auf unruhige Fotos ohne ruhige Fläche setzen

## Farben (`src/app/globals.css`, `@theme`)

| Token | Wert | Einsatz |
|---|---|---|
| `night` | #0A0F14 | Filmische Kapitel, Fußzeile |
| `ink` | #101820 | Text, dunkle Flächen |
| `paper` | #F8FAF7 | Grundfläche |
| `stone` | #EEF1EF | Ruhige Flächen |
| `mist` / `line` | #E9EEF0 / #DCE2E5 | Flächen, Linien |
| `sun-1` / `sun-2` / `sun-3` | #FFD84D / #FFA42A / #FF6F1A | Licht und Energie, als `--sun-gradient` |
| `lime` | #B7F34B | Nur die eine Haupthandlung je Ansicht |

## Schrift

- **Sora** (Display, wie das Logo): Überschriften. Skala `t-hero`, `t-display`, `t-h1`, `t-h2`, `t-h3`
- **Hanken Grotesk**: Fließtext (`t-lead` für Einleitungen)
- **JetBrains Mono**: Zahlen, Einheiten, Labels (`t-label`, `t-num`)

Alle über `next/font` selbst gehostet. Beim Seitenaufruf besteht keine Verbindung zu Google.

## Bildsprache „Linienwerk“

Feine, präzise Linien auf Nacht, perspektivisch berechnet (eigene Engine in `src/lib/linework`). Sie kommt zum Einsatz in:
- Hero
- Kapitel 1 (Siedlung)
- Kapitel 3 (Speicher)

Sonnenverlauf nur dort, wo Licht oder Energie fließt.

Echte Produktfotos ersetzen die Zeichnungen, sobald sie vorliegen (siehe `docs/BILDER.md`). Gezeichnete Produkte geben sich nie als Foto aus.
