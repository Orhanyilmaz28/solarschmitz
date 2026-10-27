import type { ReactNode } from "react";

/**
 * Lesetypografie für Ratgeber und Rechtstexte: rund 65 Zeichen Zeilenlänge,
 * großzügiger Zeilenabstand, Überschriften in der Display-Schrift.
 */
export function Prose({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`max-w-[66ch] text-[17px] leading-[1.75] text-ink/85 md:text-[18px] [&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:decoration-ink/25 [&_a]:underline-offset-[5px] [&_a:hover]:decoration-ink [&_blockquote]:mt-8 [&_blockquote]:border-l-2 [&_blockquote]:border-sun [&_blockquote]:pl-5 [&_blockquote]:text-ink [&_h2]:mb-5 [&_h2]:mt-16 [&_h2]:font-display [&_h2]:text-[clamp(1.5rem,2.4vw,2rem)] [&_h2]:font-semibold [&_h2]:leading-[1.15] [&_h2]:tracking-[-0.03em] [&_h2]:text-ink [&>h2:first-child]:mt-0 [&>section:first-child>h2:first-child]:mt-0 [&_h3]:mb-2 [&_h3]:mt-10 [&_h3]:font-display [&_h3]:text-[1.15rem] [&_h3]:font-semibold [&_h3]:tracking-[-0.015em] [&_h3]:text-ink [&_li]:mt-2 [&_li]:pl-1 [&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-5 [&_p:first-child]:mt-0 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_li::marker]:text-sun-3 ${className}`}
    >
      {children}
    </div>
  );
}

/** Sichtbarer Platzhalter für Angaben, die vor dem Livegang ergänzt werden müssen */
export function Placeholder({ children }: { children: ReactNode }) {
  return <span className="rounded bg-sun-soft px-1.5 py-0.5 font-mono text-[0.82em] text-[#7a4a00]">[{children}]</span>;
}
