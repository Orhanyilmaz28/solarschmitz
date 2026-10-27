import { getImageProps } from "next/image";
import type { ReactNode } from "react";
import { media, type MediaKey } from "@/config/media";

/**
 * Art-directed Bild: eigener Ausschnitt für Handy und Desktop (<picture>),
 * optimiert über next/image (AVIF/WebP, responsive Größen).
 * Ist der Slot leer, wird `fallback` gezeigt (gezeichnete Szene).
 */
interface Props {
  slot: MediaKey;
  fallback: ReactNode;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

export function ArtImage({ slot, fallback, priority = false, className = "", sizes = "100vw" }: Props) {
  const m = media[slot];
  const desktop = m.desktop;
  const mobile = m.mobile ?? m.desktop;
  if (!desktop || !mobile) return <>{fallback}</>;

  const common = { alt: m.alt, sizes, priority, quality: 82 } as const;
  const {
    props: { srcSet: desktopSet },
  } = getImageProps({ ...common, src: desktop.src, width: desktop.width, height: desktop.height });
  const {
    props: { srcSet: mobileSet, ...rest },
  } = getImageProps({ ...common, src: mobile.src, width: mobile.width, height: mobile.height });

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSet} />
      <source media="(max-width: 767px)" srcSet={mobileSet} />
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img
        {...rest}
        className={`h-full w-full object-cover object-[var(--focus-m)] md:object-[var(--focus-d)] ${className}`}
        style={{
          ["--focus-m" as string]: mobile.focus ?? "50% 50%",
          ["--focus-d" as string]: desktop.focus ?? "50% 50%",
        }}
      />
    </picture>
  );
}
