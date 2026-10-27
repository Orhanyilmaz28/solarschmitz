import type { ReactNode } from "react";

type Tone = "info" | "preview" | "draft" | "warning";

const tones: Record<Tone, { box: string; dot: string }> = {
  info: { box: "border-line bg-white", dot: "bg-lime-deep" },
  preview: { box: "border-sun/40 bg-sun-soft/40", dot: "bg-sun" },
  draft: { box: "border-ink/15 bg-mist", dot: "bg-ink" },
  warning: { box: "border-danger/30 bg-[#fdf1ec]", dot: "bg-danger" },
};

/** Hinweiskasten für Vorschau-, Entwurfs- und Statusmeldungen */
export function Notice({ tone = "info", title, children, className = "" }: { tone?: Tone; title?: ReactNode; children: ReactNode; className?: string }) {
  const t = tones[tone];
  return (
    <div role="note" className={`flex gap-3 rounded-2xl border px-5 py-4 text-sm ${t.box} ${className}`}>
      <span aria-hidden className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${t.dot}`} />
      <div className="min-w-0">
        {title && <p className="font-semibold text-ink">{title}</p>}
        <div className={`text-muted ${title ? "mt-1" : ""}`}>{children}</div>
      </div>
    </div>
  );
}
