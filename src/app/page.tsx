import { Hero } from "@/components/home/Hero";
import { HeroArt } from "@/components/home/hero/HeroArt";
import { ArtImage } from "@/components/media/ArtImage";
import { simulate } from "@/lib/solar/calc";
import { formatInt } from "@/lib/format";
import { SunChapter } from "@/components/home/chapters/SunChapter";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { ModuleChapter } from "@/components/home/chapters/ModuleChapter";
import { StorageChapter } from "@/components/home/chapters/StorageChapter";
import { EnergyDashboardSection } from "@/components/home/dashboard/EnergyDashboardSection";
import { LazyConfigurator } from "@/components/home/LazyConfigurator";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HowWeWork } from "@/components/home/HowWeWork";
import { GuidesTeaser, FaqTeaser } from "@/components/home/GuidesAndFaq";
import { ClosingChapter } from "@/components/home/chapters/ClosingChapter";

/**
 * Startseite als Geschichte in Akten:
 * dunkel (Hero, Kapitel 1 Licht) → hell (Produktwelt, Kapitel 2 Modul) →
 * dunkel (Kapitel 3 Speicher, Kapitel 4 Dashboard) → hell (Produktfinder, Auswahl,
 * Vertrauen, Ratgeber, Fragen) → dunkel (Kapitel 5 Morgen, Fußzeile).
 */
export default function HomePage() {
  // Beispielwert aus dem Ertragsrechner (880 Wp, Südbalkon, senkrecht montiert)
  const example = simulate({ totalWp: 880, orientation: "sued", mounting: "balkon", withStorage: false, systemCostEUR: null });
  const exampleKWh = Math.round(example.annualKWh / 10) * 10;
  return (
    <>
      <Hero
        art={<ArtImage slot="hero" priority fallback={<HeroArt variant="desktop" className="h-full w-full" />} />}
        artMobile={<ArtImage slot="hero" fallback={<HeroArt variant="mobile" className="h-full w-full" />} />}
        facts={[
          { value: "800 W", label: "Einspeisung erlaubt" },
          { value: "2.000 Wp", label: "Modulleistung möglich" },
          { value: `≈ ${formatInt(exampleKWh)} kWh`, label: "pro Jahr mit 880 Wp am Südbalkon" },
        ]}
      />

      <SunChapter />
      <CategoryShowcase id="produktwelt" />
      <ModuleChapter />

      <div data-header="dark" className="bg-night">
        <StorageChapter />
        <EnergyDashboardSection />
      </div>

      <section id="produktfinder" className="section-y scroll-mt-16 bg-paper" aria-labelledby="produktfinder-title">
        <div className="container-x">
          <SectionHeader
            id="produktfinder-title"
            label="Produktfinder"
            lines={["Drei Fragen.", "Deine Anlage."]}
            size="display"
            align="split"
            lead="Wo soll sie hin, wie unabhängig willst du sein, was ist dir wichtig? Danach siehst du ein passendes System mit Ertrag, Ersparnis und Amortisation. Alle Annahmen kannst du ändern."
          />
          <div className="mt-12 md:mt-16">
            <LazyConfigurator id="produktfinder-app" />
          </div>
        </div>
      </section>

      <FeaturedProducts />
      <HowWeWork />
      <GuidesTeaser />
      <FaqTeaser />
      <ClosingChapter />
    </>
  );
}
