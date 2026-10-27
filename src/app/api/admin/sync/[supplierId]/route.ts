import { getStore } from "@/lib/store";
import { getSupplierAdapter } from "@/lib/suppliers/registry";
import { runSupplierSync } from "@/lib/suppliers/sync";
import { flag, json, problem } from "../../../_lib/http";
import { summarizeSync } from "../../_summary";

export const dynamic = "force-dynamic";

/** POST /api/admin/sync/:supplierId[?commit=1][&removeMissing=1] – Katalog beim Lieferanten abrufen */
export async function POST(req: Request, ctx: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await ctx.params;
  const adapter = getSupplierAdapter(supplierId);
  if (!adapter) return problem(404, "Unbekannter Lieferant.");
  const url = new URL(req.url);
  const result = await runSupplierSync(adapter, getStore(), {
    dryRun: !flag(url, "commit"),
    removeMissing: flag(url, "removeMissing"),
  });
  return json(summarizeSync(result, 200));
}
