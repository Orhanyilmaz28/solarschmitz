import { describe, expect, it } from "vitest";
import { receiptText, withdrawalSchema, formatReceivedAt } from "@/lib/withdrawal";

describe("Widerrufsfunktion (§ 356a BGB)", () => {
  const input = { name: "Erika Muster", contract: "SS-20261027-7F3A", email: " Erika@Example.org " };

  it("verlangt nur Name, Vertrag und E-Mail; Teilwiderruf ist optional", () => {
    const r = withdrawalSchema.safeParse(input);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("erika@example.org");
      expect(r.data.part).toBe("");
      expect(Object.keys(r.data).sort()).toEqual(["contract", "email", "name", "part"]);
    }
  });

  it("fragt keinen Grund ab (zusätzliche Felder werden verworfen)", () => {
    const r = withdrawalSchema.safeParse({ ...input, reason: "zu teuer" });
    expect(r.success).toBe(true);
    if (r.success) expect("reason" in r.data).toBe(false);
  });

  it("meldet fehlende Angaben", () => {
    const r = withdrawalSchema.safeParse({ name: "", contract: "", email: "x" });
    expect(r.success).toBe(false);
  });

  it("Eingangsbestätigung enthält Inhalt sowie Datum und Uhrzeit (deutsche Zeit)", () => {
    const at = new Date("2026-10-27T13:05:00Z");
    const parsed = withdrawalSchema.parse({ ...input, part: "nur der Speicher" });
    const text = receiptText(parsed, at);
    expect(formatReceivedAt(at)).toBe("27.10.2026 um 14:05 Uhr");
    expect(text).toContain("27.10.2026 um 14:05 Uhr");
    expect(text).toContain("SS-20261027-7F3A");
    expect(text).toContain("nur der Speicher");
    expect(text).toContain("Erika Muster");
  });
});
