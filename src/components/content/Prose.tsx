import type { ReactNode } from "react";

/** Lesefreundlicher Fließtext für Ratgeber und Rechtstexte (ca. 65 Zeichen Zeilenlänge) */
export function Prose({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`max-w-[68ch] text-[17px] leading-[1.75] text-ink/85 [&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:decoration-lime [&_a]:decoration-2 [&_a]:underline-offset-4 [&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-[1.65rem] [&_h2]:font-bold [&_h2]:text-ink [&_h2:first-child]:mt-0 [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:font-sans [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-normal [&_h3]:text-ink [&_li]:mt-2 [&_p]:mt-4 [&_p:first-child]:mt-0 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 ${className}`}
    >
      {children}
    </div>
  );
}

/** Sichtbarer Platzhalter für Angaben, die vor dem Livegang ergänzt werden müssen */
export function Placeholder({ children }: { children: ReactNode }) {
  return <span className="rounded bg-sun-soft px-1.5 py-0.5 font-mono text-[0.85em] text-[#7a4a00]">[{children}]</span>;
}
