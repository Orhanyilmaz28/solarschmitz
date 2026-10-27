import { forwardOrder } from "@/lib/orders/forward";
import { getStore } from "@/lib/store";
import { errorMessage } from "@/lib/suppliers/errors";
import { getSupplierAdapter } from "@/lib/suppliers/registry";
import { json, problem } from "../../../../_lib/http";

export const dynamic = "force-dynamic";

/** POST /api/admin/orders/:orderId/forward – bezahlte Bestellung (erneut) an Lieferanten übermitteln */
export async function POST(_req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const store = getStore();
  const order = await store.orders.get(orderId);
  if (!order) return problem(404, "Bestellung nicht gefunden.");
  try {
    const updated = await forwardOrder(order, getSupplierAdapter);
    await store.orders.save(updated);
    return json({ status: updated.status, supplierOrders: updated.supplierOrders });
  } catch (err) {
    return problem(409, errorMessage(err));
  }
}
