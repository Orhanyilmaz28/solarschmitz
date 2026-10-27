import { z } from "zod";

export const contactTopics = ["beratung", "bestellung", "lieferung", "sonstiges"] as const;

export const contactTopicLabels: Record<(typeof contactTopics)[number], string> = {
  beratung: "Kaufberatung",
  bestellung: "Bestellung",
  lieferung: "Lieferung & Rückgabe",
  sonstiges: "Sonstiges",
};

/** Kontaktformular – im Browser und auf dem Server identisch geprüft */
export const contactFormSchema = z.object({
  name: z.string().trim().min(2, { error: "Bitte gib deinen Namen an." }).max(80, { error: "Der Name ist zu lang." }),
  email: z.string().trim().toLowerCase().pipe(z.email({ error: "Bitte gib eine gültige E-Mail-Adresse ein." })),
  topic: z.enum(contactTopics, { error: "Bitte wähle ein Thema." }),
  message: z
    .string()
    .trim()
    .min(10, { error: "Bitte beschreib dein Anliegen in ein paar Worten (mind. 10 Zeichen)." })
    .max(3000, { error: "Die Nachricht ist zu lang (max. 3.000 Zeichen)." }),
  privacy: z.literal(true, { error: "Bitte stimm der Verarbeitung deiner Angaben zu." }),
  /** Honeypot gegen Spam-Bots, muss leer bleiben */
  website: z.string().max(0).optional(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
