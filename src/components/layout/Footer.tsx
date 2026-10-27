import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { logoData } from "@/components/brand/logo-data";
import { brand } from "@/config/brand";
import { footerNav, legalNav } from "@/config/navigation";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer data-header="dark" className="cv-auto on-dark relative overflow-hidden border-t border-ink-line bg-ink text-paper" style={{ ["--cv-d" as string]: "720px", ["--cv-m" as string]: "1370px" }}>
      <div className="container-x relative">
        <div className="grid gap-10 pb-14 pt-16 md:pt-20 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
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
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {legalNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-paper">
                  {l.label}
                </Link>
              </li>
            ))}
            {/* Widerrufsfunktion nach § 356a BGB: gut sichtbar auf jeder Seite */}
            <li>
              <Link
                href="/vertrag-widerrufen"
                className="inline-flex h-9 items-center rounded-full border border-paper/25 px-4 font-semibold text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ink"
              >
                Vertrag widerrufen
              </Link>
            </li>
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
