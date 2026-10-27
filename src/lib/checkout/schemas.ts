import { z } from "zod";

/**
 * Formular-Schemas für Kasse und Kundenkonto.
 * Diese Datei ist ohne Server-Abhängigkeiten und kann auch in Client-Komponenten
 * für die Validierung im Browser genutzt werden. Der Server prüft immer erneut.
 */

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} fehlt.` })
    .trim()
    .min(1, { error: `${label} fehlt.` })
    .min(min, { error: `${label} ist zu kurz.` })
    .max(max, { error: `${label} ist zu lang.` });

export const germanZipSchema = z
  .string({ error: "Postleitzahl fehlt." })
  .trim()
  .regex(/^\d{5}$/, { error: "Bitte eine fünfstellige Postleitzahl eingeben." })
  .refine((v) => v !== "00000", { error: "Diese Postleitzahl gibt es nicht." });

export const phoneSchema = z
  .string()
  .trim()
  .max(30, { error: "Telefonnummer ist zu lang." })
  .regex(/^[+\d][\d\s/()-]{5,}$/, { error: "Bitte eine gültige Telefonnummer eingeben." });

export const contactSchema = z.object({
  email: z.string({ error: "E-Mail fehlt." }).trim().toLowerCase().pipe(z.email({ error: "Bitte eine gültige E-Mail-Adresse eingeben." })),
  // Optional, aber für die Spedition hilfreich
  phone: z.union([phoneSchema, z.literal("")]).optional(),
});

export const addressSchema = z.object({
  firstName: trimmed(1, 60, "Vorname"),
  lastName: trimmed(1, 60, "Nachname"),
  company: z.string().trim().max(80, { error: "Firmenname ist zu lang." }).optional(),
  street: trimmed(2, 80, "Straße"),
  houseNumber: z
    .string({ error: "Hausnummer fehlt." })
    .trim()
    .min(1, { error: "Hausnummer fehlt." })
    .max(10, { error: "Hausnummer ist zu lang." })
    .regex(/^\d+[a-zA-Z]?([-/ ]\d*[a-zA-Z]?)?$/, { error: "Bitte eine gültige Hausnummer eingeben, z. B. 12 oder 12a." }),
  zip: germanZipSchema,
  city: trimmed(2, 60, "Ort"),
  // Versand vorerst nur innerhalb Deutschlands
  country: z.literal("DE", { error: "Wir liefern derzeit nur nach Deutschland." }),
});

export const cartLineSchema = z.object({
  productId: z.string().min(1).max(100),
  quantity: z.number().int({ error: "Menge muss eine ganze Zahl sein." }).min(1).max(20, { error: "Maximal 20 Stück je Artikel." }),
});

export const checkoutSchema = z
  .object({
    contact: contactSchema,
    billingAddress: addressSchema,
    shippingSameAsBilling: z.boolean(),
    shippingAddress: addressSchema.optional(),
    lines: z.array(cartLineSchema).min(1, { error: "Der Warenkorb ist leer." }).max(30),
    note: z.string().trim().max(500, { error: "Hinweis ist zu lang (max. 500 Zeichen)." }).optional(),
    acceptTerms: z.literal(true, { error: "Bitte bestätige die AGB." }),
    // Bestätigung, dass die Widerrufsbelehrung gelesen wurde
    acknowledgeWithdrawal: z.literal(true, { error: "Bitte bestätige, dass du die Widerrufsbelehrung gelesen hast." }),
    /**
     * Kundin oder Kunde bestätigt die Voraussetzungen für den Nullsteuersatz (§ 12 Abs. 3 UStG).
     * Fehlt die Bestätigung, rechnet der Server mit dem Regelsteuersatz.
     */
    zeroRateConfirmed: z.boolean().optional().default(false),
  })
  .superRefine((v, ctx) => {
    if (!v.shippingSameAsBilling && !v.shippingAddress) {
      ctx.addIssue({ code: "custom", path: ["shippingAddress"], message: "Bitte eine Lieferadresse angeben." });
    }
  });

export type ContactInput = z.infer<typeof contactSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** zod-Fehler in { "billingAddress.zip": "…" } umwandeln, praktisch für Formulare */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
