import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { brand } from "@/config/brand";
import { site } from "@/config/site";

interface Fact {
  icon: IconName;
  title: string;
  text: string;
  href: string;
}

/** Drei Fakten zu Versand, Widerruf und Beratung, ruhig als Liste mit Haarlinien. */
export function ServiceFacts({ className = "" }: { className?: string }) {
  const { contact } = brand;
  const facts: Fact[] = [
    { icon: "truck", title: "Versand direkt vom Lieferanten", text: "Mit Sendungsverfolgung per E-Mail.", href: "/versand" },
    { icon: "return", title: `${site.withdrawalDays} Tage Widerrufsrecht`, text: "Ab Erhalt der Ware, Details in der Widerrufsbelehrung.", href: "/widerruf" },
  ];
  if (contact.phone) {
    facts.push({ icon: "phone", title: `Fragen? ${contact.phone}`, text: contact.hours ?? "Wir beraten dich persönlich.", href: `tel:${contact.phone.replace(/\s/g, "")}` });
  }
  return (
    <ul className={`divide-y divide-line border-y border-line ${className}`}>
      {facts.map((f) => (
        <li key={f.title}>
          <Link href={f.href} className="group flex items-start gap-4 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone text-ink">
              <Icon name={f.icon} size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold group-hover:underline">{f.title}</span>
              <span className="mt-0.5 block text-sm text-muted">{f.text}</span>
            </span>
            <Icon name="arrow-up-right" size={16} className="mt-1 shrink-0 text-muted transition-colors group-hover:text-ink" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
