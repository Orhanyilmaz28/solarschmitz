import Link from "next/link";
import { simulate } from "@/lib/solar/calc";
import { getProductBySlug } from "@/lib/catalog";
import { solarAssumptions } from "@/config/solar-assumptions";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { formatEUR, formatNumber } from "@/lib/format";

/**
 * Beispielrechnung statt Werbeversprechen: alle Zahlen kommen aus dem
 * Ertragsrechner mit den offen gelegten Standardannahmen.
 */
export function ExampleYield() {
  const set = getProductBySlug("komplettset-balkonkraftwerk-880w-bifazial");
  const wp = set?.specs.totalWp ?? 880;
  const price = set?.price ?? null;
  const r = simulate({ totalWp: wp, orientation: "sued", mounting: "balkon", withStorage: false, systemCostEUR: price });
  const a = solarAssumptions;

  const stats = [
    { value: Math.round(r.annualKWh), suffix: " kWh", decimals: 0, label: "Solarstrom pro Jahr", note: `${formatNumber(wp)} Wp, Südbalkon, senkrecht montiert` },
    { value: Math.round(r.firstYearSavingsEUR), suffix: " €", decimals: 0, label: "Ersparnis im ersten Jahr", note: `${Math.round(a.selfConsumption.withoutStorage * 100)} % Eigenverbrauch, ${a.electricityPriceCt} ct/kWh` },
    ...(r.paybackYears !== null && price !== null
      ? [{ value: r.paybackYears, suffix: " Jahre", decimals: 1, label: "bis sich das Set bezahlt macht", note: `bei ${formatEUR(price)} Richtpreis` }]
      : []),
  ];

  return (
    <section className="bg-paper pt-24 md:pt-32" aria-labelledby="yield-title">
      <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-end">
        <Reveal>
          <p className="eyebrow">Beispielrechnung</p>
          <h2 id="yield-title" className="display-lg mt-4 text-[34px] md:text-[52px]">
            Zwei Module am Balkon. Spürbar weniger Stromkosten.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Ein Balkonkraftwerk deckt einen Teil deines Grundverbrauchs: Kühlschrank, Router, Standby-Geräte. Die Werte rechts sind eine Schätzung mit offenen Annahmen.{" "}
            <Link href="/konfigurator" className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-4">
              Rechne deine eigene Situation durch.
            </Link>
          </p>
        </Reveal>
        <dl className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 120} className="bg-white p-6 md:p-7">
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="mt-3 font-sans text-[40px] font-bold leading-none tracking-tight md:text-[48px]">
                <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix} className="[font-variant-numeric:normal]" />
              </dd>
              <dd className="mt-3 text-xs text-muted">{s.note}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
