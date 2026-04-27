"use client";

import { useEffect, useState } from "react";
import { Mail, MapPin, MessageCircle, Pencil } from "lucide-react";
import Link from "next/link";

import { togglePersonActiveAction } from "@/app/actions/people";
import {
  getCityIndicator,
  getInitials,
  getRolePresentation,
  getWhatsAppHref,
} from "@/components/people/people-view-helpers";
import { getRoleDisplayName } from "@/lib/display";
import { getPersonRoleValues, parsePersonNotesMeta } from "@/lib/people-notes";
import type { PersonListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type PeopleTableColumn =
  | "profile"
  | "role"
  | "details"
  | "phone"
  | "email"
  | "city"
  | "status";

const PEOPLE_TABLE_COLUMNS_STORAGE_KEY =
  "basket-production.people.table-columns.v2";
const DEFAULT_PEOPLE_TABLE_COLUMNS: PeopleTableColumn[] = [
  "profile",
  "role",
  "details",
  "phone",
  "email",
  "city",
  "status",
];
const PEOPLE_TABLE_LAPTOP_HIDDEN_COLUMNS = new Set<PeopleTableColumn>([
  "details",
  "phone",
  "email",
]);

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

    const label =
      column === "profile"
        ? "Nombre"
        : column === "role"
          ? "Rol"
          : column === "details"
            ? "Responsable"
          : column === "phone"
            ? "Celular"
          : column === "email"
            ? "Correo"
          : column === "city"
            ? "Ciudad"
          : column === "status"
            ? "Estado"
            : "";

    return (
      <th
        key={column}
        draggable
        onDragStart={() => handleColumnDragStart(column)}
        onDragEnd={handleColumnDragEnd}
        className={cn(
          "cursor-grab select-none px-4 py-4 transition-colors active:cursor-grabbing xl:px-5 2xl:px-6",
          PEOPLE_TABLE_LAPTOP_HIDDEN_COLUMNS.has(column) &&
            "hidden 2xl:table-cell",
          column === "profile" && "px-8",
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
        <div className="flex items-center justify-start gap-2">
          <span>{label}</span>
        </div>
      </th>
    );
  };

  const renderCell = (person: PersonListItem, column: PeopleTableColumn) => {
    const meta = parsePersonNotesMeta(person.notes);
    const roles = getPersonRoleValues(meta, person.primary_role);
    const primaryRole = roles[0] ?? "";
    const displayRole = roles.map((role) => getRoleDisplayName(role)).join(", ");
    const rolePresentation = getRolePresentation(primaryRole);
    const city = meta.city || "";
    const cityIndicator = getCityIndicator(city);
    const detailSummary = meta.coverage || "";
    const compactPhone = person.phone?.trim() ?? "";
    const compactEmail = person.email?.trim() ?? "";
    const compactPhoneHref = compactPhone ? getWhatsAppHref(compactPhone) : null;
    const hasCompactContacts = Boolean(compactPhone || compactEmail);
    const cellClassName = cn(
      "px-4 py-4 xl:px-5 2xl:px-6 2xl:py-5",
      PEOPLE_TABLE_LAPTOP_HIDDEN_COLUMNS.has(column) &&
        "hidden 2xl:table-cell",
      column === "profile" && "px-8",
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
                {canEdit ? (
                  <Link
                    href={`/people?edit=${person.id}`}
                    aria-label={`Editar a ${person.full_name}`}
                    title={`Editar a ${person.full_name}`}
                    className="group inline-flex max-w-full items-center gap-1.5 text-[1.05rem] font-extrabold leading-[1.05] text-[var(--foreground)] transition hover:text-[var(--accent)]"
                  >
                    <span className="min-w-0 truncate">{person.full_name}</span>
                    <Pencil className="size-3.5 shrink-0 text-[#94a3b8] transition group-hover:text-[var(--accent)]" />
                  </Link>
                ) : (
                  <p className="truncate text-[1.05rem] font-extrabold leading-[1.05] text-[var(--foreground)]">
                    {person.full_name}
                  </p>
                )}
                {hasCompactContacts ? (
                  <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden text-xs font-medium text-[#70819b] 2xl:hidden">
                    {compactPhone ? (
                      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                        {compactPhoneHref ? (
                          <a
                            href={compactPhoneHref}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Escribir por WhatsApp a ${person.full_name}`}
                            className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a] transition hover:bg-[#dcfce7]"
                          >
                            <MessageCircle className="size-3" />
                          </a>
                        ) : (
                          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#f3f6fa] text-[#94a3b8]">
                            <MessageCircle className="size-3" />
                          </span>
                        )}
                        <span title={compactPhone} className="min-w-0 truncate">
                          {compactPhone}
                        </span>
                      </div>
                    ) : null}
                    {compactPhone && compactEmail ? (
                      <span className="shrink-0 text-[#c2cbd7]">·</span>
                    ) : null}
                    {compactEmail ? (
                      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                        <a
                          href={`mailto:${compactEmail}`}
                          aria-label={`Escribir por correo a ${person.full_name}`}
                          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#4f46e5] transition hover:bg-[#e0e7ff]"
                        >
                          <Mail className="size-3" />
                        </a>
                        <span title={compactEmail} className="min-w-0 truncate">
                          {compactEmail}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 text-xs font-medium text-[#94a3b8] 2xl:hidden">
                    Sin celular ni correo
                  </p>
                )}
              </div>
            </div>
          </td>
        );
      case "phone":
        return (
          <td key={column} className={cellClassName}>
            <div className="flex justify-start">
              <div className="flex items-center gap-2">
                {person.phone ? (
                  <a
                    href={getWhatsAppHref(person.phone) ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Escribir por WhatsApp a ${person.full_name}`}
                    className="inline-flex size-8 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a] transition hover:bg-[#dcfce7]"
                  >
                    <MessageCircle className="size-4" />
                  </a>
                ) : null}
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {person.phone ?? "Sin teléfono"}
                </p>
              </div>
            </div>
          </td>
        );
      case "role":
        return (
          <td key={column} className={cellClassName}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-full",
                  rolePresentation.className,
                )}
              >
                <rolePresentation.Icon className="size-4" />
              </span>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {displayRole || "Sin rol"}
              </p>
            </div>
          </td>
        );
      case "city":
        return (
          <td key={column} className={cellClassName}>
            <div className="flex justify-start">
              <div className="flex items-center gap-2">
                <span
                  title={cityIndicator.label}
                  className="inline-flex size-8 items-center justify-center rounded-full bg-[#f4f7fb] text-sm"
                >
                  {cityIndicator.emoji ? (
                    <span aria-hidden="true">{cityIndicator.emoji}</span>
                  ) : (
                    <MapPin className="size-4 text-[#94a3b8]" />
                  )}
                </span>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {city || "Sin ciudad"}
                </p>
              </div>
            </div>
          </td>
        );
      case "email":
        return (
          <td key={column} className={cellClassName}>
            <div className="flex justify-start">
              <div className="flex items-center gap-2">
                {person.email ? (
                  <a
                    href={`mailto:${person.email}`}
                    aria-label={`Escribir por correo a ${person.full_name}`}
                    className="inline-flex size-8 items-center justify-center rounded-full bg-[#eef2ff] text-[#4f46e5] transition hover:bg-[#e0e7ff]"
                  >
                    <Mail className="size-4" />
                  </a>
                ) : null}
                <p className="text-xs font-medium text-[#70819b]">
                  {person.email ?? "Sin correo"}
                </p>
              </div>
            </div>
          </td>
        );
      case "status":
        return (
          <td key={column} className={cellClassName}>
            <div className="flex justify-start">
              <div className="flex items-center">
                <form action={togglePersonActiveAction}>
                  <input type="hidden" name="personId" value={person.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={person.active ? "off" : "on"}
                  />
                  <button
                    type="submit"
                    role="switch"
                    aria-checked={person.active}
                    aria-label={`${person.active ? "Desactivar" : "Activar"} a ${person.full_name}`}
                    disabled={!canEdit}
                    className={cn(
                      "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
                      person.active
                        ? "border-[#b8e7c7] bg-[#e9f9ee]"
                        : "border-[#e6d8dd] bg-[#f4edf0]",
                      !canEdit && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none absolute left-1 inline-flex size-5 rounded-full bg-white shadow-[0_2px_6px_rgba(15,23,42,0.16)] transition-transform",
                        person.active && "translate-x-5",
                      )}
                    />
                  </button>
                </form>
              </div>
            </div>
          </td>
        );
      case "details":
        return (
          <td key={column} className={cellClassName}>
            <p className="max-w-[22rem] truncate text-sm font-medium text-[#516173]">
              {detailSummary || "Sin responsable asignado"}
            </p>
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
            <tr key={person.id} className="group transition hover:bg-[#fafbfd]">
              {columnOrder.map((column) => renderCell(person, column))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
