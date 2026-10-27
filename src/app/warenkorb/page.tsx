import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = {
  title: "Warenkorb",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <div className="container-x pt-8">
        <Breadcrumbs items={[{ label: "Warenkorb" }]} />
        <h1 className="display-lg mt-10 text-[clamp(2.25rem,5vw,4rem)]">Warenkorb</h1>
      </div>
      <section className="container-x pb-24 pt-10">
        <CartView />
      </section>
    </>
  );
}
