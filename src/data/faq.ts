export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "technik" | "recht" | "bestellung" | "speicher";
  /** Weiterführende Seiten, werden unter der Antwort verlinkt */
  links?: { href: string; label: string }[];
}

export const faqCategoryLabels: Record<FaqItem["category"], string> = {
  technik: "Technik",
  recht: "Recht & Anmeldung",
  speicher: "Speicher",
  bestellung: "Bestellung & Versand",
};

/**
 * Häufige Fragen. Die ersten sechs erscheinen auch auf der Startseite.
 * Rechtliche Angaben: Stand Oktober 2026, vor Livegang prüfen lassen.
 */
export const faqItems: FaqItem[] = [
  {
    id: "leistung",
    category: "recht",
    question: "Wie viel Leistung darf ein Balkonkraftwerk haben?",
    answer:
      "Seit dem Solarpaket I (in Kraft seit Mai 2024) darf der Wechselrichter eines Steckersolargeräts bis zu 800 W ins Hausnetz einspeisen. Die angeschlossenen Solarmodule dürfen zusammen bis zu 2.000 Wp haben. Mehr Modulleistung hilft vor allem morgens, abends und bei Bewölkung, weil der Wechselrichter dann länger nahe an seiner Grenze arbeitet.",
  },
  {
    id: "anmeldung",
    category: "recht",
    question: "Muss ich mein Balkonkraftwerk anmelden?",
    answer:
      "Ja, im Marktstammdatenregister der Bundesnetzagentur, innerhalb eines Monats nach der Inbetriebnahme. Die Registrierung ist kostenlos und online in wenigen Minuten erledigt. Die frühere zusätzliche Meldung beim Netzbetreiber entfällt seit 2024.",
  },
  {
    id: "stecker",
    category: "technik",
    question: "Kann ich das Balkonkraftwerk an eine normale Steckdose anschließen?",
    answer:
      "Steckerfertige Sets bis 800 W werden in der Regel mit Schuko-Stecker geliefert und an eine fest installierte Haushaltssteckdose angeschlossen. Die Steckdose muss intakt sein. Schließ das Gerät nicht über Mehrfachsteckdosen oder Verlängerungen mit weiteren Verbrauchern an. Wenn du unsicher bist, ob deine Elektroinstallation geeignet ist, lass sie von einer Elektrofachkraft prüfen.",
  },
  {
    id: "mieter",
    category: "recht",
    question: "Darf ich als Mieterin oder Mieter ein Balkonkraftwerk anbringen?",
    answer:
      "Seit Oktober 2024 gelten Steckersolargeräte im Miet- und Wohnungseigentumsrecht als privilegierte bauliche Veränderung. Vermieter und Eigentümergemeinschaften können die Installation deshalb in der Regel nicht grundsätzlich ablehnen, dürfen aber bei der Art der Montage mitreden. Hol dir vorher die Zustimmung ein und kläre, wo und wie die Module befestigt werden.",
  },
  {
    id: "mwst",
    category: "recht",
    question: "Wann gilt 0 % Umsatzsteuer?",
    answer:
      "Für Solarmodule, Wechselrichter, Speicher und die wesentlichen Komponenten einer Photovoltaikanlage gilt seit 2023 der Nullsteuersatz nach § 12 Abs. 3 UStG. Voraussetzung: Du kaufst als Betreiberin oder Betreiber der Anlage, und sie wird auf oder in der Nähe eines Wohngebäudes installiert (oder eines öffentlichen oder gemeinnützig genutzten Gebäudes). Bei Anlagen bis 30 kWp laut Marktstammdatenregister gilt die Voraussetzung zum Standort als erfüllt. An der Kasse fragen wir ab, ob das auf dich zutrifft. Wenn nicht, berechnen wir 19 % Umsatzsteuer. Zubehör ohne direkten Anlagenbezug, etwa smarte Steckdosen, kostet immer 19 %. Den Steuersatz siehst du bei jedem Produkt.",
  },
  {
    id: "speicher-nutzen",
    category: "speicher",
    question: "Lohnt sich ein Speicher für mein Balkonkraftwerk?",
    answer:
      "Ein Speicher lohnt sich vor allem, wenn du tagsüber wenig Strom verbrauchst. Ohne Speicher fließt Solarstrom, den du gerade nicht nutzt, in der Regel unvergütet ins Netz. Mit Speicher steht er dir am Abend zur Verfügung. Dafür kostet das Set mehr, und die Amortisation dauert oft länger. Unser Produktfinder rechnet beide Varianten mit deinen eigenen Annahmen durch.",
    links: [{ href: "/konfigurator", label: "Produktfinder starten" }],
  },
  {
    id: "speicher-nachruesten",
    category: "speicher",
    question: "Kann ich einen Speicher später nachrüsten?",
    answer:
      "Ja. AC-gekoppelte Speicher werden über die Steckdose angeschlossen und funktionieren mit vielen bestehenden Balkonkraftwerken. Andere Speicher werden zwischen Module und Wechselrichter gesetzt. Prüfe in den technischen Daten, welche Variante zu deiner Anlage passt, oder frag uns.",
    links: [{ href: "/kategorie/batteriespeicher", label: "Batteriespeicher ansehen" }],
  },
  {
    id: "stromausfall",
    category: "speicher",
    question: "Liefert mein Balkonkraftwerk bei einem Stromausfall Strom?",
    answer:
      "Nicht ins Hausnetz. Der Wechselrichter schaltet sich bei einem Netzausfall automatisch ab, damit im Netz keine Spannung anliegt. Manche Speicher haben eine eigene Steckdose, an der du Geräte auch ohne Netz betreiben kannst. Ob ein Gerät das kann, steht in seinen technischen Daten.",
  },
  {
    id: "zaehler",
    category: "technik",
    question: "Brauche ich einen neuen Stromzähler?",
    answer:
      "Nicht vor der Inbetriebnahme. Seit dem Solarpaket I darfst du dein Balkonkraftwerk übergangsweise auch an einem älteren Zähler ohne Rücklaufsperre betreiben, bis dein Messstellenbetreiber ihn gegen einen digitalen Zähler tauscht. Du meldest die Anlage im Marktstammdatenregister an, den Zählertausch organisiert der Messstellenbetreiber.",
  },
  {
    id: "ausrichtung",
    category: "technik",
    question: "Welche Ausrichtung bringt den meisten Ertrag?",
    answer:
      "Am meisten Strom liefert eine Südausrichtung mit etwa 30° Neigung. Ost- und Westausrichtungen bringen etwas weniger Jahresertrag, verteilen ihn aber besser über den Tag. Senkrecht am Balkongeländer montierte Module erzeugen spürbar weniger als aufgeständerte. Verschattung durch Bäume, Nachbargebäude oder Balkonbrüstungen mindert den Ertrag stark.",
    links: [{ href: "/ratgeber", label: "Mehr im Ratgeber" }],
  },
  {
    id: "versand",
    category: "bestellung",
    question: "Von wo wird meine Bestellung verschickt?",
    answer:
      "Wir arbeiten mit ausgewählten Lieferanten zusammen, die deine Bestellung direkt an dich versenden. Wir halten keine eigenen Lagerbestände. Die Sendungsverfolgung bekommst du per E-Mail, sobald der Lieferant das Paket übergeben hat. Versandkosten und Lieferzeiten legen wir gerade mit unseren Lieferanten fest und zeigen sie vor der Bestellung an.",
    links: [{ href: "/versand", label: "Versand und Lieferung" }],
  },
  {
    id: "widerruf",
    category: "bestellung",
    question: "Kann ich meine Bestellung zurückgeben?",
    answer:
      "Als Verbraucherin oder Verbraucher hast du ein gesetzliches Widerrufsrecht von 14 Tagen ab Erhalt der Ware. Wie die Rücksendung abläuft, steht in der Widerrufsbelehrung.",
    links: [{ href: "/widerruf", label: "Widerrufsbelehrung" }],
  },
  {
    id: "bestellen",
    category: "bestellung",
    question: "Kann ich schon bestellen?",
    answer:
      "Noch nicht. Unser Shop befindet sich in der Vorschau: Produktdaten und Preise stimmen wir gerade mit unseren Lieferanten ab, und die Zahlungsabwicklung wird angebunden. Du kannst Produkte schon in den Warenkorb legen und vergleichen. Bestellungen nehmen wir erst an, wenn Preise, Versand und Zahlung verbindlich feststehen.",
  },
  {
    id: "beratung",
    category: "bestellung",
    question: "Ich bin unsicher, welches Set passt. Bekomme ich Beratung?",
    answer:
      "Ja. Starte mit dem Produktfinder, er schlägt dir nach wenigen Fragen passende Produkte vor. Wenn danach noch Fragen offen sind, ruf uns an oder schreib uns über das Kontaktformular. Nenne am besten Montageort, Ausrichtung und ungefähren Stromverbrauch, dann können wir gezielt antworten.",
    links: [
      { href: "/konfigurator", label: "Produktfinder" },
      { href: "/kontakt", label: "Kontakt" },
    ],
  },
];
