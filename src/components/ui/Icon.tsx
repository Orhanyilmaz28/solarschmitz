import type { SVGProps } from "react";

/**
 * Sonnenwerk-Icons: 24er-Raster, 1,6 px Linie, runde Enden.
 * Bewusst wenige, ruhige Formen. Farbe über currentColor.
 */
const paths = {
  "arrow-right": "M4 12h15m-6-6 6 6-6 6",
  "arrow-up-right": "M7 17 17 7M9 7h8v8",
  "arrow-down": "M12 4v15m-6-6 6 6 6-6",
  "chevron-down": "m6 9 6 6 6-6",
  "chevron-right": "m9 6 6 6-6 6",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm9.5 16-4.4-4.4",
  cart: "M3 4h2.6l2.1 10.4h10.1l1.9-7.6H6.4M9 19.3h.01M17 19.3h.01",
  compare: "M4 8h13l-3-3M20 16H7l3 3",
  menu: "M4 8h16M4 16h16",
  close: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "m5 12.5 4.5 4.5L19 7.5",
  sun: "M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
  bolt: "M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z",
  battery: "M7 6h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm3-2h4M9 15h6M9 11.5h6",
  home: "M4 11 12 4l8 7v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H4.5a.5.5 0 0 1-.5-.5V11Z",
  panel: "M4.5 6h15l-2 12h-15l2-12ZM10.3 6l-1.9 12M15.7 6l-1.9 12M3.8 12h15",
  inverter: "M5 5h14v14H5V5Zm3 4h8M8 15c1.3-1.6 2.7-1.6 4 0s2.7 1.6 4 0",
  plug: "M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0V8ZM12 16.5V21",
  shield: "M12 3 5 6v5.5c0 4.3 3 7.6 7 9.5 4-1.9 7-5.2 7-9.5V6l-7-3Zm-3 9 2 2 4-4",
  truck: "M3 6h11v10H3V6Zm11 4h4l3 3v3h-7M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  return: "M9 7 4 12l5 5M4.5 12H15a5 5 0 0 1 0 10h-2",
  chat: "M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-5 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  phone: "M6.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5v3A2 2 0 0 1 18.5 20 15 15 0 0 1 4.5 6a2 2 0 0 1 2-2.5Z",
  mail: "M4 6h16v12H4V6Zm0 .5 8 6.5 8-6.5",
  chart: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v5.5M12 7.5v.01",
  play: "M8 5.5v13l10-6.5-10-6.5Z",
  pause: "M8 5v14M16 5v14",
  grid: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z",
  euro: "M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9",
  tool: "M14.5 5.5a4 4 0 0 0 4.9 4.9l-9.9 9.9a2.1 2.1 0 0 1-3-3l9.9-9.9a4 4 0 0 1-1.9-1.9Z",
  location: "M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
} as const;

export type IconName = keyof typeof paths;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  /** Zugängliche Beschriftung; ohne label wird das Icon für Screenreader ausgeblendet */
  label?: string;
}

export function Icon({ name, size = 20, strokeWidth = 1.6, label, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
