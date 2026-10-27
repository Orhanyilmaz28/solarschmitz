import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

interface Props {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
  /** Großes rechtes Element, z. B. eine Illustration */
  aside?: ReactNode;
}

export function PageHeader({ eyebrow, title, lead, crumbs, children, aside }: Props) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="container-x pb-12 pt-8 md:pb-16 md:pt-10">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className={`mt-8 grid gap-10 md:mt-12 ${aside ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center" : ""}`}>
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            <h1 className="display-lg m-0 text-[clamp(2.25rem,5vw,4rem)]">{title}</h1>
            {lead && <p className="mt-5 max-w-[60ch] text-lg text-muted">{lead}</p>}
            {children && <div className="mt-8">{children}</div>}
          </div>
          {aside && <div className="min-w-0">{aside}</div>}
        </div>
      </div>
    </header>
  );
}
