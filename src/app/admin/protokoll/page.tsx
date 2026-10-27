import { getStore } from "@/lib/store";
import { syncStatusLabel, syncTone } from "../_components/labels";
import { AdminTitle, Card, EmptyState, Pill, TableWrap, formatDateTime, td, th } from "../_components/ui";

export const metadata = { title: "Protokoll · Admin" };

export default async function LogPage() {
  const store = getStore();
  const [syncs, shipments] = await Promise.all([store.syncLog.list(100), store.shipments.list(100)]);

  return (
    <>
      <AdminTitle title="Protokoll" lead="Synchronisierungen, Importe und eingehende Versandmeldungen der Lieferanten." />

      <Card title="Synchronisierungen und Importe">
        {syncs.length === 0 ? (
          <EmptyState title="Noch keine Einträge">Testläufe und Importe erscheinen hier.</EmptyState>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Zeit</th>
                <th className={th}>Lieferant</th>
                <th className={th}>Quelle</th>
                <th className={th}>Art</th>
                <th className={th}>Ergebnis</th>
                <th className={th}>Fehler</th>
              </tr>
            </thead>
            <tbody>
              {syncs.map((s) => (
                <tr key={s.id}>
                  <td className={`${td} whitespace-nowrap`}>{formatDateTime(s.startedAt)}</td>
                  <td className={td}>{s.supplierId}</td>
                  <td className={td}>{s.source}</td>
                  <td className={td}>{s.dryRun ? "Vorschau" : "Übernommen"}</td>
                  <td className={td}>
                    <Pill tone={syncTone(s.status)}>{syncStatusLabel[s.status]}</Pill>
                    <span className="block text-xs text-muted">{s.message}</span>
                  </td>
                  <td className={`${td} min-w-[240px] text-xs`}>
                    {s.errors.length === 0 ? (
                      "–"
                    ) : (
                      <details>
                        <summary className="cursor-pointer font-semibold">{s.errors.length} Hinweise</summary>
                        <ul className="m-0 mt-1 list-none space-y-1 p-0 text-danger">
                          {s.errors.slice(0, 20).map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Card title="Versandmeldungen" className="mt-6">
        {shipments.length === 0 ? (
          <EmptyState title="Noch keine Versandmeldungen">
            Lieferanten melden den Versandstatus per Webhook an <code className="font-mono text-sm">/api/webhooks/suppliers/[id]</code>.
          </EmptyState>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Empfangen</th>
                <th className={th}>Lieferant</th>
                <th className={th}>Bestellung</th>
                <th className={th}>Status</th>
                <th className={th}>Ergebnis</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={`${s.supplierId}-${s.eventId}`}>
                  <td className={`${td} whitespace-nowrap`}>{formatDateTime(s.receivedAt)}</td>
                  <td className={td}>{s.supplierId}</td>
                  <td className={`${td} font-mono text-xs`}>{s.orderNumber ?? s.supplierOrderId ?? "–"}</td>
                  <td className={td}>{s.status}</td>
                  <td className={td}>
                    <Pill tone={s.applied ? "ok" : "warn"}>{s.applied ? "übernommen" : "nicht zugeordnet"}</Pill>
                    <span className="block text-xs text-muted">{s.message}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
