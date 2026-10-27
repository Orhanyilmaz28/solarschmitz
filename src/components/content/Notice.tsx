import type { ReactNode } from "react";

type Tone = "info" | "preview" | "draft" | "warning";

const tones: Record<Tone, { box: string; dot: string }> = {
  info: { box: "border-line bg-white", dot: "bg-ink" },
  preview: { box: "border-sun/35 bg-sun-soft/45", dot: "bg-sun-3" },
  draft: { box: "border-line bg-stone", dot: "bg-ink" },
  warning: { box: "border-danger/25 bg-[#fdf1ec]", dot: "bg-danger" },
};

/** Hinweis für Vorschau-, Entwurfs- und Statusmeldungen. Bewusst leise gestaltet. */
export function Notice({ tone = "info", title, children, className = "" }: { tone?: Tone; title?: ReactNode; children: ReactNode; className?: string }) {
  const t = tones[tone];
  return (
    <div role="note" className={`flex gap-3.5 rounded-2xl border px-5 py-4 text-[14.5px] leading-relaxed ${t.box} ${className}`}>
      <span aria-hidden className={`mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} />
      <div className="min-w-0">
        {title && <p className="font-semibold text-ink">{title}</p>}
        <div className={`text-muted ${title ? "mt-1" : ""}`}>{children}</div>
      </div>
    </div>
  );
}
