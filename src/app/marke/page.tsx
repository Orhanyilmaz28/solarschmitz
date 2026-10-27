import type { Metadata } from "next";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { LogoReplay } from "@/components/brand/LogoReplay";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Marke",
  description: "Logo-Paket, Farben und Schriften von Sonnenwerk zum Ansehen und Herunterladen.",
  robots: { index: false, follow: true },
};

const files: { title: string; use: string; light: string; dark?: string; dark2?: string }[] = [
  { title: "Hauptlogo (Signatur)", use: "Website, Drucksachen, Fahrzeuge. Das „o“ ist die Sonne.", light: "sonnenwerk-logo.svg", dark: "sonnenwerk-logo-dark.svg" },
  { title: "Kompakt", use: "Kleine Größen ab 16 px Höhe: offenere Laufweite, 2 × 2 Zellen.", light: "sonnenwerk-logo-kompakt.svg", dark: "sonnenwerk-logo-kompakt-dark.svg" },
  { title: "Monogramm", use: "Knappe Flächen, Stempel, Profilbild als Kachel.", light: "sonnenwerk-monogramm.svg", dark: "sonnenwerk-monogramm-dark.svg", dark2: "sonnenwerk-monogramm-kachel.svg" },
  { title: "Zeichen", use: "Favicon, App-Icon, Muster. Drei Viertel Sonne, ein Viertel Modul.", light: "sonnenwerk-zeichen.svg", dark: "sonnenwerk-zeichen-dark.svg", dark2: "sonnenwerk-app-icon.svg" },
  { title: "Mit Zeichen", use: "Wenn das Zeichen getrennt stehen soll, etwa auf Schildern.", light: "sonnenwerk-logo-mit-zeichen.svg", dark: "sonnenwerk-logo-mit-zeichen-dark.svg" },
  { title: "Gestapelt", use: "Quadratische Formate und zentrierte Layouts.", light: "sonnenwerk-stacked.svg", dark: "sonnenwerk-stacked-dark.svg" },
  { title: "Einfarbig", use: "Prägung, Fax, Gravur, Folie.", light: "sonnenwerk-logo-mono.svg", dark: "sonnenwerk-logo-mono-white.svg" },
  { title: "Animiert", use: "Eigenständige SVG mit Auftritt, respektiert „Bewegung reduzieren“.", light: "sonnenwerk-logo-animiert.svg" },
];

const colors = [
  { name: "Nacht", hex: "#0A0F14", role: "Filmische Kapitel, Fußzeile" },
  { name: "Tinte", hex: "#101820", role: "Text, dunkle Flächen" },
  { name: "Papier", hex: "#F8FAF7", role: "Grundfläche" },
  { name: "Stein", hex: "#EEF1EF", role: "Ruhige Flächen" },
  { name: "Sonne hell", hex: "#FFD84D", role: "Licht, Energie" },
  { name: "Sonne", hex: "#FFA42A", role: "Licht, Energie" },
  { name: "Sonne tief", hex: "#FF6F1A", role: "Licht, Energie" },
  { name: "Grün", hex: "#B7F34B", role: "Nur die eine Haupthandlung" },
];

function Download({ file, label }: { file: string; label: string }) {
  return (
    <a href={`/brand/${file}`} download className="text-sm font-semibold underline decoration-current/25 underline-offset-4 hover:decoration-current">
      {label}
    </a>
  );
}

export default function MarkePage() {
  return (
    <div className="bg-paper">
      <section data-header="dark" className="on-dark relative overflow-hidden bg-night pb-24 pt-[calc(80px+72px)] text-paper md:pb-32">
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_164_42/0.16),transparent)]" />
        <div className="container-x relative text-center">
          <p className="t-label">Marke · Logo-Paket</p>
          <div className="mt-14">
            <LogoReplay />
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-x">
          <SectionHeader
            label="Logo"
            lines={["Eine Sonne,", "viele Größen."]}
            align="split"
            lead="Das Hauptlogo ist die Signatur: Im Schriftzug ersetzt die Sonne das „o“, ein Viertel davon ist Solarmodul. Für jede Größe und Fläche gibt es eine passende Fassung, alle als SVG."
          />
          <ul className="mt-14 grid gap-5 md:grid-cols-2">
            {files.map((f) => (
              <li key={f.title} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
                <div className="grid grid-cols-2">
                  <div className={`grid h-44 place-items-center bg-white p-8 ${f.dark ? "" : "col-span-2"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/brand/${f.light}`} alt={`${f.title}, hell`} className="max-h-16 w-auto max-w-full" />
                  </div>
                  {f.dark && (
                    <div className="grid h-44 place-items-center bg-night p-8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/brand/${f.dark2 ?? f.dark}`} alt={`${f.title}, dunkel`} className={`w-auto max-w-full ${f.dark2 ? "max-h-24 rounded-2xl" : "max-h-16"}`} />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line p-6">
                  <div className="min-w-0">
                    <h3 className="t-h3 m-0">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted">{f.use}</p>
                  </div>
                  <div className="flex gap-4">
                    <Download file={f.light} label="SVG hell" />
                    {f.dark && <Download file={f.dark} label="SVG dunkel" />}
                    {f.dark2 && <Download file={f.dark2} label="Kachel" />}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-16 grid gap-10 border-t border-line pt-12 md:grid-cols-3">
            <div>
              <h3 className="t-h3 m-0">Schutzzone</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">Rundum frei lassen: mindestens die Höhe der Sonne. Nichts ragt in diesen Raum.</p>
            </div>
            <div>
              <h3 className="t-h3 m-0">Mindestgrößen</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">Signatur ab 20 px Höhe, darunter die Kompakt-Fassung ab 16 px. Zeichen ab 16 px, als Favicon die Kachel.</p>
            </div>
            <div>
              <h3 className="t-h3 m-0">Nicht erlaubt</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">Sonne umfärben, Zellen weglassen, Schrift verzerren, Schatten oder Konturen hinzufügen, auf unruhige Fotos ohne Fläche setzen.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-y border-t border-line bg-stone">
        <div className="container-x">
          <SectionHeader label="Farbe" lines={["Licht und Präzision."]} lead="Ruhige Flächen, Nacht für filmische Momente, Sonnenfarben nur für Licht und Energie, Grün nur für die eine Haupthandlung." />
          <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {colors.map((c) => (
              <li key={c.hex} className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="h-24" style={{ background: c.hex }} />
                <div className="p-4">
                  <p className="font-semibold">{c.name}</p>
                  <p className="font-mono text-xs text-muted">{c.hex}</p>
                  <p className="mt-1 text-xs text-muted">{c.role}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 h-16 rounded-2xl bg-[image:var(--sun-gradient)]" aria-label="Sonnenverlauf" role="img" />
        </div>
      </section>

      <section className="section-y">
        <div className="container-x">
          <SectionHeader label="Schrift" lines={["Drei Schriften,", "klare Rollen."]} />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="rounded-[var(--radius-card)] border border-line bg-white p-7">
              <p className="t-label">Display · Sora</p>
              <p className="mt-4 font-display text-5xl font-semibold tracking-[-0.04em]">Energie neu gedacht.</p>
              <p className="mt-4 text-sm text-muted">Überschriften und Logo. Eng gesetzt, kräftig.</p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-line bg-white p-7">
              <p className="t-label">Text · Hanken Grotesk</p>
              <p className="mt-4 text-lg leading-relaxed">Dein Zuhause. Deine Energie. Deine Unabhängigkeit. Klar lesbar in Fließtext, Formularen und Tabellen.</p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-line bg-white p-7">
              <p className="t-label">Daten · JetBrains Mono</p>
              <p className="mt-4 font-mono text-3xl tabular-nums">2,71 kWh · 297 W</p>
              <p className="mt-4 text-sm text-muted">Zahlen, Einheiten, Labels.</p>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-10 rounded-[var(--radius-card)] border border-line bg-white p-8">
            <Logo variant="monogram" height={56} />
            <LogoMark size={56} />
            <Logo variant="signature" height={40} />
            <Logo variant="lockup" height={40} />
          </div>
        </div>
      </section>
    </div>
  );
}
