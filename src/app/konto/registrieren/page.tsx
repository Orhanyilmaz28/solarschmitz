import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/content/AccountShell";
import { DisabledForm } from "@/components/content/DisabledForm";

export const metadata: Metadata = { title: "Konto anlegen", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return (
    <AccountShell title="Konto anlegen" active="/konto/registrieren" lead="Mit einem Konto siehst du künftig alle Bestellungen und Sendungen an einem Ort.">
      <DisabledForm
        submitLabel="Konto anlegen"
        fields={[
          { id: "reg-firstname", label: "Vorname", autoComplete: "given-name" },
          { id: "reg-lastname", label: "Nachname", autoComplete: "family-name" },
          { id: "reg-email", label: "E-Mail-Adresse", type: "email", autoComplete: "email" },
          { id: "reg-password", label: "Passwort (mind. 10 Zeichen)", type: "password", autoComplete: "new-password" },
        ]}
        footer={
          <p>
            Schon registriert?{" "}
            <Link href="/konto/anmelden" className="font-semibold underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
              Anmelden
            </Link>
          </p>
        }
      />
    </AccountShell>
  );
}
