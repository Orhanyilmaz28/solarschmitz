# Marke: Sonnenwerk

## Name ändern

Der Name steht nur an einer Stelle: `src/config/brand.ts` (`name`, `wordmark`, `shortName`). Mit `joined: true` wird die Wortmarke ohne Leerzeichen gesetzt.
Danach `npm run logo` ausführen, damit die SVG-Dateien neu erzeugt werden (braucht Internet für die Schrift; hinter einem Proxy `NODE_USE_ENV_PROXY=1 npm run logo`).

## Logo

**Bildmarke:** Eine Sonne geht hinter einem geneigten Solarmodul auf. Die Fugen zwischen den Zellen und der Spalt zur Sonne sind ausgestanzt, damit das Zeichen auf jedem Untergrund sauber steht und auch als 16-px-Favicon lesbar bleibt.

**Wortmarke:** SONNENWERK in Archivo, breite Ausprägung (125 %), zusammengeschrieben: „SONNEN“ fett (800), „WERK“ normal (400).

| Datei | Verwendung |
|---|---|
| `public/brand/logo-light-bg.svg` | Wort-Bild-Marke auf hellem Grund |
| `public/brand/logo-dark-bg.svg` | Wort-Bild-Marke auf dunklem Grund |
| `public/brand/icon-light-bg.svg` / `icon-dark-bg.svg` | Bildmarke allein |
| `public/brand/icon-app.svg`, `src/app/icon.svg`, `src/app/apple-icon.png` | App-Icon und Favicon |
| `src/components/brand/Logo.tsx` | React-Komponenten `Logo` und `LogoIcon` mit `tone="light" | "dark"` |

Schutzraum: mindestens die halbe Höhe der Bildmarke rundum. Die Sonne ist immer in Sonnenfarben (Verlauf #FFCB3D → #F5841F, in `brand.colors.sunTop/sunBottom`).

## Farben

| Token | Wert | Einsatz |
|---|---|---|
| `ink` | #101820 | Text, dunkle Abschnitte |
| `lime` | #B7F34B | Handlungen, Energie, Akzente. Nie für Fließtext auf Hell |
| `lime-deep` | #3E6A00 | Grüner Text auf hellem Grund |
| `paper` | #F8FAF7 | Seitenhintergrund |
| `mist` | #E9EEF0 | Flächen, Karten-Hintergründe |
| `sun` | #FFB547 | Sonnenlicht, Hinweise „Vorschau“ |

## Schriften

- **Archivo** (breit, kräftig): Überschriften und Wortmarke
- **Hanken Grotesk**: Fließtext und große Kennzahlen
- **JetBrains Mono**: technische Daten, Einheiten, kleine Labels

Alle über `next/font` selbst gehostet (keine Verbindung zu Google beim Seitenaufruf).
