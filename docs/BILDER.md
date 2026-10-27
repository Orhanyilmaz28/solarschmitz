# Bilder und Medien

## Stand

Die Seite enthält **keine Fotos**. In der Entwicklungsumgebung waren Bilddienste (Unsplash, Pexels, Wikimedia) gesperrt, und Bilder anderer Shops dürfen nicht ungefragt übernommen werden.

Stattdessen gibt es gezeichnete, lizenzfreie Grafiken (eigener Code):

| Stelle | Komponente | Ersetzen durch |
|---|---|---|
| Hero der Startseite | `src/components/home/HeroScene.tsx` | Foto oder Video, siehe unten |
| Produktbilder | `src/components/illustrations/ProductVisual.tsx` (Schlüssel `visual` im Produkt) | Produktfotos im Feld `images` des Produkts |
| Kategorien, Mega-Menü, Ratgeber | `ProductVisual` | optional eigene Fotos |
| Storytelling-Grafik | `src/components/home/EnergyStory.tsx` | bleibt als Grafik sinnvoll |

## Hero-Foto oder -Video einbinden

1. Datei nach `public/media/` legen, z. B. `public/media/hero.jpg` (mindestens 2400 × 1500 px, Querformat, Motiv rechts, links ruhige Fläche für den Text).
2. In `src/config/brand.ts` eintragen:

```ts
media: {
  hero: { src: "/media/hero.jpg", alt: "Modernes Einfamilienhaus mit Solaranlage im Abendlicht", credit: "Foto: Name / Quelle" },
  heroVideo: null,
},
```

Die Seite nutzt dann automatisch `next/image` (AVIF/WebP, responsive Größen) mit Abdunklung für lesbaren Text.

## Produktfotos

Im Produkt (`src/data/products.ts` oder per Lieferanten-Import):

```ts
images: [{ src: "/media/produkte/set-880.jpg", alt: "Komplettset 880 W mit zwei Modulen", credit: "Hersteller" }],
```

Externe Bild-URLs (z. B. vom Lieferanten-CDN) in `next.config.ts` unter `images.remotePatterns` freigeben.
Produktfotos vom Lieferanten nur mit dessen Erlaubnis verwenden (Dropshipping-Vertrag prüfen).

## Fehlende Motive (Wunschliste)

| Motiv | Verwendung | Format |
|---|---|---|
| Modernes Haus mit Solardach, warmes Abendlicht | Hero | Querformat 3:2 oder 16:9, Video 10–20 s optional |
| Balkon mit zwei Modulen am Geländer | Kategorie Balkonkraftwerke, Ratgeber | 4:3 |
| Speicher im Hauswirtschaftsraum oder auf dem Balkon | Kategorie Speicher | 4:3 |
| Nahaufnahme Solarzellen mit Lichtreflex | Kategorie Solarmodule, Storytelling | 16:9 |
| Montage am Flachdach / Garten-Aufständerung | Kategorie Montage | 4:3 |
| Mikrowechselrichter in Händen / am Modul | Kategorie Wechselrichter | 4:3 |
| Mehrfamilienhaus mit Balkonen | Ratgeber „Mieter“ | 16:9 |

## Lizenzierte Quellen

- Eigene Fotos (am besten: echte Installationen von Kunden, mit Einwilligung)
- Hersteller-Pressebereiche (Nutzungsbedingungen beachten)
- Stockfotos mit kommerzieller Lizenz, z. B. Unsplash-Lizenz, Pexels-Lizenz oder gekaufte Lizenzen (Adobe Stock, Getty). Lizenz und Urheber in `credit` dokumentieren.
