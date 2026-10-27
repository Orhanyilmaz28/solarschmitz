import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { categories } from "@/data/categories";

export default function NotFound() {
  return (
    <section className="container-x grid min-h-[60vh] items-center py-20">
      <div className="max-w-2xl">
        <p className="font-mono text-sm text-lime-deep">Fehler 404</p>
        <h1 className="display-lg mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">Hier scheint gerade keine Sonne.</h1>
        <p className="mt-5 text-lg text-muted">Diese Seite gibt es nicht oder nicht mehr. Vielleicht findest du hier, was du suchst:</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="dark" arrow>
            Zur Startseite
          </ButtonLink>
          <ButtonLink href="/produkte" variant="outline">
            Alle Produkte
          </ButtonLink>
        </div>
        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/kategorie/${c.slug}`} className="underline decoration-lime decoration-2 underline-offset-4 hover:text-lime-deep">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
