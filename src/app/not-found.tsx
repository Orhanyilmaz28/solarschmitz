import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LineReveal } from "@/components/motion/LineReveal";
import { categories } from "@/data/categories";

export default function NotFound() {
  return (
    <section className="container-x grid min-h-[70vh] gap-16 py-20 md:py-28 lg:grid-cols-12 lg:items-center">
      <div className="min-w-0 lg:col-span-7">
        {/* Sonne knapp unter dem Horizont */}
        <div aria-hidden className="relative h-16 w-32 overflow-hidden border-b border-ink/15">
          <div className="absolute left-1/2 top-7 h-24 w-24 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,#ffd84d_0%,#ffa42a_55%,#ff6f1a_100%)] opacity-90" />
        </div>
        <p className="t-label mt-8">Fehler 404</p>
        <LineReveal as="h1" lines={["Hier scheint", "gerade keine Sonne."]} immediate className="t-h1 m-0 mt-5" />
        <p className="t-lead mt-6 max-w-[46ch]">Diese Seite gibt es nicht oder nicht mehr. Von hier aus findest du schnell zurück.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="dark" size="lg" arrow>
            Zur Startseite
          </ButtonLink>
          <ButtonLink href="/produkte" variant="outline" size="lg">
            Alle Produkte
          </ButtonLink>
        </div>
      </div>
      <nav aria-label="Kategorien" className="min-w-0 lg:col-span-4 lg:col-start-9">
        <p className="t-label">Sortiment</p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/kategorie/${c.slug}`} className="group flex items-center justify-between gap-4 py-4 text-[15px] font-semibold">
                <span className="group-hover:underline">{c.name}</span>
                <Icon name="arrow-right" size={18} className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
