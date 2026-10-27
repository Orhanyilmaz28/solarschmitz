import Link from "next/link";
import { categories } from "@/lib/catalog";
import { dataStatuses, type DataStatus } from "@/lib/catalog/types";
import { formatEUR } from "@/lib/format";
import { getStore } from "@/lib/store";
import { getMergedProducts } from "@/lib/store/catalog";
import { getSupplierConfigs } from "@/lib/suppliers/registry";
import { dataStatusLabel, dataStatusTone, stockLabel, stockTone } from "../_components/labels";
import { AdminTitle, Card, EmptyState, Pill, TableWrap, formatDateTime, td, th } from "../_components/ui";

export const metadata = { title: "Produkte · Admin" };

type Search = Promise<{ lieferant?: string; status?: string }>;

export default async function AdminProductsPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const store = getStore();
  const [all, imported] = await Promise.all([getMergedProducts(store), store.products.list()]);
  const importedIds = new Set(imported.map((p) => p.id));
  const suppliers = getSupplierConfigs();
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? id;
  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  const status = (dataStatuses as readonly string[]).includes(sp.status ?? "") ? (sp.status as DataStatus) : undefined;
  const supplierIds = [...new Set(all.map((p) => p.supplier.id))];
  const list = all
    .filter((p) => (!sp.lieferant || p.supplier.id === sp.lieferant) && (!status || p.dataStatus === status))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  const link = (params: { lieferant?: string; status?: string }) => {
    const q = new URLSearchParams();
    const l = "lieferant" in params ? params.lieferant : sp.lieferant;
    const s = "status" in params ? params.status : sp.status;
    if (l) q.set("lieferant", l);
    if (s) q.set("status", s);
    const qs = q.toString();
    return qs ? `/admin/produkte?${qs}` : "/admin/produkte";
  };
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm font-semibold ${active ? "border-ink bg-ink text-paper" : "border-line bg-white"}`;

  return (
    <>
      <AdminTitle
        title="Produkte"
        lead="Alle Produkte aus Seed-Katalog und Importen. Einkaufspreise sind nur hier sichtbar und werden nie an den Shop ausgeliefert."
      />
      <div className="mb-5 flex flex-wrap gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Nach Lieferant filtern">
          <span className="text-sm text-muted">Lieferant:</span>
          <Link href={link({ lieferant: undefined })} className={chip(!sp.lieferant)}>
            Alle
          </Link>
          {supplierIds.map((id) => (
            <Link key={id} href={link({ lieferant: id })} className={chip(sp.lieferant === id)}>
              {supplierName(id)}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Nach Datenstatus filtern">
          <span className="text-sm text-muted">Status:</span>
          <Link href={link({ status: undefined })} className={chip(!status)}>
            Alle
          </Link>
          {dataStatuses.map((s) => (
            <Link key={s} href={link({ status: s })} className={chip(status === s)}>
              {dataStatusLabel[s]}
            </Link>
          ))}
        </div>
      </div>

      <Card title={`${list.length} Produkte`}>
        {list.length === 0 ? (
          <EmptyState title="Keine Produkte für diesen Filter">Filter zurücksetzen oder einen Import durchführen.</EmptyState>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Produkt</th>
                <th className={th}>Kategorie</th>
                <th className={th}>Lieferant</th>
                <th className={th}>Datenstatus</th>
                <th className={`${th} text-right`}>EK netto</th>
                <th className={`${th} text-right`}>VK brutto</th>
                <th className={th}>Bestand</th>
                <th className={th}>Quelle</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className={`${td} min-w-[240px]`}>
                    <Link href={`/produkt/${p.slug}`} className="font-semibold hover:underline">
                      {p.name}
                    </Link>
                    <br />
                    <span className="font-mono text-xs text-muted">
                      {p.sku}
                      {p.supplier.supplierSku ? ` · Lief.-Nr. ${p.supplier.supplierSku}` : ""}
                    </span>
                  </td>
                  <td className={td}>{catName(p.category)}</td>
                  <td className={td}>{supplierName(p.supplier.id)}</td>
                  <td className={td}>
                    <Pill tone={dataStatusTone[p.dataStatus]}>{dataStatusLabel[p.dataStatus]}</Pill>
                  </td>
                  <td className={`${td} text-right tabular`}>{p.supplier.costPrice !== undefined ? formatEUR(p.supplier.costPrice) : "–"}</td>
                  <td className={`${td} text-right tabular`}>
                    {p.price > 0 ? formatEUR(p.price) : "–"}
                    <span className="block text-xs text-muted">{p.vatRate} % MwSt.</span>
                  </td>
                  <td className={td}>
                    <Pill tone={stockTone[p.stock.status]}>
                      {stockLabel[p.stock.status]}
                      {p.stock.quantity !== undefined ? ` (${p.stock.quantity})` : ""}
                    </Pill>
                    {p.stock.updatedAt && <span className="block text-xs text-muted">{formatDateTime(p.stock.updatedAt)}</span>}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{importedIds.has(p.id) ? "Import" : "Seed"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
