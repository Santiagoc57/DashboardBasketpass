"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Pencil, X } from "lucide-react";

import { useGridInsightsDock } from "@/components/grid/grid-insights-dock";
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
  const [isEditing, setIsEditing] = useState(false);
  const { close: closeInsightsDock } = useGridInsightsDock();

  function requestEditMode() {
    if (isEditing) {
      return;
    }

    const confirmed = window.confirm(
      "Vas a activar la edición de esta planilla. Los cambios que realices se guardan sobre la grilla operativa existente y pueden impactar asignaciones, reportes y vistas relacionadas. Revisa cada campo antes de modificarlo.",
    );

    if (confirmed) {
      setIsEditing(true);
    }
  }

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsEditing(false);
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
        onClick={() => {
          closeInsightsDock();
          setOpen(true);
        }}
        disabled={!matches.length}
        className="panel-surface inline-flex size-12 items-center justify-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] text-[#607089] transition hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Abrir planilla"
        title="Abrir planilla"
      >
        <Maximize2 className="size-5" />
      </button>

      {open && typeof document !== "undefined" ? createPortal(
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
              {canEdit ? (
                <>
                  <button
                    type="button"
                    onClick={requestEditMode}
                    disabled={isEditing}
                    className={`inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border px-3 text-xs font-black uppercase tracking-[0.14em] transition ${
                      isEditing
                        ? "cursor-default border-[var(--accent)] bg-[#fff1f4] text-[var(--accent)]"
                        : "border-[#d8e0eb] bg-white text-[#64748b] hover:border-[#f3b5c2] hover:text-[var(--accent)]"
                    }`}
                    aria-pressed={isEditing}
                  >
                    <Pencil className="size-4" />
                    Editar
                  </button>
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="inline-flex h-10 items-center rounded-[var(--panel-radius)] border border-[#b7e4c7] bg-[#f0fdf4] px-3 text-xs font-black uppercase tracking-[0.14em] text-[#15803d] transition hover:border-[#86d7a4]"
                    >
                      Guardar cambios
                    </button>
                  ) : null}
                </>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setOpen(false);
                }}
                className="inline-flex size-10 items-center justify-center rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white text-[#64748b] hover:border-[#f3b5c2] hover:text-[var(--accent)]"
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
              isEditing={isEditing}
              redirectTo={redirectTo}
            />
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
