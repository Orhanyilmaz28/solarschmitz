# Premium-Upgrade Sonnenwerk: Bericht

Stand: 27.10.2026.

**Zum Namen:** Das Briefing nennt als Arbeitstitel „SCHMITZ SOLAR“. Umgesetzt ist „Sonnenwerk“, weil das zuletzt festgelegt wurde (Domain sonnenwerk.de, Logo, Impressum). Der Name steht nur in `src/config/brand.ts` und lässt sich dort ändern; danach `npm run logo`.

## 1. Was sich verbessert hat

| Bereich | Vorher | Jetzt |
|---|---|---|
| Design-DNA | Archivo, viele Einzelwerte | „Licht & Präzision“: Sora wie das Logo, feste Typoskala, Akte hell und dunkel, Sonnenverlauf nur für Licht und Energie, Grün nur für die Haupthandlung |
| Hero | animierte Szene, schwere Grafik im HTML | „Energie neu gedacht.“: Linienwerk-Szene mit eigener Perspektiv-Engine. Choreografie in reinem CSS: Szene, Zeilen-Reveal, Buttons, Fenster gehen an, Energieimpuls. Eigener Bildausschnitt für das Handy |
| Storytelling | eine Grafik mit Phasen | fünf Kapitel: Licht (Tageslauf über einer Siedlung), Modul (Explosionsansicht mit Hotspots), Speicher (Tag bis Morgen mit Energieflüssen), Dashboard, Morgen (Sonnenaufgang mit Abschluss) |
| Navigation | einfache Kopfzeile | transparent über dem Hero, dann helles oder dunkles Glas je nach Abschnitt; Mega-Menü mit Vorschau; sichtbare Suche (Strg K); Warenkorb-Zähler; Lesefortschritt; Vollbild-Menü am Handy |
| Konfigurator | 6 Fragen | drei Fragen (Ort mit Bildkarten, Unabhängigkeit, Priorität), danach ein visuelles Ergebnis mit System, Tageskurve, Ertrag, Ersparnis und Amortisation; Annahmen änderbar |
| Shop | Basis | neue Produktübersicht mit Filterleiste, Produktseite mit Varianten, Kaufbox, Bauteil-Schema und Hersteller-Infos (GPSR), Vergleich mit festem Kopf, keine Streichpreise |
| Recht | 0 % USt. pauschal | 0 % nur mit Bestätigung der Voraussetzungen, sonst 19 %; Server rechnet nach und speichert die Angabe mit Zeitstempel. Button-Lösung, wesentliche Merkmale vor dem Kauf. Widerrufsfunktion „Vertrag widerrufen“ nach § 356a BGB (seit 19.06.2026 Pflicht) |
| Logo-Paket | Signatur, Zeichen | dazu Kompakt-Fassung, Monogramm „S☀“ (auch als Kachel), animierte SVG, Markenseite `/marke` mit Downloads |
| Performance | Startseite 1,7 MB HTML (Entwicklung), Grafiken doppelt im HTML | Produktion: HTML 83 KB (gzip), JavaScript beim ersten Laden 145 KB statt 255 KB, große Grafiken als cachebare Dateien, GSAP und Lenis nachgeladen, Abschnitte unten per `content-visibility` |

## 2. Neue Komponenten (Auswahl)

- **Linienwerk:**
  - `src/lib/linework/engine.ts`: Perspektiv-Engine
  - `src/lib/linework/svg.ts`: SVG-Ausgabe
  - `src/app/art/[file]/route.ts`: Grafikdateien
  - `src/app/art/visual/[key]/route.ts`: Produktgrafiken als Dateien
- **Hero:** `src/components/home/Hero.tsx`, `hero/HeroArt.tsx`, `hero/heroSvg.ts`, `hero/houseScene.ts`
- **Kapitel:** in `src/components/home/chapters/`
  - Kapitel 1: `SunChapter`, `SunStage`, `sun/siedlung.ts`
  - Kapitel 2: `ModuleChapter`, `ModuleStage`
  - Kapitel 3: `StorageChapter`, `StorageStage`, `storageScene`, `storageArt`, `storageModel`
  - Kapitel 5: `ClosingChapter`
- **Kapitel 4:** `src/components/home/dashboard/*`, Simulation in `src/lib/energy-sim`
- **Navigation:** `Header`, `MegaMenu`, `MobileMenu`, `PreviewBanner`
- **Bewegung:**
  - `LineReveal`, `LazyMount`, `OffscreenPause`
  - `src/lib/motion/gsap.ts` (GSAP nachladen)
- **Bausteine:** `Icon`, `SectionHeader`, `ArtImage` (Art-Direction), `VisualImage`
- **Konfigurator 2.0:** `Configurator`, `Result`, `SystemDiagram`, `DayCurve`, `scenes/PlaceScene`, `src/lib/solar/recommend.ts`
- **Shop:** `FilterBar`, `ProductGrid`, `ProductMedia`, `ProductSchematic`, `pdp/*`, `CompareTable`, `CompareBar`, `VatFootnote`
- **Kasse:** `VatQuestion`, `OrderReview`, `CheckoutSummary`, `ZeroRateHint`
- **Recht:**
  - `src/lib/cart/vat.ts`
  - `src/lib/withdrawal`, `/vertrag-widerrufen`, `/api/widerruf`
- **Marke:**
  - `scripts/build-logo.mjs` (erzeugt das ganze Paket)
  - `src/components/brand/Logo.tsx`, `LogoReplay.tsx`, `/marke`

## 3. Animationen

| Ort | Ablauf | Technik |
|---|---|---|
| Hero | Schleier blendet aus → Zeilen gleiten aus der Maske (0,3 s, je 0,12 s versetzt) → Unterzeile, Buttons, Kennzahlen → Fenster flackern an → Energieimpuls läuft von der Sonne ins Haus → Scroll-Hinweis | CSS, startet ohne JavaScript; GSAP nur für Parallaxe |
| Kopfzeile | Höhe 80 → 66 px, Glas hell oder dunkel je nach Abschnitt, Lesefortschritt in Sonnenfarben | CSS, IntersectionObserver |
| Kapitel 1 | 04:30 bis 22:30: Nacht, Morgenrot, Tag, Abendrot, Nacht. Die Sonne zieht ihre Bahn, die Ertragskurve wächst unter ihr mit Messlinie und Watt-Angabe, Module spiegeln den Himmel, Fenster gehen aus und an, Uhr und kWh laufen mit | sticky Bühne, ScrollTrigger, Werte pro Bild über Refs |
| Kapitel 2 | Modul dreht in 3/4-Ansicht → sieben Schichten fahren auseinander → fünf Hotspots nacheinander | CSS-3D, ScrollTrigger |
| Kapitel 3 | 10:00 bis 10:00: Flüsse Module/Speicher/Haus/Netz mit wandernden Punkten, Ladestand, Himmel und Mond | sticky Bühne, ScrollTrigger |
| Kapitel 4 | Tag abspielen oder an der Zeitleiste ziehen | React, Simulation |
| Kapitel 5 | Sonne geht beim Hineinscrollen auf, Strahlen erscheinen | ScrollTrigger (scrub) |
| Logo | Sonne geht im Kreis auf, Zellen laden diagonal, Reflex gleitet, Buchstaben steigen auf | CSS |
| Überall | Zeilen-Reveal, Einblenden, magnetische Buttons, Menüs mit Clip-Path, Seitenübergang | CSS, IntersectionObserver |

**Regeln:**
- Bewegung läuft nur, wenn `<html data-motion="on">` gesetzt ist.
- Bei „Bewegung reduzieren“ und ohne JavaScript ist alles sofort sichtbar.
- Die Kapitel zeigen dann eine ruhige Fassung mit allen Texten.
- Dauer-Animationen pausieren außerhalb des Bildes.
- Kein WebGL.

## 4. Testergebnisse

| Prüfung | Ergebnis |
|---|---|
| TypeScript (`npm run typecheck`) | 0 Fehler |
| Tests (`npm test`) | 149 von 149 bestanden (Rechner, Simulation, Empfehlung, Preise, Steuer, Warenkorb, Bestellungen, Widerruf, Katalog, Lieferanten) |
| Produktions-Build | erfolgreich, 62 Seiten plus statische Grafikdateien |
| Seiten-QA (Produktion) | 21 Seiten × 375/430/820/1440/1920 px: kein horizontales Scrollen, keine Konsolenfehler (nur der gewollte 404-Status der Fehlerseite) |
| Ohne Bewegung / ohne JavaScript | alle Kapitel lesbar, keine versteckten Inhalte |

### Lighthouse 12.8 (Produktions-Build, lokal; Median aus mehreren Läufen)

| Seite | Gerät | Performance | LCP | TBT | CLS | Barrierefreiheit | Best Practices |
|---|---|---|---|---|---|---|---|
| Startseite | Desktop | 99 | 0,8 s | 0–10 ms | 0 | 100 | 100 |
| Startseite | Handy (Simulation) | 75–80 | 4,7 s | 200–270 ms | 0 | 100 | 100 |
| Produkte | Desktop / Handy | 98 / 76 | 1,1 s / 4,7 s | 0 / 270 ms | 0 | 100 | 100 |
| Produktseite | Desktop / Handy | 99 / 87 | 1,0 s / 3,9 s | 30 / 120 ms | 0 | 96* | 100 |
| Konfigurator | Desktop / Handy | 99 / 82 | 1,0 s / 4,0 s | 30 / 250 ms | 0 | 95* | 100 |

\* Die gefundenen Punkte (Kontrast, Linkbeschriftung, Schritt-Buttons) sind danach behoben.

**Ziele LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms:**
- **CLS:** überall 0.
- **Desktop:** alle Ziele erreicht.
- **Handy:** Die Lighthouse-Simulation (langsames 4G, 4-fache CPU-Drosselung, berechnet) ergibt einen LCP von 4,7 s und liegt damit über dem Ziel. Mit echter Drosselung im Browser gemessen (`--throttling-method=devtools`) sind es 2,5–3,0 s. Ungedrosselt erscheint das Hero-Bild nach 0,67 s.
- **Ursachen:**
  - die Datenmenge, die die Simulation vor dem LCP mitrechnet (Next.js/React-Grundlast, Schriften)
  - das Aktivieren der Seite
- **Messwerte aus dem Feld:** Lighthouse-Werte sind Labormessungen. Belastbar sind Felddaten nach dem Livegang, etwa über die Search Console oder Vercel Speed Insights.

**SEO:** Der Wert 63 auf der Startseite kommt von `noindex` im Vorschau-Modus und ist gewollt. Mit `site.previewMode = false` entfällt das.

**Unterwegs gefundene und behobene Ursachen:**
- **Zoom- oder Transparenz-Animation am Hero-Bild:** Chrome misst den LCP erst nach ihrem Ende. Jetzt steht das Bild ruhig, ein Schleier darüber blendet aus.
- **zod im Browser-Bundle:** Der Katalog wurde dort erneut geprüft. Jetzt prüft der Build.
- **Grafiken doppelt im HTML:** Sie stehen jetzt in eigenen Dateien.
- **Endlos drehende Strahlen:** Sie liefen per Verlauf und mussten jedes Bild neu gemalt werden.
- **Menüs:** Sie brachten auf jeder Seite sieben Grafiken mit.

## 5. Fehlende Assets und Integrationen

**Von dir oder vom Lieferanten:**
- Registergericht/HRB und USt-IdNr. für das Impressum (`src/config/brand.ts`)
- Händlerkonditionen, eigene Verkaufspreise, Versandkosten und Lieferzeit (`src/config/site.ts`)
- Produktfotos aller Artikel mit Freigabe des Lieferanten; Hero-Foto optional (`docs/BILDER.md`)
- Datenblätter: Modulmaße, Zelltyp, Wirkungsgrad, Garantien
- Herstelleranschriften und EU-Verantwortliche (GPSR), Sicherheitshinweise
- Lieferanten-Feed oder API-Zugang von eforu (`docs/LIEFERANTEN.md`)

**Technisch vor dem Livegang:**
- **Kasse:**
  - Zahlungsanbieter anbinden (`src/lib/payments`)
  - danach `CHECKOUT_ENABLED=true` und `PAYMENT_PROVIDER` setzen
- **Daten und E-Mail:**
  - Datenbank statt Datei-Speicher (`src/lib/store`)
  - Mailversand
  - `CONTACT_WEBHOOK_URL` und `WITHDRAWAL_WEBHOOK_URL`: Der angebundene Dienst muss die Eingangsbestätigung des Widerrufs per E-Mail senden.
- **Rechtliche Prüfung (Entwürfe sind markiert):**
  - Widerrufsbelehrung mit Gestaltungshinweis 3 der Fassung ab 19.06.2026, Rücksendeadresse beim Dropshipping
  - AGB, Datenschutz
  - Hinweise nach BattDG und ElektroG
- `ADMIN_USER` / `ADMIN_PASSWORD` setzen; danach `site.previewMode = false`.

## 6. Lokal starten

```bash
npm install
cp .env.example .env.local
npm run dev                  # http://localhost:3000
npm run build && npm start   # Produktionsstand
npm test && npm run typecheck
```

## 7. Vorschau

Den Startseiten-Rundgang zeigen am besten:
- `npm run dev`
- die Markenseite `/marke`
- die Screenshots und das Scroll-Video aus dem Abschlussbericht im Chat
