import { getStore } from "@/lib/store";
import { json } from "../../_lib/http";

export const dynamic = "force-dynamic";

/** GET /api/admin/sync-log?limit=50[&supplierId=] */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));
  const supplierId = url.searchParams.get("supplierId");
  let entries = await getStore().syncLog.list(supplierId ? 500 : limit);
  if (supplierId) entries = entries.filter((e) => e.supplierId === supplierId).slice(0, limit);
  return json({ entries });
}
