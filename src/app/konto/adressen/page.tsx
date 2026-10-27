import type { Metadata } from "next";
import { AccountShell } from "@/components/content/AccountShell";

export const metadata: Metadata = { title: "Adressen", robots: { index: false, follow: false } };

export default function AddressesPage() {
  return (
    <AccountShell title="Adressen" active="/konto/adressen" lead="Speichere Rechnungs- und Lieferadressen, um beim Bestellen Zeit zu sparen.">
      <ul className="divide-y divide-line border-y border-line">
        {["Rechnungsadresse", "Lieferadresse"].map((t) => (
          <li key={t} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="t-h3 m-0">{t}</p>
              <p className="mt-1.5 text-[15px] text-muted">Noch keine Adresse hinterlegt.</p>
            </div>
            <button
              type="button"
              disabled
              className="inline-flex h-11 items-center self-start rounded-full border border-line px-5 text-sm font-semibold text-muted disabled:cursor-not-allowed sm:self-auto"
            >
              Adresse hinzufügen
            </button>
          </li>
        ))}
      </ul>
    </AccountShell>
  );
}
