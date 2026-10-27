import { processShipmentUpdate } from "@/lib/orders/shipments";
import { getStore } from "@/lib/store";
import { getSupplierConfig } from "@/lib/suppliers/registry";
import { shipmentWebhookSchema, toShipmentUpdate, verifyWebhookSignature } from "@/lib/suppliers/webhook";
import { json, problem, readBodyText } from "../../../_lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/suppliers/:supplierId – Versandstatus vom Lieferanten.
 * Signatur: X-Signature: sha256=HMAC_SHA256(SUPPLIER_WEBHOOK_SECRET, `${X-Timestamp}.${body}`)
 */
export async function POST(req: Request, ctx: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await ctx.params;
  if (!getSupplierConfig(supplierId)) return problem(404, "Unbekannter Lieferant.");

  const rawBody = await readBodyText(req, 32 * 1024);
  if (rawBody === null) return problem(413, "Anfrage ist zu groß.");

  const check = verifyWebhookSignature({
    rawBody,
    timestamp: req.headers.get("x-timestamp"),
    signature: req.headers.get("x-signature"),
    secret: process.env.SUPPLIER_WEBHOOK_SECRET,
  });
  if (!check.ok) return problem(401, check.reason);

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return problem(400, "Ungültiges JSON.");
  }
  const parsed = shipmentWebhookSchema.safeParse(body);
  if (!parsed.success) return problem(422, "Ungültige Versanddaten.", { issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) });

  const result = await processShipmentUpdate(getStore(), toShipmentUpdate(supplierId, parsed.data));
  // 200 auch bei Duplikaten, damit der Lieferant nicht endlos wiederholt
  return json(result, result.applied || result.duplicate ? 200 : 202);
}
