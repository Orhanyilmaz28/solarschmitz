"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/motion/Reveal";
import dynamic from "next/dynamic";
import { LazyMount } from "@/components/motion/LazyMount";

// Das Dashboard wird erst kurz vor dem Hinscrollen geladen (spart JavaScript beim ersten Laden)
const DashboardApp = dynamic(() => import("./DashboardApp").then((m) => m.DashboardApp), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
});

function DashboardSkeleton() {
  return (
    <div aria-busy="true" className="min-h-[1700px] rounded-[28px] border border-ink-line bg-ink/60 p-8 md:min-h-[1180px]">
      <noscript>
        <p className="text-sm text-muted-dark">Die interaktive Tagesansicht braucht JavaScript.</p>
      </noscript>
    </div>
  );
}

/**
 * Kapitel 4 – Alles unter Kontrolle.
 * Interaktive Demonstration einer Energie-App mit simulierten Beispieldaten.
 */
export function EnergyDashboardSection({ label = "Kapitel 4", id = "dashboard" }: { label?: string; id?: string }) {
  return (
    <section id={id} className="on-dark relative scroll-mt-20 overflow-hidden bg-night text-paper" aria-labelledby={`${id}-title`}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 top-10 h-[480px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgb(255_164_42/0.10),transparent)]" />
        <div className="absolute -left-40 bottom-0 h-[420px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(183_243_75/0.05),transparent)]" />
      </div>
      <div className="container-x section-y relative">
        <SectionHeader
          id={`${id}-title`}
          label={label}
          size="display"
          align="split"
          lines={["Alles unter", "Kontrolle."]}
          lead="Ein Tag mit Balkonkraftwerk und Speicher: wann die Sonne liefert, was dein Haushalt braucht und wann der Speicher übernimmt. Spiel den Tag ab oder zieh an der Zeitleiste."
        />
        <Reveal className="mt-14 md:mt-20" y={40}>
          <LazyMount fallback={<DashboardSkeleton />}>
            <DashboardApp />
          </LazyMount>
        </Reveal>
        <p className="mt-5 max-w-[70ch] text-[13px] text-muted-dark">
          Die Werte sind eine Simulation mit Beispieldaten und keine Messwerte einer echten Anlage. Mit einer App-fähigen Anlage siehst du solche Daten
          später für deine eigene Anlage, je nach Hersteller in dessen App.
        </p>
      </div>
    </section>
  );
}
