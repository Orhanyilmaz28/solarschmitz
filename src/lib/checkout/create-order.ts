import { randomBytes, randomUUID } from "node:crypto";
import { isPurchasable } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";
import { isCheckoutEnabled, site } from "@/config/site";
import { computeTotals, splitBySupplier } from "@/lib/orders/split";
import { transition } from "@/lib/orders/state";
import type { Address, Order, OrderLine } from "@/lib/orders/types";
import { getPaymentProvider, getPaymentStatus, type PaymentSession } from "@/lib/payments";
import { findProduct } from "@/lib/store/catalog";
import type { Store } from "@/lib/store/types";
import { errorMessage } from "@/lib/suppliers/errors";
import { withStandardVat, STANDARD_VAT_RATE } from "@/lib/cart/vat";
import { checkoutSchema, fieldErrors, type AddressInput } from "./schemas";

export type CreateOrderErrorCode =
  | "CHECKOUT_DISABLED"
  | "VALIDATION"
  | "PRODUCT_UNAVAILABLE"
  | "SHIPPING_NOT_CONFIGURED"
  | "PAYMENT_NOT_CONFIGURED"
  | "PAYMENT_FAILED";

export type CreateOrderResult =
  | { ok: true; order: Order; payment: PaymentSession }
  | { ok: false; code: CreateOrderErrorCode; httpStatus: number; message: string; fields?: Record<string, string> };

export const CHECKOUT_DISABLED_MESSAGE =
  "Der Checkout ist noch nicht freigeschaltet. Bestellungen sind möglich, sobald Zahlung, Versand und Lieferantenanbindung eingerichtet und getestet sind.";

function toAddress(a: AddressInput): Address {
  return { ...a, company: a.company || undefined, country: "DE" };
}

/** Bestellnummer wie "SS-20261027-7F3A" */
export function newOrderNumber(now = new Date()): string {
  const d = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `SS-${d}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

/**
 * Bestellposition mit Steuersatz.
 * Katalogpreise begünstigter Artikel sind mit 0 % USt. ausgewiesen. Ohne Bestätigung der
 * Voraussetzungen (§ 12 Abs. 3 UStG) gilt der Regelsteuersatz, der Bruttopreis steigt entsprechend.
 */
export function orderLineFor(p: Product, quantity: number, zeroRateConfirmed: boolean): OrderLine {
  const standard = p.vatRate === 0 && !zeroRateConfirmed;
  return {
    productId: p.id,
    sku: p.sku,
    name: p.name,
    quantity,
    unitPrice: standard ? withStandardVat(p.price) : p.price,
    vatRate: standard ? STANDARD_VAT_RATE : p.vatRate,
    supplierId: p.supplier.id,
    supplierSku: p.supplier.supplierSku,
  };
}

export interface CreateOrderDeps {
  store: Store;
  /** Für Tests überschreibbar */
  checkoutEnabled?: () => boolean;
  lookupProduct?: (id: string) => Promise<Product | undefined>;
  now?: Date;
  returnUrl?: string;
}

/**
 * Legt eine Bestellung an und startet die Zahlung.
 * Lehnt ab, solange der Checkout gesperrt ist oder Zahlung/Versand nicht eingerichtet sind.
 * Preise kommen immer vom Server, nie aus dem Warenkorb des Browsers.
 */
export async function createOrder(input: unknown, deps: CreateOrderDeps): Promise<CreateOrderResult> {
  const enabled = deps.checkoutEnabled ?? isCheckoutEnabled;
  if (!enabled()) return { ok: false, code: "CHECKOUT_DISABLED", httpStatus: 503, message: CHECKOUT_DISABLED_MESSAGE };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION", httpStatus: 400, message: "Bitte die markierten Felder prüfen.", fields: fieldErrors(parsed.error) };
  }
  const data = parsed.data;

  if (site.shipping.status !== "configured" || site.shipping.flatRateEUR === null) {
    return { ok: false, code: "SHIPPING_NOT_CONFIGURED", httpStatus: 503, message: "Versandkosten sind noch nicht festgelegt." };
  }

  const payment = getPaymentStatus();
  const provider = getPaymentProvider();
  if (!payment.ready || !provider) {
    return { ok: false, code: "PAYMENT_NOT_CONFIGURED", httpStatus: 503, message: payment.message };
  }

  const lookup = deps.lookupProduct ?? ((id: string) => findProduct(deps.store, id));
  const lines: OrderLine[] = [];
  for (const l of data.lines) {
    const p = await lookup(l.productId);
    if (!p || !isPurchasable(p)) {
      return {
        ok: false,
        code: "PRODUCT_UNAVAILABLE",
        httpStatus: 409,
        message: `${p?.name ?? "Ein Artikel"} ist derzeit nicht bestellbar. Bitte den Warenkorb prüfen.`,
      };
    }
    lines.push(orderLineFor(p, l.quantity, data.zeroRateConfirmed));
  }

  const now = (deps.now ?? new Date()).toISOString();
  const shipping = site.shipping.freeShippingFromEUR !== null && computeTotals(lines).itemsGross >= site.shipping.freeShippingFromEUR ? 0 : site.shipping.flatRateEUR;
  const number = newOrderNumber(deps.now);
  const billing = toAddress(data.billingAddress);
  let order: Order = {
    id: randomUUID(),
    number,
    createdAt: now,
    updatedAt: now,
    status: "created",
    email: data.contact.email,
    phone: data.contact.phone || undefined,
    billingAddress: billing,
    shippingAddress: data.shippingSameAsBilling || !data.shippingAddress ? billing : toAddress(data.shippingAddress),
    lines,
    totals: computeTotals(lines, shipping),
    supplierOrders: splitBySupplier(number, lines, now),
    note: data.note || undefined,
    zeroRate: { confirmed: data.zeroRateConfirmed, at: now },
    events: [
      { at: now, type: "status", message: "Bestellung angelegt" },
      {
        at: now,
        type: "status",
        message: data.zeroRateConfirmed
          ? "Voraussetzungen für 0 % USt. (§ 12 Abs. 3 UStG) bestätigt"
          : "Keine Bestätigung für 0 % USt., Regelsteuersatz angewendet",
      },
    ],
  };

  try {
    const session = await provider.createPayment({
      orderNumber: number,
      amountEUR: order.totals.totalGross,
      email: order.email,
      returnUrl: deps.returnUrl ?? `${site.url}/checkout/bestaetigung?bestellung=${number}`,
    });
    order = transition({ ...order, payment: { provider: provider.id, reference: session.reference, status: "pending" } }, "payment_pending", undefined, now);
    await deps.store.orders.save(order);
    return { ok: true, order, payment: session };
  } catch (err) {
    return { ok: false, code: "PAYMENT_FAILED", httpStatus: 502, message: `Zahlung konnte nicht gestartet werden: ${errorMessage(err)}` };
  }
}
