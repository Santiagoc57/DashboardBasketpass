"use client";

import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";

import { PersonRowActions } from "@/components/people/person-row-actions";
import { Button } from "@/components/ui/button";
import { getAssignmentStateDisplayName, getRoleDisplayName } from "@/lib/display";
import { parsePersonNotesMeta } from "@/lib/people-notes";
import type { PersonListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type PeopleTableColumn =
  | "profile"
  | "contact"
  | "status"
  | "details"
  | "actions";

const PEOPLE_TABLE_COLUMNS_STORAGE_KEY =
  "basket-production.people.table-columns";
const DEFAULT_PEOPLE_TABLE_COLUMNS: PeopleTableColumn[] = [
  "profile",
  "contact",
  "status",
  "details",
  "actions",
];

function normalizePeopleTableColumns(
  value: unknown,
): PeopleTableColumn[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const nextColumns = value.filter((item): item is PeopleTableColumn =>
    DEFAULT_PEOPLE_TABLE_COLUMNS.includes(item as PeopleTableColumn),
  );

  if (
    nextColumns.length !== DEFAULT_PEOPLE_TABLE_COLUMNS.length ||
    new Set(nextColumns).size !== DEFAULT_PEOPLE_TABLE_COLUMNS.length
  ) {
    return null;
  }

  return nextColumns;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getStatusBadgeClass(state: PersonListItem["assignment_state"]) {
  switch (state) {
    case "En asignacion":
      return "border-[#b8e7c7] bg-[#eefbf2] text-[#1b7d43] [&>span]:bg-[#23b25f]";
    case "Inactivo":
      return "border-[#f2c6ce] bg-[#fff3f5] text-[#b42343] [&>span]:bg-[var(--accent)]";
    default:
      return "border-[#d8dee8] bg-[#f6f8fb] text-[#596980] [&>span]:bg-[#8ea0b7]";
  }
}

export function PeopleTable({
  people,
  canEdit,
}: {
  people: PersonListItem[];
  canEdit: boolean;
}) {
  const [columnOrder, setColumnOrder] = useState<PeopleTableColumn[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_PEOPLE_TABLE_COLUMNS;
    }

    try {
      const parsedColumns = normalizePeopleTableColumns(
        JSON.parse(
          window.localStorage.getItem(PEOPLE_TABLE_COLUMNS_STORAGE_KEY) ??
            "null",
        ),
      );

      return parsedColumns ?? DEFAULT_PEOPLE_TABLE_COLUMNS;
    } catch {
      window.localStorage.removeItem(PEOPLE_TABLE_COLUMNS_STORAGE_KEY);
      return DEFAULT_PEOPLE_TABLE_COLUMNS;
    }
  });
  const [draggedColumn, setDraggedColumn] =
    useState<PeopleTableColumn | null>(null);
  const [dragOverColumn, setDragOverColumn] =
    useState<PeopleTableColumn | null>(null);

  useEffect(() => {
    window.localStorage.setItem(
      PEOPLE_TABLE_COLUMNS_STORAGE_KEY,
      JSON.stringify(columnOrder),
    );
  }, [columnOrder]);

  function handleColumnDragStart(column: PeopleTableColumn) {
    setDraggedColumn(column);
    setDragOverColumn(column);
  }

  function handleColumnDragOver(column: PeopleTableColumn) {
    if (draggedColumn && draggedColumn !== column) {
      setDragOverColumn(column);
    }
  }

  function handleColumnDrop(column: PeopleTableColumn) {
    if (!draggedColumn || draggedColumn === column) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    setColumnOrder((current) => {
      const next = [...current];
      const draggedIndex = next.indexOf(draggedColumn);
      const targetIndex = next.indexOf(column);

      if (draggedIndex === -1 || targetIndex === -1) {
        return current;
      }

      next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, draggedColumn);
      return next;
    });

    setDraggedColumn(null);
    setDragOverColumn(null);
  }

  function handleColumnDragEnd() {
    setDraggedColumn(null);
    setDragOverColumn(null);
  }

  const renderHeader = (column: PeopleTableColumn) => {
    const isDropTarget =
      !!draggedColumn && draggedColumn !== column && dragOverColumn === column;
    const isRightAligned = column === "actions";

    const label =
      column === "profile"
        ? "Nombre y perfil"
        : column === "contact"
          ? "Contacto"
          : column === "status"
            ? "Estado"
            : column === "details"
              ? "Responsable y notas"
              : "Acciones";

    return (
      <th
        key={column}
        className={cn(
          "px-6 py-4 transition-colors",
          column === "profile" && "px-8",
          isRightAligned && "px-8 text-right",
          isDropTarget && "bg-[#f8fafc]",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          handleColumnDragOver(column);
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleColumnDrop(column);
        }}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            isRightAligned ? "justify-end" : "justify-between",
          )}
        >
          <span>{label}</span>
          <button
            type="button"
            draggable
            aria-label={`Reordenar columna ${label}`}
            onDragStart={() => handleColumnDragStart(column)}
            onDragEnd={handleColumnDragEnd}
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-md text-[#b0bccd] transition hover:bg-[#eef2f7] hover:text-[#617187]",
              draggedColumn === column && "bg-white text-[#617187] shadow-sm",
            )}
          >
            <GripVertical className="size-3.5" />
          </button>
        </div>
      </th>
    );
  };

  const renderCell = (person: PersonListItem, column: PeopleTableColumn) => {
    const meta = parsePersonNotesMeta(person.notes);
    const displayRole = meta.role || person.primary_role || "";
    const detailSummary = [
      meta.coverage ? `Responsable: ${meta.coverage}` : "",
      meta.notes,
    ]
      .filter(Boolean)
      .join(" · ");
    const cellClassName = cn(
      "px-6 py-5",
      column === "profile" && "px-8",
      column === "actions" && "px-8",
    );

    switch (column) {
      case "profile":
        return (
          <td key={column} className={cellClassName}>
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[#eef2f6] text-sm font-extrabold text-[#64748b]">
                {getInitials(person.full_name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-[var(--foreground)]">
                  {person.full_name}
                </p>
                <p className="truncate text-xs font-medium text-[#70819b]">
                  {displayRole
                    ? getRoleDisplayName(displayRole)
                    : "Sin rol frecuente"}
                </p>
              </div>
            </div>
          </td>
        );
      case "contact":
        return (
          <td key={column} className={cellClassName}>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {person.phone ?? "Sin teléfono"}
            </p>
            <p className="text-xs font-medium text-[#70819b]">
              {person.email ?? "Sin correo"}
            </p>
          </td>
        );
      case "status":
        return (
          <td key={column} className={cellClassName}>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold",
                getStatusBadgeClass(person.assignment_state),
              )}
            >
              <span className="size-1.5 rounded-full" />
              {getAssignmentStateDisplayName(person.assignment_state)}
            </span>
          </td>
        );
      case "details":
        return (
          <td key={column} className={cellClassName}>
            <p className="max-w-[22rem] truncate text-sm font-medium text-[#516173]">
              {detailSummary || "Sin responsable ni notas operativas"}
            </p>
          </td>
        );
      case "actions":
        return (
          <td key={column} className={cellClassName}>
            <div className="flex items-center justify-end">
              {canEdit ? (
                <PersonRowActions
                  personId={person.id}
                  fullName={person.full_name}
                />
              ) : (
                <Button variant="secondary" disabled className="h-9">
                  Solo lectura
                </Button>
              )}
            </div>
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="bg-[#fafbfd] text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
            {columnOrder.map((column) => renderHeader(column))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1f6]">
          {people.map((person) => (
            <tr
              key={person.id}
              className="group transition hover:bg-[#fff8f9]"
            >
              {columnOrder.map((column) => renderCell(person, column))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
