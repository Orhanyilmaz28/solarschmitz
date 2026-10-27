import { NextResponse } from "next/server";
import { contactFormSchema } from "@/components/content/contactSchema";

/**
 * Kontaktformular.
 * Solange CONTACT_WEBHOOK_URL nicht gesetzt ist, wird nichts versendet (503).
 * Mit gesetzter URL wird die Nachricht als JSON per POST weitergeleitet,
 * z. B. an einen Mail-Dienst, ein Ticketsystem oder einen Automations-Webhook.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Die Anfrage konnte nicht gelesen werden." }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!(key in fields)) fields[key] = issue.message;
    }
    // Honeypot gefüllt: still verwerfen
    if (fields.website) return NextResponse.json({ ok: true }, { status: 200 });
    return NextResponse.json({ ok: false, message: "Bitte prüfe deine Eingaben.", fields }, { status: 422 });
  }

  const target = process.env.CONTACT_WEBHOOK_URL;
  if (!target) {
    return NextResponse.json(
      {
        ok: false,
        message: "Das Kontaktformular ist noch nicht angebunden. Deine Nachricht wurde nicht gesendet. Bitte schreib uns vorerst per E-Mail.",
      },
      { status: 503 },
    );
  }

  const { website: _honeypot, privacy: _privacy, ...message } = parsed.data;
  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...message, receivedAt: new Date().toISOString(), source: "kontaktformular" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Webhook antwortete mit ${res.status}`);
  } catch {
    return NextResponse.json(
      { ok: false, message: "Die Nachricht konnte gerade nicht zugestellt werden. Bitte versuch es später erneut oder schreib uns per E-Mail." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, message: "Danke! Deine Nachricht ist angekommen. Wir melden uns per E-Mail." });
}
