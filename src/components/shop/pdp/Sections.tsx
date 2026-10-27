import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "@/lib/catalog/types";
import type { AccessoryHint } from "@/lib/catalog";
import { complianceNotes, gpsrRows, includeIcon, type KeyFigure } from "@/lib/catalog/facts";
import { site } from "@/config/site";
import { formatEUR } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { PriceTag } from "../DataStatus";
import { AddToCartButton } from "../ProductActions";
import { ProductThumb } from "../ProductMedia";
import { specGroups } from "../specRows";
import { nb } from "../typo";

/** Abschnitt der Produktseite: Nummer und Titel links, Inhalt rechts, Haarlinie oben */
export function SectionShell({ id, index, title, intro, children }: { id: string; index: number; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titel`}
      className="grid scroll-mt-[calc(env(safe-area-inset-top,0px)+148px)] gap-8 border-t border-line py-16 md:gap-10 md:py-24 lg:grid-cols-12 lg:gap-x-[var(--grid-gap)]"
    >
      <div className="min-w-0 lg:col-span-4">
        <p className="font-mono text-[12px] tabular text-muted">{String(index).padStart(2, "0")}</p>
        <h2 id={`${id}-titel`} className="t-h2 mt-3">
          {title}
        </h2>
        {intro && <div className="mt-4 max-w-[36ch] text-[15px] leading-relaxed text-muted">{intro}</div>}
      </div>
      <div className="min-w-0 lg:col-span-8">{children}</div>
    </section>
  );
}

/** Große Kennzahlen aus echten technischen Daten */
export function KeyFigures({ figures }: { figures: KeyFigure[] }) {
  if (!figures.length) return null;
  const cols = figures.length >= 3 ? "grid-cols-3" : figures.length === 2 ? "grid-cols-2" : "";
  return (
    <dl className={`grid border-y border-line ${cols}`}>
      {figures.map((f, i) => (
        <div
          key={f.label}
          className={`flex min-w-0 flex-col-reverse justify-end gap-2.5 py-6 md:gap-3 md:py-9 ${i > 0 ? "border-l border-line pl-3.5 sm:pl-6 lg:pl-8" : ""} ${
            i < figures.length - 1 ? "pr-3 sm:pr-6 lg:pr-8" : ""
          }`}
        >
          <dt lang="de" className="t-label hyphens-auto !text-[10px] !tracking-[0.1em] [overflow-wrap:anywhere] sm:!text-[11.5px] sm:!tracking-[0.16em] sm:[overflow-wrap:normal]">
            {f.label}
          </dt>
          <dd className={`m-0 ${f.text ? "t-h3 !text-[1rem] sm:!text-[clamp(1.2rem,1.6vw,1.5rem)]" : "t-num text-[clamp(1.9rem,5.2vw,4.75rem)]"}`}>
            {f.value}
            {f.unit && <span className="ml-1.5 text-[0.36em] font-medium tracking-[-0.01em] text-muted">{f.unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Highlights({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="border-t border-line">
      {items.map((h) => (
        <li key={h} className="flex items-start gap-3.5 border-b border-line py-3.5 text-[15.5px]">
          <Icon name="check" size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-ink" />
          {nb(h)}
        </li>
      ))}
    </ul>
  );
}

/** Technische Daten in Gruppen */
export function SpecGroupList({ product }: { product: Product }) {
  const groups = specGroups(product);
  return (
    <div className="gap-12 md:columns-2">
      {groups.map((g) => (
        <div key={g.title} className="mb-12 min-w-0 break-inside-avoid last:mb-0">
          <h3 className="t-label mb-3">{g.title}</h3>
          <dl className="border-t border-ink">
            {g.rows.map((r) => (
              <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-4 border-b border-line py-3.5 text-[15px]">
                <dt className="text-muted">{r.label}</dt>
                <dd className="m-0 font-medium">{nb(r.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

/** Lieferumfang mit Symbolen */
export function IncludesList({ items }: { items: string[] }) {
  if (!items.length) return <Missing>Der Lieferumfang wird mit den Lieferantendaten ergänzt.</Missing>;
  return (
    <ul className="grid border-t border-line sm:grid-cols-2">
      {items.map((i, idx) => (
        <li key={`${i}-${idx}`} className="flex items-center gap-4 border-b border-line py-4 sm:even:border-l sm:even:pl-6 sm:odd:pr-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-stone text-ink">
            <Icon name={includeIcon(i)} size={21} />
          </span>
          <span className="text-[15.5px] leading-snug">{nb(i)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Passendes Zubehör mit Begründung aus den Kompatibilitätsregeln */
export function AccessoryList({ items }: { items: AccessoryHint[] }) {
  return (
    <ul className="border-t border-line">
      {items.map(({ product: p, reason, quantity }) => (
        <li key={p.id} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-5 gap-y-4 border-b border-line py-5 sm:grid-cols-[128px_minmax(0,1fr)_auto] sm:gap-x-7">
          <Link href={`/produkt/${p.slug}`} tabIndex={-1} aria-hidden className="block aspect-[4/3] overflow-hidden rounded-2xl bg-stone">
            <ProductThumb product={p} className="h-full w-full p-1.5 transition-transform duration-700 ease-[var(--ease-out-expo)] hover:scale-105" />
          </Link>
          <div className="min-w-0">
            <p className="t-label !text-[10.5px]">{reason}</p>
            <Link href={`/produkt/${p.slug}`} className="mt-1.5 block text-[16px] font-semibold leading-snug underline-offset-4 hover:underline">
              {nb(p.name)}
            </Link>
            {quantity && <p className="mt-1 text-[13px] text-muted">Empfohlen: {quantity} Stück</p>}
          </div>
          <div className="col-span-2 flex items-center justify-between gap-5 sm:col-span-1 sm:justify-end">
            <PriceTag product={p} footnote />
            <AddToCartButton product={p} quantity={quantity ?? 1} compact variant="subtle" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Versand und Rückgabe: nur festgelegte Angaben, Offenes ehrlich benannt */
export function ShippingInfo() {
  const s = site.shipping;
  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Versandkosten",
      value: s.status === "configured" && s.flatRateEUR !== null ? formatEUR(s.flatRateEUR) : <Missing>Stimmen wir gerade mit dem Lieferanten ab</Missing>,
    },
    { label: "Lieferzeit", value: s.deliveryTime ?? <Missing>Wird vor dem Verkaufsstart festgelegt</Missing> },
    { label: "Versand", value: s.carrierNote },
    { label: "Liefergebiet", value: "Deutschland" },
    { label: "Widerrufsrecht", value: `${site.withdrawalDays} Tage ab Erhalt der Ware` },
  ];
  return (
    <div>
      <dl className="border-t border-line">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1 border-b border-line py-4 text-[15px] sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] sm:gap-6">
            <dt className="text-muted">{r.label}</dt>
            <dd className="m-0">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[15px] font-semibold">
        <Link href="/versand" className="underline decoration-ink/20 underline-offset-[6px] hover:decoration-ink">
          Versand & Lieferung
        </Link>
        <Link href="/widerruf" className="underline decoration-ink/20 underline-offset-[6px] hover:decoration-ink">
          Widerrufsbelehrung
        </Link>
      </p>
    </div>
  );
}

/** Herstellerangaben (GPSR), Sicherheitshinweise und Hinweise zu Rücknahme und Entsorgung */
export function ManufacturerInfo({ product }: { product: Product }) {
  const notes = complianceNotes(product);
  const demo = product.dataStatus === "demo";
  return (
    <div className="space-y-14">
      {demo ? (
        <p className="m-0 max-w-[60ch] text-[15.5px] leading-relaxed text-muted">
          Demo-Produkt: Es gibt keinen Hersteller und kein Angebot. Bei echten Produkten stehen hier Herstellerangaben und Sicherheitshinweise.
        </p>
      ) : (
        <div className="grid gap-12 md:grid-cols-2">
          <div className="min-w-0">
            <h3 className="t-label mb-3">Hersteller</h3>
            <dl className="border-t border-ink">
              {gpsrRows(product).map((r) => (
                <div key={r.label} className="grid gap-1 border-b border-line py-3.5 text-[15px]">
                  <dt className="text-muted">{r.label}</dt>
                  <dd className="m-0 font-medium">
                    {r.value ? nb(r.value) : <Missing>wird mit Lieferantendaten ergänzt{r.hint ? ` (${r.hint})` : ""}</Missing>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="min-w-0">
            <h3 className="t-label mb-3">Sicherheitshinweise</h3>
            <div className="border-t border-ink pt-4">
              {product.safetyNotes.length ? (
                <ul className="space-y-3 text-[15px] leading-relaxed">
                  {product.safetyNotes.map((n) => (
                    <li key={n} className="flex gap-3">
                      <Icon name="info" size={18} className="mt-0.5 shrink-0" />
                      {n}
                    </li>
                  ))}
                </ul>
              ) : (
                <Missing>Warn- und Sicherheitshinweise aus Datenblatt und Anleitung werden mit den Lieferantendaten ergänzt.</Missing>
              )}
            </div>
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="t-h3 m-0">Rücknahme und Entsorgung</h3>
            <CheckChip />
          </div>
          <div className="mt-6 grid gap-10 border-t border-line pt-6 md:grid-cols-2">
            {notes.map((n) => (
              <div key={n.id} className="min-w-0">
                <h4 className="t-label m-0">{n.title}</h4>
                <div className="mt-3 space-y-3 text-[15px] leading-relaxed">
                  {n.paragraphs.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Kennzeichnung für Inhalte, die vor dem Verkaufsstart rechtlich geprüft werden müssen */
export function CheckChip() {
  return <span className="chip border border-dashed border-sun-3/60 bg-sun-soft/40 text-[#7a4a00]">Vor Livegang prüfen</span>;
}

/** Fehlender Wert, ehrlich markiert */
export function Missing({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-baseline gap-2 font-normal text-muted">
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full border border-sun-3" />
      <span>{children}</span>
    </span>
  );
}
