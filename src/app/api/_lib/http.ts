import { NextResponse } from "next/server";

/** JSON-Antwort ohne Caching */
export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function problem(status: number, message: string, extra: Record<string, unknown> = {}) {
  return json({ error: message, ...extra }, status);
}

/** Request-Body als Text lesen, mit Größenlimit */
export async function readBodyText(req: Request, maxBytes: number): Promise<string | null> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) return null;
  const text = await req.text();
  return text.length > maxBytes ? null : text;
}

export function flag(url: URL, name: string): boolean {
  const v = url.searchParams.get(name);
  return v === "1" || v === "true";
}
