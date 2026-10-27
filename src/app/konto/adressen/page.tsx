import type { Metadata } from "next";
import { AccountShell } from "@/components/content/AccountShell";

export const metadata: Metadata = { title: "Adressen", robots: { index: false, follow: false } };

export default function AddressesPage() {
  return (
    <AccountShell title="Adressen" active="/konto/adressen" lead="Speichere Rechnungs- und Lieferadressen, um beim Bestellen Zeit zu sparen.">
      <div className="grid gap-4 sm:grid-cols-2">
        {["Rechnungsadresse", "Lieferadresse"].map((t) => (
          <div key={t} className="rounded-[var(--radius-card)] border border-dashed border-line bg-white p-6">
            <p className="font-semibold">{t}</p>
            <p className="mt-2 text-sm text-muted">Noch keine Adresse hinterlegt.</p>
            <button type="button" disabled className="mt-5 h-10 rounded-full border border-line px-5 text-sm font-semibold text-muted disabled:cursor-not-allowed">
              Adresse hinzufügen
            </button>
          </div>
        ))}
      </div>
    </AccountShell>
  );
}
