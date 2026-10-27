export interface NavLink {
  label: string;
  href: string;
  /** in der Kopfzeile erst auf breiten Bildschirmen (ab 1400 px) zeigen */
  wide?: boolean;
}

export const mainNav: NavLink[] = [
  { label: "Konfigurator", href: "/konfigurator" },
  { label: "Ratgeber", href: "/ratgeber" },
  { label: "Über uns", href: "/ueber-uns", wide: true },
  { label: "Kontakt", href: "/kontakt", wide: true },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Alle Produkte", href: "/produkte" },
      { label: "Balkonkraftwerke", href: "/kategorie/balkonkraftwerke" },
      { label: "Mit Speicher", href: "/kategorie/balkonkraftwerke-mit-speicher" },
      { label: "Batteriespeicher", href: "/kategorie/batteriespeicher" },
      { label: "Solarmodule", href: "/kategorie/solarmodule" },
      { label: "Wechselrichter", href: "/kategorie/wechselrichter" },
      { label: "Montage & Zubehör", href: "/kategorie/montage-zubehoer" },
    ],
  },
  {
    title: "Beratung",
    links: [
      { label: "Konfigurator", href: "/konfigurator" },
      { label: "Produktvergleich", href: "/vergleich" },
      { label: "Ratgeber", href: "/ratgeber" },
      { label: "Häufige Fragen", href: "/faq" },
      { label: "Kontakt", href: "/kontakt" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "Versand & Lieferung", href: "/versand" },
      { label: "Widerrufsrecht", href: "/widerruf" },
      { label: "Kundenkonto", href: "/konto" },
      { label: "Über uns", href: "/ueber-uns" },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "AGB", href: "/agb" },
  { label: "Widerruf", href: "/widerruf" },
];
