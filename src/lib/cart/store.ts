"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

const MAX_QTY = 20;

/** Warenkorb im Browser. Preise werden immer frisch aus dem Katalog gelesen, nie gespeichert. */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      add: (productId, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.productId === productId);
          const lines = existing
            ? s.lines.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l))
            : [...s.lines, { productId, quantity: Math.min(MAX_QTY, quantity) }];
          return { lines };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.productId !== productId)
              : s.lines.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l)),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "schmitz-solar-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
      // Wird in <Providers> nach dem ersten Rendern geladen (vermeidet Hydration-Fehler)
      skipHydration: true,
    },
  ),
);

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}
