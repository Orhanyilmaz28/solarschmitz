# Bilder und Medien

## Grundsatz

Auf der Seite sind **keine Fotos** und **keine fremden Produktbilder**. Sie zeigt:

- **Linienwerk-Grafiken:** eigene, perspektivisch berechnete Zeichnungen aus `src/lib/linework`. Sie stehen im Hero, in Kapitel 1 (Siedlung im Tageslauf) und in Kapitel 3 (Speicher). Sie sind als Illustration erkennbar und geben sich nicht als Foto aus.
- **Produktgrafiken:** gezeichnet (`src/components/illustrations/ProductVisual.tsx`, Schemata in `src/components/shop/ProductSchematic.tsx`). Sie stellen das jeweilige Produkt nicht fotografisch dar und werden durch echte Produktfotos ersetzt, sobald der Lieferant sie freigibt.

Es gibt keine 360°-Ansichten, keine Renderings, die echt aussehen sollen, und keine Bilder anderer Shops.

## Art-Direction: Desktop und Handy getrennt

Bild-Slots stehen in `src/config/media.ts`. Jeder Slot hat einen eigenen Ausschnitt für Desktop und Handy, dazu:
- Bildschwerpunkt (`focus`, steuert `object-position`)
- Alt-Text und Urheberangabe
- Motiv-Briefing (`brief`) und Wunschformate

Die Komponente `src/components/media/ArtImage.tsx` liefert ein `<picture>`:
- ab 768 px die Desktop-Datei, darunter die Handy-Datei
- beide über `next/image` optimiert (AVIF/WebP, passende Größen)
- solange ein Slot leer ist, die gezeichnete Szene

| Slot | Verwendung | Formate | Briefing |
|---|---|---|---|
| `hero` | Startseite, Bühne hinter „Energie neu gedacht.“ | Desktop 3200 × 1800 px, Motiv rechts · Handy 1200 × 2000 px, Haus im unteren Drittel | Architektonisch hochwertiges Haus, Module sichtbar, tief stehende Sonne, linke Hälfte ruhig für Text |

### Hero-Foto eintragen

1. Dateien nach `public/media/` legen, z. B. `hero-desktop.jpg` und `hero-mobile.jpg`.
2. In `src/config/media.ts`:

```ts
hero: {
  desktop: { src: "/media/hero-desktop.jpg", width: 3200, height: 1800, focus: "65% 55%" },
  mobile: { src: "/media/hero-mobile.jpg", width: 1200, height: 2000, focus: "50% 70%" },
  alt: "…",
  credit: "Foto: Name / Lizenz",
  // brief und formats bleiben als Dokumentation
},
```

Die gezeichnete Szene tritt dann automatisch zurück.

**Hinweis:** Die Kapitel 1 und 3 sind bewusst gezeichnet, weil sich ihr Licht beim Scrollen mit der Tageszeit ändert. Ein Foto würde dort den Tagesverlauf verlieren.

## Produktfotos

Im Produkt (`src/data/products.ts` oder per Lieferanten-Import):

```ts
images: [{ src: "/media/produkte/set-880.jpg", alt: "Komplettset 880 W mit zwei Modulen", credit: "Hersteller" }],
```

- Externe Bild-URLs (z. B. vom Lieferanten-CDN) in `next.config.ts` unter `images.remotePatterns` freigeben.
- Fotos des Lieferanten nur mit dessen Erlaubnis nutzen (Dropshipping-Vertrag prüfen).
- Nur Fotos des tatsächlich verkauften Modells verwenden.

## Wunschliste Motive

| Motiv | Verwendung | Format |
|---|---|---|
| Haus mit Solardach im Gegenlicht | Hero (Slot `hero`) | siehe oben |
| Original-Produktfotos aller Sets, Speicher, Wechselrichter, Halterungen (freigestellt, 3 Ansichten) | Produktseiten, Karten | mindestens 2000 px, heller Grund |
| Balkon mit zwei Modulen am Geländer | Kategorie Balkonkraftwerke, Ratgeber | 4:3 |
| Speicher im Hauswirtschaftsraum | Kategorie Speicher | 4:3 |
| Mehrfamilienhaus mit Balkonkraftwerken | Ratgeber „Mieter“ | 16:9 |
| Montage Flachdach / Garten | Kategorie Montage | 4:3 |

## Lizenzierte Quellen

- **Eigene Fotos:** am besten echte Installationen von Kundinnen und Kunden, mit deren Einwilligung.
- **Hersteller-Pressebereiche:** Nutzungsbedingungen beachten.
- **Stockfotos mit kommerzieller Lizenz.**

Lizenz und Urheber immer in `credit` dokumentieren.
