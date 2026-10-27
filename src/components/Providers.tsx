"use client";

import { useEffect, type ReactNode } from "react";
import { useCart } from "@/lib/cart/store";
import { useCompare } from "@/lib/compare/store";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { Toaster } from "@/components/ui/Toaster";
import { OffscreenPause } from "@/components/motion/OffscreenPause";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useCart.persist.rehydrate();
    void useCompare.persist.rehydrate();
  }, []);
  return (
    <>
      <SmoothScroll />
      <OffscreenPause />
      {children}
      <CartDrawer />
      <Toaster />
    </>
  );
}
