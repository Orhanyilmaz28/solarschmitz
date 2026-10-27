# Sonnenwerk

Startseite für den Solar-Onlineshop **sonnenwerk.de**: Balkonkraftwerke, Stromspeicher, PV-Komplettanlagen und Zubehör.
Die Ware kommt per Dropshipping von [eforu.solar](https://eforu.solar/pages/balkonkraftwerk-dropshipping).

Die Seite ist eine einzelne statische Datei (`index.html`) ohne Build-Schritt. Zum Ansehen einfach im Browser öffnen.

## Enthalten

- Ertragsrechner (Modulleistung, Ausrichtung, Montage, Strompreis, Speicher) mit passendem Set-Vorschlag
- Kategorien, Bestseller mit Filter und Suche
- Warenkorb mit Mengen, Versandkostenfrei-Schwelle (499 €) und Versandkosten (39 €)
- Anleitung in vier Schritten, FAQ zu den Regeln für Balkonkraftwerke, Newsletter-Feld
- Hell- und Dunkelmodus, Handy-tauglich

## Vor dem Start anpassen

- **Produkte und Preise:** Im Script von `index.html` im Array `P` (Abschnitt „Sortiment“). Die aktuellen Einträge sind Platzhalter und müssen durch den eforu-Katalog ersetzt werden.
- **Lieferzeit:** Konstante `DELIVERY` mit eforu abstimmen. Den Text in „Schritt 2“ ebenfalls.
- **Versand:** `FREE` und `SHIP` im Abschnitt „Warenkorb“.
- **Kasse und Newsletter** sind noch nicht angebunden. Für echte Bestellungen braucht es ein Shopsystem (z. B. Shopify oder WooCommerce mit Dropshipping-Anbindung).
- **Rechtstexte:** Impressum, AGB, Widerrufsbelehrung und Datenschutz verlinken.
