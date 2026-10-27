import { VAT_FOOTNOTE_ID } from "./pricing";

/**
 * Fußnote zum Nullsteuersatz für Photovoltaik (§ 12 Abs. 3 UStG).
 * Gehört auf jede Seite, die Preise mit „¹“ zeigt.
 */
export function VatFootnote({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <aside
      id={VAT_FOOTNOTE_ID}
      aria-label="Hinweis zur Umsatzsteuer"
      className={`scroll-mt-40 border-t pt-6 text-[13px] leading-relaxed ${tone === "dark" ? "border-ink-line text-muted-dark" : "border-line text-muted"} ${className}`}
    >
      <p className="max-w-[92ch]">
        <sup className="mr-1">1</sup>
        Nullsteuersatz nach § 12 Abs. 3 UStG: Für Solarmodule, Wechselrichter, Batteriespeicher und die für den Betrieb wesentlichen
        Komponenten gilt 0 % Umsatzsteuer, wenn du die Anlage als Betreiber:in auf oder in der Nähe eines Wohngebäudes (oder eines
        öffentlichen bzw. dem Gemeinwohl dienenden Gebäudes) installierst. Bei Anlagen bis 30 kWp gilt diese Voraussetzung als erfüllt.
        Andernfalls fallen 19 % Umsatzsteuer an. Du bestätigst die Voraussetzungen im Bestellprozess. Artikel mit „inkl. 19 % USt.“, zum
        Beispiel smarte Steckdosen, fallen nicht unter den Nullsteuersatz.
      </p>
    </aside>
  );
}
