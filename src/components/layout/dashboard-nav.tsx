"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  Settings2,
  Shield,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/grid", label: "Producción", icon: CalendarDays },
  { href: "/mi-jornada", label: "Mi jornada", icon: ClipboardList },
  { href: "/incidents", label: "Incidencias", icon: AlertTriangle },
  { href: "/reports", label: "Reportes", icon: FileText },
  { href: "/teams", label: "Equipos", icon: Shield },
  { href: "/people", label: "Personal", icon: BriefcaseBusiness },
  { href: "/roles", label: "Roles", icon: ShieldCheck },
  { href: "/settings", label: "Configuración", icon: Settings2 },
] as const;

export function DashboardNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-[22px] px-4 py-3 text-[15px] font-semibold transition",
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[#52627b] hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]",
            )}
          >
            <Icon className="size-5" strokeWidth={2.2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
