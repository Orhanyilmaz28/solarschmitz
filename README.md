# Sonnenwerk

Onlineshop **sonnenwerk.de** der Energiezentrale Schmitz UG (haftungsbeschränkt), Hilden.
Solar-Onlineshop für Balkonkraftwerke, Batteriespeicher, Solarmodule, Wechselrichter und Zubehör.
Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, GSAP und Lenis für Animationen.

Der Shop ist auf **Dropshipping** ausgelegt: Es gibt kein eigenes Lager, Bestellungen werden an Lieferanten weitergeleitet.
Solange Zahlung, Versand und Lieferanten nicht angebunden sind, läuft die Seite im **Vorschau-Modus**. Bestellungen sind dann gesperrt, und das sagt die Seite auch offen.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
cp .env.example .env.local   # Werte nach Bedarf ausfüllen, für die Vorschau reicht die Vorlage
npm run dev                  # http://localhost:3000
```

Produktionsstand lokal prüfen:

```bash
npm run build && npm start   # http://localhost:3000
```

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` / `npm start` | Produktions-Build und Start |
| `npm test` | Tests (Rechner, Simulation, Empfehlungen, Preise, Steuer, Warenkorb, Bestellungen, Widerruf, Import) |
| `npm run typecheck` | TypeScript-Prüfung |
| `npm run logo` | Logo-Paket aus dem Markennamen neu erzeugen |
| `npm run import:feed -- --supplier demo-feed --file data/supplier-feeds/demo-feed.csv` | Lieferanten-Feed testen (Vorschau, mit `--commit` übernehmen) |

## Was drin ist

- **Startseite als Geschichte:**
  - Cinematic Hero „Energie neu gedacht.“
  - Kapitel 1 Licht: ein Junitag läuft beim Scrollen über einer Siedlung ab
  - Produktwelt
  - Kapitel 2: Modul im Schnitt mit Hotspots
  - Kapitel 3: Speicher und Energieflüsse
  - Kapitel 4: Energie-Dashboard
  - Produktfinder, Auswahl, Vertrauen, Ratgeber, Fragen
  - Kapitel 5 Morgen

  Alle Zahlen stammen aus einer offen beschriebenen Beispielrechnung.
- **Konfigurator 2.0** (`/konfigurator` und auf der Startseite):
  - drei Fragen zu Ort, Unabhängigkeit und Priorität
  - danach ein visuelles Ergebnis mit System, Ertrag, Ersparnis und Amortisation
  - alle Annahmen änderbar
- **Shop:**
  - Produktübersicht mit Filtern und Suche (auch Strg+K), Kategorie- und Produktseiten, Vergleich
  - Warenkorb mit Umsatzsteuer-Logik (0 % nur unter Voraussetzungen)
  - Kasse mit Button-Lösung und wesentlichen Merkmalen, bis zur Freischaltung gesperrt
  - Widerrufsfunktion „Vertrag widerrufen“ (§ 356a BGB)
- **Navigation:**
  - Kopfzeile transparent über dem Hero, danach helles oder dunkles Glas je nach Abschnitt
  - Mega-Menü mit Vorschau, sichtbare Suche, Warenkorb-Status
  - Vollbild-Menü am Handy
- **Marke:**
  - Logo-Paket (Signatur, Kompakt, Monogramm, Zeichen, Favicon, animiert)
  - Übersicht mit Downloads unter `/marke`
- **Inhalte:** FAQ, Ratgeber, Über uns, Kontakt, Versand (mit Batterie- und Altgeräte-Hinweisen), Rechtstexte als markierte Entwürfe.
- **Lieferanten-Integration und Admin** (`/admin`): Details in [docs/LIEFERANTEN.md](docs/LIEFERANTEN.md).

## Wichtige Dateien

| Datei | Inhalt |
|---|---|
| `src/config/brand.ts` | Markenname, Kontakt, Farben, Bild-Slots. **Name hier ändern**, danach `npm run logo`. |
| `src/config/site.ts` | Vorschau-Modus, Versandkosten, Lieferzeit, Checkout-Schalter |
| `src/config/solar-assumptions.ts` | Annahmen für Ertrag und Ersparnis |
| `src/data/products.ts` | Start-Katalog (wird später durch den Lieferanten-Import ersetzt) |
| `src/app/globals.css` | Design-Tokens (Farben, Schriften, Animationen) |

## Datenstatus der Produkte

Jedes Produkt hat einen `dataStatus`, der in der Oberfläche sichtbar ist:

- `supplier-unverified` („Vorschau“): aus dem öffentlichen Katalog von eforu.solar übernommen (Stand Okt. 2026). Preise sind Endkundenpreise des Lieferanten, **nicht** deine Verkaufspreise.
- `demo` („Demo-Produkt“): Platzhalter für Kategorien ohne Lieferantendaten (Solarmodule, 4-Modul-Sets). Ohne Preis, nicht bestellbar.
- `live`: per Lieferanten-Import bestätigt. Nur diese Produkte werden nach Freischaltung bestellbar.

## Vor dem Livegang

1. Händlerkonditionen, Versandkosten und Lieferzeit mit eforu klären; in `src/config/site.ts` eintragen.
2. Lieferanten-Feed oder API anbinden (`.env.local`, siehe docs/LIEFERANTEN.md) und importieren.
3. Datenbank statt Datei-Speicher anbinden (`src/lib/store`), Zahlungsanbieter integrieren (`src/lib/payments`), Mailversand einrichten, `CONTACT_WEBHOOK_URL` und `WITHDRAWAL_WEBHOOK_URL` setzen (Eingangsbestätigung des Widerrufs per E-Mail testen).
4. In `src/config/brand.ts` noch Registergericht/HRB-Nummer und ggf. USt-IdNr. eintragen. Rechtstexte anwaltlich prüfen lassen.
5. Lizenzierte Fotos einbinden (siehe [docs/BILDER.md](docs/BILDER.md)).
6. `site.previewMode` auf `false`, `CHECKOUT_ENABLED=true` und `PAYMENT_PROVIDER` setzen, erst nach Testbestellungen.
7. `ADMIN_USER` und `ADMIN_PASSWORD` setzen.

## Weitere Dokumentation

- [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md): Aufbau, Datenfluss, Animationen
- [docs/LIEFERANTEN.md](docs/LIEFERANTEN.md): Lieferanten, Import, Preisregeln, Bestellungen, Webhooks
- [docs/BILDER.md](docs/BILDER.md): fehlende Bilder und wie man sie einbindet
- [docs/MARKE.md](docs/MARKE.md): Logo-Paket, Farben, Schriften, Bildsprache
- [docs/UPGRADE-BERICHT.md](docs/UPGRADE-BERICHT.md): Premium-Upgrade: Änderungen, Animationen, Messwerte, offene Punkte
