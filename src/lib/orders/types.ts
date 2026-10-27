import type { ShipmentStatus } from "@/lib/suppliers/types";

export const orderStatuses = [
  "created",
  "payment_pending",
  "paid",
  "forwarded",
  "partially_shipped",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const supplierOrderStatuses = ["pending", "submitted", "shipped", "delivered", "cancelled", "failed"] as const;
export type SupplierOrderStatus = (typeof supplierOrderStatuses)[number];

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  country: "DE";
}

export interface OrderLine {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  /** Bruttopreis je Stück zum Bestellzeitpunkt */
  unitPrice: number;
  vatRate: 0 | 19;
  supplierId: string;
  supplierSku?: string;
}

export interface Tracking {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

/** Teilbestellung je Lieferant (Dropshipping: jeder Lieferant versendet selbst) */
export interface SupplierOrder {
  id: string;
  supplierId: string;
  lineIndexes: number[];
  status: SupplierOrderStatus;
  supplierReference?: string;
  tracking?: Tracking;
  lastMessage?: string;
  updatedAt: string;
}

export interface OrderEvent {
  at: string;
  type: "status" | "supplier" | "shipment" | "note";
  message: string;
}

export interface OrderTotals {
  /** Summe brutto der Positionen */
  itemsGross: number;
  shippingGross: number;
  totalGross: number;
  /** Enthaltene Umsatzsteuer je Satz */
  vat: { rate: 0 | 19; amount: number }[];
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  email: string;
  phone?: string;
  billingAddress: Address;
  shippingAddress: Address;
  lines: OrderLine[];
  totals: OrderTotals;
  supplierOrders: SupplierOrder[];
  payment?: { provider: string; reference?: string; status: "pending" | "paid" | "failed" | "refunded" };
  note?: string;
  /** Angabe zum Nullsteuersatz (§ 12 Abs. 3 UStG) mit Zeitpunkt, als Nachweis */
  zeroRate?: { confirmed: boolean; at: string };
  events: OrderEvent[];
}

export interface ShipmentEventRecord {
  eventId: string;
  supplierId: string;
  orderNumber?: string;
  supplierOrderId?: string;
  status: ShipmentStatus;
  receivedAt: string;
  applied: boolean;
  message: string;
}
