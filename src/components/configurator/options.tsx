import type { IconName } from "@/components/ui/Icon";
import type { Independence, Place, Priority } from "@/lib/solar/recommend";

/** Inhalte der Konfigurator-Schritte (Texte in du-Form, kurz und konkret) */

export interface PlaceOption {
  value: Place;
  label: string;
  hint: string;
}

export const placeOptions: PlaceOption[] = [
  { value: "balkon", label: "Balkon", hint: "Am Geländer, steckerfertig" },
  { value: "hausdach", label: "Hausdach", hint: "Schrägdach, Montage durch Fachbetrieb" },
  { value: "flachdach", label: "Flachdach", hint: "Garage, Carport oder Bungalow" },
  { value: "garten", label: "Garten", hint: "Aufgeständert auf Rasen oder Terrasse" },
];

export interface ChoiceOption<V extends string> {
  value: V;
  label: string;
  hint: string;
  icon: IconName;
}

export const independenceOptions: ChoiceOption<Independence>[] = [
  { value: "ohne", label: "Ohne Speicher", hint: "Solarstrom nutzen, wenn er entsteht. Günstigster Einstieg.", icon: "sun" },
  { value: "speicher", label: "Mit Batteriespeicher", hint: "Überschuss vom Mittag für den Abend aufheben.", icon: "battery" },
  { value: "unsicher", label: "Noch unsicher", hint: "Wir zeigen dir beide Wege im Vergleich.", icon: "compare" },
];

export const priorityOptions: ChoiceOption<Priority>[] = [
  { value: "preis", label: "Niedriger Einstiegspreis", hint: "Mit kleinem Budget anfangen", icon: "euro" },
  { value: "leistung", label: "Hohe Leistung", hint: "Möglichst viel Strom pro Jahr", icon: "bolt" },
  { value: "eigenversorgung", label: "Maximale Eigenversorgung", hint: "Möglichst viel selbst nutzen, auch abends", icon: "home" },
  { value: "installation", label: "Einfache Installation", hint: "Wenig Aufwand, steckerfertig", icon: "plug" },
];

export const stepTitles = ["Ort", "Unabhängigkeit", "Priorität", "Ergebnis"] as const;
