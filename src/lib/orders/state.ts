import type { Order, OrderStatus, SupplierOrder, SupplierOrderStatus } from "./types";

/** Erlaubte Statuswechsel einer Bestellung */
export const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  created: ["payment_pending", "cancelled"],
  payment_pending: ["paid", "cancelled", "failed"],
  paid: ["forwarded", "cancelled", "failed"],
  forwarded: ["partially_shipped", "shipped", "delivered", "cancelled", "failed"],
  partially_shipped: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  // Fehlgeschlagene Weiterleitung kann erneut versucht werden
  failed: ["forwarded", "cancelled"],
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  created: "Angelegt",
  payment_pending: "Zahlung offen",
  paid: "Bezahlt",
  forwarded: "An Lieferant übermittelt",
  partially_shipped: "Teilweise versendet",
  shipped: "Versendet",
  delivered: "Zugestellt",
  cancelled: "Storniert",
  failed: "Fehler bei Weiterleitung",
};

export const supplierOrderStatusLabels: Record<SupplierOrderStatus, string> = {
  pending: "Wartet",
  submitted: "Übermittelt",
  shipped: "Versendet",
  delivered: "Zugestellt",
  cancelled: "Storniert",
  failed: "Fehlgeschlagen",
};

export class InvalidTransitionError extends Error {
  readonly from: OrderStatus;
  readonly to: OrderStatus;
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Statuswechsel von "${orderStatusLabels[from]}" zu "${orderStatusLabels[to]}" ist nicht erlaubt.`);
    this.name = "InvalidTransitionError";
    this.from = from;
    this.to = to;
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || orderTransitions[from].includes(to);
}

/** Gibt eine neue Bestellung mit geändertem Status zurück (unverändertes Original) */
export function transition(order: Order, to: OrderStatus, message?: string, at = new Date().toISOString()): Order {
  if (order.status === to) return order;
  if (!canTransition(order.status, to)) throw new InvalidTransitionError(order.status, to);
  return {
    ...order,
    status: to,
    updatedAt: at,
    events: [...order.events, { at, type: "status", message: message ?? `Status: ${orderStatusLabels[to]}` }],
  };
}

/**
 * Gesamtstatus aus den Teilbestellungen ableiten (nach Versand-Updates).
 * Stornierte Teilbestellungen zählen nicht mit, solange andere aktiv sind.
 */
export function deriveStatusFromSupplierOrders(current: OrderStatus, parts: SupplierOrder[]): OrderStatus {
  const active = parts.filter((p) => p.status !== "cancelled");
  if (!parts.length) return current;
  if (!active.length) return canTransition(current, "cancelled") ? "cancelled" : current;
  const all = (s: SupplierOrderStatus[]) => active.every((p) => s.includes(p.status));
  const some = (s: SupplierOrderStatus[]) => active.some((p) => s.includes(p.status));
  let next: OrderStatus = current;
  if (all(["delivered"])) next = "delivered";
  else if (all(["shipped", "delivered"])) next = "shipped";
  else if (some(["shipped", "delivered"])) next = "partially_shipped";
  return canTransition(current, next) ? next : current;
}
