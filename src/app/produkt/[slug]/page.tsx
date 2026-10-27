import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllProducts, getProductBySlug, getRelatedProducts, hasPrice } from "@/lib/catalog";
import { getCategory } from "@/data/categories";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { Notice } from "@/components/content/Notice";
import { ConsultCta } from "@/components/content/ConsultCta";
import { ProductCard, ProductMedia, keySpecs } from "@/components/shop/ProductCard";
import { DataStatusChip, PriceTag } from "@/components/shop/DataStatus";
import { ProductBuyBox } from "@/components/shop/ProductBuyBox";
import { SpecTable } from "@/components/shop/SpecTable";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/config/site";
import { brand } from "@/config/brand";
import { formatEUR } from "@/lib/format";

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.shortDescription,
    // Demo-Produkte nicht in Suchmaschinen aufnehmen
    robots: p.dataStatus === "demo" ? { index: false, follow: true } : undefined,
  };
}

const sections = [
  { id: "beschreibung", label: "Beschreibung" },
  { id: "technische-daten", label: "Technische Daten" },
  { id: "lieferumfang", label: "Lieferumfang" },
  { id: "versand", label: "Versand & Lieferung" },
];

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const category = getCategory(product.category);
  const related = getRelatedProducts(product, 4);
  const shipping = site.shipping;

  // Strukturierte Daten nur mit gesicherten Angaben. Ein Angebot (offers) erst, wenn der Preis bestätigt ist.
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    category: category?.name,
    url: new URL(`/produkt/${product.slug}`, site.url).toString(),
    ...(product.images[0] ? { image: new URL(product.images[0].src, site.url).toString() } : {}),
    ...(product.dataStatus === "live" && hasPrice(product)
      ? {
          offers: {
            "@type": "Offer",
            price: product.price.toFixed(2),
            priceCurrency: "EUR",
            seller: { "@type": "Organization", name: brand.name },
          },
        }
      : {}),
  };

  return (
    <>
      <div className="container-x pt-8">
        <Breadcrumbs
          items={[
            { label: "Produkte", href: "/produkte" },
            ...(category ? [{ label: category.name, href: `/kategorie/${category.slug}` }] : []),
            { label: product.name },
          ]}
        />
      </div>

      <section className="container-x grid gap-10 pb-16 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:pt-12">
        {/* Produktbühne */}
        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <div className="sheen group relative aspect-[4/3] w-full max-w-full overflow-hidden rounded-[28px] bg-[radial-gradient(110%_90%_at_25%_10%,#ffffff_0%,#e9eef0_62%,#dfe6e9_100%)]">
            <div aria-hidden className="absolute -right-[10%] -top-[20%] h-[70%] w-[70%] rounded-full bg-sun/25 blur-3xl" />
            <div className="absolute inset-[7%] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]">
              <ProductMedia product={product} className="h-full w-full" priority />
            </div>
            <div className="absolute left-5 top-5 z-[3] flex gap-2">
              <DataStatusChip product={product} />
            </div>
          </div>
          {!product.images.length && (
            <p className="mt-3 text-xs text-muted">Abbildung: Illustration. Produktfotos folgen mit den Lieferantendaten.</p>
          )}
        </div>

        {/* Kaufbereich */}
        <div className="min-w-0">
          <p className="eyebrow">{product.brand}</p>
          <h1 className="display-md mt-3 text-[clamp(1.9rem,3.6vw,2.9rem)]">{product.name}</h1>
          <p className="mt-4 text-lg text-muted">{product.shortDescription}</p>

          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Technische Eckdaten">
            {keySpecs(product).map((s) => (
              <li key={s} className="rounded-lg bg-mist px-3 py-1 font-mono text-sm">
                {s}
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-line pt-8">
            <PriceTag product={product} size="lg" />
            <div className="mt-6">
              <ProductBuyBox product={product} />
            </div>
          </div>

          {product.dataStatus !== "live" && (
            <Notice
              tone={product.dataStatus === "demo" ? "draft" : "preview"}
              title={product.dataStatus === "demo" ? "Demo-Produkt" : "Vorschau-Daten"}
              className="mt-8"
            >
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

          {product.highlights.length > 0 && (
            <ul className="mt-8 space-y-3">
              {product.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-[15px]">
                  <span aria-hidden className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime">
                    <svg viewBox="0 0 16 16" className="h-3 w-3">
                      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-8 grid gap-4 rounded-2xl border border-line bg-white p-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Versand</dt>
              <dd className="mt-1 font-semibold">
                {shipping.status === "configured" && shipping.flatRateEUR !== null ? formatEUR(shipping.flatRateEUR) : "wird noch festgelegt"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Lieferzeit</dt>
              <dd className="mt-1 font-semibold">{shipping.deliveryTime ?? "wird noch festgelegt"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Verfügbarkeit</dt>
              <dd className="mt-1 font-semibold">
                {product.stock.status === "unknown"
                  ? "Wird nach Anbindung des Lieferanten angezeigt"
                  : product.stock.status === "in_stock"
                    ? "Beim Lieferanten verfügbar"
                    : product.stock.status === "low"
                      ? "Nur noch wenige verfügbar"
                      : "Derzeit nicht verfügbar"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Abschnittsnavigation */}
      <nav aria-label="Produktinformationen" className="sticky top-[calc(env(safe-area-inset-top,0px)_+_76px)] z-20 border-y border-line bg-paper/90 backdrop-blur">
        <ul className="container-x flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
          {sections.map((s) => (
            <li key={s.id} className="shrink-0">
              <a href={`#${s.id}`} className="block rounded-full px-4 py-2 text-sm font-semibold text-muted hover:bg-mist hover:text-ink">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-x divide-y divide-line">
        <section id="beschreibung" className="grid scroll-mt-40 gap-6 py-14 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
          <h2 className="display-md m-0 text-2xl md:text-3xl">Beschreibung</h2>
          <div className="max-w-[68ch] text-[17px] leading-relaxed text-ink/85">
            <p>{product.description}</p>
          </div>
        </section>

        <section id="technische-daten" className="grid scroll-mt-40 gap-6 py-14 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
          <div>
            <h2 className="display-md m-0 text-2xl md:text-3xl">Technische Daten</h2>
            {product.dataStatus !== "live" && <p className="mt-3 text-sm text-muted">Angaben werden mit dem Datenblatt des Lieferanten ergänzt.</p>}
          </div>
          <div className="min-w-0 max-w-3xl">
            <SpecTable product={product} />
          </div>
        </section>

        <section id="lieferumfang" className="grid scroll-mt-40 gap-6 py-14 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
          <h2 className="display-md m-0 text-2xl md:text-3xl">Lieferumfang</h2>
          {product.includes.length ? (
            <ul className="grid max-w-3xl gap-3 sm:grid-cols-2">
              {product.includes.map((i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-[15px]">
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-lime-deep" />
                  {i}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Der Lieferumfang wird mit den Lieferantendaten ergänzt.</p>
          )}
        </section>

        <section id="versand" className="grid scroll-mt-40 gap-6 py-14 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
          <h2 className="display-md m-0 text-2xl md:text-3xl">Versand & Lieferung</h2>
          <div className="max-w-[68ch] space-y-4 text-[17px] leading-relaxed text-ink/85">
            <p>{shipping.carrierNote}</p>
            <p>
              Versandkosten und Lieferzeit stimmen wir gerade mit unseren Lieferanten ab. Sie stehen vor der Bestellung verbindlich im Warenkorb
              und an dieser Stelle. Geliefert wird nach Deutschland.
            </p>
            <p>
              Du hast ein gesetzliches Widerrufsrecht von {site.withdrawalDays} Tagen.{" "}
              <Link href="/versand" className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-4">
                Mehr zu Versand und Rückgabe
              </Link>
            </p>
          </div>
        </section>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="aehnlich" className="border-t border-line bg-white">
          <div className="container-x py-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 id="aehnlich" className="display-md m-0 text-[clamp(1.6rem,3vw,2.25rem)]">
                Passt dazu
              </h2>
              {category && (
                <Link href={`/kategorie/${category.slug}`} className="text-sm font-semibold underline decoration-lime decoration-2 underline-offset-4">
                  Alle {category.name}
                </Link>
              )}
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p, i) => (
                <li key={p.id} className="min-w-0">
                  <Reveal delay={i * 70} className="h-full">
                    <ProductCard product={p} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <ConsultCta title="Fragen zu diesem Produkt?" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
