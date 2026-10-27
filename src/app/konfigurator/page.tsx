import type { Metadata } from "next";
import { Configurator } from "@/components/configurator/Configurator";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Konfigurator",
  description:
    "Drei Fragen zu Ort, Unabhängigkeit und Priorität: Der Sonnenwerk-Konfigurator schlägt passende Solarsets vor und rechnet Ertrag, Ersparnis und Amortisation mit offenen Annahmen durch.",
};

export default function KonfiguratorPage() {
  return (
    <div className="bg-paper">
      <section className="container-x pb-10 pt-14 md:pb-14 md:pt-20">
        <SectionHeader
          label="Konfigurator"
          lines={["Finde deine", "Solarlösung."]}
          size="display"
          align="split"
          lead="Drei Fragen, danach siehst du ein passendes System, was es im Jahr erzeugt und spart und wann es sich bezahlt macht. Alle Annahmen kannst du ändern."
        />
      </section>
      <section className="container-x pb-24 md:pb-32">
        <Configurator />
      </section>
    </div>
  );
}
