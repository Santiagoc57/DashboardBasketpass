"use client";

import { Filter, Search } from "lucide-react";
import { usePathname } from "next/navigation";

export function DashboardHeaderUtility() {
  const pathname = usePathname();

  if (pathname === "/reports") {
    return null;
  }

  return (
    <>
      <label className="hidden h-11 min-w-[280px] max-w-xl flex-1 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background-soft)] px-4 md:flex">
        <Search className="size-4 text-[var(--muted)]" />
        <input
          aria-label="Buscar"
          placeholder="Buscar partido, ID o incidencia..."
          className="w-full bg-transparent text-sm font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
        />
      </label>
      <button
        type="button"
        className="hidden h-11 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--foreground)] shadow-sm transition hover:bg-[var(--background-soft)] md:inline-flex"
      >
        <Filter className="size-4 text-[var(--accent)]" />
        Filtros
      </button>
    </>
  );
}
