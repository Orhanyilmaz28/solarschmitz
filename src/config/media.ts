/**
 * Bild-Slots der Website mit Art-Direction (getrennte Ausschnitte für Desktop und Handy).
 *
 * Solange ein Slot leer ist (null), zeigt die Seite die gezeichnete Szene.
 * Neue Fotos: Datei nach /public/media legen und hier eintragen.
 * `brief` beschreibt das gewünschte Motiv für Fotograf:in oder Bildagentur.
 */
export interface MediaSource {
  src: string;
  width: number;
  height: number;
  /** Bildschwerpunkt in Prozent, z. B. "70% 60%" (für object-position) */
  focus?: string;
}

export interface MediaSlot {
  desktop: MediaSource | null;
  mobile: MediaSource | null;
  alt: string;
  credit: string | null;
  brief: string;
  /** Empfohlene Formate */
  formats: { desktop: string; mobile: string };
}

export type MediaKey = "hero" | "landscape" | "storage" | "closing";

export const media: Record<MediaKey, MediaSlot> = {
  hero: {
    desktop: null,
    mobile: null,
    alt: "Modernes Einfamilienhaus mit Solarmodulen im Abendlicht",
    credit: null,
    brief:
      "Architektonisch hochwertiges Einfamilienhaus (Flachdach oder Pultdach), Solarmodule sichtbar, tief stehende Sonne, warmes Gegenlicht, linke Bildhälfte ruhig für Text.",
    formats: { desktop: "3200 × 1800 px, Motiv rechts", mobile: "1200 × 2000 px, Haus im unteren Drittel" },
  },
  landscape: {
    desktop: null,
    mobile: null,
    alt: "Solarmodule in einer weiten Landschaft bei Sonnenaufgang",
    credit: null,
    brief: "Weite Landschaft mit Solarflächen oder Dächern, Morgen- oder Abendlicht, viel Himmel für die Überschrift.",
    formats: { desktop: "3200 × 1600 px", mobile: "1200 × 1800 px" },
  },
  storage: {
    desktop: null,
    mobile: null,
    alt: "Batteriespeicher in einem hellen Hauswirtschaftsraum",
    credit: null,
    brief: "Batteriespeicher freigestellt oder in heller, aufgeräumter Umgebung; nur Originalfotos des tatsächlich verkauften Modells.",
    formats: { desktop: "2400 × 1600 px", mobile: "1200 × 1500 px" },
  },
  closing: {
    desktop: null,
    mobile: null,
    alt: "Haus in der Dämmerung, innen warmes Licht",
    credit: null,
    brief: "Emotionales Abendmotiv: Haus in der blauen Stunde, warmes Licht in den Fenstern, Solarmodule sichtbar.",
    formats: { desktop: "3200 × 1800 px", mobile: "1200 × 2000 px" },
  },
};
