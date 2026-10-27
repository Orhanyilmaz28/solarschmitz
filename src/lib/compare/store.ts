"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { site } from "@/config/site";

interface CompareState {
  ids: string[];
  toggle: (id: string) => "added" | "removed" | "full";
  remove: (id: string) => void;
  clear: () => void;
}

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const { ids } = get();
        if (ids.includes(id)) {
          set({ ids: ids.filter((x) => x !== id) });
          return "removed";
        }
        if (ids.length >= site.compareLimit) return "full";
        set({ ids: [...ids, id] });
        return "added";
      },
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
    }),
    { name: "sonnenwerk-compare", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
