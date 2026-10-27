import type { VisualKey } from "@/lib/catalog/types";

export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  readingMinutes: number;
  category: string;
  visual: VisualKey;
  sections: { heading: string; body: string[] }[];
  /** Stand des Textes, z. B. „Oktober 2026“ */
  updated?: string;
}

export const guides: Guide[] = [
  {
    slug: "balkonkraftwerk-anmelden",
    title: "Balkonkraftwerk anmelden: Schritt für Schritt",
    excerpt:
      "Die Anmeldung im Marktstammdatenregister ist kostenlos und in wenigen Minuten erledigt. So gehst du vor und diese Angaben brauchst du.",
    updated: "Oktober 2026",
    readingMinutes: 4,
    category: "Recht & Anmeldung",
    visual: "meter",
    sections: [
      {
        heading: "Was angemeldet werden muss",
        body: [
          "Jedes Balkonkraftwerk muss im Marktstammdatenregister (MaStR) der Bundesnetzagentur eingetragen werden. Die Frist beträgt einen Monat ab Inbetriebnahme, also ab dem Tag, an dem die Anlage zum ersten Mal Strom ins Hausnetz einspeist.",
          "Seit dem Solarpaket I entfällt die frühere zusätzliche Meldung beim Netzbetreiber. Das Register informiert den Netzbetreiber selbst. Für Steckersolargeräte gibt es im Register ein vereinfachtes Formular.",
        ],
      },
      {
        heading: "Diese Angaben solltest du bereithalten",
        body: [
          "Du brauchst deine Adresse, das Datum der Inbetriebnahme, die Leistung der Solarmodule in Wp und die Leistung des Wechselrichters in W. Beide Werte findest du auf den Typenschildern oder im Datenblatt deines Sets.",
          "Hilfreich ist außerdem die Nummer deines Stromzählers. Sie steht auf dem Zähler und auf deiner Stromrechnung.",
        ],
      },
      {
        heading: "So läuft die Registrierung ab",
        body: [
          "Öffne das Webportal des Marktstammdatenregisters und lege ein Benutzerkonto an. Registriere dich anschließend als Anlagenbetreiber, also als natürliche Person.",
          "Wähle danach die Registrierung einer Stromerzeugungseinheit und dort das Steckersolargerät. Trage die Leistungsdaten ein und schicke die Registrierung ab. Du bekommst eine Registernummer, die du für deine Unterlagen aufbewahren solltest.",
        ],
      },
      {
        heading: "Und der Stromzähler?",
        body: [
          "Ältere Ferraris-Zähler ohne Rücklaufsperre dürfen übergangsweise weiterlaufen, bis der Messstellenbetreiber den Zähler tauscht. Den Tausch veranlasst der Messstellenbetreiber selbst. Du musst dich nicht darum kümmern.",
          "Die Regeln können sich ändern. Prüfe vor der Anmeldung die aktuellen Hinweise der Bundesnetzagentur.",
        ],
      },
    ],
  },
  {
    slug: "solarpaket-800-watt-2000-wp",
    title: "800 W und 2.000 Wp: Was das Solarpaket I erlaubt",
    excerpt:
      "Seit 2024 gelten neue Grenzen für Steckersolargeräte. Wir erklären den Unterschied zwischen Wechselrichter- und Modulleistung und was das für deine Planung bedeutet.",
    updated: "Oktober 2026",
    readingMinutes: 5,
    category: "Recht & Anmeldung",
    visual: "kit-4",
    sections: [
      {
        heading: "Zwei Grenzen, zwei Bedeutungen",
        body: [
          "Das Solarpaket I hat die zulässige Leistung von Balkonkraftwerken angehoben. Der Wechselrichter darf jetzt bis zu 800 W ins Hausnetz einspeisen, vorher waren es 600 W.",
          "Davon getrennt gilt eine Grenze für die Solarmodule: Zusammen dürfen sie bis zu 2.000 Wp haben. Wp steht für Watt Peak, die Leistung unter genormten Testbedingungen mit voller Sonneneinstrahlung.",
        ],
      },
      {
        heading: "Warum mehr Modulleistung sinnvoll ist",
        body: [
          "Volle Leistung erreichen Module nur selten, etwa an klaren Mittagen im Sommer. Die meiste Zeit liefern sie deutlich weniger. Mehr Modulleistung sorgt dafür, dass der Wechselrichter auch morgens, abends und bei leichter Bewölkung nahe an seinen 800 W arbeitet.",
          "An sehr sonnigen Mittagen wird die Leistung oberhalb von 800 W abgeregelt. Dieser Verlust ist meist klein im Vergleich zum Gewinn in den übrigen Stunden.",
        ],
      },
      {
        heading: "Was das für deine Planung heißt",
        body: [
          "Für ein Balkongeländer sind zwei Module üblich, weil Platz und Gewicht begrenzt sind. Im Garten oder auf dem Flachdach lassen sich auch vier Module aufstellen, solange die Summe höchstens 2.000 Wp beträgt.",
          "Achte darauf, dass der Wechselrichter für die gewählte Modulleistung ausgelegt ist. Die maximale Eingangsleistung je Eingang steht im Datenblatt.",
        ],
      },
    ],
  },
  {
    slug: "lohnt-sich-ein-speicher",
    title: "Lohnt sich ein Speicher am Balkonkraftwerk?",
    excerpt:
      "Ein Speicher erhöht den Anteil Solarstrom, den du selbst nutzt. Ob sich das rechnet, hängt vor allem von deinem Verbrauch am Tag ab.",
    updated: "Oktober 2026",
    readingMinutes: 6,
    category: "Speicher",
    visual: "kit-2-storage",
    sections: [
      {
        heading: "Das Problem ohne Speicher",
        body: [
          "Ein Balkonkraftwerk erzeugt den meisten Strom zur Mittagszeit. Wenn dann niemand zu Hause ist, laufen nur Grundverbraucher wie Kühlschrank und Router. Der Rest fließt ins öffentliche Netz, bei Balkonkraftwerken in der Regel ohne Vergütung.",
          "Wie viel du selbst nutzt, hängt stark von deinem Alltag ab. Wer tagsüber zu Hause arbeitet, nutzt deutlich mehr als jemand, der erst abends heimkommt.",
        ],
      },
      {
        heading: "Was ein Speicher ändert",
        body: [
          "Ein Speicher lädt mit dem Überschuss vom Mittag und gibt den Strom abends und nachts wieder ab. So steigt dein Eigenverbrauch. Viele Systeme regeln die Abgabe über ein Smart Meter passend zum aktuellen Verbrauch.",
          "Für Balkonkraftwerke sind Speicher mit etwa 1,6 bis 2,7 kWh verbreitet. Das reicht, um den Grundverbrauch vieler Haushalte über den Abend zu decken.",
        ],
      },
      {
        heading: "So rechnest du nach",
        body: [
          "Vergleiche zwei Fragen: Wie viel kostet der Speicher zusätzlich? Und wie viele Kilowattstunden nutzt du dadurch pro Jahr mehr selbst? Multipliziert mit deinem Strompreis ergibt das die zusätzliche Ersparnis pro Jahr.",
          "Ein Speicher verlängert die Amortisation oft, weil er mehr kostet, als er zusätzlich einspart. Er kann sich trotzdem lohnen, wenn du tagsüber wenig verbrauchst oder Wert auf Unabhängigkeit legst. Unser Produktfinder rechnet beide Varianten mit deinen Werten durch.",
        ],
      },
    ],
  },
  {
    slug: "ausrichtung-und-neigung",
    title: "Ausrichtung und Neigung: So holst du den meisten Ertrag",
    excerpt:
      "Süd, Ost-West oder senkrecht am Geländer? So wirken sich Himmelsrichtung, Neigung und Schatten auf den Ertrag deiner Module aus.",
    updated: "Oktober 2026",
    readingMinutes: 5,
    category: "Technik",
    visual: "mount-flat",
    sections: [
      {
        heading: "Himmelsrichtung",
        body: [
          "In Deutschland liefern nach Süden ausgerichtete Module über das Jahr den höchsten Ertrag. Ost- und Westausrichtungen bringen weniger, verteilen die Erzeugung aber besser auf Vormittag und Nachmittag. Das kann für den Eigenverbrauch sogar günstiger sein.",
          "Nordausrichtungen lohnen sich nur eingeschränkt. Hier ist der Ertrag deutlich geringer.",
        ],
      },
      {
        heading: "Neigung",
        body: [
          "Ideal ist eine Neigung von etwa 30°. Senkrecht am Balkongeländer montierte Module verlieren gegenüber dieser Ideallage merklich an Jahresertrag, liefern aber im Winter bei tief stehender Sonne vergleichsweise gut.",
          "Auf dem Flachdach oder im Garten hilft eine Aufständerung. Viele Halterungen lassen sich im Winkel verstellen, den möglichen Bereich nennt das Datenblatt.",
        ],
      },
      {
        heading: "Schatten vermeiden",
        body: [
          "Schon kleine Schatten können den Ertrag eines ganzen Moduls stark mindern. Achte auf Bäume, Satellitenschüsseln, Brüstungen und Nachbargebäude, auch im Winter, wenn die Sonne tiefer steht.",
          "Wechselrichter mit zwei MPP-Trackern regeln jedes Modul einzeln. So zieht ein verschattetes Modul das andere nicht mit herunter.",
        ],
      },
    ],
  },
  {
    slug: "balkonkraftwerk-als-mieter",
    title: "Balkonkraftwerk als Mieter: Deine Rechte",
    excerpt:
      "Seit Oktober 2024 haben Mieter und Wohnungseigentümer einen Anspruch auf Zustimmung zu einem Steckersolargerät. Was das konkret bedeutet.",
    updated: "Oktober 2026",
    readingMinutes: 4,
    category: "Recht & Anmeldung",
    visual: "mount-rail",
    sections: [
      {
        heading: "Privilegierte Maßnahme",
        body: [
          "Seit Oktober 2024 zählen Steckersolargeräte im Mietrecht und im Wohnungseigentumsrecht zu den sogenannten privilegierten baulichen Veränderungen. Vermieter und Eigentümergemeinschaften können ein Balkonkraftwerk deshalb in der Regel nicht mehr grundsätzlich ablehnen.",
          "Die Zustimmung brauchst du trotzdem. Bitte sie schriftlich ein, bevor du montierst.",
        ],
      },
      {
        heading: "Worüber mitentschieden werden darf",
        body: [
          "Vermieter und Eigentümergemeinschaft dürfen bei der Art der Durchführung mitreden, etwa beim Montageort, bei der Befestigung oder beim Erscheinungsbild der Fassade. Auch Fragen der Sicherheit, zum Beispiel Windlast und sichere Befestigung, spielen eine Rolle.",
          "Beschreibe in deiner Anfrage das geplante Set, die Maße der Module und die vorgesehene Halterung. Das beschleunigt die Entscheidung.",
        ],
      },
      {
        heading: "Beim Auszug",
        body: [
          "Ein Balkonkraftwerk lässt sich ohne Spuren wieder abbauen, wenn es mit einer geeigneten Halterung befestigt wurde. Beim Auszug nimmst du es einfach mit und meldest es im Marktstammdatenregister ab oder um.",
          "Dieser Ratgeber ersetzt keine Rechtsberatung. Bei Streitfragen helfen Mietervereine oder eine Anwältin bzw. ein Anwalt.",
        ],
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
