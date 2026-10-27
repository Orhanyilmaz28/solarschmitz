import type { Metadata, Viewport } from "next";
import { Sora, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { Providers } from "@/components/Providers";
import { CompareBar } from "@/components/shop/CompareBar";
import { assertCatalogValid } from "@/lib/catalog/validate";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
// Labels und Zahlen (auch im Hero sichtbar, daher vorab geladen)
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${brand.name} – ${brand.claim}`, template: `%s · ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  openGraph: { type: "website", locale: "de_DE", siteName: brand.name, title: brand.name, description: brand.description },
  robots: site.previewMode ? { index: false, follow: false } : { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: brand.colors.anthracite,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Setzt data-motion="on" vor dem ersten Zeichnen, damit Reveal-Effekte nicht flackern. */
const motionScript = `(function(){try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.motion='on'}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Katalog beim Build gegen das Schema prüfen (bricht bei ungültigen Daten ab)
  assertCatalogValid();
  return (
    <html lang="de" className={`${sora.variable} ${hanken.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body>
        <a href="#inhalt" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-lime focus:px-5 focus:py-3 focus:font-semibold focus:text-ink">
          Zum Inhalt springen
        </a>
        <Providers>
          <PreviewBanner />
          <Header />
          <main id="inhalt">{children}</main>
          <Footer />
          <CompareBar />
        </Providers>
      </body>
    </html>
  );
}
