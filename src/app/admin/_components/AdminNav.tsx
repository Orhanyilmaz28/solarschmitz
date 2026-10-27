"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/lieferanten", label: "Lieferanten" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/produkte", label: "Produkte" },
  { href: "/admin/bestellungen", label: "Bestellungen" },
  { href: "/admin/protokoll", label: "Protokoll" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin-Navigation" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((it) => {
        const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              active ? "bg-ink text-paper" : "text-ink hover:bg-mist"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
