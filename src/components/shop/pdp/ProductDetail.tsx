"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type { Product } from "@/lib/catalog/types";
import type { AccessoryHint } from "@/lib/catalog";
import { getCategory } from "@/data/categories";
import { keyFigures } from "@/lib/catalog/facts";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { Notice } from "@/components/content/Notice";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/config/site";
import { formatEUR } from "@/lib/format";
import { PriceTag } from "../DataStatus";
import { CompareToggle } from "../ProductActions";
import { ProductBuyBox } from "../ProductBuyBox";
import { ProductCard } from "../ProductCard";
import { VatFootnote } from "../VatFootnote";
import { nb } from "../typo";
import { ProductStage } from "./ProductStage";
import { VariantSwitch } from "./VariantSwitch";
import { AccessoryList, Highlights, IncludesList, KeyFigures, ManufacturerInfo, SectionShell, ShippingInfo, SpecGroupList } from "./Sections";
import { SectionNav, StickyBuyBar, type NavSection } from "./StickyBars";

export interface VariantBundle {
  product: Product;
  accessories: AccessoryHint[];
  similar: Product[];
}

interface Props {
  /** Alle Varianten der Produktfamilie mit vorberechnetem Zubehör und ähnlichen Produkten */
  bundles: VariantBundle[];
  initialId: string;
  /** Markenname für den Seitentitel beim Variantenwechsel */
  siteName: string;
}

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => unknown };

/**
 * Produktseite. Varianten einer Familie wechseln ohne Neuladen: Bild, Name, Preis
 * und Daten blenden weich über, die Adresse zeigt die gewählte Variante.
 */
export function ProductDetail({ bundles, initialId, siteName }: Props) {
  const [activeId, setActiveId] = useState(initialId);
  const bundle = bundles.find((b) => b.product.id === activeId) ?? bundles[0]!;
  const { product, accessories, similar } = bundle;
  const family = bundles.map((b) => b.product);
  const category = getCategory(product.category);
  const rootRef = useRef<HTMLDivElement>(null);
  const buyRef = useRef<HTMLDivElement>(null);
  const [pastBuy, setPastBuy] = useState(false);

  // Zurück/Vor auf eine gewechselte Variante: Auswahl aus der Adresse übernehmen
  useEffect(() => {
    const match = bundles.find((b) => window.location.pathname === `/produkt/${b.product.slug}`);
    if (match) setActiveId(match.product.id);
    // nur beim ersten Rendern
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ist der Hauptknopf nach oben aus dem Bild gescrollt? (Scroll statt IntersectionObserver,
  // damit auch Sprünge über Ankerlinks erkannt werden)
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      setPastBuy(el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const select = (id: string) => {
    const next = bundles.find((b) => b.product.id === id);
    if (!next || id === activeId) return;
    const apply = () => {
      flushSync(() => setActiveId(id));
      // Bewusst am Next-Router vorbei: Die Seite bleibt stehen (kein Scroll nach oben, kein Neuladen),
      // die Adresse zeigt trotzdem die gewählte Variante und lässt sich teilen.
      History.prototype.replaceState.call(window.history, window.history.state, "", `/produkt/${next.product.slug}${window.location.hash}`);
      document.title = `${next.product.name} · ${siteName}`;
    };
    const doc = document as ViewTransitionDoc;
    const motion = document.documentElement.dataset.motion === "on";
    if (motion && typeof doc.startViewTransition === "function") {
      doc.startViewTransition(apply);
      return;
    }
    apply();
    if (motion) {
      rootRef.current?.querySelectorAll<HTMLElement>("[data-vfade]").forEach((el) =>
        el.animate(
          [
            { opacity: 0, transform: "translateY(6px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 480, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        ),
      );
    }
  };

  const figures = keyFigures(product);
  const preview = product.dataStatus !== "live";

  const sections: NavSection[] = [
    { id: "ueberblick", label: "Überblick" },
    { id: "technische-daten", label: "Technische Daten" },
    { id: "lieferumfang", label: "Lieferumfang" },
    ...(accessories.length ? [{ id: "zubehoer", label: "Passt dazu" }] : []),
    { id: "versand", label: "Versand & Rückgabe" },
    { id: "herstellerangaben", label: "Hersteller & Sicherheit" },
  ];
  let n = 0;
  const num = () => ++n;

  return (
    <div ref={rootRef}>
      <div className="container-x pt-8" data-vfade>
        <Breadcrumbs
          items={[
            { label: "Produkte", href: "/produkte" },
            ...(category ? [{ label: category.name, href: `/kategorie/${category.slug}` }] : []),
            { label: product.name },
          ]}
        />
      </div>

      {/* Bühne und Kaufbereich */}
      <section aria-label="Produkt" className="container-x grid gap-10 pb-16 pt-8 md:pt-12 lg:grid-cols-12 lg:gap-x-[var(--grid-gap)] lg:pb-24">
        <div className="min-w-0 lg:col-span-7 lg:self-start lg:sticky lg:top-[calc(env(safe-area-inset-top,0px)+104px)]" data-vfade>
          <ProductStage product={product} />
        </div>

        <div className="min-w-0 lg:col-span-5 lg:pl-4 xl:pl-10">
          <div data-vfade>
            <p className="t-label">
              {product.brand}
              {category && <span className="text-muted"> · {category.name}</span>}
            </p>
            <h1 className="mt-4 font-display text-[clamp(1.9rem,2.9vw,2.875rem)] font-[650] leading-[1.04] tracking-[-0.036em]">{nb(product.name)}</h1>
            <p className="mt-5 max-w-[48ch] text-[17px] leading-relaxed text-muted">{nb(product.shortDescription)}</p>
          </div>

          <VariantSwitch variants={family} activeId={product.id} onSelect={select} />

          <div className="mt-9 border-t border-line pt-7" data-vfade>
            <PriceTag product={product} size="lg" footnote />
            {product.dataStatus === "supplier-unverified" && (
              <p className="mt-3 text-[13px] text-muted">Richtpreis aus dem Katalog des Lieferanten, noch nicht bestätigt.</p>
            )}
          </div>

          <div ref={buyRef} className="mt-7">
            <ProductBuyBox product={product} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3">
            <CompareToggle product={product} />
            <a href="#technische-daten" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
              <Icon name="arrow-down" size={16} />
              Technische Daten
            </a>
          </div>

          {product.dataStatus !== "demo" && (
            <dl className="mt-9 border-t border-line text-[14px]" data-vfade>
              <Fact label="Versand">
                {site.shipping.status === "configured" && site.shipping.flatRateEUR !== null
                  ? formatEUR(site.shipping.flatRateEUR)
                  : "Kosten stimmen wir gerade mit dem Lieferanten ab"}
              </Fact>
              <Fact label="Lieferzeit">{site.shipping.deliveryTime ?? "Wird vor dem Verkaufsstart festgelegt"}</Fact>
              <Fact label="Verfügbarkeit">{stockText(product)}</Fact>
              <Fact label="Widerruf">{site.withdrawalDays} Tage Widerrufsrecht</Fact>
            </dl>
          )}

          {preview && (
            <Notice tone={product.dataStatus === "demo" ? "draft" : "preview"} title={product.dataStatus === "demo" ? "Demo-Produkt" : "Vorschau-Daten"} className="mt-8">
              <p>{product.dataNote}</p>
              {product.dataStatus === "supplier-unverified" && product.supplier.sourceUrl && (
                <p className="mt-2">
                  Quelle:{" "}
                  <a href={product.supplier.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-4">
                    Produktseite des Lieferanten
                  </a>
                </p>
              )}
              <p className="mt-2">Bestellungen sind noch nicht möglich.</p>
            </Notice>
          )}
        </div>
      </section>

      <SectionNav sections={sections} product={product} showBuy={pastBuy} />

      <div className="container-x" data-vfade>
        <SectionShell id="ueberblick" index={num()} title="Auf einen Blick">
          <KeyFigures figures={figures} />
          <div className={`grid gap-10 md:grid-cols-2 md:gap-12 ${figures.length ? "mt-12" : ""}`}>
            <p className="m-0 text-[17px] leading-relaxed">{nb(product.description)}</p>
            <Highlights items={product.highlights} />
          </div>
        </SectionShell>

        <SectionShell
          id="technische-daten"
          index={num()}
          title="Technische Daten"
          intro={preview ? "Angaben laut Lieferant. Wir ergänzen sie mit dem Datenblatt, bevor der Verkauf startet." : undefined}
        >
          <SpecGroupList product={product} />
        </SectionShell>

        <SectionShell id="lieferumfang" index={num()} title="Lieferumfang">
          <IncludesList items={product.includes} />
        </SectionShell>

        {accessories.length > 0 && (
          <SectionShell id="zubehoer" index={num()} title="Passt dazu" intro="Abgeleitet aus Kompatibilität und Montageort laut Produktdaten.">
            <AccessoryList items={accessories} />
          </SectionShell>
        )}

        <SectionShell id="versand" index={num()} title="Versand & Rückgabe">
          <ShippingInfo />
        </SectionShell>

        <SectionShell
          id="herstellerangaben"
          index={num()}
          title="Hersteller & Sicherheit"
          intro="Angaben nach der EU-Produktsicherheitsverordnung (GPSR). Fehlende Angaben ergänzen wir vor dem Verkaufsstart."
        >
          <ManufacturerInfo product={product} />
        </SectionShell>

        {similar.length > 0 && (
          <section aria-labelledby="aehnliche-titel" className="border-t border-line py-16 md:py-24">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
              <h2 id="aehnliche-titel" className="t-h2 m-0">
                Ähnliche Produkte
              </h2>
              {category && (
                <Link href={`/kategorie/${category.slug}`} className="group inline-flex items-center gap-2 text-[14px] font-semibold">
                  <span className="underline decoration-ink/20 underline-offset-[6px] group-hover:decoration-ink">Alle {category.name}</span>
                  <Icon name="arrow-right" size={16} className="transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              )}
            </div>
            <ul className="grid gap-x-[var(--grid-gap)] gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((p, i) => (
                <li key={p.id} className="min-w-0">
                  <Reveal delay={(i % 4) * 70} className="h-full">
                    <ProductCard product={p} footnote />
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        )}

        <VatFootnote className="mb-20 md:mb-28" />
      </div>

      <StickyBuyBar product={product} visible={pastBuy} />
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 border-b border-line py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

function stockText(p: Product): string {
  switch (p.stock.status) {
    case "in_stock":
      return "Beim Lieferanten verfügbar";
    case "low":
      return "Nur noch wenige verfügbar";
    case "out_of_stock":
      return "Derzeit nicht verfügbar";
    default:
      return "Wird nach Anbindung des Lieferanten angezeigt";
  }
}
