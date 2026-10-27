"use client";

import { create } from "zustand";

interface Toast {
  id: number;
  message: string;
  tone: "default" | "success" | "warning";
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
}

let next = 1;

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, tone = "default") => {
    const id = next++;
    set({ toasts: [...get().toasts.slice(-2), { id, message, tone }] });
    setTimeout(() => get().dismiss(id), 3200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function toast(message: string, tone?: Toast["tone"]) {
  useToast.getState().push(message, tone);
}

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[90] flex flex-col items-center gap-2 px-4"
      style={{ bottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-[var(--shadow-lift)] animate-[page-in_0.4s_var(--ease-out-expo)_both]"
        >
          <span aria-hidden className={`h-2 w-2 rounded-full ${t.tone === "warning" ? "bg-sun" : "bg-lime"}`} />
          {t.message}
        </div>
      ))}
    </div>
  );
}
