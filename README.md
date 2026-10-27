# Sonnenwerk

Onlineshop **sonnenwerk.de** der Energiezentrale Schmitz UG (haftungsbeschränkt), Hilden.
Solar-Onlineshop für Balkonkraftwerke, Batteriespeicher, Solarmodule, Wechselrichter und Zubehör.
Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, GSAP und Lenis für Animationen.

Der Shop ist auf **Dropshipping** ausgelegt: Es gibt kein eigenes Lager, Bestellungen werden an Lieferanten weitergeleitet.
Solange Zahlung, Versand und Lieferanten nicht angebunden sind, läuft die Seite im **Vorschau-Modus**. Bestellungen sind dann gesperrt, und das sagt die Seite auch offen.

## Schnellstart

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` / `npm start` | Produktions-Build und Start |
| `npm test` | Tests (Rechner, Empfehlungen, Preisregeln, Import, Bestellungen) |
| `npm run typecheck` | TypeScript-Prüfung |
| `npm run logo` | Logo-SVGs aus dem Markennamen neu erzeugen |
| `npm run import:feed -- --supplier demo-feed --file data/supplier-feeds/demo-feed.csv` | Lieferanten-Feed testen (Vorschau, mit `--commit` übernehmen) |

## Was drin ist

- **Startseite:** Hero mit animierter Szene (Haus mit Solardach im Abendlicht), Text-Reveal, Sonnenstrahlen, Parallax; Beispielrechnung; Produktwelt mit 6 Kategorien; Scroll-Storytelling „So einfach wird aus Sonnenlicht dein eigener Strom“; Produktfinder; Auswahl; Ratgeber; FAQ.
- **Produktfinder** (`/konfigurator`): 6 Fragen → passende Sets, Zubehör, Simulation von Jahresproduktion, Ersparnis, Amortisation mit Diagrammen. Alle Annahmen sind sichtbar und änderbar (`src/config/solar-assumptions.ts`).
- **Shop:** Produktübersicht mit Filtern und Suche, Kategorieseiten, Produktdetailseiten, Suche (auch als Overlay mit Strg+K), Produktvergleich, Warenkorb, Checkout in 5 Schritten (bis zur Freischaltung gesperrt), Kundenkonto-Struktur.
- **Inhalte:** FAQ, Ratgeber (5 Artikel), Über uns, Kontakt, Versand, Rechtstexte als markierte Entwürfe.
- **Lieferanten-Integration und Admin** (`/admin`): Adapter für CSV, XML, REST-API und E-Mail-Bestellung; Feld-Mapping, Preisregeln, Bestandsabgleich, Bestellweiterleitung, Versandstatus per Webhook, Sync-Protokoll. Details: [docs/LIEFERANTEN.md](docs/LIEFERANTEN.md).

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
3. Datenbank statt Datei-Speicher anbinden (`src/lib/store`), Zahlungsanbieter integrieren (`src/lib/payments`), Mailversand einrichten.
4. In `src/config/brand.ts` noch E-Mail-Adresse, Registergericht/HRB-Nummer und ggf. USt-IdNr. eintragen. Rechtstexte anwaltlich prüfen lassen.
5. Lizenzierte Fotos einbinden (siehe [docs/BILDER.md](docs/BILDER.md)).
6. `site.previewMode` auf `false`, `CHECKOUT_ENABLED=true` und `PAYMENT_PROVIDER` setzen, erst nach Testbestellungen.
7. `ADMIN_USER` und `ADMIN_PASSWORD` setzen.

## Weitere Dokumentation

- [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md): Aufbau, Datenfluss, Animationen
- [docs/LIEFERANTEN.md](docs/LIEFERANTEN.md): Lieferanten, Import, Preisregeln, Bestellungen, Webhooks
- [docs/BILDER.md](docs/BILDER.md): fehlende Bilder und wie man sie einbindet
- [docs/MARKE.md](docs/MARKE.md): Logo, Farben, Schriften
