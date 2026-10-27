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

## Produkte

Die 12 Produkte im Script von `index.html` (Array `P`, Abschnitt „Sortiment“) stammen aus dem Privatkunden-Shop von eforu.solar, Stand Oktober 2026 laut Websuche:
2 Balkonkraftwerk-Komplettsets (880 W, eins mit Anker SOLIX E1600 Speicher), 6 Speicher (Anker SOLIX, EcoFlow, Zendure) und 4 Zubehörteile (APsystems EZ1-M, Halterung, Anker Smart Meter und Smart Plug).

Die Preise sind die **Endkundenpreise von eforu**. Vor dem Start mit den Händlerkonditionen abgleichen und die eigene Marge einrechnen.

## Vor dem Start anpassen

- **Preise und Daten** mit dem eforu-Händlerbereich abgleichen, Produktfotos von eforu einbinden (aktuell gezeichnete Platzhalter-Grafiken).
- **Lieferzeit:** Konstante `DELIVERY` mit eforu abstimmen.
- **Versand:** `FREE` (499 €) und `SHIP` (39 €) im Abschnitt „Warenkorb“. eforu berechnet Privatkunden laut Produktseite 80 € Versand innerhalb Deutschlands. Prüfen, was für Dropshipping-Partner gilt, sonst zahlst du bei kostenlosem Versand drauf.
- **MwSt.:** Smart Meter und Smart Plug sind mit 19 % angesetzt, alles andere mit 0 %. Mit eforu klären.
- **Kasse und Newsletter** sind noch nicht angebunden. Für echte Bestellungen braucht es ein Shopsystem (z. B. Shopify oder WooCommerce mit Dropshipping-Anbindung).
- **Rechtstexte:** Impressum, AGB, Widerrufsbelehrung und Datenschutz verlinken.
