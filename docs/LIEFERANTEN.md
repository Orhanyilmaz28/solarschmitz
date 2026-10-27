# Lieferanten-Anbindung (Dropshipping)

Sonnenwerk hält keinen eigenen Lagerbestand. Produkte, Preise und Bestände kommen von Lieferanten;
Bestellungen werden je Lieferant aufgeteilt und zum Direktversand an die Kundschaft weitergegeben.

## Überblick

```
Feed / API des Lieferanten
        │  fetchCatalog()
        ▼
Parser (CSV · XML · JSON)          src/lib/suppliers/parsers
        ▼
Feld-Mapping + Einheiten           src/lib/suppliers/mapping.ts, units.ts, stock.ts
        ▼
Shop-Produkt + Preisregel          src/lib/suppliers/to-product.ts, pricing.ts
        ▼
Validierung (productSchema)        src/lib/catalog/types.ts
        ▼
Diff: neu · geändert · unverändert · entfernt     src/lib/suppliers/sync.ts
        ▼
Store (Produkte, Sync-Log)         src/lib/store
```

Bestellungen:

```
Checkout → createOrder (gesperrt bis freigeschaltet)     src/lib/checkout
        ▼
Aufteilung nach Lieferant (Teilbestellungen)             src/lib/orders/split.ts
        ▼ nach Zahlungseingang
forwardOrder → adapter.submitOrder()                     src/lib/orders/forward.ts
        ▼
Versandstatus per Webhook oder adapter.fetchShipments()  src/lib/orders/shipments.ts
```

## Bausteine

| Datei | Aufgabe |
| --- | --- |
| `src/lib/suppliers/types.ts` | `SupplierAdapter`-Interface, Konfigurationstypen, Feed- und Bestelltypen |
| `src/lib/suppliers/config.ts` | Lieferanten-Konfiguration (`eforu`, `demo-feed`) und Standard-Spaltennamen |
| `src/lib/suppliers/registry.ts` | Adapter je Lieferant, Prüfung fehlender Zugangsdaten |
| `src/lib/suppliers/adapters/` | Katalogquellen (Datei, Feed-URL, REST) und Bestellwege (E-Mail/CSV, REST, manuell) |
| `src/lib/suppliers/webhook.ts` | Signaturprüfung und Schema für Versand-Webhooks |
| `src/lib/store/` | Repository-Schnittstellen, Datei- und Arbeitsspeicher-Implementierung |
| `src/lib/orders/` | Bestellmodell, Status-Maschine, Weiterleitung, Versandstatus |
| `src/lib/payments/` | Zahlungsanbieter-Schnittstelle (noch ohne funktionierende Anbindung) |
| `src/lib/checkout/` | Formular-Schemas, `createOrder`, Checkout-Status |

## Adapter-Interface

```ts
interface SupplierAdapter {
  config: SupplierConfig;
  testConnection(): Promise<ConnectionStatus>;
  fetchCatalog(): Promise<CatalogFetchResult>;      // Rohdatensätze
  fetchPricesAndStock(): Promise<PriceStockUpdate[]>;
  submitOrder(payload: SupplierOrderPayload): Promise<SupplierOrderResult>;
  fetchShipments(since?: string): Promise<ShipmentUpdate[]>;
}
```

Methoden, die ein Lieferant nicht anbietet, werfen `NotConfiguredError` mit einer verständlichen Meldung.
Nichts wird stillschweigend übersprungen oder vorgetäuscht.

## Neuen Lieferanten anschließen

1. Eintrag in `src/lib/suppliers/config.ts` ergänzen:
   - `catalog`: `file` (nur Tests), `url` (CSV/XML/JSON-Feed), `rest` (JSON-API)
   - `orders`: `email-csv`, `rest` oder `manual`
   - `mapping`: Spaltennamen des Feeds je Produktfeld (mehrere Kandidaten möglich, Schreibweise egal)
   - `categoryMap`: Lieferanten-Kategorie (Teilstring) → Shop-Kategorie
   - `pricing`: Preisregel (siehe unten)
   - `importAs`: `live` für bestätigte Lieferantendaten, `demo` für Testdaten
2. Zugangsdaten als Umgebungsvariablen setzen (`.env.local`, in Produktion im Hosting). Nie ins Repository.
3. Admin → Lieferanten → **Verbindung testen**, dann **Testlauf (Vorschau)**.
4. Vorschau prüfen (Kategorien, Preise, Margen, Bestand), dann übernehmen.
5. Weicht die Schnittstelle stark ab: eigenen Adapter schreiben, der `SupplierAdapter` umsetzt,
   und mit `registerSupplierAdapter()` hinterlegen.

## Feld-Mapping

Unterstützte Felder: `supplierSku`, `ean`, `name`, `brand`, `category`, `shortDescription`, `description`,
`costPrice` (EK netto), `rrp` (UVP brutto), `vatRate`, `stock`, `moduleCount`, `moduleWp`, `modules` („2 x 440 W“),
`totalWp`, `inverterW`, `storageKWh`, `storageMaxKWh`, `imageUrl`, `productUrl`.

- Zahlen: deutsche und englische Formate (`1.209,00`, `1,6`, `1,209.50`).
- Einheiten werden umgerechnet: `1600 Wh` → 1,6 kWh, `0,88 kWp` → 880 W, `0,8 kW` → 800 W.
- XML: verschachtelte Felder werden als `preise.Einkaufspreis_netto` und zusätzlich unter dem kurzen Namen bereitgestellt.
  Die Produktliste wird automatisch gefunden oder über `recordPath` angegeben (z. B. `katalog.artikel`).
- XML mit `DOCTYPE`/`ENTITY` wird aus Sicherheitsgründen abgelehnt. Feeds sind auf 10 MB begrenzt.
- Bild- und Produkt-URLs werden nur mit `http(s)` übernommen.
- Jede Zeile liefert eine Fehlerliste (Zeilennummer, Feld, Meldung). Fehlerhafte Zeilen werden nie importiert.

## Bestand

Es wird nur übernommen, was der Lieferant meldet. Zahl → `in_stock`/`low`/`out_of_stock`;
„auf Lager“/„verfügbar“ → `in_stock`; „nicht verfügbar“/„ausverkauft“ → `out_of_stock`.
Alles andere, auch „verfügbar ab …“, bleibt `unknown`. Es wird nie ein Bestand geschätzt.

## Preisregeln

`computeSellPrice()` in `src/lib/suppliers/pricing.ts` (rechnet in Cent):

1. Netto-VK = EK × (1 + Marge %) + Fixaufschlag
2. Mindestens EK + Mindest-Rohertrag
3. Brutto mit Steuersatz (0 % oder 19 %), Rundung **nach oben** auf `,90`, `,99`, volle Euro oder ohne
4. Optional nie über der UVP (dann nach unten auf die Preisendung gerundet)
5. Liegt der Rohertrag danach unter der Mindestmarge, wird das als Hinweis markiert (nicht versteckt)

Ohne Einkaufspreis wird die UVP übernommen und markiert. Streichpreise werden nicht automatisch aus der UVP gesetzt
(Preisangabenverordnung); sie werden nur bewusst gepflegt.

## Synchronisierung

- **Vorschau (Dry-Run)**: zeigt alle Zeilen mit Änderung und Hinweisen, speichert nichts außer einem Protokolleintrag.
- **Übernehmen**: speichert neue und geänderte Produkte. ID, Slug und gepflegte Texte bleiben stabil.
- **Fehlende entfernen** (optional): löscht Produkte des Lieferanten, die nicht mehr im Feed stehen.

Wege: Admin → Lieferanten / Import, `POST /api/admin/sync/:id[?commit=1]`, `POST /api/admin/import`, oder CLI:

```bash
npm run import:feed -- --supplier demo-feed --file data/supplier-feeds/demo-feed.csv          # Vorschau
npm run import:feed -- --supplier demo-feed --file data/supplier-feeds/demo-feed.xml --commit
npm run import:feed -- --supplier eforu --fetch                                              # direkt beim Lieferanten
```

Für regelmäßige Preis- und Bestandsupdates den Sync-Endpunkt per Cronjob aufrufen (z. B. stündlich, mit Basic Auth).

## Bestellweiterleitung

- Jede Bestellung wird nach `supplier.id` der Positionen in Teilbestellungen aufgeteilt (`SS-…-1`, `SS-…-2`).
- Weitergeleitet wird erst nach Zahlungseingang (`paid`). Fehler werden je Teilbestellung festgehalten;
  ein erneuter Versuch schickt nur die fehlgeschlagenen Teile.
- **E-Mail/CSV**: erzeugt Mailtext und Bestell-CSV (`buildOrderEmail`, `buildOrderCsv`). Versand erst nach
  `setMailTransport(…)` mit einem echten Mailanbieter; ohne wird `NotConfiguredError` geworfen.
- Status: `created → payment_pending → paid → forwarded → partially_shipped → shipped → delivered`,
  dazu `cancelled` und `failed` (Wiederholung möglich).

## Versand-Webhook

`POST /api/webhooks/suppliers/:supplierId`

Header:

```
X-Timestamp: 1793094284                 (Unix-Sekunden, max. 5 Minuten Abweichung)
X-Signature: sha256=<hex>               HMAC-SHA256(SUPPLIER_WEBHOOK_SECRET, "<timestamp>.<raw body>")
Content-Type: application/json
```

Body:

```json
{
  "eventId": "evt-123",
  "orderNumber": "SS-20261027-7F3A",
  "supplierOrderId": "SS-20261027-7F3A-1",
  "status": "shipped",
  "carrier": "DHL",
  "trackingNumber": "00340434...",
  "trackingUrl": "https://…",
  "occurredAt": "2026-10-28T09:00:00Z"
}
```

`status`: `in_transit`, `shipped`, `delivered`, `cancelled`, `exception`. Doppelte `eventId` werden ignoriert (Antwort 200).
Kann ein Lieferant nicht signieren, einen kleinen Vermittlungsdienst davorschalten oder Status per `fetchShipments` abfragen.

## Admin und Schutz

`/admin` und `/api/admin/*` sind per Basic Auth geschützt (`ADMIN_USER`, `ADMIN_PASSWORD`, siehe `src/middleware.ts`).
Ohne Zugangsdaten ist der Bereich in Produktion gesperrt (404) und nur in der Entwicklung offen, mit Hinweis im Admin.
Basic Auth nur über HTTPS nutzen; für mehrere Personen später ein richtiges Login ergänzen.

Einkaufspreise und Lieferanten-Artikelnummern erscheinen nur im Admin. Die öffentliche Produkt-API (`/api/products`)
liefert sie nicht aus (`toPublicProduct`).

## Datenspeicher

`src/lib/store` definiert Repositories für Produkte, Bestellungen, Sync-Protokoll und Versandmeldungen.
Mitgeliefert:

- **Datei-Store** (Standard): JSON unter `data/runtime/` (gitignored). **Nur für Entwicklung**: keine Transaktionen,
  kein Mehrbenutzerbetrieb; auf Serverless-Plattformen ist das Dateisystem flüchtig oder schreibgeschützt.
- **Arbeitsspeicher** (`STORE_DRIVER=memory`): für Tests und Vorschau.

Für den Live-Betrieb eine Datenbank-Implementierung (z. B. Postgres) mit denselben Schnittstellen schreiben und in
`src/lib/store/index.ts` eintragen. Der Shop-Katalog liest aktuell den Seed-Katalog; importierte Produkte stehen über
`getMergedProducts()` (`src/lib/store/catalog.ts`) bereit und sollten mit der Datenbank in `src/lib/catalog` einfließen.

## Zahlungen und Checkout

`src/lib/payments` enthält Platzhalter für Stripe, PayPal und Mollie (`implemented: false`). Sie werfen `NotConfiguredError`.
`createOrder()` lehnt ab, solange

1. `CHECKOUT_ENABLED` nicht `true` ist,
2. Versandkosten in `src/config/site.ts` nicht festgelegt sind,
3. kein umgesetzter Zahlungsanbieter mit Zugangsdaten konfiguriert ist,
4. ein Artikel nicht den Datenstatus `live` hat oder nicht verfügbar ist.

Preise werden immer serverseitig aus dem Katalog genommen, nie aus dem Warenkorb des Browsers.

## Was für eforu noch fehlt

Bei E.FOR.U (eforu.solar) anfragen bzw. klären:

- [ ] **Datenzugang**: Feed-URL (CSV/XML) oder API mit Dokumentation → `SUPPLIER_EFORU_FEED_URL` bzw. `SUPPLIER_EFORU_API_URL`, `SUPPLIER_EFORU_API_KEY`
- [ ] **Spaltennamen** des Feeds → `mapping` in `config.ts` anpassen
- [ ] **Händlerpreise** (EK netto) und ob eine UVP mitgeliefert wird → Preisregel festlegen
- [ ] **Versandkosten** für Dropshipping (Privatkunden zahlen laut eforu-Shop 80 € innerhalb Deutschlands) → `site.shipping`
- [ ] **Lieferzeit** und Versanddienstleister
- [ ] **Bestellweg**: E-Mail mit CSV, Portal oder API → `SUPPLIER_EFORU_ORDER_EMAIL` oder REST-Kanal; Mailversand einrichten
- [ ] **Versandstatus/Tracking**: Webhook, API oder E-Mail
- [ ] **Steuersatz** für Zubehör (Smart Meter, Smart Plug) und **neutraler Versand** (ohne eforu-Rechnung im Paket)
- [ ] **Produktbilder**: Nutzungsrechte und Bild-URLs im Feed
- [ ] **Retouren und Gewährleistung**: Ablauf zwischen Kundschaft, Sonnenwerk und eforu
