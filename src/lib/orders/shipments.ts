import type { Store } from "@/lib/store/types";
import { errorMessage } from "@/lib/suppliers/errors";
import type { ShipmentUpdate, SupplierAdapter } from "@/lib/suppliers/types";
import { applyShipmentUpdate, shipmentRecord } from "./forward";

/** Bestellnummer aus der Teilbestellungs-ID ableiten ("SS-20261027-AB12-1" -> "SS-20261027-AB12") */
function orderNumberOf(update: ShipmentUpdate): string | undefined {
  if (update.orderNumber) return update.orderNumber;
  return update.supplierOrderId?.replace(/-\d+$/, "");
}

/** Ein Versand-Update verarbeiten. Doppelte Ereignisse (gleiche eventId) werden ignoriert. */
export async function processShipmentUpdate(store: Store, update: ShipmentUpdate): Promise<{ applied: boolean; duplicate: boolean; message: string }> {
  if (await store.shipments.has(update.supplierId, update.eventId)) {
    return { applied: false, duplicate: true, message: "Ereignis bereits verarbeitet" };
  }
  const number = orderNumberOf(update);
  const order = number ? await store.orders.getByNumber(number) : undefined;
  if (!order) {
    const message = "Bestellung nicht gefunden";
    await store.shipments.add(shipmentRecord(update, false, message));
    return { applied: false, duplicate: false, message };
  }
  try {
    const res = applyShipmentUpdate(order, update);
    if (res.applied) await store.orders.save(res.order);
    await store.shipments.add(shipmentRecord(update, res.applied, res.message));
    return { applied: res.applied, duplicate: false, message: res.message };
  } catch (err) {
    const message = errorMessage(err);
    await store.shipments.add(shipmentRecord(update, false, message));
    return { applied: false, duplicate: false, message };
  }
}

/** Versandstatus beim Lieferanten abfragen (falls dessen API das kann) */
export async function syncShipments(adapter: SupplierAdapter, store: Store, since?: string) {
  const updates = await adapter.fetchShipments(since);
  const results = [];
  for (const u of updates) results.push({ eventId: u.eventId, ...(await processShipmentUpdate(store, u)) });
  return results;
}
