import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { logoData } from "@/components/brand/logo-data";
import { brand } from "@/config/brand";
import { footerNav, legalNav } from "@/config/navigation";
import { ButtonLink } from "@/components/ui/Button";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark relative overflow-hidden bg-ink text-paper">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-lime/10 blur-[120px]" />
      <div className="container-x relative">
        <div className="grid gap-10 border-b border-ink-line py-16 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div>
            <p className="eyebrow">Persönliche Beratung</p>
            <p className="display-lg mt-3 max-w-xl text-4xl md:text-5xl">Fragen zu deinem Balkon, Dach oder Speicher?</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <ButtonLink href="/kontakt" variant="primary" size="lg" arrow>
              Beratung anfragen
            </ButtonLink>
            <ButtonLink href="/konfigurator" variant="outline-light" size="lg">
              Produktfinder
            </ButtonLink>
          </div>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Logo tone="dark" height={34} glow />
            <p className="mt-5 text-sm text-muted-dark">{brand.description}</p>
            <dl className="mt-6 space-y-1 text-sm">
              {brand.contact.email && (
                <div className="flex gap-2">
                  <dt className="text-muted-dark">E-Mail</dt>
                  <dd className="select-all">{brand.contact.email}</dd>
                </div>
              )}
              {brand.contact.phone && (
                <div className="flex gap-2">
                  <dt className="text-muted-dark">Telefon</dt>
                  <dd className="select-all">{brand.contact.phone}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-muted-dark">Erreichbar</dt>
                <dd>{brand.contact.hours}</dd>
              </div>
            </dl>
          </div>
          {footerNav.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[15px] text-paper/85 transition-colors hover:text-lime">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-ink-line py-6 text-sm text-muted-dark md:flex-row md:items-center md:justify-between" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 0px))" }}>
          <p>
            © {year} {brand.legal.company ?? brand.name}. Vorschau-Version, Bestellungen sind noch nicht möglich.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-paper">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Große Signatur als Abschluss: Schrift kaum sichtbar, die Sonne leuchtet */}
      {logoData.signature && (
        <div aria-hidden className="pointer-events-none select-none overflow-hidden">
          <div className="container-x relative pb-3 pt-8 md:pb-5">
            <div className="relative">
              <div
                className="absolute aspect-square w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_150_40/0.35),transparent)] blur-2xl"
                style={{
                  left: `${((logoData.signature.mark.x + logoData.signature.mark.size / 2) / logoData.signature.width) * 100}%`,
                  top: `${((logoData.signature.mark.y + logoData.signature.mark.size / 2) / logoData.signature.height) * 100}%`,
                }}
              />
              <Logo variant="signature" tone="dark" fluid textColor="rgb(248 250 247 / 0.06)" className="relative" />
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
