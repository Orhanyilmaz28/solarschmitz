/**
 * Zentrale Markenkonfiguration.
 * Name, Kontaktdaten und Farben werden überall aus dieser Datei gelesen.
 * Nach einer Namensänderung `npm run logo` ausführen, damit auch die
 * SVG-Dateien in /public/brand neu erzeugt werden.
 */
export const brand = {
  /** Markenname, z. B. für Seitentitel */
  name: "Sonnenwerk",
  /**
   * Schriftzug im Logo: erster Teil fett, zweiter Teil leicht, ohne Leerzeichen.
   * Nach einer Änderung `npm run logo` ausführen.
   */
  wordmark: { primary: "Sonnen", secondary: "werk" },
  shortName: "Sonnenwerk",
  claim: "Deine Energie. Deine Zukunft.",
  description:
    "Balkonkraftwerke, Batteriespeicher, Solarmodule und Zubehör. Mit Produktfinder, Ertragsrechner und persönlicher Beratung.",

  domain: "sonnenwerk.de",
  contact: {
    email: "info@sonnenwerk.de" as string | null,
    phone: "0176 42903444" as string | null,
    hours: "Mo–Fr 9–17 Uhr",
    address: { street: "Richrather Straße 69", zip: "40723", city: "Hilden", country: "Deutschland" } as null | {
      street: string;
      zip: string;
      city: string;
      country: string;
    },
  },
  /** Anbieter laut Impressum */
  legal: {
    company: "Energiezentrale Schmitz UG (haftungsbeschränkt)" as string | null,
    managingDirector: "Philipp Schmitz (Geschäftsführer)" as string | null,
    /** Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV */
    contentResponsible: "Philipp Schmitz" as string | null,
    // TODO: Registergericht und HRB-Nummer (UG ist im Handelsregister eingetragen)
    register: null as string | null,
    // TODO: USt-IdNr., falls vorhanden
    vatId: null as string | null,
  },

  colors: {
    anthracite: "#101820",
    green: "#B7F34B",
    warmWhite: "#F8FAF7",
    lightGrey: "#E9EEF0",
    /** Sonne im Logo: Verlauf von oben nach unten (Quelle: scripts/build-logo.mjs) */
    sunTop: "#FFD84D",
    sunMid: "#FFA42A",
    sunBottom: "#FF6F1A",
  },

  /**
   * Bild-Slots. Solange ein Wert null ist, zeigt die Seite die gezeichnete Szene.
   * Lizenzierte Fotos nach /public/media legen und hier eintragen (siehe docs/BILDER.md).
   */
  media: {
    hero: null as null | { src: string; alt: string; credit: string },
    heroVideo: null as null | { src: string; poster: string },
  },
} as const;

export type Brand = typeof brand;
