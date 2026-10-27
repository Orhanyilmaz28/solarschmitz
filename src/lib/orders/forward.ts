import { errorMessage, NotConfiguredError } from "@/lib/suppliers/errors";
import type { ShipmentUpdate, SupplierAdapter } from "@/lib/suppliers/types";
import { buildSupplierPayload } from "./split";
import { deriveStatusFromSupplierOrders, transition } from "./state";
import type { Order, ShipmentEventRecord, SupplierOrder } from "./types";

export type AdapterLookup = (supplierId: string) => SupplierAdapter | undefined;

/**
 * Bezahlte Bestellung an die Lieferanten weiterleiten.
 * Jede Teilbestellung wird einzeln übermittelt; Fehler werden festgehalten,
 * damit sie im Admin sichtbar sind und erneut versucht werden können.
 */
export async function forwardOrder(order: Order, getAdapter: AdapterLookup, now = new Date().toISOString()): Promise<Order> {
  if (order.status !== "paid" && order.status !== "failed") {
    throw new Error(`Nur bezahlte Bestellungen werden weitergeleitet (aktuell: ${order.status}).`);
  }
  const events = [...order.events];
  const parts: SupplierOrder[] = [];

  for (const part of order.supplierOrders) {
    if (part.status !== "pending" && part.status !== "failed") {
      parts.push(part);
      continue;
    }
    const adapter = getAdapter(part.supplierId);
    if (!adapter) {
      parts.push({ ...part, status: "failed", lastMessage: "Unbekannter Lieferant", updatedAt: now });
      events.push({ at: now, type: "supplier", message: `${part.id}: Unbekannter Lieferant ${part.supplierId}` });
      continue;
    }
    try {
      const res = await adapter.submitOrder(buildSupplierPayload(order, part));
      const status = res.accepted ? "submitted" : "failed";
      parts.push({ ...part, status, supplierReference: res.supplierReference, lastMessage: res.message, updatedAt: now });
      events.push({ at: now, type: "supplier", message: `${part.id} → ${adapter.config.name}: ${res.message}` });
    } catch (err) {
      const msg = err instanceof NotConfiguredError ? `Nicht eingerichtet: ${err.message}` : errorMessage(err);
      parts.push({ ...part, status: "failed", lastMessage: msg, updatedAt: now });
      events.push({ at: now, type: "supplier", message: `${part.id} → ${adapter.config.name}: ${msg}` });
    }
  }

  const anyFailed = parts.some((p) => p.status === "failed");
  const updated: Order = { ...order, supplierOrders: parts, events, updatedAt: now };
  return transition(updated, anyFailed ? "failed" : "forwarded", anyFailed ? "Weiterleitung teilweise fehlgeschlagen" : "An Lieferanten übermittelt", now);
}

/** Versand-Update auf die passende Teilbestellung anwenden */
export function applyShipmentUpdate(order: Order, update: ShipmentUpdate): { order: Order; applied: boolean; message: string } {
  const idx = order.supplierOrders.findIndex(
    (p) =>
      p.supplierId === update.supplierId &&
      (p.id === update.supplierOrderId || (update.supplierReference && p.supplierReference === update.supplierReference) || order.supplierOrders.filter((x) => x.supplierId === update.supplierId).length === 1),
  );
  if (idx < 0) return { order, applied: false, message: "Keine passende Teilbestellung gefunden" };

  const part = order.supplierOrders[idx]!;
  const statusMap = { in_transit: "shipped", shipped: "shipped", delivered: "delivered", cancelled: "cancelled", exception: part.status } as const;
  const nextPartStatus = statusMap[update.status];
  const tracking = {
    carrier: update.carrier ?? part.tracking?.carrier,
    trackingNumber: update.trackingNumber ?? part.tracking?.trackingNumber,
    trackingUrl: update.trackingUrl ?? part.tracking?.trackingUrl,
  };
  const parts = order.supplierOrders.map((p, i) =>
    i === idx ? { ...p, status: nextPartStatus, tracking, lastMessage: `Versandstatus: ${update.status}`, updatedAt: update.occurredAt } : p,
  );
  const events = [
    ...order.events,
    {
      at: update.occurredAt,
      type: "shipment" as const,
      message: `${part.id}: ${update.status}${tracking.trackingNumber ? ` (${tracking.carrier ?? "Sendung"} ${tracking.trackingNumber})` : ""}`,
    },
  ];
  const next = deriveStatusFromSupplierOrders(order.status, parts);
  let updated: Order = { ...order, supplierOrders: parts, events, updatedAt: update.occurredAt };
  if (next !== order.status) updated = transition(updated, next, undefined, update.occurredAt);
  return { order: updated, applied: true, message: "Versandstatus übernommen" };
}

/** Datensatz fürs Versand-Protokoll */
export function shipmentRecord(update: ShipmentUpdate, applied: boolean, message: string): ShipmentEventRecord {
  return {
    eventId: update.eventId,
    supplierId: update.supplierId,
    orderNumber: update.orderNumber,
    supplierOrderId: update.supplierOrderId,
    status: update.status,
    receivedAt: new Date().toISOString(),
    applied,
    message,
  };
}
