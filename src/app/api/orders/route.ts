import { createOrder } from "@/lib/checkout/create-order";
import { getStore } from "@/lib/store";
import { json, problem, readBodyText } from "../_lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders – Bestellung anlegen.
 * Antwortet mit 503, solange der Checkout gesperrt ist (CHECKOUT_ENABLED, Zahlung, Versand).
 */
export async function POST(req: Request) {
  const text = await readBodyText(req, 64 * 1024);
  if (text === null) return problem(413, "Anfrage ist zu groß.");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return problem(400, "Ungültiges JSON.");
  }

  const result = await createOrder(body, { store: getStore() });
  if (!result.ok) {
    return problem(result.httpStatus, result.message, { code: result.code, fields: result.fields });
  }
  return json({ orderNumber: result.order.number, redirectUrl: result.payment.redirectUrl }, 201);
}
