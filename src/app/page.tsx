import { Hero } from "@/components/home/Hero";
import { ExampleYield } from "@/components/home/ExampleYield";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { EnergyStory } from "@/components/home/EnergyStory";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HowWeWork } from "@/components/home/HowWeWork";
import { GuidesTeaser, FaqTeaser } from "@/components/home/GuidesAndFaq";
import { Configurator } from "@/components/configurator/Configurator";
import { Reveal } from "@/components/motion/Reveal";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ExampleYield />
      <CategoryShowcase />
      <EnergyStory />

      <section className="bg-paper py-24 md:py-32" aria-labelledby="finder-title">
        <div className="container-x">
          <Reveal className="mb-12 max-w-3xl">
            <p className="eyebrow">Produktfinder</p>
            <h2 id="finder-title" className="display-lg mt-4 text-[36px] md:text-[60px]">
              Finde deine perfekte Solarlösung.
            </h2>
            <p className="mt-5 text-lg text-muted">Sechs Fragen, danach passende Sets und eine Simulation deiner Ersparnis.</p>
          </Reveal>
          <Configurator />
        </div>
      </section>

      <FeaturedProducts />
      <HowWeWork />
      <GuidesTeaser />
      <FaqTeaser />
    </>
  );
}
