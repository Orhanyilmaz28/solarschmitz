# Architektur

## Überblick

```
src/
  app/                 Routen (App Router). Shop-Seiten, Inhalte, /admin, /api
  components/
    home/              Startseite: Hero, Szene, Produktwelt, Storytelling, Teaser
    configurator/      Produktfinder, Simulation, Diagramme, Annahmen
    shop/              Produktkarte, Filter, Warenkorb, Vergleich, Kaufbox
    checkout/          Checkout-Schritte
    layout/            Header, Mega-Menü, Mobilmenü, Suche, Footer
    motion/            Reveal, CountUp, Magnetic, SmoothScroll (Lenis + GSAP)
    illustrations/     Gezeichnete Produktgrafiken
    brand/             Logo
  config/              Marke, Shop-Einstellungen, Rechenannahmen, Navigation
  data/                Seed-Katalog, Kategorien, FAQ, Ratgeber
  lib/
    catalog/           Produktschema (zod), Suche, Filter
    solar/             Ertrags- und Ersparnisrechnung, Empfehlungslogik
    cart/, compare/    Warenkorb und Vergleich (zustand, im Browser gespeichert)
    suppliers/         Lieferanten-Adapter, Mapping, Preisregeln, Sync
    store/             Speicher-Schnittstelle (Datei für Entwicklung, Memory für Tests)
    orders/            Bestellmodell, Aufteilung nach Lieferant, Weiterleitung, Versandstatus
    payments/          Zahlungsanbieter-Schnittstelle (noch ohne Anbieter)
    checkout/          Formular-Schemas, Bestellanlage, Freischalt-Status
  middleware.ts        Schutz für /admin und /api/admin
tests/                 Vitest
```

## Datenfluss

1. **Katalog:** `src/data/products.ts` → validiert mit `productSchema` → `src/lib/catalog`. Seiten werden statisch erzeugt.
2. **Import:** Lieferanten-Feed/API → Adapter → Mapping → Validierung → Preisregeln → Diff → Store. Danach können Seiten aus `getMergedProducts(getStore())` lesen.
3. **Warenkorb:** speichert nur Produkt-IDs und Mengen. Preise werden immer frisch aus dem Katalog berechnet (`src/lib/cart/totals.ts`).
4. **Bestellung:** `POST /api/orders` → `createOrder` prüft Freischaltung, validiert, legt Bestellung an → Zahlung → Aufteilung nach Lieferant → Weiterleitung → Versandstatus per Webhook oder Abruf.

Einkaufspreise (`supplier.costPrice`) werden aus dem öffentlichen Katalog entfernt und nie an den Browser gegeben.

## Freischaltung des Checkouts

Bestellungen sind nur möglich, wenn **alle** Bedingungen erfüllt sind (`src/lib/checkout/status.ts`):
`CHECKOUT_ENABLED=true`, Zahlungsanbieter gesetzt, Versandkosten konfiguriert, Produkt mit Status `live`.

## Animationen

- **Lenis** für weiches Scrollen (aus bei Touch und reduzierter Bewegung), gekoppelt an **GSAP ScrollTrigger**.
- **Hero:** GSAP-Timeline für den Auftritt, Parallax je Ebene beim Scrollen und mit der Maus, wandernder Lichtreflex auf dem Dach, Sonnenstrahlen per CSS-Conic-Gradient.
- **Storytelling:** stehende Grafik (CSS sticky), Phasen per IntersectionObserver, Energielinien per `stroke-dashoffset`.
- **Reveal, CountUp, Magnetic Buttons, Mega-Menü, Akkordeons, Seitenübergänge:** leichte CSS-/rAF-Lösungen.
- `prefers-reduced-motion` wird überall respektiert: Inhalte sind dann sofort sichtbar, ohne Bewegung. Ohne JavaScript bleibt alles lesbar (Reveal versteckt nur, wenn `<html data-motion="on">` gesetzt ist).

## Referenz

solago.de war aus der Entwicklungsumgebung nicht erreichbar und konnte nicht analysiert werden. Struktur und Conversion-Elemente basieren auf allgemeinen Mustern guter Solar- und E-Commerce-Seiten; Layouts, Texte und Grafiken sind eigenständig.
