/**
 * Zentrale Markenkonfiguration.
 * Name, Kontaktdaten und Farben werden überall aus dieser Datei gelesen.
 * Nach einer Namensänderung `npm run logo` ausführen, damit auch die
 * SVG-Dateien in /public/brand neu erzeugt werden.
 */
export const brand = {
  /** Vollständiger Markenname, z. B. für Titel und Rechtstexte */
  name: "SCHMITZ SOLAR",
  /** Wortmarke: erster Teil fett, zweiter Teil leicht */
  wordmark: { primary: "SCHMITZ", secondary: "SOLAR" },
  shortName: "Schmitz Solar",
  claim: "Deine Energie. Deine Zukunft.",
  description:
    "Balkonkraftwerke, Batteriespeicher, Solarmodule und Zubehör. Mit Produktfinder, Ertragsrechner und persönlicher Beratung.",

  // TODO: echte Daten eintragen, bevor die Seite live geht.
  domain: "schmitz-solar.de",
  contact: {
    email: "kontakt@schmitz-solar.de",
    phone: null as string | null,
    hours: "Mo–Fr 9–17 Uhr",
    address: null as null | { street: string; zip: string; city: string },
  },
  legal: {
    company: null as string | null,
    managingDirector: null as string | null,
    register: null as string | null,
    vatId: null as string | null,
  },

  colors: {
    anthracite: "#101820",
    green: "#B7F34B",
    warmWhite: "#F8FAF7",
    lightGrey: "#E9EEF0",
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
