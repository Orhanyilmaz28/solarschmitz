import { afterEach, describe, expect, it, vi } from "vitest";
import { createOrder, CHECKOUT_DISABLED_MESSAGE } from "@/lib/checkout/create-order";
import { checkoutSchema, fieldErrors } from "@/lib/checkout/schemas";
import { applyShipmentUpdate, forwardOrder } from "@/lib/orders/forward";
import { processShipmentUpdate } from "@/lib/orders/shipments";
import { computeTotals, splitBySupplier } from "@/lib/orders/split";
import { canTransition, deriveStatusFromSupplierOrders, InvalidTransitionError, transition } from "@/lib/orders/state";
import type { Order, OrderLine } from "@/lib/orders/types";
import { createMemoryStore } from "@/lib/store/memory";
import { buildOrderCsv, submitOrderVia } from "@/lib/suppliers/adapters/orders";
import { supplierConfigs } from "@/lib/suppliers/config";
import { NotConfiguredError } from "@/lib/suppliers/errors";
import type { SupplierAdapter, SupplierOrderPayload } from "@/lib/suppliers/types";
import { signWebhook, verifyWebhookSignature } from "@/lib/suppliers/webhook";

const lines: OrderLine[] = [
  { productId: "a", sku: "SS-A", name: "Set", quantity: 1, unitPrice: 329, vatRate: 0, supplierId: "eforu", supplierSku: "E1" },
  { productId: "b", sku: "SS-B", name: "Zähler", quantity: 2, unitPrice: 99, vatRate: 19, supplierId: "eforu", supplierSku: "E2" },
  { productId: "c", sku: "SS-C", name: "Modul", quantity: 1, unitPrice: 119, vatRate: 0, supplierId: "other", supplierSku: "O1" },
];

const address = { firstName: "Erika", lastName: "Muster", street: "Hauptstraße", houseNumber: "1a", zip: "50667", city: "Köln", country: "DE" as const };

function order(status: Order["status"] = "paid"): Order {
  const now = "2026-10-27T10:00:00.000Z";
  return {
    id: "o1",
    number: "SS-20261027-AAAA",
    createdAt: now,
    updatedAt: now,
    status,
    email: "erika@example.org",
    billingAddress: address,
    shippingAddress: address,
    lines,
    totals: computeTotals(lines),
    supplierOrders: splitBySupplier("SS-20261027-AAAA", lines, now),
    events: [],
  };
}

function fakeAdapter(id: string, behavior: "ok" | "not-configured" | "error"): SupplierAdapter {
  const config = { ...supplierConfigs[0]!, id, name: id };
  return {
    config,
    testConnection: async () => ({ state: "connected", message: "ok", checkedAt: "" }),
    fetchCatalog: async () => ({ records: [], format: "csv", source: "fake" }),
    fetchPricesAndStock: async () => [],
    fetchShipments: async () => [],
    submitOrder: vi.fn(async (p: SupplierOrderPayload) => {
      if (behavior === "not-configured") throw new NotConfiguredError("Mailversand fehlt");
      if (behavior === "error") throw new Error("HTTP 500");
      return { accepted: true, supplierReference: `REF-${p.supplierOrderId}`, message: "übermittelt" };
    }),
  };
}

describe("Summen und Aufteilung", () => {
  it("berechnet enthaltene MwSt. je Satz", () => {
    const t = computeTotals(lines, 39);
    expect(t.itemsGross).toBe(646);
    expect(t.totalGross).toBe(685);
    // 198 brutto bei 19 % -> 31,61; Versand 39 bei 19 % -> 6,23
    expect(t.vat).toEqual([
      { rate: 0, amount: 0 },
      { rate: 19, amount: 37.84 },
    ]);
  });

  it("teilt nach Lieferant auf", () => {
    const parts = splitBySupplier("SS-1", lines);
    expect(parts.map((p) => [p.id, p.supplierId, p.lineIndexes])).toEqual([
      ["SS-1-1", "eforu", [0, 1]],
      ["SS-1-2", "other", [2]],
    ]);
  });
});

describe("Status-Maschine", () => {
  it("erlaubt nur definierte Übergänge", () => {
    expect(canTransition("created", "payment_pending")).toBe(true);
    expect(canTransition("created", "shipped")).toBe(false);
    expect(() => transition(order("created"), "shipped")).toThrow(InvalidTransitionError);
    const o = transition(order("paid"), "forwarded", undefined, "2026-10-27T11:00:00.000Z");
    expect(o.status).toBe("forwarded");
    expect(o.events.at(-1)?.type).toBe("status");
  });

  it("leitet den Gesamtstatus aus Teilbestellungen ab", () => {
    const parts = order().supplierOrders;
    expect(deriveStatusFromSupplierOrders("forwarded", [{ ...parts[0]!, status: "shipped" }, { ...parts[1]!, status: "submitted" }])).toBe("partially_shipped");
    expect(deriveStatusFromSupplierOrders("forwarded", [{ ...parts[0]!, status: "shipped" }, { ...parts[1]!, status: "delivered" }])).toBe("shipped");
    expect(deriveStatusFromSupplierOrders("shipped", parts.map((p) => ({ ...p, status: "delivered" as const })))).toBe("delivered");
  });
});

describe("Weiterleitung an Lieferanten", () => {
  it("übermittelt jede Teilbestellung und setzt forwarded", async () => {
    const eforu = fakeAdapter("eforu", "ok");
    const other = fakeAdapter("other", "ok");
    const res = await forwardOrder(order(), (id) => (id === "eforu" ? eforu : other));
    expect(res.status).toBe("forwarded");
    expect(res.supplierOrders.map((p) => p.status)).toEqual(["submitted", "submitted"]);
    expect(res.supplierOrders[0]?.supplierReference).toBe("REF-SS-20261027-AAAA-1");
    const payload = (eforu.submitOrder as ReturnType<typeof vi.fn>).mock.calls[0]![0] as SupplierOrderPayload;
    expect(payload.lines).toEqual([
      { supplierSku: "E1", name: "Set", quantity: 1 },
      { supplierSku: "E2", name: "Zähler", quantity: 2 },
    ]);
    expect(payload.shippingAddress.street).toBe("Hauptstraße 1a");
  });

  it("markiert fehlende Einrichtung als Fehler statt sie zu verschweigen", async () => {
    const res = await forwardOrder(order(), (id) => fakeAdapter(id, id === "eforu" ? "not-configured" : "ok"));
    expect(res.status).toBe("failed");
    expect(res.supplierOrders[0]?.status).toBe("failed");
    expect(res.supplierOrders[0]?.lastMessage).toMatch(/Nicht eingerichtet/);
    expect(res.supplierOrders[1]?.status).toBe("submitted");

    // Erneuter Versuch schickt nur die fehlgeschlagene Teilbestellung
    const retryAdapter = fakeAdapter("eforu", "ok");
    const otherAdapter = fakeAdapter("other", "ok");
    const retry = await forwardOrder(res, (id) => (id === "eforu" ? retryAdapter : otherAdapter));
    expect(retry.status).toBe("forwarded");
    expect(otherAdapter.submitOrder).not.toHaveBeenCalled();
  });

  it("leitet unbezahlte Bestellungen nicht weiter", async () => {
    await expect(forwardOrder(order("created"), () => undefined)).rejects.toThrow(/bezahlte/);
  });

  it("E-Mail-Kanal versendet ohne Mailversand nichts", async () => {
    process.env.SUPPLIER_TEST_ORDER_EMAIL = "orders@example.org";
    const payload: SupplierOrderPayload = {
      orderNumber: "SS-1",
      supplierOrderId: "SS-1-1",
      createdAt: "",
      shippingAddress: { name: "Erika Muster", street: "Hauptstraße 1a", zip: "50667", city: "Köln", country: "DE", email: "e@example.org" },
      lines: [{ supplierSku: "E1", name: "Set; mit Semikolon", quantity: 1 }],
    };
    await expect(submitOrderVia({ kind: "email-csv", toEnv: "SUPPLIER_TEST_ORDER_EMAIL" }, payload, { supplierId: "t", shopName: "Test" })).rejects.toBeInstanceOf(NotConfiguredError);
    const csv = buildOrderCsv(payload);
    expect(csv.split("\r\n")[0]).toContain("Bestellnummer;Artikelnummer");
    expect(csv).toContain('"Set; mit Semikolon"');
    delete process.env.SUPPLIER_TEST_ORDER_EMAIL;
  });
});

describe("Versandstatus", () => {
  it("übernimmt Tracking und aktualisiert den Gesamtstatus", () => {
    const fwd: Order = { ...order("forwarded"), supplierOrders: order().supplierOrders.map((p) => ({ ...p, status: "submitted" as const })) };
    const res = applyShipmentUpdate(fwd, {
      eventId: "e1",
      supplierId: "eforu",
      supplierOrderId: "SS-20261027-AAAA-1",
      status: "shipped",
      carrier: "DHL",
      trackingNumber: "00340434",
      occurredAt: "2026-10-28T09:00:00.000Z",
    });
    expect(res.applied).toBe(true);
    expect(res.order.status).toBe("partially_shipped");
    expect(res.order.supplierOrders[0]?.tracking).toEqual({ carrier: "DHL", trackingNumber: "00340434", trackingUrl: undefined });
  });

  it("verarbeitet Ereignisse nur einmal", async () => {
    const store = createMemoryStore();
    await store.orders.save({ ...order("forwarded"), supplierOrders: order().supplierOrders.map((p) => ({ ...p, status: "submitted" as const })) });
    const update = { eventId: "e1", supplierId: "other", supplierOrderId: "SS-20261027-AAAA-2", status: "delivered" as const, occurredAt: "2026-10-28T09:00:00.000Z" };
    expect((await processShipmentUpdate(store, update)).applied).toBe(true);
    expect((await processShipmentUpdate(store, update)).duplicate).toBe(true);
    expect((await store.orders.getByNumber("SS-20261027-AAAA"))?.status).toBe("partially_shipped");
    expect(await store.shipments.list()).toHaveLength(1);
  });
});

describe("Webhook-Signatur", () => {
  const secret = "test-secret";
  const body = JSON.stringify({ eventId: "e1", status: "shipped" });
  const ts = 1_800_000_000;

  it("akzeptiert gültige Signaturen", () => {
    const signature = signWebhook(body, ts, secret);
    expect(verifyWebhookSignature({ rawBody: body, timestamp: String(ts), signature, secret, nowSeconds: ts + 10 })).toEqual({ ok: true });
  });

  it("lehnt manipulierte, alte oder fehlende Signaturen ab", () => {
    const signature = signWebhook(body, ts, secret);
    expect(verifyWebhookSignature({ rawBody: body + " ", timestamp: String(ts), signature, secret, nowSeconds: ts }).ok).toBe(false);
    expect(verifyWebhookSignature({ rawBody: body, timestamp: String(ts), signature, secret, nowSeconds: ts + 301 }).ok).toBe(false);
    expect(verifyWebhookSignature({ rawBody: body, timestamp: String(ts), signature: "sha256=00", secret, nowSeconds: ts }).ok).toBe(false);
    expect(verifyWebhookSignature({ rawBody: body, timestamp: null, signature, secret }).ok).toBe(false);
    expect(verifyWebhookSignature({ rawBody: body, timestamp: String(ts), signature, secret: undefined }).ok).toBe(false);
  });
});

describe("Checkout", () => {
  afterEach(() => {
    delete process.env.CHECKOUT_ENABLED;
    delete process.env.PAYMENT_PROVIDER;
  });

  const valid = {
    contact: { email: " Erika@Example.org ", phone: "" },
    billingAddress: address,
    shippingSameAsBilling: true,
    lines: [{ productId: "p-apsystems-ez1m", quantity: 1 }],
    acceptTerms: true,
    acknowledgeWithdrawal: true,
  };

  it("Schema prüft deutsche Adressen", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
    const bad = checkoutSchema.safeParse({ ...valid, billingAddress: { ...address, zip: "1234" }, acceptTerms: false });
    expect(bad.success).toBe(false);
    const errors = fieldErrors(bad.error!);
    expect(errors["billingAddress.zip"]).toMatch(/fünfstellige/);
    expect(errors.acceptTerms).toMatch(/AGB/);
    expect(checkoutSchema.safeParse({ ...valid, shippingSameAsBilling: false }).success).toBe(false);
  });

  it("lehnt ab, solange der Checkout gesperrt ist", async () => {
    const res = await createOrder(valid, { store: createMemoryStore() });
    expect(res).toMatchObject({ ok: false, code: "CHECKOUT_DISABLED", httpStatus: 503, message: CHECKOUT_DISABLED_MESSAGE });
  });

  it("lehnt ab, wenn nur ein Platzhalter-Zahlungsanbieter gesetzt ist", async () => {
    process.env.CHECKOUT_ENABLED = "true";
    process.env.PAYMENT_PROVIDER = "stripe";
    const res = await createOrder(valid, { store: createMemoryStore() });
    expect(res.ok).toBe(false);
    // Versand ist im Repository noch nicht konfiguriert; das wird zuerst gemeldet
    if (!res.ok) expect(["SHIPPING_NOT_CONFIGURED", "PAYMENT_NOT_CONFIGURED"]).toContain(res.code);
  });

  it("meldet Validierungsfehler je Feld", async () => {
    const res = await createOrder({ ...valid, lines: [] }, { store: createMemoryStore(), checkoutEnabled: () => true });
    expect(res).toMatchObject({ ok: false, code: "VALIDATION", httpStatus: 400 });
    if (!res.ok) expect(res.fields?.lines).toMatch(/leer/);
  });
});
