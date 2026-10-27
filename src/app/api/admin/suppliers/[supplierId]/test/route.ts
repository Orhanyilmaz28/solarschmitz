import { getSetupStatus, getSupplierAdapter } from "@/lib/suppliers/registry";
import { json, problem } from "../../../../_lib/http";

export const dynamic = "force-dynamic";

/** POST /api/admin/suppliers/:supplierId/test – Verbindung prüfen, ohne Daten zu übernehmen */
export async function POST(_req: Request, ctx: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await ctx.params;
  const adapter = getSupplierAdapter(supplierId);
  if (!adapter) return problem(404, "Unbekannter Lieferant.");
  const status = await adapter.testConnection();
  return json({ supplierId, status, setup: getSetupStatus(adapter.config) });
}
