import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminNav } from "./_components/AdminNav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const openInDev = !process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD;
  return (
    <div className="bg-mist/60">
      <div className="container-x grid gap-6 py-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 lg:py-12">
        <aside className="min-w-0">
          <p className="eyebrow m-0 mb-3 px-3">Admin</p>
          <AdminNav />
        </aside>
        <div className="min-w-0">
          {openInDev && (
            <div role="note" className="mb-6 rounded-2xl border border-sun bg-sun-soft px-5 py-4 text-sm">
              <strong>Admin-Zugang ist offen.</strong> ADMIN_USER und ADMIN_PASSWORD sind nicht gesetzt. Das ist nur in der
              Entwicklung erlaubt; in Produktion ist der Bereich dann gesperrt.
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
