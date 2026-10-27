import type { ReactNode } from "react";

export type Tone = "ok" | "warn" | "error" | "neutral" | "info";

const toneClass: Record<Tone, string> = {
  ok: "bg-lime/45 text-ink",
  warn: "bg-sun-soft text-ink",
  error: "bg-danger/10 text-danger",
  neutral: "bg-mist text-muted",
  info: "bg-ink text-paper",
};

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`chip ${toneClass[tone]}`}>{children}</span>;
}

export function Card({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-line bg-white p-5 md:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="m-0 font-display text-lg font-bold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-white p-5">
      <p className="eyebrow m-0">{label}</p>
      <p className="m-0 mt-2 font-display text-3xl font-bold tabular">{value}</p>
      {hint && <p className="m-0 mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function AdminTitle({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="display-md m-0 text-3xl md:text-4xl">{title}</h1>
        {lead && <p className="m-0 mt-2 max-w-[65ch] text-muted">{lead}</p>}
      </div>
      {children}
    </div>
  );
}

/** Tabelle mit eigenem horizontalem Scrollbereich */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 md:-mx-6 md:px-6">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export const th = "border-b border-line py-2 pr-4 font-medium text-muted whitespace-nowrap";
export const td = "border-b border-line/70 py-2.5 pr-4 align-top";

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-paper p-8 text-center">
      <p className="m-0 font-display text-lg font-bold">{title}</p>
      <div className="mx-auto mt-2 max-w-[56ch] text-muted">{children}</div>
    </div>
  );
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}
