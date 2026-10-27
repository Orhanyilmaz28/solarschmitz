import { getCheckoutStatus } from "@/lib/checkout/status";
import { formatEUR } from "@/lib/format";
import { orderStatusLabels, supplierOrderStatusLabels } from "@/lib/orders/state";
import { getStore } from "@/lib/store";
import { AdminTitle, Card, EmptyState, Pill, TableWrap, formatDateTime, td, th } from "../_components/ui";

export const metadata = { title: "Bestellungen · Admin" };

export default async function AdminOrdersPage() {
  const orders = await getStore().orders.list();
  const checkout = getCheckoutStatus();

  return (
    <>
      <AdminTitle
        title="Bestellungen"
        lead="Jede Bestellung wird nach Lieferanten aufgeteilt. Die Teilbestellungen gehen direkt an den jeweiligen Lieferanten, der an die Kundschaft versendet."
      />
      {orders.length === 0 ? (
        <EmptyState title="Noch keine Bestellungen">
          <p className="m-0">
            {checkout.enabled
              ? "Der Checkout ist freigeschaltet. Neue Bestellungen erscheinen hier."
              : "Der Checkout ist gesperrt, deshalb kann noch niemand bestellen. Offen:"}
          </p>
          {!checkout.enabled && (
            <ul className="m-0 mt-3 list-none space-y-1 p-0 text-sm">
              {checkout.blockers
                .filter((b) => b.key !== "catalog")
                .map((b) => (
                  <li key={b.key}>{b.message}</li>
                ))}
            </ul>
          )}
        </EmptyState>
      ) : (
        <Card title={`${orders.length} Bestellungen`}>
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Nummer</th>
                <th className={th}>Datum</th>
                <th className={th}>Kunde</th>
                <th className={`${th} text-right`}>Summe</th>
                <th className={th}>Status</th>
                <th className={th}>Teilbestellungen</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className={`${td} font-mono text-xs`}>{o.number}</td>
                  <td className={`${td} whitespace-nowrap`}>{formatDateTime(o.createdAt)}</td>
                  <td className={td}>
                    {o.billingAddress.firstName} {o.billingAddress.lastName}
                    <span className="block text-xs text-muted">
                      {o.shippingAddress.zip} {o.shippingAddress.city}
                    </span>
                  </td>
                  <td className={`${td} text-right tabular`}>{formatEUR(o.totals.totalGross)}</td>
                  <td className={td}>
                    <Pill tone={o.status === "failed" ? "error" : o.status === "delivered" ? "ok" : "neutral"}>{orderStatusLabels[o.status]}</Pill>
                  </td>
                  <td className={`${td} min-w-[220px]`}>
                    <ul className="m-0 list-none space-y-1 p-0">
                      {o.supplierOrders.map((s) => (
                        <li key={s.id} className="text-xs">
                          <span className="font-semibold">{s.supplierId}</span> · {supplierOrderStatusLabels[s.status]}
                          {s.tracking?.trackingNumber && ` · ${s.tracking.carrier ?? "Sendung"} ${s.tracking.trackingNumber}`}
                          {s.lastMessage && <span className="block text-muted">{s.lastMessage}</span>}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      )}
    </>
  );
}
