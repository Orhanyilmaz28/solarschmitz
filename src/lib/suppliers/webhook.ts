import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { shipmentStatuses, type ShipmentUpdate } from "./types";

/**
 * Versandstatus-Webhooks der Lieferanten.
 *
 * Header:
 *   X-Timestamp: Unix-Zeit in Sekunden
 *   X-Signature: sha256=<hex>  mit HMAC-SHA256(secret, `${timestamp}.${rawBody}`)
 * Ereignisse älter als 5 Minuten werden abgelehnt (Schutz vor Wiederholung).
 */
export const WEBHOOK_TOLERANCE_SECONDS = 300;

export function signWebhook(rawBody: string, timestamp: number, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")}`;
}

export type SignatureCheck = { ok: true } | { ok: false; reason: string };

export function verifyWebhookSignature(input: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  secret: string | undefined;
  nowSeconds?: number;
}): SignatureCheck {
  if (!input.secret) return { ok: false, reason: "Webhook-Geheimnis ist nicht konfiguriert" };
  if (!input.timestamp || !input.signature) return { ok: false, reason: "Signatur oder Zeitstempel fehlt" };
  const ts = Number(input.timestamp);
  if (!Number.isInteger(ts)) return { ok: false, reason: "Ungültiger Zeitstempel" };
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > WEBHOOK_TOLERANCE_SECONDS) return { ok: false, reason: "Zeitstempel außerhalb des erlaubten Fensters" };

  const expected = Buffer.from(signWebhook(input.rawBody, ts, input.secret));
  const given = Buffer.from(input.signature.trim());
  // Längen zuerst vergleichen, da timingSafeEqual sonst wirft
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "Signatur ungültig" };
  return { ok: true };
}

export const shipmentWebhookSchema = z.object({
  eventId: z.string().min(1).max(200),
  orderNumber: z.string().max(60).optional(),
  supplierOrderId: z.string().max(80).optional(),
  reference: z.string().max(120).optional(),
  status: z.enum(shipmentStatuses),
  carrier: z.string().max(60).optional(),
  trackingNumber: z.string().max(80).optional(),
  trackingUrl: z.url({ protocol: /^https?$/ }).optional(),
  occurredAt: z.iso.datetime({ offset: true }).optional(),
});

export function toShipmentUpdate(supplierId: string, body: z.infer<typeof shipmentWebhookSchema>): ShipmentUpdate {
  return {
    eventId: body.eventId,
    supplierId,
    orderNumber: body.orderNumber,
    supplierOrderId: body.supplierOrderId,
    supplierReference: body.reference,
    status: body.status,
    carrier: body.carrier,
    trackingNumber: body.trackingNumber,
    trackingUrl: body.trackingUrl,
    occurredAt: body.occurredAt ?? new Date().toISOString(),
  };
}
