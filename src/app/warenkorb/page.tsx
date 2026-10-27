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
        <h1 className="t-h1 mb-0 mt-10 md:mt-14">Warenkorb</h1>
      </div>
      <section className="container-x pb-24 pt-10 md:pb-32 md:pt-14">
        <CartView />
      </section>
    </>
  );
}
