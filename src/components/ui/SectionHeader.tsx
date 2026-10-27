import type { ReactNode } from "react";
import { LineReveal } from "@/components/motion/LineReveal";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Einheitlicher Abschnittskopf: Label, Überschrift (zeilenweise), Einleitung, Aktionen.
 * size: "display" für Kapitel-Öffner, "h1" für normale Abschnitte.
 */
interface Props {
  label?: string;
  lines: string[];
  lead?: ReactNode;
  actions?: ReactNode;
  size?: "display" | "h1" | "h2";
  align?: "left" | "split";
  id?: string;
  className?: string;
}

export function SectionHeader({ label, lines, lead, actions, size = "h1", align = "left", id, className = "" }: Props) {
  const titleClass = size === "display" ? "t-display" : size === "h2" ? "t-h2" : "t-h1";
  if (align === "split") {
    return (
      <div className={`grid gap-8 md:grid-cols-12 md:items-end ${className}`}>
        <div className="md:col-span-7">
          {label && <Reveal as="p" className="t-label mb-5">{label}</Reveal>}
          <LineReveal as="h2" id={id} lines={lines} className={`${titleClass} m-0`} />
        </div>
        <div className="flex flex-col gap-6 md:col-span-5 md:pb-2">
          {lead && <Reveal delay={120} className="t-lead max-w-[46ch]">{lead}</Reveal>}
          {actions && <Reveal delay={200} className="flex flex-wrap gap-3">{actions}</Reveal>}
        </div>
      </div>
    );
  }
  return (
    <div className={`max-w-4xl ${className}`}>
      {label && <Reveal as="p" className="t-label mb-5">{label}</Reveal>}
      <LineReveal as="h2" id={id} lines={lines} className={`${titleClass} m-0`} />
      {lead && <Reveal delay={120} className="t-lead mt-6 max-w-[58ch]">{lead}</Reveal>}
      {actions && <Reveal delay={200} className="mt-8 flex flex-wrap gap-3">{actions}</Reveal>}
    </div>
  );
}
