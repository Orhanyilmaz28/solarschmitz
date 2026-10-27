import type { Address, Order, OrderLine, OrderTotals, SupplierOrder } from "./types";
import type { SupplierOrderPayload } from "@/lib/suppliers/types";

const cents = (eur: number) => Math.round(eur * 100);

/** Summen inkl. enthaltener Umsatzsteuer je Satz (Preise sind brutto) */
export function computeTotals(lines: OrderLine[], shippingGross = 0, shippingVatRate: 0 | 19 = 19): OrderTotals {
  const itemsCents = lines.reduce((s, l) => s + cents(l.unitPrice) * l.quantity, 0);
  const vatCents = new Map<0 | 19, number>();
  for (const l of lines) {
    const gross = cents(l.unitPrice) * l.quantity;
    const vat = Math.round(gross - gross / (1 + l.vatRate / 100));
    vatCents.set(l.vatRate, (vatCents.get(l.vatRate) ?? 0) + vat);
  }
  if (shippingGross > 0) {
    const g = cents(shippingGross);
    vatCents.set(shippingVatRate, (vatCents.get(shippingVatRate) ?? 0) + Math.round(g - g / (1 + shippingVatRate / 100)));
  }
  return {
    itemsGross: itemsCents / 100,
    shippingGross: cents(shippingGross) / 100,
    totalGross: (itemsCents + cents(shippingGross)) / 100,
    vat: [...vatCents.entries()].sort((a, b) => a[0] - b[0]).map(([rate, amount]) => ({ rate, amount: amount / 100 })),
  };
}

/** Positionen nach Lieferant gruppieren; jede Gruppe wird eine Teilbestellung */
export function splitBySupplier(orderNumber: string, lines: OrderLine[], now = new Date().toISOString()): SupplierOrder[] {
  const groups = new Map<string, number[]>();
  lines.forEach((l, i) => {
    const list = groups.get(l.supplierId) ?? [];
    list.push(i);
    groups.set(l.supplierId, list);
  });
  return [...groups.entries()].map(([supplierId, lineIndexes], n) => ({
    id: `${orderNumber}-${n + 1}`,
    supplierId,
    lineIndexes,
    status: "pending",
    updatedAt: now,
  }));
}

function formatAddress(a: Address) {
  return {
    name: `${a.firstName} ${a.lastName}`.trim(),
    company: a.company,
    street: `${a.street} ${a.houseNumber}`.trim(),
    zip: a.zip,
    city: a.city,
    country: a.country,
  };
}

/** Daten, die ein Lieferant für den Direktversand bekommt (nur das Nötige) */
export function buildSupplierPayload(order: Order, part: SupplierOrder): SupplierOrderPayload {
  return {
    orderNumber: order.number,
    supplierOrderId: part.id,
    createdAt: order.createdAt,
    shippingAddress: { ...formatAddress(order.shippingAddress), phone: order.phone, email: order.email },
    lines: part.lineIndexes.map((i) => {
      const l = order.lines[i]!;
      return { supplierSku: l.supplierSku ?? l.sku, name: l.name, quantity: l.quantity };
    }),
    note: order.note,
  };
}
