import type { Metadata } from "next";
import { getCheckoutStatus } from "@/lib/checkout/status";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = {
  title: "Kasse",
  robots: { index: false, follow: false },
};

// Freischaltung hängt von Umgebungsvariablen ab und muss bei jeder Anfrage geprüft werden.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const { enabled } = getCheckoutStatus();
  return (
    <>
      <div className="container-x pt-10">
        <p className="eyebrow">Kasse</p>
        <h1 className="display-lg mt-3 text-[clamp(2rem,4.5vw,3.5rem)]">Bestellung vorbereiten</h1>
      </div>
      <section className="container-x pb-24 pt-10">
        <CheckoutFlow checkoutEnabled={enabled} />
      </section>
    </>
  );
}
