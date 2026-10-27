import Link from "next/link";
import { site } from "@/config/site";

/** Schmale Leiste: Solange Produkte und Preise nicht final sind, sagt die Seite das offen. */
export function PreviewBanner() {
  if (!site.previewMode) return null;
  return (
    <div className="relative z-[51] bg-ink-2 text-[13px] text-paper/80" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="container-x flex min-h-9 items-center justify-center gap-2 py-1.5 text-center">
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-lime" />
        <p className="whitespace-nowrap text-[12px] sm:text-[13px]">
          <span className="font-semibold text-paper">Vorschau:</span>{" "}
          <span className="hidden lg:inline">Sortiment und Preise werden gerade mit unseren Lieferanten abgestimmt. </span>
          <span className="sm:hidden">Bestellen noch nicht möglich.</span>
          <span className="hidden sm:inline">Bestellungen sind noch nicht möglich.</span>{" "}
          <Link href="/versand" className="underline decoration-paper/40 underline-offset-2 hover:text-lime">
            Mehr<span className="sr-only sm:not-sr-only"> zur Vorschau erfahren</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
