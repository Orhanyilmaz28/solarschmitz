/**
 * Typografische Feinheiten für Produkttexte:
 * kein Zeilenumbruch zwischen Zahl und Einheit („880 Wp“), in Bereichen („0–90°“)
 * und in Angaben wie „2 × 440 Wp“.
 */
export function nb(text: string): string {
  return text
    .replace(/(\d)\s+×\s+(\d)/g, "$1 × $2")
    .replace(/(\d)\s+(?=(?:kWh|kWp|Wp|Wh|kW|W|mm|cm|kg|V|A|°|%|€|Module|Modulen|Stück)(?![\p{L}\p{N}]))/gu, "$1 ")
    .replace(/(\d)–(\d)/g, "$1–⁠$2");
}
