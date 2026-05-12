"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  Settings2,
  Shield,
  Users,
} from "lucide-react";

import type { AppRole } from "@/lib/database.types";
import { isDashboardNavHrefAllowedForRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/grid", label: "Producción", icon: CalendarDays },
  { href: "/grid?workbook=blank", label: "Planilla", icon: FileSpreadsheet },
  { href: "/mi-jornada", label: "Mi jornada", icon: ClipboardList },
  { href: "/reports", label: "Operaciones", icon: BriefcaseBusiness },
  { href: "/teams", label: "Equipos", icon: Shield },
  { href: "/people", label: "Personal", icon: Users },
  { href: "/settings", label: "Configuración", icon: Settings2 },
] as const;

const mobileNavItems = navItems.filter((item) =>
  ["/grid", "/mi-jornada", "/reports", "/teams"].includes(item.href),
);

export function DashboardNav({
  mobile = false,
  role,
}: {
  mobile?: boolean;
  role?: AppRole | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workbookMode = searchParams.get("workbook");
  const allowedItems = navItems.filter((item) =>
    isDashboardNavHrefAllowedForRole(item.href, role),
  );
  const allowedMobileItems = mobileNavItems.filter((item) =>
    isDashboardNavHrefAllowedForRole(item.href, role),
  );

  if (mobile) {
    return (
      <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {allowedMobileItems.map((item) => {
          const active =
            item.href === "/grid?workbook=blank"
              ? pathname === "/grid" && workbookMode === "blank"
              : item.href === "/grid"
                ? pathname === "/grid" && workbookMode !== "blank"
                : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition",
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
    <nav className="space-y-2 xl:space-y-3">
      {allowedItems.map((item) => {
        const active =
          item.href === "/grid?workbook=blank"
            ? pathname === "/grid" && workbookMode === "blank"
            : item.href === "/grid"
              ? pathname === "/grid" && workbookMode !== "blank"
              : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={cn(
              "flex min-w-0 items-center gap-3 rounded-[var(--panel-radius)] px-4 py-3.5 text-[15px] font-semibold transition lg:justify-center lg:px-0 xl:justify-start xl:gap-2.5 xl:px-3 xl:py-3 xl:text-[14px] 2xl:gap-3 2xl:px-5 2xl:py-3.5 2xl:text-[15px]",
              active
                ? "bg-[var(--accent)] text-white shadow-[0_14px_32px_rgba(230,18,56,0.24)]"
                : "bg-[#0d1731] text-white hover:bg-[#132347]",
            )}
          >
            <Icon className="size-5" strokeWidth={2.2} />
            <span className="hidden min-w-0 truncate xl:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
