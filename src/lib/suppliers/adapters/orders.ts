import Papa from "papaparse";
import { NotConfiguredError } from "../errors";
import { fetchWithTimeout, requireEnv } from "../http";
import type { OrderChannel, ShipmentUpdate, SupplierOrderPayload, SupplierOrderResult } from "../types";
import { joinUrl } from "./catalog";

/** Versand von E-Mails. Bewusst nur als Schnittstelle: ohne Anbieter wird nichts verschickt. */
export interface MailTransport {
  send(mail: { to: string; subject: string; text: string; attachments: { filename: string; content: string }[] }): Promise<void>;
}

let mailTransport: MailTransport | null = null;

/** Mailversand registrieren (z. B. SMTP oder ein Transaktionsmail-Dienst) */
export function setMailTransport(t: MailTransport | null) {
  mailTransport = t;
}

/** Bestellpositionen als CSV, wie viele Dropshipping-Lieferanten sie per Mail annehmen */
export function buildOrderCsv(p: SupplierOrderPayload): string {
  const a = p.shippingAddress;
  return Papa.unparse(
    p.lines.map((l) => ({
      Bestellnummer: p.supplierOrderId,
      Artikelnummer: l.supplierSku,
      Bezeichnung: l.name,
      Menge: l.quantity,
      Name: a.name,
      Firma: a.company ?? "",
      Strasse: a.street,
      PLZ: a.zip,
      Ort: a.city,
      Land: a.country,
      Telefon: a.phone ?? "",
      "E-Mail": a.email,
    })),
    { delimiter: ";" },
  );
}

export function buildOrderEmail(p: SupplierOrderPayload, shopName: string) {
  const a = p.shippingAddress;
  const lines = p.lines.map((l) => `- ${l.quantity} × ${l.name} (Art.-Nr. ${l.supplierSku})`).join("\n");
  return {
    subject: `Dropshipping-Bestellung ${p.supplierOrderId} von ${shopName}`,
    text: [
      "Guten Tag,",
      "",
      `bitte liefern Sie folgende Bestellung direkt an unseren Kunden (Referenz ${p.supplierOrderId}):`,
      "",
      lines,
      "",
      "Lieferadresse:",
      a.name,
      a.company,
      a.street,
      `${a.zip} ${a.city}`,
      a.country,
      a.phone ? `Tel. ${a.phone}` : undefined,
      "",
      p.note ? `Hinweis: ${p.note}\n` : undefined,
      "Bitte senden Sie uns die Sendungsnummer, sobald die Ware verschickt ist.",
      "",
      `Mit freundlichen Grüßen\n${shopName}`,
    ]
      .filter((x) => x !== undefined)
      .join("\n"),
    attachment: { filename: `bestellung-${p.supplierOrderId}.csv`, content: buildOrderCsv(p) },
  };
}

export async function submitOrderVia(
  channel: OrderChannel,
  payload: SupplierOrderPayload,
  ctx: { supplierId: string; shopName: string },
): Promise<SupplierOrderResult> {
  switch (channel.kind) {
    case "email-csv": {
      const env = requireEnv([channel.toEnv], "Bestell-E-Mail des Lieferanten");
      if (!mailTransport) {
        throw new NotConfiguredError("Mailversand ist nicht eingerichtet. Die Bestellung wurde nicht übermittelt.", ["MailTransport"]);
      }
      const mail = buildOrderEmail(payload, ctx.shopName);
      await mailTransport.send({ to: env[channel.toEnv]!, subject: mail.subject, text: mail.text, attachments: [mail.attachment] });
      return { accepted: true, message: `Bestellung per E-Mail an den Lieferanten gesendet.` };
    }
    case "rest": {
      const env = requireEnv([channel.baseUrlEnv, channel.apiKeyEnv], "Bestell-API des Lieferanten");
      const res = await fetchWithTimeout(joinUrl(env[channel.baseUrlEnv]!, channel.ordersPath), {
        supplierId: ctx.supplierId,
        method: "POST",
        headers: { Authorization: `Bearer ${env[channel.apiKeyEnv]}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        timeoutMs: 20_000,
      });
      const body = (await res.json().catch(() => ({}))) as { id?: unknown; reference?: unknown };
      const ref = typeof body.reference === "string" ? body.reference : typeof body.id === "string" ? body.id : undefined;
      return { accepted: true, supplierReference: ref, message: "Bestellung per API übermittelt." };
    }
    case "manual":
      throw new NotConfiguredError("Für diesen Lieferanten ist kein automatischer Bestellweg eingerichtet.");
  }
}

export async function fetchShipmentsVia(channel: OrderChannel, since: string | undefined, supplierId: string): Promise<ShipmentUpdate[]> {
  if (channel.kind !== "rest" || !channel.shipmentsPath) {
    throw new NotConfiguredError("Versandstatus kommt bei diesem Lieferanten per Webhook oder wird manuell gepflegt.");
  }
  const env = requireEnv([channel.baseUrlEnv, channel.apiKeyEnv], "Versand-API des Lieferanten");
  const url = new URL(joinUrl(env[channel.baseUrlEnv]!, channel.shipmentsPath));
  if (since) url.searchParams.set("since", since);
  const res = await fetchWithTimeout(url.toString(), {
    supplierId,
    headers: { Authorization: `Bearer ${env[channel.apiKeyEnv]}`, Accept: "application/json" },
  });
  const data = (await res.json()) as unknown;
  const list = Array.isArray(data) ? data : [];
  return list.flatMap((x): ShipmentUpdate[] => {
    if (!x || typeof x !== "object") return [];
    const o = x as Record<string, unknown>;
    const status = typeof o.status === "string" ? o.status : "";
    if (!["in_transit", "shipped", "delivered", "cancelled", "exception"].includes(status)) return [];
    return [
      {
        eventId: String(o.eventId ?? o.id ?? `${supplierId}-${o.trackingNumber ?? ""}-${status}`),
        supplierId,
        orderNumber: typeof o.orderNumber === "string" ? o.orderNumber : undefined,
        supplierOrderId: typeof o.supplierOrderId === "string" ? o.supplierOrderId : undefined,
        supplierReference: typeof o.reference === "string" ? o.reference : undefined,
        status: status as ShipmentUpdate["status"],
        carrier: typeof o.carrier === "string" ? o.carrier : undefined,
        trackingNumber: typeof o.trackingNumber === "string" ? o.trackingNumber : undefined,
        trackingUrl: typeof o.trackingUrl === "string" ? o.trackingUrl : undefined,
        occurredAt: typeof o.occurredAt === "string" ? o.occurredAt : new Date().toISOString(),
      },
    ];
  });
}
