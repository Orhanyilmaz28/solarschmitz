"use client";

import { useId, useState, type ReactNode } from "react";

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

/** Barrierearmes Akkordeon mit weicher Höhenanimation (grid-rows 0fr → 1fr). */
export function Accordion({ items, defaultOpen, tone = "light" }: { items: AccordionItem[]; defaultOpen?: string; tone?: "light" | "dark" }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);
  const uid = useId();
  const line = tone === "light" ? "border-line" : "border-ink-line";
  const muted = tone === "light" ? "text-muted" : "text-muted-dark";
  return (
    <div className={`border-t ${line}`}>
      {items.map((item) => {
        const isOpen = open === item.id;
        const btnId = `${uid}-${item.id}-btn`;
        const panelId = `${uid}-${item.id}-panel`;
        return (
          <div key={item.id} className={`border-b ${line}`}>
            <h3 className="m-0 font-sans text-base font-semibold tracking-normal md:text-lg">
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="group flex w-full items-center justify-between gap-6 py-5 text-left"
              >
                <span>{item.title}</span>
                <span
                  aria-hidden
                  className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
                    isOpen ? "border-lime bg-lime text-ink" : tone === "light" ? "border-line group-hover:border-ink" : "border-ink-line group-hover:border-paper"
                  }`}
                >
                  <span className="absolute h-[1.5px] w-3.5 bg-current" />
                  <span className={`absolute h-3.5 w-[1.5px] bg-current transition-transform duration-500 ease-[var(--ease-out-expo)] ${isOpen ? "rotate-90 scale-y-0" : ""}`} />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out-expo)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className={`max-w-[68ch] pb-6 ${muted}`}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
