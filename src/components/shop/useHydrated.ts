"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart/store";

/** true, sobald der Warenkorb aus dem Browser-Speicher geladen ist */
export function useCartHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useCart.persist.hasHydrated()) setHydrated(true);
    return useCart.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}
