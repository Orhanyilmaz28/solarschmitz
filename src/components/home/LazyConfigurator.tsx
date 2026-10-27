"use client";

import dynamic from "next/dynamic";
import { LazyMount } from "@/components/motion/LazyMount";

const Configurator = dynamic(() => import("@/components/configurator/Configurator").then((m) => m.Configurator), {
  ssr: false,
  loading: () => <ConfiguratorSkeleton />,
});

const places = ["Balkon", "Hausdach", "Flachdach", "Garten"];

/** Platzhalter in Form von Schritt 1, bis der Konfigurator geladen ist */
function ConfiguratorSkeleton() {
  return (
    <div aria-busy="true" className="min-h-[760px] rounded-[var(--radius-card)] border border-line bg-white md:min-h-[700px]">
      <div className="grid grid-cols-4 gap-4 border-b border-line px-5 pb-4 pt-5 md:px-10">
        {["Ort", "Unabhängigkeit", "Priorität", "Ergebnis"].map((s, i) => (
          <div key={s}>
            <div className={`h-1 rounded-full ${i === 0 ? "bg-[image:var(--sun-gradient)]" : "bg-line"}`} />
            <p className="mt-2 hidden text-sm text-muted md:block">{s}</p>
          </div>
        ))}
      </div>
      <div className="px-5 py-8 md:px-10 md:py-12">
        <noscript>
          <p className="mb-4 rounded-2xl bg-stone p-4 text-sm text-muted">Der Produktfinder braucht JavaScript. Alternativ beraten wir dich gern persönlich über die Kontaktseite.</p>
        </noscript>
        <p className="t-label">Frage 1 von 3</p>
        <p className="t-h2 m-0 mt-3">Wo möchtest du deine Energie erzeugen?</p>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {places.map((p) => (
            <div key={p} className="flex aspect-[4/5] items-end rounded-2xl bg-stone p-4 font-semibold">
              {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LazyConfigurator({ id }: { id?: string }) {
  return (
    <LazyMount fallback={<ConfiguratorSkeleton />}>
      <Configurator id={id} />
    </LazyMount>
  );
}
