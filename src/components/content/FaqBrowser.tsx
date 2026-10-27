"use client";

import Link from "next/link";
import { useState } from "react";
import { faqCategoryLabels, type FaqItem } from "@/data/faq";
import { Accordion } from "@/components/ui/Accordion";
import { Icon } from "@/components/ui/Icon";

const order: FaqItem["category"][] = ["recht", "technik", "speicher", "bestellung"];

/** Kleinschreibung ohne Akzente: „zähler“ findet auch „Zähler“ und „zahler“ */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** FAQ mit Suche und Themen-Navigation. Antworten bleiben ohne JavaScript im Akkordeon erreichbar. */
export function FaqBrowser({ items }: { items: FaqItem[] }) {
  const [query, setQuery] = useState("");
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const visible = terms.length
    ? items.filter((f) => {
        const hay = normalize(`${f.question} ${f.answer}`);
        return terms.every((t) => hay.includes(t));
      })
    : items;
  const groups = order.map((c) => ({ category: c, items: visible.filter((f) => f.category === c) })).filter((g) => g.items.length > 0);
  const single = terms.length > 0 && visible.length === 1 ? visible[0]!.id : undefined;

  return (
    <div className="grid gap-x-16 gap-y-10 lg:grid-cols-12">
      <aside className="min-w-0 lg:col-span-4 xl:col-span-3">
        <div className="lg:sticky lg:top-28">
          <label htmlFor="faq-search" className="t-label">
            Frage suchen
          </label>
          <div className="relative mt-3">
            <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="z. B. Zähler, Speicher"
              autoComplete="off"
              className="field-input !pl-11"
            />
          </div>
          <p aria-live="polite" className="mt-2 min-h-5 text-[13px] text-muted">
            {terms.length ? `${visible.length} ${visible.length === 1 ? "Antwort" : "Antworten"} gefunden` : ""}
          </p>
          <nav aria-label="Themen" className="mt-6">
            <p className="t-label">Themen</p>
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:divide-y lg:divide-line lg:overflow-visible lg:border-y lg:border-line lg:pb-0">
              {order.map((c) => {
                const n = visible.filter((f) => f.category === c).length;
                return (
                  <li key={c} className="shrink-0">
                    <a
                      href={`#${c}`}
                      aria-disabled={n === 0 || undefined}
                      className={`flex items-center justify-between gap-4 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition-colors hover:border-ink lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-3.5 lg:text-[15px] lg:hover:underline ${
                        n === 0 ? "pointer-events-none opacity-40" : ""
                      }`}
                    >
                      {faqCategoryLabels[c]}
                      <span className="hidden font-mono text-xs font-normal text-muted lg:inline">{n}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      <div className="min-w-0 lg:col-span-8 xl:col-span-9">
        {groups.length === 0 ? (
          <div className="border-y border-line py-12">
            <p className="t-h3 m-0">Dazu haben wir noch keine Antwort.</p>
            <p className="mt-3 max-w-[52ch] text-muted">
              Versuch es mit einem anderen Begriff oder frag uns direkt. Wir antworten persönlich.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              <button type="button" onClick={() => setQuery("")} className="font-semibold underline decoration-ink/20 underline-offset-4 hover:decoration-ink">
                Suche zurücksetzen
              </button>
              <Link href="/kontakt" className="font-semibold underline decoration-ink/20 underline-offset-4 hover:decoration-ink">
                Frage stellen
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-16 md:space-y-20">
            {groups.map(({ category, items: list }) => (
              <section key={category} id={category} aria-labelledby={`faq-${category}`} className="scroll-mt-28">
                <h2 id={`faq-${category}`} className="t-h2 m-0 mb-6 md:mb-8">
                  {faqCategoryLabels[category]}
                </h2>
                <Accordion
                  key={`${category}-${single ?? ""}`}
                  defaultOpen={list.some((f) => f.id === single) ? single : undefined}
                  items={list.map((f) => ({ id: f.id, title: f.question, content: <Answer item={f} /> }))}
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Answer({ item }: { item: FaqItem }) {
  return (
    <>
      <p className="text-[16px] leading-relaxed">{item.answer}</p>
      {item.links && item.links.length > 0 && (
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {item.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-ink"
            >
              {l.label}
              <Icon name="arrow-right" size={15} />
            </Link>
          ))}
        </p>
      )}
    </>
  );
}
