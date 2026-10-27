import { z } from "zod";
import { brand } from "@/config/brand";

/**
 * Elektronische Widerrufsfunktion nach § 356a BGB (gilt seit 19. Juni 2026).
 * - Schaltfläche „Vertrag widerrufen“, danach Bestätigung mit „Widerruf bestätigen“.
 * - Abgefragt werden nur: Name, Angaben zum Vertrag (bzw. Vertragsteil) und das
 *   elektronische Kommunikationsmittel für die Eingangsbestätigung. Kein Widerrufsgrund.
 * - Nach dem Absenden: Eingangsbestätigung mit Inhalt sowie Datum und Uhrzeit des Eingangs
 *   unverzüglich auf einem dauerhaften Datenträger (E-Mail).
 * Vor Livegang rechtlich prüfen lassen.
 */
export const withdrawalSchema = z.object({
  name: z.string({ error: "Name fehlt." }).trim().min(1, { error: "Name fehlt." }).max(120, { error: "Name ist zu lang." }),
  contract: z
    .string({ error: "Bestellnummer oder Vertrag fehlt." })
    .trim()
    .min(1, { error: "Bestellnummer oder Vertrag fehlt." })
    .max(200, { error: "Angabe ist zu lang." }),
  /** Optional: nur ein Teil der Bestellung (z. B. einzelne Artikel) */
  part: z.string().trim().max(500, { error: "Angabe ist zu lang (max. 500 Zeichen)." }).optional().default(""),
  email: z.string({ error: "E-Mail fehlt." }).trim().toLowerCase().pipe(z.email({ error: "Bitte eine gültige E-Mail-Adresse eingeben." })),
});

export type WithdrawalInput = z.infer<typeof withdrawalSchema>;

export const WITHDRAW_BUTTON_LABEL = "Vertrag widerrufen";
export const CONFIRM_BUTTON_LABEL = "Widerruf bestätigen";

const berlin = (d: Date, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", ...opts }).format(d);

/** „27.10.2026 um 14:05 Uhr“ in deutscher Zeit */
export function formatReceivedAt(d: Date): string {
  return `${berlin(d, { day: "2-digit", month: "2-digit", year: "numeric" })} um ${berlin(d, { hour: "2-digit", minute: "2-digit" })} Uhr`;
}

/** Text der Eingangsbestätigung (für E-Mail und Bildschirm) */
export function receiptText(input: WithdrawalInput, receivedAt: Date): string {
  const company = brand.legal.company ?? brand.name;
  const lines = [
    `Eingangsbestätigung Ihres Widerrufs`,
    ``,
    `Wir haben Ihre Widerrufserklärung am ${formatReceivedAt(receivedAt)} erhalten.`,
    ``,
    `Inhalt Ihrer Erklärung:`,
    `Name: ${input.name}`,
    `Vertrag / Bestellung: ${input.contract}`,
    input.part ? `Widerrufen wird nur: ${input.part}` : `Widerrufen wird: der gesamte Vertrag`,
    `Bestätigung an: ${input.email}`,
    ``,
    `Wie es weitergeht, insbesondere zur Rücksendung der Ware und zur Rückzahlung, erfahren Sie in unserer Widerrufsbelehrung und in einer gesonderten Nachricht.`,
    ``,
    `${company}`,
    brand.contact.address ? `${brand.contact.address.street}, ${brand.contact.address.zip} ${brand.contact.address.city}` : "",
    brand.contact.email ? `E-Mail: ${brand.contact.email}` : "",
  ];
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();
}
