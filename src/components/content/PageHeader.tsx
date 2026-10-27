import type { ReactNode } from "react";
import { LineReveal } from "@/components/motion/LineReveal";
import { Reveal } from "@/components/motion/Reveal";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

interface Props {
  eyebrow?: string;
  /** Überschrift. Als Text wird sie zeilenweise eingeblendet. Entfällt, wenn titleLines gesetzt ist. */
  title?: ReactNode;
  /** Gestaltete Zeilenumbrüche für die Überschrift (hat Vorrang vor title) */
  titleLines?: string[];
  lead?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
  /** Großes rechtes Element, z. B. eine Illustration */
  aside?: ReactNode;
  /** Dunkle Variante für filmische Seitenöffner */
  tone?: "light" | "dark";
  /** Ohne Linie am unteren Rand */
  flush?: boolean;
}

/** Seitenkopf: Brotkrumen, Label, große Überschrift, Einleitung. Ruhig, viel Weißraum. */
export function PageHeader({ eyebrow, title, titleLines, lead, crumbs, children, aside, tone = "light", flush = false }: Props) {
  const dark = tone === "dark";
  const lines = titleLines ?? (typeof title === "string" ? [title] : null);
  return (
    <header className={`${dark ? "on-dark bg-night text-paper" : `bg-paper ${flush ? "" : "border-b border-line"}`}`}>
      <div className="container-x pb-14 pt-8 md:pb-20 md:pt-10">
        {crumbs && <Breadcrumbs items={crumbs} tone={tone} />}
        <div className={`mt-12 grid gap-10 md:mt-20 ${aside ? "lg:grid-cols-12 lg:items-end lg:gap-14" : ""}`}>
          <div className={`min-w-0 ${aside ? "lg:col-span-7" : "max-w-5xl"}`}>
            {eyebrow && (
              <Reveal as="p" className="t-label mb-5" y={12}>
                {eyebrow}
              </Reveal>
            )}
            {lines ? <LineReveal as="h1" lines={lines} immediate className="t-h1 m-0" /> : <h1 className="t-h1 m-0">{title}</h1>}
            {lead && (
              <Reveal delay={150} y={16}>
                <p className="t-lead mt-6 max-w-[58ch]">{lead}</p>
              </Reveal>
            )}
            {children && (
              <Reveal delay={220} y={16} className="mt-9">
                {children}
              </Reveal>
            )}
          </div>
          {aside && <div className="min-w-0 lg:col-span-5">{aside}</div>}
        </div>
      </div>
    </header>
  );
}
