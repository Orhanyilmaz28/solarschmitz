# Architektur

## Überblick

```
src/
  app/                   Routen (App Router): Shop, Inhalte, /admin, /api, /art (generierte Grafiken), /marke
  components/
    home/                Startseite
      Hero.tsx           Cinematic Hero (CSS-Choreografie + GSAP-Parallaxe)
      hero/              Linienwerk-Szene des Hero (Kamera, Ebenen, SVG-Dateien)
      chapters/          Kapitel 1–5 (Licht, Modul, Speicher, Morgen) mit Szenen und Bühnen
      dashboard/         Kapitel 4: Energie-Dashboard (Simulation)
    configurator/        Konfigurator 2.0 (Ort, Unabhängigkeit, Priorität → Ergebnis)
    shop/                Produktkarte, Filter, Warenkorb, Vergleich, Kaufbox, Preise
    checkout/            Kasse, Umsatzsteuer-Frage, Übersicht
    content/             Seitenköpfe, Rechtstexte, FAQ, Ratgeber, Widerrufsfunktion
    layout/              Header, Mega-Menü, Handy-Menü, Suche, Footer
    motion/              Reveal, LineReveal, CountUp, Magnetic, SmoothScroll (Lenis + GSAP)
    media/               ArtImage (Art-Direction Desktop/Handy)
    brand/               Logo, Zeichen, Logo-Auftritt
    ui/                  Button, Icon, SectionHeader, Accordion …
  config/                Marke, Shop-Einstellungen, Rechenannahmen, Navigation, Bild-Slots
  data/                  Seed-Katalog, Kategorien, FAQ, Ratgeber
  lib/
    linework/            Linienwerk: Perspektiv-Engine und SVG-Ausgabe
    energy-sim/          Tagessimulation (Erzeugung, Verbrauch, Speicher) für Kapitel 1, 3, 4
    solar/               Ertrags- und Ersparnisrechnung, Empfehlungslogik
    cart/, compare/      Warenkorb, Umsatzsteuer, Vergleich
    withdrawal/          Widerrufsfunktion nach § 356a BGB
    suppliers/, store/, orders/, payments/, checkout/   Lieferanten, Speicher, Bestellungen, Zahlung, Kasse
tests/                   Vitest
```

## Startseite als Geschichte in Akten

| Akt | Abschnitt | Inhalt |
|---|---|---|
| dunkel | Hero | „Energie neu gedacht.“: Szene blendet ein → Zeilen gleiten aus der Maske → Unterzeile → Buttons → Fenster gehen an, Energieimpuls → Scroll-Hinweis |
| dunkel | Kapitel 1 · Licht | „Die Sonne liefert. Du profitierst.“: Scrollen lässt einen Junitag über einer Siedlung ablaufen. Die Ertragskurve wächst unter der Sonne mit, Fenster gehen aus und wieder an |
| hell | Produktwelt | Kategorien als Raster |
| hell | Kapitel 2 · Modul | Explosionsansicht eines Glas-Glas-Moduls mit fünf Hotspots |
| dunkel | Kapitel 3 · Speicher | Tag bis nächster Morgen: Flüsse Module/Speicher/Haus/Netz, Ladestand |
| dunkel | Kapitel 4 · Dashboard | Interaktive Energie-App mit Simulation |
| hell | Produktfinder, Auswahl, Vertrauen, Ratgeber, Fragen | |
| dunkel | Kapitel 5 · Morgen | „Morgen geht die Sonne wieder auf. Diesmal für dich.“: Sonne geht beim Scrollen auf |

Die Kopfzeile passt sich an: Über Abschnitten mit `data-header="dark"` wird sie zu dunklem Glas, sonst zu hellem Glas.

## Linienwerk (eigene Grafik-Engine)

`src/lib/linework/engine.ts`:
- **Kamera:** Lochkamera, waagerecht wie eine Architekturkamera, mit Shift.
- **Zeichnen:** Flächen und Linien werden gemeinsam nach Tiefe sortiert (Maleralgorithmus). Linien lassen sich unterteilen, das Bild wird an der nahen Ebene beschnitten.
- **Bausteine:** Bodenraster mit Aussparungen.

Ausgabe als SVG, ganz ohne WebGL.

**Große, unbewegte Ebenen** liefert die Route `src/app/art/[file]/route.ts` als eigene, statisch erzeugte SVG-Dateien aus, nämlich Hero-Boden, Haus, Fenster und Siedlung. Grund: Grafiken, die auf dem Server direkt in die Seite gerendert werden, stünden doppelt im HTML (einmal als Markup, einmal in den React-Daten). Als Datei werden sie gecacht und blockieren den ersten Seitenaufbau nicht.

**Inline bleiben nur kleine, animierte Teile:** Himmel, Sonne, Energielinien und Ertragskurve.

**Verdeckung bei Überlagerungen:** Ebenen wie erleuchtete Fenster oder Modulspiegelungen nutzen eine Maske aus allen Flächen in Malreihenfolge. So bleibt Verdecktes verdeckt.

**Tiefenwirkung des Bodenrasters:** Sie kommt aus einer Maske zum Horizont hin, nicht aus Tausenden Teilstücken. Das spart rund 95 % Dateigröße.

## Bewegungssystem

- `<html data-motion="on">` setzt ein kleines Inline-Skript vor dem ersten Bild, wenn keine reduzierte Bewegung gewünscht ist.
  - Alle verborgenen Startzustände hängen an diesem Attribut.
  - Ohne JavaScript oder mit „Bewegung reduzieren“ ist alles sofort sichtbar und lesbar.
- **Hero:** Die Choreografie läuft in reinem CSS (startet ohne auf JavaScript zu warten, gut für LCP). GSAP ergänzt nur die Parallaxe.
- **Kapitel 1, 2, 3:** hohe Sektion mit `position: sticky`-Bühne.
  - Der Fortschritt kommt aus GSAP ScrollTrigger, ohne pin.
  - Pro Bild werden nur Transform, Opacity, Pfaddaten und Texte über Refs gesetzt, kein React-State.
  - Ohne Bewegung zeigen die Kapitel eine ruhige Fassung mit allen Texten.
- **Lenis** sorgt für weiches Scrollen am Desktop (aus bei Touch und reduzierter Bewegung).
- **Weitere Effekte:** LineReveal, Reveal, Magnetic Buttons, Mega-Menü, Handy-Menü mit Clip-Path.

## Datenfluss Shop

1. **Katalog:** `src/data/products.ts` → `productSchema` (zod) → `src/lib/catalog`. Seiten werden statisch erzeugt.
2. **Import:** Lieferanten-Feed oder API → Adapter → Mapping → Validierung → Preisregeln → Diff → Store.
3. **Warenkorb:** speichert nur IDs und Mengen. Preise berechnet `resolveCart` immer frisch.
   - 0 % USt. nur nach Bestätigung der Voraussetzungen (§ 12 Abs. 3 UStG), sonst 19 %.
4. **Bestellung:** `POST /api/orders` → `createOrder`.
   - prüft, ob der Shop freigeschaltet ist, und validiert die Eingaben
   - wendet den Steuersatz an und speichert die Steuerangabe mit Zeitstempel
   - danach Zahlung, Aufteilung nach Lieferant, Weiterleitung, Versandstatus
5. **Widerruf:** `/vertrag-widerrufen` → `POST /api/widerruf`.
   - fragt nur Name, Vertrag und E-Mail ab
   - vermerkt den Widerruf an der Bestellung
   - Weiterleitung an `WITHDRAWAL_WEBHOOK_URL`, der angebundene Dienst verschickt die Eingangsbestätigung

Einkaufspreise (`supplier.costPrice`) verlassen nie den Server.

## Freischaltung des Checkouts

Bestellungen sind nur möglich, wenn **alle** Bedingungen erfüllt sind (`src/lib/checkout/status.ts`):
- `CHECKOUT_ENABLED=true`
- Zahlungsanbieter gesetzt
- Versandkosten konfiguriert
- Produkt mit Status `live`
