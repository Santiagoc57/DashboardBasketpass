"use client";

import { useEffect, useState } from "react";
import { Maximize2, Table2, X } from "lucide-react";

import { ProductionPlainTable } from "@/components/grid/production-plain-table";
import type { MatchListItem } from "@/lib/types";

type ProductionPlainWorkspaceProps = {
  matches: MatchListItem[];
  people: Array<{
    id: string;
    full_name: string;
  }>;
  canEdit: boolean;
  redirectTo: string;
  periodLabel: string;
};

export function ProductionPlainWorkspace({
  matches,
  people,
  canEdit,
  redirectTo,
  periodLabel,
}: ProductionPlainWorkspaceProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!matches.length}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[#617187] shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:border-[rgba(230,18,56,0.24)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Table2 className="size-4" />
        Planilla
        <Maximize2 className="size-3.5 text-[#94a3b8]" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-[#f8fafc] text-[#1f2937]">
          <div className="flex min-h-[4.25rem] items-center justify-between border-b border-[#d8dee8] bg-white px-5">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                Grilla de producción
              </p>
              <h2 className="truncate text-xl font-black tracking-[-0.03em] text-[#14161b]">
                Planilla operativa
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden rounded-full border border-[#d8e0eb] bg-[#f8fafc] px-3 py-1.5 text-xs font-bold text-[#64748b] sm:inline-flex">
                {periodLabel} · {matches.length} partidos
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-[#d8e0eb] bg-white text-[#64748b] hover:border-[#f3b5c2] hover:text-[var(--accent)]"
                aria-label="Cerrar planilla"
                title="Cerrar planilla"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 p-3">
            <ProductionPlainTable
              matches={matches}
              people={people}
              canEdit={canEdit}
              redirectTo={redirectTo}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
