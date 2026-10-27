import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/content/AccountShell";
import { DisabledForm } from "@/components/content/DisabledForm";

export const metadata: Metadata = { title: "Anmelden", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <AccountShell title="Anmelden" active="/konto/anmelden">
      <DisabledForm
        submitLabel="Anmelden"
        fields={[
          { id: "login-email", label: "E-Mail-Adresse", type: "email", autoComplete: "email" },
          { id: "login-password", label: "Passwort", type: "password", autoComplete: "current-password" },
        ]}
        footer={
          <p>
            Noch kein Konto?{" "}
            <Link href="/konto/registrieren" className="font-semibold underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
              Konto anlegen
            </Link>
          </p>
        }
      />
    </AccountShell>
  );
}
