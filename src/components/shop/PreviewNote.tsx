import { site } from "@/config/site";

/**
 * Einmaliger Vorschau-Hinweis pro Seite (statt Wiederholung auf jeder Kachel).
 * Erscheint nur im Vorschau-Modus.
 */
export function PreviewNote({ className = "" }: { className?: string }) {
  if (!site.previewMode) return null;
  return (
    <p role="note" className={`flex items-start gap-3 text-sm text-muted ${className}`}>
      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sun" />
      <span>
        <span className="font-semibold text-ink">Vorschau:</span> Produkte mit dem Hinweis „Vorschau“ stammen aus dem öffentlichen Katalog unseres
        Lieferanten. Preise sind Richtpreise und noch nicht bestätigt. „Demo-Produkte“ sind Platzhalter ohne Preis. Bestellungen sind noch nicht möglich.
      </span>
    </p>
  );
}
