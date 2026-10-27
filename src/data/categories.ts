import type { Category } from "@/lib/catalog/types";

export const categories: Category[] = [
  {
    slug: "balkonkraftwerke",
    name: "Balkonkraftwerke",
    tagline: "Steckerfertig. Bis 800 W Einspeisung.",
    description:
      "Komplettsets aus Solarmodulen, Wechselrichter und Kabel. Anbringen, in die Steckdose stecken und ab dem ersten Sonnenstrahl Strom sparen.",
    visual: "kit-2",
    buyingTips: [
      "Der Wechselrichter darf höchstens 800 W einspeisen, die Module zusammen bis 2.000 Wp haben.",
      "Für Balkongeländer sind zwei Module üblich, für Garten und Flachdach auch vier.",
      "Bifaziale Glas-Glas-Module nutzen auch Licht von hinten, etwa von hellen Wänden.",
    ],
  },
  {
    slug: "balkonkraftwerke-mit-speicher",
    name: "Balkonkraftwerke mit Speicher",
    tagline: "Solarstrom auch am Abend.",
    description:
      "Sets mit integriertem Batteriespeicher. Überschüssiger Strom vom Mittag wird gespeichert und abends genutzt, statt ungenutzt ins Netz zu fließen.",
    visual: "kit-2-storage",
    buyingTips: [
      "Ein Speicher erhöht den Anteil, den du selbst nutzt, deutlich.",
      "1,6 bis 2,7 kWh reichen für den Grundverbrauch eines Haushalts am Abend.",
      "Viele Systeme lassen sich später mit Zusatzbatterien erweitern.",
    ],
  },
  {
    slug: "solarmodule",
    name: "Solarmodule",
    tagline: "Hohe Leistung auf kleiner Fläche.",
    description:
      "Einzelne Module zum Erweitern oder Selbstzusammenstellen. Mit Leistungsdaten, Maßen und Zelltechnologie im Überblick.",
    visual: "module",
    buyingTips: [
      "Achte auf Maße und Gewicht, besonders bei Balkonmontage.",
      "Glas-Glas-Module sind robuster und altern langsamer.",
      "Mehr Wp bringen vor allem bei Ost/West-Ausrichtung spürbar mehr Ertrag.",
    ],
  },
  {
    slug: "batteriespeicher",
    name: "Batteriespeicher",
    tagline: "Speichern, was die Sonne liefert.",
    description:
      "Speicher zum Nachrüsten für bestehende Balkonkraftwerke. AC-gekoppelte Modelle funktionieren auch mit vorhandenen Wechselrichtern.",
    visual: "battery",
    buyingTips: [
      "AC-gekoppelte Speicher lassen sich an fast jedes vorhandene Balkonkraftwerk anschließen.",
      "Ein Smart Meter steuert die Abgabe passend zum aktuellen Verbrauch.",
      "LiFePO₄-Zellen gelten als langlebig und sicher.",
    ],
  },
  {
    slug: "wechselrichter",
    name: "Wechselrichter",
    tagline: "Das Herz der Anlage.",
    description:
      "Mikrowechselrichter wandeln den Gleichstrom der Module in Haushaltsstrom um. Mit App-Anbindung siehst du jederzeit, was deine Anlage leistet.",
    visual: "inverter",
    buyingTips: [
      "Für Balkonkraftwerke ist eine Ausgangsleistung von 800 W zulässig.",
      "Zwei MPP-Tracker erlauben unterschiedlich ausgerichtete Module.",
      "WLAN oder Bluetooth ermöglichen das Auslesen per App.",
    ],
  },
  {
    slug: "montage-zubehoer",
    name: "Montage & Zubehör",
    tagline: "Sicher befestigt. Smart vernetzt.",
    description:
      "Halterungen für Balkon, Flachdach, Garten und Fassade sowie Smart Meter, Kabel und smarte Steckdosen.",
    visual: "mount-flat",
    buyingTips: [
      "Prüfe vor dem Kauf Geländerdurchmesser oder Dachfläche.",
      "Aufständerungen mit 20–35° Neigung bringen auf Flachdächern den besten Ertrag.",
      "Ein Smart Meter macht den Verbrauch sichtbar und steuert Speicher.",
    ],
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
