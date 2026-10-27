import { getSupplierConfigs } from "@/lib/suppliers/registry";
import { ImportTool } from "../_components/ImportTool";
import { AdminTitle } from "../_components/ui";

export const metadata = { title: "Import · Admin" };

export default function ImportPage() {
  const suppliers = getSupplierConfigs().map((s) => ({ id: s.id, name: s.name }));
  return (
    <>
      <AdminTitle
        title="Produktimport"
        lead={
          <>
            CSV-, XML- oder JSON-Feed hochladen, Zuordnung und Preise prüfen, dann übernehmen. Zum Ausprobieren eignen sich die Dateien
            unter <code className="font-mono text-sm">data/supplier-feeds/</code>.
          </>
        }
      />
      <ImportTool suppliers={suppliers} />
    </>
  );
}
