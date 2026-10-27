import Link from "next/link";
import { getCheckoutStatus } from "@/lib/checkout/status";
import type { DataStatus } from "@/lib/catalog/types";
import { getStore } from "@/lib/store";
import { getMergedProducts } from "@/lib/store/catalog";
import { getSetupStatus, getSupplierConfigs } from "@/lib/suppliers/registry";
import { AdminTitle, Card, Pill, Stat, TableWrap, formatDateTime, td, th } from "./_components/ui";
import { dataStatusLabel, setupTone, syncTone, syncStatusLabel } from "./_components/labels";

export default async function AdminOverview() {
  const store = getStore();
  const [products, syncs, orders] = await Promise.all([getMergedProducts(store), store.syncLog.list(5), store.orders.list()]);
  const checkout = getCheckoutStatus();
  const suppliers = getSupplierConfigs();

  const byStatus = (s: DataStatus) => products.filter((p) => p.dataStatus === s).length;

  return (
    <>
      <AdminTitle title="Übersicht" lead={`Stand der Lieferantenanbindung, des Katalogs und des Checkouts. Datenspeicher: ${store.driver === "file" ? "Dateien unter data/runtime (nur Entwicklung)" : store.driver}.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Produkte gesamt" value={products.length} hint="Seed-Katalog und Importe" />
        <Stat label="Live" value={byStatus("live")} hint="vom Lieferanten bestätigt" />
        <Stat label="Ungeprüft" value={byStatus("supplier-unverified")} hint="aus öffentlichem Katalog" />
        <Stat label="Demo" value={byStatus("demo")} hint="Platzhalter, nicht bestellbar" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Checkout" action={<Pill tone={checkout.enabled ? "ok" : "warn"}>{checkout.enabled ? "Freigeschaltet" : "Gesperrt"}</Pill>}>
          <p className="m-0 text-sm text-muted">
            Bestellungen sind erst möglich, wenn alle Punkte erledigt sind. Es werden keine Zahlungen oder Bestellungen simuliert.
          </p>
          <ul className="m-0 mt-4 list-none space-y-2 p-0 text-sm">
            {checkout.blockers.map((b) => (
              <li key={b.key} className="flex gap-3">
                <span aria-hidden className={`mt-1.5 h-2 w-2 flex-none rounded-full ${b.key === "catalog" ? "bg-muted" : "bg-sun"}`} />
                <span>{b.message}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Lieferanten" action={<Link href="/admin/lieferanten" className="text-sm font-semibold text-lime-deep">Verwalten</Link>}>
          <ul className="m-0 list-none space-y-3 p-0">
            {suppliers.map((s) => {
              const setup = getSetupStatus(s);
              const count = products.filter((p) => p.supplier.id === s.id).length;
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper px-4 py-3">
                  <div className="min-w-0">
                    <p className="m-0 font-semibold">{s.name}</p>
                    <p className="m-0 text-sm text-muted">
                      {count} Produkte · Katalog: {setup.catalog.label} · Bestellungen: {setup.orders.label}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={setupTone(setup.catalog.ready)}>Katalog {setup.catalog.ready ? "bereit" : "offen"}</Pill>
                    <Pill tone={setupTone(setup.orders.ready)}>Bestellweg {setup.orders.ready ? "bereit" : "offen"}</Pill>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="Letzte Synchronisierungen" action={<Link href="/admin/protokoll" className="text-sm font-semibold text-lime-deep">Alle anzeigen</Link>}>
          {syncs.length === 0 ? (
            <p className="m-0 text-sm text-muted">Noch keine Synchronisierung. Starte einen Testlauf unter Lieferanten oder Import.</p>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th className={th}>Zeit</th>
                  <th className={th}>Lieferant</th>
                  <th className={th}>Art</th>
                  <th className={th}>Ergebnis</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {syncs.map((s) => (
                  <tr key={s.id}>
                    <td className={`${td} whitespace-nowrap`}>{formatDateTime(s.startedAt)}</td>
                    <td className={td}>{s.supplierId}</td>
                    <td className={td}>{s.dryRun ? "Vorschau" : "Übernommen"}</td>
                    <td className={td}>{s.message}</td>
                    <td className={td}>
                      <Pill tone={syncTone(s.status)}>{syncStatusLabel[s.status]}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>

        <Card title="Bestellungen">
          <p className="m-0 font-display text-3xl font-bold tabular">{orders.length}</p>
          <p className="m-0 mt-1 text-sm text-muted">
            {orders.length === 0 ? "Noch keine Bestellungen. Der Checkout ist gesperrt." : "Bestellungen im Datenspeicher."}
          </p>
          <p className="m-0 mt-4 text-sm">
            Datenstatus im Katalog: {(["live", "supplier-unverified", "demo"] as const).map((s) => `${dataStatusLabel[s]} ${byStatus(s)}`).join(" · ")}
          </p>
        </Card>
      </div>
    </>
  );
}
