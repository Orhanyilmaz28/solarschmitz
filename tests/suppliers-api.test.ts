import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as importRoute } from "@/app/api/admin/import/route";
import { POST as ordersRoute } from "@/app/api/orders/route";
import { GET as productsRoute } from "@/app/api/products/route";
import { POST as webhookRoute } from "@/app/api/webhooks/suppliers/[supplierId]/route";
import { computeTotals, splitBySupplier } from "@/lib/orders/split";
import type { Order } from "@/lib/orders/types";
import { createMemoryStore, setStore } from "@/lib/store";
import { signWebhook } from "@/lib/suppliers/webhook";

const store = createMemoryStore();
const csv = readFileSync(path.join(process.cwd(), "data", "supplier-feeds", "demo-feed.csv"), "utf8");

beforeAll(() => {
  setStore(store);
  process.env.SUPPLIER_WEBHOOK_SECRET = "s3cret";
});
afterAll(() => {
  setStore(null);
  delete process.env.SUPPLIER_WEBHOOK_SECRET;
});

describe("API-Routen", () => {
  it("Import-Vorschau und Übernahme", async () => {
    const req = (q: string) =>
      new Request(`http://localhost/api/admin/import${q}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: csv, supplierId: "demo-feed" }),
      });
    const preview = await (await importRoute(req(""))).json();
    expect(preview.dryRun).toBe(true);
    expect(preview.counts.valid).toBe(6);
    expect(await store.products.list()).toHaveLength(0);

    const commit = await (await importRoute(req("?commit=1"))).json();
    expect(commit.counts.created).toBe(6);
    expect(await store.products.list()).toHaveLength(6);
  });

  it("Produkt-API liefert keine Einkaufspreise aus", async () => {
    const res = await productsRoute(new Request("http://localhost/api/products?q=demo-feed"));
    const data = await res.json();
    expect(data.count).toBeGreaterThan(0);
    expect(JSON.stringify(data)).not.toContain("costPrice");
  });

  it("Bestell-API lehnt bei gesperrtem Checkout ab", async () => {
    const res = await ordersRoute(new Request("http://localhost/api/orders", { method: "POST", body: "{}" }));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("CHECKOUT_DISABLED");
  });

  it("Webhook prüft Signatur und übernimmt Versandstatus", async () => {
    const now = "2026-10-27T10:00:00.000Z";
    const lines = [{ productId: "x", sku: "S", name: "Set", quantity: 1, unitPrice: 300, vatRate: 0 as const, supplierId: "eforu", supplierSku: "E1" }];
    const order: Order = {
      id: "o-api",
      number: "SS-20261027-BEEF",
      createdAt: now,
      updatedAt: now,
      status: "forwarded",
      email: "a@example.org",
      billingAddress: { firstName: "A", lastName: "B", street: "Weg", houseNumber: "1", zip: "10115", city: "Berlin", country: "DE" },
      shippingAddress: { firstName: "A", lastName: "B", street: "Weg", houseNumber: "1", zip: "10115", city: "Berlin", country: "DE" },
      lines,
      totals: computeTotals(lines),
      supplierOrders: splitBySupplier("SS-20261027-BEEF", lines, now).map((p) => ({ ...p, status: "submitted" as const })),
      events: [],
    };
    await store.orders.save(order);

    const body = JSON.stringify({ eventId: "evt-1", orderNumber: order.number, status: "shipped", carrier: "DHL", trackingNumber: "123" });
    const ts = Math.floor(Date.now() / 1000);
    const call = (signature: string) =>
      webhookRoute(
        new Request("http://localhost/api/webhooks/suppliers/eforu", {
          method: "POST",
          headers: { "x-timestamp": String(ts), "x-signature": signature },
          body,
        }),
        { params: Promise.resolve({ supplierId: "eforu" }) },
      );

    expect((await call("sha256=falsch")).status).toBe(401);
    const ok = await call(signWebhook(body, ts, "s3cret"));
    expect(ok.status).toBe(200);
    expect((await store.orders.getByNumber(order.number))?.status).toBe("shipped");
    expect((await (await call(signWebhook(body, ts, "s3cret"))).json()).duplicate).toBe(true);
  });
});
