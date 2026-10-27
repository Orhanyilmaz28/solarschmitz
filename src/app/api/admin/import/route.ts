import { getStore } from "@/lib/store";
import { getSupplierConfig } from "@/lib/suppliers/registry";
import { MAX_FEED_BYTES } from "@/lib/suppliers/parsers";
import { importFeedText } from "@/lib/suppliers/sync";
import type { FeedFormat } from "@/lib/suppliers/types";
import { flag, json, problem } from "../../_lib/http";
import { summarizeSync } from "../_summary";

export const dynamic = "force-dynamic";

const formats: FeedFormat[] = ["csv", "xml", "json"];

/**
 * POST /api/admin/import[?commit=1][&removeMissing=1]
 * Body: multipart/form-data (file, supplierId, format?, recordPath?)
 *    oder JSON { text, supplierId, format?, recordPath? }
 * Ohne commit nur Vorschau (Dry-Run).
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_FEED_BYTES + 64 * 1024) return problem(413, "Datei ist zu groß (max. 10 MB).");

  let text: string | undefined;
  let supplierId: string | undefined;
  let format: string | undefined;
  let recordPath: string | undefined;
  let fileName: string | undefined;

  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (file instanceof File) {
        if (file.size > MAX_FEED_BYTES) return problem(413, "Datei ist zu groß (max. 10 MB).");
        text = await file.text();
        fileName = file.name;
      } else if (typeof form.get("text") === "string") {
        text = form.get("text") as string;
      }
      supplierId = form.get("supplierId")?.toString();
      format = form.get("format")?.toString() || undefined;
      recordPath = form.get("recordPath")?.toString() || undefined;
    } else {
      const body = (await req.json()) as Record<string, unknown>;
      text = typeof body.text === "string" ? body.text : undefined;
      supplierId = typeof body.supplierId === "string" ? body.supplierId : undefined;
      format = typeof body.format === "string" && body.format ? body.format : undefined;
      recordPath = typeof body.recordPath === "string" && body.recordPath ? body.recordPath : undefined;
    }
  } catch {
    return problem(400, "Anfrage konnte nicht gelesen werden.");
  }

  if (!text?.trim()) return problem(400, "Bitte eine Datei hochladen oder Feed-Inhalt einfügen.");
  if (text.length > MAX_FEED_BYTES) return problem(413, "Feed ist zu groß (max. 10 MB).");
  const config = supplierId ? getSupplierConfig(supplierId) : undefined;
  if (!config) return problem(400, "Unbekannter Lieferant.");
  if (format && !formats.includes(format as FeedFormat)) return problem(400, "Format muss csv, xml oder json sein.");

  const result = await importFeedText(text, config, getStore(), {
    dryRun: !flag(url, "commit"),
    removeMissing: flag(url, "removeMissing"),
    format: format as FeedFormat | undefined,
    recordPath,
    source: fileName ? `Upload: ${fileName}` : undefined,
  });
  return json(summarizeSync(result));
}
