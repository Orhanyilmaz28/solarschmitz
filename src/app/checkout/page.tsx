import type { Metadata } from "next";
import { getCheckoutStatus } from "@/lib/checkout/status";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { Icon, type IconName } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Kasse",
  robots: { index: false, follow: false },
};

// Freischaltung hängt von Umgebungsvariablen ab und muss bei jeder Anfrage geprüft werden.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const { enabled } = getCheckoutStatus();
  // Lieferbeschränkungen und Zahlungsmittel gehören an den Beginn des Bestellvorgangs (§ 312j Abs. 1 BGB)
  const facts: { icon: IconName; text: string }[] = [
    { icon: "location", text: "Lieferung nur innerhalb Deutschlands" },
    { icon: "truck", text: "Versandkosten und Lieferzeit siehst du vor der Bestellung" },
    { icon: "euro", text: enabled ? "Zahlung über unseren Zahlungsanbieter" : "Zahlungsarten werden gerade eingerichtet" },
  ];
  return (
    <>
      <div className="container-x pt-8">
        <Breadcrumbs items={[{ label: "Warenkorb", href: "/warenkorb" }, { label: "Kasse" }]} />
        <div className="mt-10 flex flex-col gap-6 md:mt-14 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="t-h1 m-0">Kasse</h1>
          <ul className="flex flex-col gap-2.5 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-x-7">
            {facts.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5">
                <Icon name={f.icon} size={17} className="shrink-0 text-ink" />
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <section className="container-x pb-24 pt-10 md:pb-32 md:pt-14">
        <CheckoutFlow checkoutEnabled={enabled} />
      </section>
    </>
  );
}
