"use client";

import { useState } from "react";
import { Logo } from "./Logo";
import { Icon } from "@/components/ui/Icon";

/** Animierter Logo-Auftritt mit Knopf zum Wiederholen */
export function LogoReplay() {
  const [run, setRun] = useState(0);
  return (
    <div className="relative">
      <div key={run} className="flex min-h-[180px] items-center justify-center">
        <Logo variant="signature" tone="dark" animated glow height={96} className="h-auto w-[min(640px,80vw)]" />
      </div>
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="mx-auto mt-8 flex h-10 items-center gap-2 rounded-full border border-paper/25 px-4 text-sm font-semibold text-paper transition-colors hover:border-paper"
      >
        <Icon name="play" size={16} /> Auftritt wiederholen
      </button>
    </div>
  );
}
