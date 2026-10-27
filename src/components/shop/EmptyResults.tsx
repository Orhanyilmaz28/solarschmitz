import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/** Leerer Zustand der Produktliste: ruhig, mit zwei klaren Auswegen */
export function EmptyResults({
  title = "Keine passenden Produkte",
  text = "Lockere einen Filter oder versuch einen anderen Suchbegriff. Der Produktfinder hilft dir auch ohne Fachbegriffe weiter.",
  resetHref = "/produkte",
}: {
  title?: string;
  text?: string;
  resetHref?: string;
}) {
  return (
    <div className="grid gap-8 border-t border-line pt-10 md:grid-cols-12 md:pt-14">
      <p className="t-h2 m-0 md:col-span-6">{title}</p>
      <div className="md:col-span-5 md:col-start-8">
        <p className="m-0 text-[16px] leading-relaxed text-muted">{text}</p>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-[15px] font-semibold">
          <Link href={resetHref} className="group inline-flex items-center gap-2">
            <span className="underline decoration-ink/20 underline-offset-[6px] group-hover:decoration-ink">Filter zurücksetzen</span>
          </Link>
          <Link href="/konfigurator" className="group inline-flex items-center gap-2">
            <span className="underline decoration-ink/20 underline-offset-[6px] group-hover:decoration-ink">Zum Produktfinder</span>
            <Icon name="arrow-right" size={16} className="transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
