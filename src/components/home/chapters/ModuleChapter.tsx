import { SectionHeader } from "@/components/ui/SectionHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { getProductById } from "@/lib/catalog";
import { solarAssumptions } from "@/config/solar-assumptions";
import { formatInt } from "@/lib/format";
import { ModuleStage, type ModuleHotspot } from "./ModuleStage";
import styles from "./module-chapter.module.css";

/**
 * Kapitel 2 – Das Modul.
 * Explosionsansicht eines bifazialen Glas-Glas-Moduls mit fünf Hotspots.
 * Allgemeine Fakten sind als solche formuliert; konkrete Produktangaben stammen
 * ausschließlich aus den Lieferantendaten im Katalog (Einstiegsset p-eforu-set-880).
 */
export function ModuleChapter({ id = "kapitel-modul", label = "Kapitel 2" }: { id?: string; label?: string }) {
  const set = getProductById("p-eforu-set-880");
  const setHref = set ? `/produkt/${set.slug}` : undefined;
  const moduleCount = set?.specs.moduleCount;
  const moduleWp = set?.specs.moduleWp;
  const isGlassGlassBifacial = /glas-glas/i.test(set?.specs.moduleType ?? "") && /bifazial/i.test(set?.specs.moduleType ?? "");
  const { inverterMaxW, moduleMaxWp } = solarAssumptions.plugInLimits;

  const hotspots: ModuleHotspot[] = [
    {
      key: "zelltechnologie",
      title: "Zelltechnologie",
      body: "Monokristalline Siliziumzellen sind heute Standard, oft als Halbzellen: Jede Zelle ist in der Mitte geteilt. Kleinere Zellen führen kleinere Ströme, das senkt Verluste. Und Teilverschattung trifft nur einen Teil des Moduls.",
      note: "Welche Zellen ein bestimmtes Modul nutzt, zeigen wir auf der Produktseite, sobald der Hersteller es bestätigt hat.",
      layers: [3],
      anchor: { layer: 3, u: 0.3, v: 0.25 },
    },
    {
      key: "leistung",
      title: "Leistung",
      body: "Watt-Peak (Wp) ist die Leistung unter Normbedingungen: 1.000 W/m² Einstrahlung bei 25 °C Zelltemperatur. Draußen liefert ein Modul meist weniger. Was am Ende zählt, ist der Ertrag übers Jahr.",
      fact:
        moduleCount && moduleWp
          ? { value: `${moduleCount} × ${formatInt(moduleWp)} Wp`, label: "Unser Einstiegsset, Angabe des Lieferanten", href: setHref, linkLabel: "Zum Set" }
          : undefined,
      layers: [3],
      anchor: { layer: 3, u: 0.68, v: 0.5 },
    },
    {
      key: "effizienz",
      title: "Effizienz",
      body: "Der Wirkungsgrad sagt, welcher Anteil des Sonnenlichts auf der Modulfläche zu Strom wird. Ein höherer Wert heißt mehr Leistung auf gleicher Fläche. Das zählt vor allem dort, wo wenig Platz ist, etwa am Balkongeländer.",
      layers: [1],
      anchor: { layer: 1, u: 0.42, v: 0.1 },
    },
    {
      key: "verarbeitung",
      title: "Verarbeitung",
      body: "Bei Glas-Glas-Modulen liegen die Zellen zwischen zwei Glasscheiben statt auf einer Kunststofffolie. Diese Bauweise gilt als besonders robust gegen Feuchtigkeit und Witterung. Bifazial heißt: Auch die Rückseite nutzt Licht, etwa von hellen Wänden oder Kies reflektiert.",
      fact: isGlassGlassBifacial
        ? { value: "Glas-Glas, bifazial", label: "Module unseres Einstiegssets, laut Lieferant", href: setHref, linkLabel: "Zum Set" }
        : undefined,
      layers: [1, 5],
      anchor: { layer: 5, u: 0.97, v: 0.5 },
    },
    {
      key: "kompatibilitaet",
      title: "Kompatibilität",
      body: "In der Anschlussdose beginnen die Solarkabel, meist mit MC4-kompatiblen Steckern. Sie führen zum Mikrowechselrichter, der den Gleichstrom in netzkonformen Wechselstrom umwandelt.",
      fact: {
        value: `${formatInt(inverterMaxW)} W · ${formatInt(moduleMaxWp)} Wp`,
        label: "Höchstwerte für Steckersolargeräte: Einspeisung und Modulleistung",
      },
      layers: [6],
      anchor: { layer: 6, u: 0.64, v: 0.88 },
    },
  ];

  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-20 ${styles.section}`}>
      <div className="container-x pt-[var(--space-section)]">
        <SectionHeader
          id={`${id}-title`}
          label={`${label} · Das Modul`}
          size="display"
          align="split"
          lines={["Aus Licht", "wird Strom."]}
          lead="Ein Solarmodul hat keine beweglichen Teile, aber einen genauen Aufbau. Hier siehst du, was in einem Glas-Glas-Modul steckt und worauf es beim Vergleichen ankommt."
        />
      </div>

      <ModuleStage hotspots={hotspots} legendTitle="Bauteile des Moduls" />

      <div className="container-x pb-[var(--space-section)]">
        <Reveal className="flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[60ch] text-[13px] leading-relaxed text-muted">
            Schematische Darstellung, nicht maßstabsgetreu. Konkrete Produktangaben stammen vom Lieferanten; Zelltyp und Wirkungsgrad nennen wir pro Produkt,
            sobald sie bestätigt sind.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/kategorie/solarmodule" variant="dark" arrow>
              Solarmodule ansehen
            </ButtonLink>
            <ButtonLink href="/kategorie/balkonkraftwerke" variant="outline">
              Komplettsets ansehen
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
