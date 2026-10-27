import { NextResponse, type NextRequest } from "next/server";

/**
 * Schützt /admin und /api/admin per Basic Auth (ADMIN_USER / ADMIN_PASSWORD).
 * Ohne Zugangsdaten: in Produktion gesperrt (404), in der Entwicklung offen –
 * das Admin-UI zeigt dann einen deutlichen Hinweis.
 * Basic Auth nur über HTTPS betreiben; für mehrere Admins später echtes Login ergänzen.
 */
export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Not Found", { status: 404 });
    }
    const res = NextResponse.next();
    res.headers.set("X-Admin-Auth", "open-dev");
    return res;
  }

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(header.slice(6).trim());
    } catch {
      decoded = "";
    }
    const sep = decoded.indexOf(":");
    if (sep >= 0 && safeEqual(decoded.slice(0, sep), user) && safeEqual(decoded.slice(sep + 1), pass)) {
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  }

  return new NextResponse("Anmeldung erforderlich", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

/** Vergleich mit konstanter Laufzeit (Edge-Runtime hat kein crypto.timingSafeEqual) */
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
