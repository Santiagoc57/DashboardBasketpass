"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Copy, Megaphone, PencilLine } from "lucide-react";

import { CreateMatchModal } from "@/components/grid/create-match-modal";
import { formatMatchDate } from "@/lib/date";
import type { PersonRow } from "@/lib/database.types";
import type { MatchListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type MatchCardActionsProps = {
  canEdit: boolean;
  detailsId: string;
  match: MatchListItem;
  people: Pick<PersonRow, "id" | "full_name" | "phone" | "email">[];
  redirectTo: string;
  className?: string;
};

const controlClassName =
  "inline-flex size-10 items-center justify-center rounded-full border border-[#d7dde7] bg-[#f4f6fa] text-[#16181d] transition hover:border-[rgba(230,18,56,0.24)] hover:bg-[#fff3f6] hover:text-[var(--accent)]";

export function MatchCardActions({
  canEdit,
  detailsId,
  match,
  people,
  redirectTo,
  className,
}: MatchCardActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const details = document.getElementById(detailsId);
    if (!(details instanceof HTMLDetailsElement)) {
      return undefined;
    }

    const observer = new MutationObserver(() => {
      setIsOpen(details.open);
    });

    observer.observe(details, {
      attributes: true,
      attributeFilter: ["open"],
    });

    return () => observer.disconnect();
  }, [detailsId]);

  useEffect(() => {
    if (!editMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setEditMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [editMenuOpen]);

  function toggleDetails(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const details = document.getElementById(detailsId);
    if (details instanceof HTMLDetailsElement) {
      details.open = !details.open;
      setIsOpen(details.open);
    }
  }

  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label={editMenuOpen ? "Cerrar acciones del partido" : "Abrir acciones del partido"}
          aria-expanded={editMenuOpen}
          aria-haspopup="menu"
          disabled={!canEdit}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setEditMenuOpen((current) => !current);
          }}
          className={cn(
            controlClassName,
            "shadow-none disabled:cursor-not-allowed disabled:opacity-50",
            editMenuOpen &&
              "border-[rgba(230,18,56,0.24)] bg-[#fff3f6] text-[var(--accent)]",
          )}
        >
          <PencilLine className="size-4" />
        </button>

        <div
          className={cn(
            "panel-surface absolute right-[calc(100%+0.75rem)] top-0 z-50 w-52 border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_18px_40px_rgba(20,24,35,0.12)]",
            !editMenuOpen && "hidden",
          )}
        >
          <CreateMatchModal
            people={people}
            redirectTo={redirectTo}
            canEdit={canEdit}
            initialDate={formatMatchDate(match.kickoff_at, match.timezone, "yyyy-MM-dd")}
            match={match}
            triggerVariant="primary"
            triggerButtonVariant="ghost"
            triggerLabel="Editar partido"
            triggerIcon={<PencilLine className="size-4" />}
            triggerClassName="h-auto w-full justify-start gap-3 rounded-[calc(var(--panel-radius)-4px)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] shadow-none"
            onTriggerClick={() => setEditMenuOpen(false)}
          />

          <CreateMatchModal
            people={people}
            redirectTo={redirectTo}
            canEdit={canEdit}
            initialDate={formatMatchDate(match.kickoff_at, match.timezone, "yyyy-MM-dd")}
            prefillMatch={match}
            triggerVariant="primary"
            triggerButtonVariant="ghost"
            triggerLabel="Crear copia"
            triggerIcon={<Copy className="size-4" />}
            triggerClassName="h-auto w-full justify-start gap-3 rounded-[calc(var(--panel-radius)-4px)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] shadow-none"
            onTriggerClick={() => setEditMenuOpen(false)}
          />
        </div>
      </div>

      <CreateMatchModal
        people={people}
        redirectTo={redirectTo}
        canEdit={canEdit}
        initialDate={formatMatchDate(match.kickoff_at, match.timezone, "yyyy-MM-dd")}
        match={match}
        mode="staff"
        triggerVariant="icon"
        triggerLabel="Notificar personal"
        triggerIcon={<Megaphone className="size-4" />}
        triggerClassName={cn(controlClassName, "shadow-none")}
      />

      <button
        type="button"
        aria-label={isOpen ? "Contraer partido" : "Expandir partido"}
        onClick={toggleDetails}
        className={cn(
          controlClassName,
          isOpen &&
            "rotate-180 border-[rgba(230,18,56,0.24)] bg-[#fff3f6] text-[var(--accent)]",
        )}
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}
