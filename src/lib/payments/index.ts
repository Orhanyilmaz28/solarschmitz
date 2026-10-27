import { NotConfiguredError } from "@/lib/suppliers/errors";

/**
 * Zahlungsanbieter-Schnittstelle.
 * Es gibt bewusst noch keine funktionierende Anbindung: Alle Anbieter sind
 * Platzhalter und werfen NotConfiguredError. Es werden keine Zahlungen vorgetäuscht.
 */
export interface PaymentSession {
  provider: string;
  reference: string;
  /** Weiterleitung zur Zahlungsseite des Anbieters */
  redirectUrl: string;
}

export interface PaymentProvider {
  id: "stripe" | "paypal" | "mollie";
  name: string;
  /** false = nur Platzhalter, darf nicht für echte Bestellungen genutzt werden */
  implemented: boolean;
  requiredEnv: string[];
  createPayment(input: { orderNumber: string; amountEUR: number; email: string; returnUrl: string }): Promise<PaymentSession>;
  /** Signatur eines Zahlungs-Webhooks prüfen und Ergebnis liefern */
  verifyWebhook(rawBody: string, headers: Headers): Promise<{ orderNumber: string; status: "paid" | "failed" | "refunded" }>;
}

function stub(id: PaymentProvider["id"], name: string, requiredEnv: string[]): PaymentProvider {
  const fail = () => {
    throw new NotConfiguredError(`${name} ist noch nicht angebunden. Bitte die Integration umsetzen und testen.`, requiredEnv);
  };
  return {
    id,
    name,
    implemented: false,
    requiredEnv,
    createPayment: async () => fail(),
    verifyWebhook: async () => fail(),
  };
}

export const paymentProviders: Record<PaymentProvider["id"], PaymentProvider> = {
  stripe: stub("stripe", "Stripe", ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]),
  paypal: stub("paypal", "PayPal", ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"]),
  mollie: stub("mollie", "Mollie", ["MOLLIE_API_KEY"]),
};

/** Konfigurierter Anbieter oder null. Ein Platzhalter gilt nicht als einsatzbereit. */
export function getPaymentProvider(): PaymentProvider | null {
  const id = process.env.PAYMENT_PROVIDER as PaymentProvider["id"] | undefined;
  if (!id || !(id in paymentProviders)) return null;
  return paymentProviders[id];
}

export function getPaymentStatus(): { ready: boolean; message: string } {
  const p = getPaymentProvider();
  if (!p) return { ready: false, message: "Kein Zahlungsanbieter gewählt (PAYMENT_PROVIDER)." };
  if (!p.implemented) return { ready: false, message: `${p.name} ist gewählt, aber noch nicht angebunden.` };
  const missing = p.requiredEnv.filter((n) => !process.env[n]);
  if (missing.length) return { ready: false, message: `${p.name}: Zugangsdaten fehlen (${missing.join(", ")}).` };
  return { ready: true, message: `${p.name} ist eingerichtet.` };
}
