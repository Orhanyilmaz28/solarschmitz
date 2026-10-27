import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { formatEUR } from "@/lib/format";
import { hasPrice } from "@/lib/catalog";
import { VAT_FOOTNOTE_ID, priceStatus, uvpText, vatLine } from "./pricing";

/** Kennzeichnet, woher Produktdaten stammen. Wichtig: keine Daten als final ausgeben, die es nicht sind. */
export function DataStatusChip({ product, className = "" }: { product: Product; className?: string }) {
  if (product.dataStatus === "live") return null;
  if (product.dataStatus === "demo")
    return (
      <span className={`chip border border-sun/40 bg-paper/90 text-[#7a4a00] backdrop-blur ${className}`} title={product.dataNote}>
        Demo-Produkt
      </span>
    );
  return (
    <span className={`chip border border-line bg-paper/90 text-muted backdrop-blur ${className}`} title={product.dataNote}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sun" />
      Vorschau
    </span>
  );
}

interface PriceTagProps {
  product: Product;
  size?: "md" | "lg";
  /** Fußnotenzeichen „¹“ zum Nullsteuersatz anzeigen (Seite muss <VatFootnote /> enthalten) */
  footnote?: boolean;
  /** Ton für dunkle Flächen */
  tone?: "light" | "dark";
}

/**
 * Preis mit Pflichtangaben nach PAngV: Gesamtpreis inkl. Umsatzsteuer und Hinweis
 * auf zusätzliche Versandkosten. Keine Streichpreise (§ 11 PAngV).
 */
export function PriceTag({ product, size = "md", footnote = false, tone = "light" }: PriceTagProps) {
  const muted = tone === "dark" ? "text-muted-dark" : "text-muted";
  if (!hasPrice(product)) {
    return (
      <div className="leading-tight">
        <span className={`t-num ${size === "lg" ? "text-[1.75rem]" : "text-lg"} ${muted}`}>Preis folgt</span>
        <span className={`mt-1 block text-xs ${muted}`}>Demo-Produkt, kein Angebot</span>
      </div>
    );
  }
  const status = priceStatus(product);
  const uvp = uvpText(product);
  return (
    <div className="leading-tight">
      {status && (
        <span className={`mb-1 block font-mono text-[10.5px] uppercase tracking-[0.14em] ${muted}`}>{status}</span>
      )}
      <span className={`t-num tabular ${size === "lg" ? "text-[2.5rem] md:text-[2.875rem]" : "text-[1.375rem]"}`}>{formatEUR(product.price)}</span>
      <span className={`mt-1.5 block text-xs ${muted}`}>
        {vatLine(product)}
        {footnote && product.vatRate === 0 && (
          <sup>
            <a href={`#${VAT_FOOTNOTE_ID}`} aria-label="Fußnote 1: Hinweis zum Nullsteuersatz" className="ml-px no-underline hover:text-ink">
              1
            </a>
          </sup>
        )}{" "}
        {size === "lg" ? (
          <Link href="/versand" className="underline decoration-current/30 underline-offset-2 hover:decoration-current">
            zzgl. Versand
          </Link>
        ) : (
          "zzgl. Versand"
        )}
      </span>
      {uvp && <span className={`mt-1 block text-xs ${muted}`}>{uvp}</span>}
    </div>
  );
}
