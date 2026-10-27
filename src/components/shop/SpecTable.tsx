import type { Product } from "@/lib/catalog/types";
import { rowsFor } from "./specRows";

export function SpecTable({ product }: { product: Product }) {
  const rows = rowsFor(product);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[15px]">
        <caption className="sr-only">Technische Daten {product.name}</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-line last:border-b-0">
              <th scope="row" className="w-[44%] py-3.5 pr-6 align-top font-normal text-muted">
                {r.label}
              </th>
              <td className="py-3.5 align-top font-medium">{r.value}</td>
            </tr>
          ))}
          <tr className="border-t border-line">
            <th scope="row" className="py-3.5 pr-6 align-top font-normal text-muted">
              Artikelnummer
            </th>
            <td className="py-3.5 align-top font-mono text-sm">{product.sku}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
