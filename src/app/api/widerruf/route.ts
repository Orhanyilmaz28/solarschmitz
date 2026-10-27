import { NextResponse } from "next/server";
import { withdrawalSchema, receiptText, formatReceivedAt } from "@/lib/withdrawal";
import { getStore } from "@/lib/store";
import { brand } from "@/config/brand";

/**
 * Widerrufsfunktion (§ 356a BGB).
 * Nimmt die Erklärung an, vermerkt sie an der Bestellung (falls gefunden) und leitet sie samt
 * Text der Eingangsbestätigung an WITHDRAWAL_WEBHOOK_URL weiter. Der angebundene Dienst
 * (z. B. Mail-Dienst oder Automations-Webhook) verschickt die Bestätigung per E-Mail an die
 * Kundin oder den Kunden und informiert den Shop.
 * Ohne konfigurierte URL antwortet die Route ehrlich mit 503 und nennt den Weg per E-Mail.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Die Anfrage konnte nicht gelesen werden." }, { status: 400 });
  }
  const parsed = withdrawalSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!(key in fields)) fields[key] = issue.message;
    }
    return NextResponse.json({ ok: false, message: "Bitte prüfe deine Angaben.", fields }, { status: 422 });
  }

  const target = process.env.WITHDRAWAL_WEBHOOK_URL;
  if (!target) {
    return NextResponse.json(
      {
        ok: false,
        message: `Die Widerrufsfunktion ist noch nicht angebunden. Bitte erkläre deinen Widerruf per E-Mail${
          brand.contact.email ? ` an ${brand.contact.email}` : ""
        }. Wir bestätigen den Eingang.`,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const input = parsed.data;
  const receivedAt = new Date();
  const receipt = receiptText(input, receivedAt);

  // An der Bestellung vermerken, wenn die Nummer passt (eine unbekannte Nummer verhindert den Widerruf nicht)
  try {
    const store = getStore();
    const order = await store.orders.getByNumber(input.contract.toUpperCase());
    if (order) {
      const at = receivedAt.toISOString();
      await store.orders.save({
        ...order,
        updatedAt: at,
        events: [...order.events, { at, type: "note", message: `Widerruf eingegangen${input.part ? ` (Teil: ${input.part})` : ""}` }],
      });
    }
  } catch {
    // Speicher nicht erreichbar: Weiterleitung trotzdem versuchen
  }

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "widerruf", ...input, receivedAt: receivedAt.toISOString(), receiptText: receipt, receiptTo: input.email }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: `Dein Widerruf konnte gerade nicht übermittelt werden. Bitte versuche es erneut oder schreib uns${
          brand.contact.email ? ` an ${brand.contact.email}` : ""
        }.`,
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, receivedAt: receivedAt.toISOString(), receivedAtText: formatReceivedAt(receivedAt), receipt },
    { headers: { "Cache-Control": "no-store" } },
  );
}
