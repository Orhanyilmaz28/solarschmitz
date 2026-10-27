import Link from "next/link";
import { site } from "@/config/site";

export interface Crumb {
  label: string;
  href?: string;
}

/** Brotkrumen-Navigation mit strukturierten Daten (BreadcrumbList) */
export function Breadcrumbs({ items, tone = "light" }: { items: Crumb[]; tone?: "light" | "dark" }) {
  const all: Crumb[] = [{ label: "Start", href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: new URL(c.href, site.url).toString() } : {}),
    })),
  };
  const dark = tone === "dark";
  return (
    <nav aria-label="Brotkrumen" className="text-[13px]">
      <ol className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${dark ? "text-muted-dark" : "text-muted"}`}>
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-2">
              {c.href && !last ? (
                <Link href={c.href} className={`underline-offset-4 hover:underline ${dark ? "hover:text-paper" : "hover:text-ink"}`}>
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={`truncate ${last ? (dark ? "text-paper" : "text-ink") : ""}`}>
                  {c.label}
                </span>
              )}
              {!last && (
                <span aria-hidden className="opacity-40">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </nav>
  );
}
