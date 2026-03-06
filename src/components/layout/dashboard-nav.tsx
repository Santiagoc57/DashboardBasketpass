"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ShieldCheck, Users2 } from "lucide-react";

import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/grid", label: "Grilla principal", icon: LayoutGrid },
      { href: "/people", label: "Personal", icon: Users2 },
      { href: "/roles", label: "Roles", icon: ShieldCheck },
    ],
  },
] as const;

export function DashboardNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {navGroups.flatMap((group) =>
          group.items.map((item) => {
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
          }),
        )}
      </nav>
    );
  }

  return (
    <nav className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-2">
          <p className="px-3 text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)] hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]",
                  )}
                >
                  <Icon className="size-[18px]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
