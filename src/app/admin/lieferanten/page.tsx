import { getStore } from "@/lib/store";
import { getSetupStatus, getSupplierConfigs } from "@/lib/suppliers/registry";
import type { CatalogSource, OrderChannel, SupplierConfig } from "@/lib/suppliers/types";
import { SupplierActions } from "../_components/SupplierActions";
import { dataStatusLabel, setupTone } from "../_components/labels";
import { AdminTitle, Card, Pill, formatDateTime } from "../_components/ui";

export const metadata = { title: "Lieferanten · Admin" };

function describeCatalog(src: CatalogSource): string {
  switch (src.kind) {
    case "file":
      return `Datei ${src.path} (${src.format.toUpperCase()})`;
    case "url":
      return `${src.format.toUpperCase()}-Feed von ${src.urlEnv}`;
    case "rest":
      return `REST-API ${src.baseUrlEnv} + ${src.productsPath}`;
    case "none":
      return "keine";
  }
}

function describeOrders(ch: OrderChannel): string {
  switch (ch.kind) {
    case "email-csv":
      return `E-Mail mit CSV an ${ch.toEnv}`;
    case "rest":
      return `REST-API ${ch.baseUrlEnv} + ${ch.ordersPath}`;
    case "manual":
      return "manuell (kein automatischer Bestellweg)";
  }
}

function describePricing(p: SupplierConfig["pricing"]): string {
  const rounding = { none: "ohne Rundung", euro: "auf volle Euro", "90": "auf ,90", "99": "auf ,99" }[p.rounding];
  return [
    `${p.marginPct} % Aufschlag`,
    p.fixedMarkupEUR ? `+ ${p.fixedMarkupEUR} € fix` : null,
    `mind. ${p.minMarginEUR} € Rohertrag`,
    rounding,
    p.capAtRrp ? "max. UVP" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default async function SuppliersPage() {
  const suppliers = getSupplierConfigs();
  const log = await getStore().syncLog.list(200);

  return (
    <>
      <AdminTitle
        title="Lieferanten"
        lead="Katalogquelle, Bestellweg und Preisregeln je Lieferant. Zugangsdaten stehen in Umgebungsvariablen, nie im Code. Ein Testlauf zeigt nur eine Vorschau."
      />
      <div className="space-y-6">
        {suppliers.map((s) => {
          const setup = getSetupStatus(s);
          const last = log.find((l) => l.supplierId === s.id);
          const missing = [...new Set([...setup.catalog.missing, ...setup.orders.missing])];
          return (
            <Card
              key={s.id}
              title={
                <span className="flex flex-wrap items-center gap-3">
                  {s.name}
                  <span className="font-mono text-xs font-normal text-muted">{s.id}</span>
                </span>
              }
              action={
                <div className="flex flex-wrap gap-2">
                  <Pill tone={setupTone(setup.catalog.ready)}>Katalog {setup.catalog.ready ? "bereit" : "offen"}</Pill>
                  <Pill tone={setupTone(setup.orders.ready)}>Bestellweg {setup.orders.ready ? "bereit" : "offen"}</Pill>
                </div>
              }
            >
              <p className="m-0 max-w-[75ch] text-muted">{s.description}</p>
              <dl className="m-0 mt-5 grid gap-x-8 gap-y-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-muted">Katalog</dt>
                  <dd className="m-0 font-medium">{describeCatalog(s.catalog)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Bestellungen</dt>
                  <dd className="m-0 font-medium">{describeOrders(s.orders)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Preisregel</dt>
                  <dd className="m-0 font-medium">{describePricing(s.pricing)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Importierte Produkte gelten als</dt>
                  <dd className="m-0 font-medium">
                    {dataStatusLabel[s.importAs]} · Standard-MwSt. {s.defaultVatRate} % · knapp ab ≤ {s.lowStockThreshold} Stück
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Letzte Synchronisierung</dt>
                  <dd className="m-0 font-medium">{last ? `${formatDateTime(last.startedAt)} – ${last.message}` : "noch keine"}</dd>
                </div>
                {s.website && (
                  <div>
                    <dt className="text-muted">Website</dt>
                    <dd className="m-0 font-medium">
                      <a href={s.website} target="_blank" rel="noreferrer" className="text-lime-deep">
                        {s.website.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              {missing.length > 0 && (
                <p className="m-0 mt-5 rounded-xl bg-paper px-4 py-3 text-sm">
                  Noch zu setzen: <code className="font-mono text-xs">{missing.join(", ")}</code>
                </p>
              )}
              <div className="mt-5 border-t border-line pt-5">
                <SupplierActions supplierId={s.id} />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
