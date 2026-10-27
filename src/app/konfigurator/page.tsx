import type { Metadata } from "next";
import { Configurator } from "@/components/configurator/Configurator";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Produktfinder",
  description: "Beantworte sechs kurze Fragen und erhalte passende Solarlösungen mit geschätzter Jahresproduktion, Ersparnis und Amortisation.",
};

export default function KonfiguratorPage() {
  return (
    <div className="bg-paper">
      <section className="container-x pb-10 pt-14 md:pt-20">
        <Reveal>
          <p className="eyebrow">Produktfinder</p>
          <h1 className="display-lg mt-3 max-w-3xl text-[40px] md:text-[64px]">Finde deine perfekte Solarlösung.</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Sechs Fragen zu Ort, Ausrichtung, Speicher, Platz, Leistung und Budget. Danach siehst du passende Sets und eine Simulation deiner Ersparnis mit offenen, änderbaren Annahmen.
          </p>
        </Reveal>
      </section>
      <section className="container-x pb-24">
        <Configurator />
      </section>
    </div>
  );
}
