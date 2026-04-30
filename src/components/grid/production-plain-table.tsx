"use client";

import { type Dispatch, type SetStateAction } from "react";
import { Copy, Trash2 } from "lucide-react";

import {
  COMMENTARY_PLAN_OPTIONS,
  normalizeCommentaryPlan,
} from "@/lib/constants";
import { formatMatchDate, formatMatchTime } from "@/lib/date";
import { getTeamDirectoryData, getTeamDisplayName } from "@/lib/team-directory";
import type { MatchListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProductionPlainTableProps = {
  matches: MatchListItem[];
  people: Array<{
    id: string;
    full_name: string;
  }>;
  canEdit: boolean;
  isEditing: boolean;
  drafts: ProductionPlanillaDrafts;
  onDraftsChange: Dispatch<SetStateAction<ProductionPlanillaDrafts>>;
  draftRows: ProductionPlanillaDraftRow[];
  onDraftRowsChange: Dispatch<SetStateAction<ProductionPlanillaDraftRow[]>>;
  selectedMatchIds: string[];
  onSelectedMatchIdsChange: Dispatch<SetStateAction<string[]>>;
  deletedMatchIds: string[];
  onDeletedMatchIdsChange: Dispatch<SetStateAction<string[]>>;
};

export type ProductionPlanillaDrafts = Record<string, Record<string, string>>;
export type ProductionPlanillaDraftRow = {
  id: string;
  fields: Record<string, string>;
};

const ROLE_FIELD_MAP = [
  ["realizadorId", "Realizador"],
  ["graphicsOperatorId", "Operador de Grafica"],
  ["camera1Id", "Camara 1"],
  ["camera2Id", "Camara 2"],
  ["camera3Id", "Camara 3"],
  ["camera4Id", "Camara 4"],
  ["camera5Id", "Camara 5"],
  ["relatorId", "Relator"],
  ["commentator1Id", "Comentario 1"],
  ["commentator2Id", "Comentario 2"],
  ["controlOperatorId", "Operador de Control"],
  ["supportTechId", "Soporte tecnico"],
] as const;

function getAssignment(match: MatchListItem, roleName: string) {
  return match.assignments.find((assignment) => assignment.role.name === roleName);
}

function getPersonName(match: MatchListItem, roleName: string) {
  const assignment = getAssignment(match, roleName);
  return assignment?.person?.full_name ?? null;
}

function getAssignmentLabel(match: MatchListItem, roleName: string) {
  return getPersonName(match, roleName) ?? "-";
}

function getResponsible(match: MatchListItem) {
  return getPersonName(match, "Responsable") ?? match.owner?.full_name ?? "";
}

function getResponsibleId(match: MatchListItem) {
  return getAssignment(match, "Responsable")?.person_id ?? match.owner?.id ?? "";
}

function getAssignedPersonId(match: MatchListItem, roleName: string) {
  return getAssignment(match, roleName)?.person_id ?? "";
}

function getDateInputValue(match: MatchListItem) {
  return formatMatchDate(match.kickoff_at, match.timezone, "yyyy-MM-dd");
}

function getCreateActionHiddenFields(match: MatchListItem) {
  return Object.fromEntries([
    ["date", getDateInputValue(match)],
    ["time", formatMatchTime(match.kickoff_at, match.timezone, "HH:mm")],
    ["timezone", match.timezone],
    ["competition", match.competition ?? ""],
    ["homeTeam", match.home_team],
    ["awayTeam", `${match.away_team} copia`],
    ["venue", match.venue ?? ""],
    ["productionMode", match.production_mode ?? ""],
    ["productionCode", match.production_code ?? ""],
    ["commentaryPlan", match.commentary_plan ?? ""],
    ["transport", match.transport ?? ""],
    ["durationMinutes", String(match.duration_minutes ?? 150)],
    ["status", match.status ?? "Pendiente"],
    ["ownerId", getResponsibleId(match)],
    ["notes", match.notes ?? ""],
    ["realizadorId", getAssignedPersonId(match, "Realizador")],
    ["graphicsOperatorId", getAssignedPersonId(match, "Operador de Grafica")],
    ["camera1Id", getAssignedPersonId(match, "Camara 1")],
    ["camera2Id", getAssignedPersonId(match, "Camara 2")],
    ["camera3Id", getAssignedPersonId(match, "Camara 3")],
    ["camera4Id", getAssignedPersonId(match, "Camara 4")],
    ["camera5Id", getAssignedPersonId(match, "Camara 5")],
    ["relatorId", getAssignedPersonId(match, "Relator")],
    ["commentator1Id", getAssignedPersonId(match, "Comentario 1")],
    ["commentator2Id", getAssignedPersonId(match, "Comentario 2")],
    ["controlOperatorId", getAssignedPersonId(match, "Operador de Control")],
    ["supportTechId", getAssignedPersonId(match, "Soporte tecnico")],
  ] as const);
}

function EditableTextCell({
  match,
  field,
  value,
  canEdit,
  isEditing,
  draftValue,
  isDirty,
  onDraftChange,
  placeholder = "-",
  type = "text",
  inputClassName,
  list,
  displayValue,
}: {
  match: MatchListItem;
  field: string;
  value: string;
  canEdit: boolean;
  isEditing: boolean;
  draftValue: string;
  isDirty: boolean;
  onDraftChange: (match: MatchListItem, field: string, originalValue: string, value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "time";
  inputClassName?: string;
  list?: string;
  displayValue?: string;
}) {
  if (!canEdit || !isEditing) {
    const resolvedValue = displayValue ?? draftValue;

    return (
      <span title={resolvedValue || placeholder} className="block truncate">
        {resolvedValue || placeholder}
      </span>
    );
  }

  return (
    <input
      type={type}
      value={draftValue}
      title={draftValue || placeholder}
      list={list}
      onChange={(event) => onDraftChange(match, field, value, event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      className={cn(
        "h-7 min-w-0 rounded-none border px-1 font-mono text-[12px] text-[#1f2937] outline-none",
        isDirty ? "border-[#f59e0b] bg-[#fff8ed]" : "border-[#94a3b8] bg-white",
        inputClassName,
      )}
    />
  );
}

function EditableSelectCell({
  match,
  field,
  value,
  label,
  options,
  canEdit,
  isEditing,
  draftValue,
  isDirty,
  onDraftChange,
  selectClassName,
}: {
  match: MatchListItem;
  field: string;
  value: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  canEdit: boolean;
  isEditing: boolean;
  draftValue: string;
  isDirty: boolean;
  onDraftChange: (match: MatchListItem, field: string, originalValue: string, value: string) => void;
  selectClassName?: string;
}) {
  const selectedLabel =
    options.find((option) => option.value === draftValue)?.label ?? label;

  if (!canEdit || !isEditing) {
    return (
      <span title={selectedLabel || "-"} className="block truncate">
        {selectedLabel || "-"}
      </span>
    );
  }

  return (
    <select
      value={draftValue}
      title={selectedLabel || "-"}
      onChange={(event) => onDraftChange(match, field, value, event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      className={cn(
        "h-7 min-w-0 rounded-none border px-1 font-mono text-[12px] text-[#1f2937] outline-none",
        isDirty ? "border-[#f59e0b] bg-[#fff8ed]" : "border-[#94a3b8] bg-white",
        selectClassName,
      )}
    >
      {options.map((option) => (
        <option key={option.value || "__empty"} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ProductionPlainTable({
  matches,
  people,
  canEdit,
  isEditing,
  drafts,
  onDraftsChange,
  draftRows,
  onDraftRowsChange,
  selectedMatchIds,
  onSelectedMatchIdsChange,
  deletedMatchIds,
  onDeletedMatchIdsChange,
}: ProductionPlainTableProps) {
  const teamOptions = Array.from(
    new Set(getTeamDirectoryData().map((team) => team.display_name)),
  ).sort((left, right) => left.localeCompare(right, "es"));
  const personOptions = [
    { value: "", label: "-" },
    ...people.map((person) => ({
      value: person.id,
      label: person.full_name,
    })),
  ];

  function getDraftValue(match: MatchListItem, field: string, originalValue: string) {
    return drafts[match.id]?.[field] ?? originalValue;
  }

  function isDraftDirty(match: MatchListItem, field: string) {
    return Object.hasOwn(drafts[match.id] ?? {}, field);
  }

  function updateDraft(
    match: MatchListItem,
    field: string,
    originalValue: string,
    value: string,
  ) {
    onDraftsChange((current) => {
      const next = { ...current };
      const currentFields = { ...(next[match.id] ?? {}) };

      if (value === originalValue) {
        delete currentFields[field];
      } else {
        currentFields[field] = value;
      }

      if (Object.keys(currentFields).length) {
        next[match.id] = currentFields;
      } else {
        delete next[match.id];
      }

      return next;
    });
  }

  function updateDraftRow(rowId: string, field: string, value: string) {
    onDraftRowsChange((current) =>
      current.map((row) =>
        row.id === rowId
          ? { ...row, fields: { ...row.fields, [field]: value } }
          : row,
      ),
    );
  }

  function addBlankRow() {
    onDraftRowsChange((current) => [
      {
        id: `draft-${Date.now()}`,
        fields: {
          date: "",
          time: "",
          timezone: "America/Bogota",
          competition: "",
          homeTeam: "",
          awayTeam: "",
          ownerId: "",
          commentaryPlan: "",
          transport: "",
          notes: "",
          status: "Pendiente",
          durationMinutes: "150",
        },
      },
      ...current,
    ]);
  }

  function copyMatchToDraftRow(match: MatchListItem) {
    onDraftRowsChange((current) => [
      {
        id: `copy-${match.id}-${Date.now()}`,
        fields: {
          ...getCreateActionHiddenFields(match),
          awayTeam: `${match.away_team} copia`,
        },
      },
      ...current,
    ]);
  }

  function removeDraftRow(rowId: string) {
    onDraftRowsChange((current) => current.filter((row) => row.id !== rowId));
  }

  function toggleMatchSelection(matchId: string) {
    onSelectedMatchIdsChange((current) =>
      current.includes(matchId)
        ? current.filter((id) => id !== matchId)
        : [...current, matchId],
    );
  }

  function markMatchForDeletion(matchId: string) {
    onDeletedMatchIdsChange((current) =>
      current.includes(matchId) ? current : [...current, matchId],
    );
    onSelectedMatchIdsChange((current) => current.filter((id) => id !== matchId));
  }

  function markSelectedForDeletion() {
    if (!selectedMatchIds.length) {
      return;
    }

    const confirmed = window.confirm(
      `Vas a marcar ${selectedMatchIds.length} partidos para eliminar. Se borrarán cuando presiones Guardar cambios.`,
    );

    if (!confirmed) {
      return;
    }

    onDeletedMatchIdsChange((current) =>
      Array.from(new Set([...current, ...selectedMatchIds])),
    );
    onSelectedMatchIdsChange([]);
  }

  function renderDraftInput(
    row: ProductionPlanillaDraftRow,
    field: string,
    options?: { type?: "text" | "date" | "time"; list?: string; className?: string },
  ) {
    return (
      <input
        type={options?.type ?? "text"}
        value={row.fields[field] ?? ""}
        list={options?.list}
        onChange={(event) => updateDraftRow(row.id, field, event.target.value)}
        className={cn(
          "h-7 w-full min-w-0 rounded-none border border-[#f59e0b] bg-[#fff8ed] px-1 font-mono text-[12px] font-semibold text-[#1f2937] outline-none",
          options?.className,
        )}
      />
    );
  }

  function renderDraftSelect(
    row: ProductionPlanillaDraftRow,
    field: string,
    options: Array<{ value: string; label: string }>,
  ) {
    return (
      <select
        value={row.fields[field] ?? ""}
        onChange={(event) => updateDraftRow(row.id, field, event.target.value)}
        className="h-7 w-full min-w-0 rounded-none border border-[#f59e0b] bg-[#fff8ed] px-1 font-mono text-[12px] text-[#1f2937] outline-none"
      >
        {options.map((option) => (
          <option key={option.value || "__empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border border-[#d8dee8] bg-[#fbfcfe]">
      {canEdit && isEditing ? (
        <div className="flex items-center justify-between border-b border-[#d8dee8] bg-white px-3 py-2">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#64748b]">
            Acciones de edición
          </p>
          <div className="flex items-center gap-2">
            {selectedMatchIds.length ? (
              <button
                type="button"
                onClick={markSelectedForDeletion}
                className="inline-flex h-8 items-center rounded-full border border-[#ffd7df] bg-[#fff5f7] px-3 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--accent)] hover:bg-[#ffe7ec]"
              >
                Eliminar {selectedMatchIds.length}
              </button>
            ) : null}
            <button
              type="button"
              onClick={addBlankRow}
              className="inline-flex h-8 items-center rounded-full border border-[#d8e0eb] bg-[#f8fafc] px-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#64748b] hover:border-[#f3b5c2] hover:text-[var(--accent)]"
            >
              Añadir fila
            </button>
          </div>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-x-scroll overflow-y-auto">
        <datalist id="production-planilla-team-options">
          {teamOptions.map((team) => (
            <option key={team} value={team} />
          ))}
        </datalist>
        <table className="min-w-[3590px] border-collapse font-mono text-[12px] text-[#1f2937]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[#d8dee8] bg-[#f4f6f9] text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
              {canEdit && isEditing ? (
                <th className="w-[96px] border-r border-[#e1e7f0] px-2 py-2 text-center">
                  Acciones
                </th>
              ) : null}
              <th className="w-[92px] border-r border-[#e1e7f0] px-2 py-2">Fecha</th>
              <th className="w-[82px] border-r border-[#e1e7f0] px-2 py-2">Hora</th>
              <th className="w-[150px] border-r border-[#e1e7f0] px-2 py-2">Liga</th>
              <th className="w-[170px] border-r border-[#e1e7f0] px-2 py-2">Equipo local</th>
              <th className="w-[170px] border-r border-[#e1e7f0] px-2 py-2">Equipo visitante</th>
              <th className="w-[210px] border-r border-[#e1e7f0] px-2 py-2">Responsable en Cancha</th>
              <th className="w-[190px] border-r border-[#e1e7f0] px-2 py-2">Realizador</th>
              <th className="w-[210px] border-r border-[#e1e7f0] px-2 py-2">Operador de Grafica</th>
              <th className="w-[170px] border-r border-[#e1e7f0] px-2 py-2">Camara 1</th>
              <th className="w-[170px] border-r border-[#e1e7f0] px-2 py-2">Camara 2</th>
              <th className="w-[170px] border-r border-[#e1e7f0] px-2 py-2">Camara 3</th>
              <th className="w-[170px] border-r border-[#e1e7f0] px-2 py-2">Camara 4</th>
              <th className="w-[170px] border-r border-[#e1e7f0] px-2 py-2">Camara 5</th>
              <th className="w-[190px] border-r border-[#e1e7f0] px-2 py-2">Relatos/Comentarios</th>
              <th className="w-[170px] border-r border-[#e1e7f0] px-2 py-2">Relator</th>
              <th className="w-[180px] border-r border-[#e1e7f0] px-2 py-2">Comentarista 1</th>
              <th className="w-[180px] border-r border-[#e1e7f0] px-2 py-2">Comentarista 2</th>
              <th className="w-[210px] border-r border-[#e1e7f0] px-2 py-2">Operador de Control</th>
              <th className="w-[180px] border-r border-[#e1e7f0] px-2 py-2">Soporte tecnico</th>
              <th className="w-[180px] border-r border-[#e1e7f0] px-2 py-2">Transporte</th>
              <th className="w-[260px] px-2 py-2">Observacion</th>
            </tr>
          </thead>
          <tbody>
            {canEdit && isEditing
              ? draftRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#f6d58a] bg-[#fff8ed]"
                  >
                    <td className="border-r border-[#f6d58a] px-2 py-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => removeDraftRow(row.id)}
                          aria-label="Quitar fila copiada"
                          title="Quitar fila copiada"
                          className="inline-flex size-6 items-center justify-center rounded-full border border-[#ffd7df] bg-[#fff5f7] text-[var(--accent)] hover:bg-[#ffe7ec]"
                        >
                            <Trash2 className="size-3" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                    <td className="border-r border-[#f6d58a] px-2 py-1">
                      {renderDraftInput(row, "date", { type: "date" })}
                    </td>
                    <td className="border-r border-[#f6d58a] px-2 py-1">
                      {renderDraftInput(row, "time", { type: "time" })}
                    </td>
                    <td className="border-r border-[#f6d58a] px-2 py-1">
                      {renderDraftInput(row, "competition")}
                    </td>
                    <td className="border-r border-[#f6d58a] px-2 py-1 font-semibold">
                      {renderDraftInput(row, "homeTeam", {
                        list: "production-planilla-team-options",
                      })}
                    </td>
                    <td className="border-r border-[#f6d58a] px-2 py-1 font-semibold">
                      {renderDraftInput(row, "awayTeam", {
                        list: "production-planilla-team-options",
                      })}
                    </td>
                    <td className="border-r border-[#f6d58a] px-2 py-1">
                      {renderDraftSelect(row, "ownerId", [
                        { value: "", label: "Sin responsable" },
                        ...people.map((person) => ({
                          value: person.id,
                          label: person.full_name,
                        })),
                      ])}
                    </td>
                    {ROLE_FIELD_MAP.slice(0, 7).map(([field]) => (
                      <td key={field} className="border-r border-[#f6d58a] px-2 py-1">
                        {renderDraftSelect(row, field, personOptions)}
                      </td>
                    ))}
                    <td className="border-r border-[#f6d58a] px-2 py-1">
                      {renderDraftSelect(row, "commentaryPlan", [
                        { value: "", label: "Sin definir" },
                        ...COMMENTARY_PLAN_OPTIONS.map((option) => ({
                          value: option,
                          label: option,
                        })),
                      ])}
                    </td>
                    {ROLE_FIELD_MAP.slice(7).map(([field]) => (
                      <td key={field} className="border-r border-[#f6d58a] px-2 py-1">
                        {renderDraftSelect(row, field, personOptions)}
                      </td>
                    ))}
                    <td className="border-r border-[#f6d58a] px-2 py-1">
                      {renderDraftInput(row, "transport")}
                    </td>
                    <td className="px-2 py-1">
                      {renderDraftInput(row, "notes")}
                    </td>
                  </tr>
                ))
              : null}
            {matches.map((match) => {
              const homeTeam = getTeamDisplayName(match.home_team, match.competition);
              const awayTeam = getTeamDisplayName(match.away_team, match.competition);
              const responsibleId = getResponsibleId(match);
              const responsibleLabel =
                people.find((person) => person.id === responsibleId)?.full_name ??
                getResponsible(match) ??
                "Sin responsable";
              const commentaryPlan = normalizeCommentaryPlan(match.commentary_plan);
              const isDeleted = deletedMatchIds.includes(match.id);
              const isSelected = selectedMatchIds.includes(match.id);

              return (
                <tr
                  key={match.id}
                  className={cn(
                    "border-b border-[#e6ebf2] odd:bg-white even:bg-[#fbfcfe] hover:bg-[#f3f7ff]",
                    isSelected && "bg-[#eff6ff] outline outline-1 outline-[#bfdbfe]",
                    isDeleted && "bg-[#fff1f4] opacity-70 line-through",
                  )}
                >
                  {canEdit && isEditing ? (
                    <td className="border-r border-[#e6ebf2] px-2 py-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDeleted}
                          onChange={() => toggleMatchSelection(match.id)}
                          aria-label="Seleccionar partido"
                          className="size-4 rounded border-[#cbd5e1]"
                        />
                        <button
                          type="button"
                          onClick={() => copyMatchToDraftRow(match)}
                          aria-label="Copiar fila"
                          title="Copiar fila"
                          className="inline-flex size-6 items-center justify-center rounded-full border border-[#d8e0eb] bg-white text-[#64748b] hover:border-[#b7e4c7] hover:text-[#15803d]"
                        >
                          <Copy className="size-3" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => markMatchForDeletion(match.id)}
                          aria-label="Eliminar fila"
                          title="Eliminar fila"
                          className="inline-flex size-6 items-center justify-center rounded-full border border-[#ffd7df] bg-[#fff5f7] text-[var(--accent)] hover:bg-[#ffe7ec]"
                        >
                          <Trash2 className="size-3" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                  <td className="border-r border-[#e6ebf2] px-2 py-1 text-[#64748b]">
                    <EditableTextCell
                      match={match}
                      field="date"
                      value={formatMatchDate(match.kickoff_at, match.timezone, "yyyy-MM-dd")}
                      type="date"
                      canEdit={canEdit}
                      isEditing={isEditing}
                      draftValue={getDraftValue(match, "date", formatMatchDate(match.kickoff_at, match.timezone, "yyyy-MM-dd"))}
                      displayValue={formatMatchDate(match.kickoff_at, match.timezone, "dd/MM/yyyy")}
                      isDirty={isDraftDirty(match, "date")}
                      onDraftChange={updateDraft}
                      inputClassName="w-[5.7rem]"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1">
                    <EditableTextCell
                      match={match}
                      field="time"
                      value={formatMatchTime(match.kickoff_at, match.timezone, "HH:mm")}
                      type="time"
                      canEdit={canEdit}
                      isEditing={isEditing}
                      draftValue={getDraftValue(match, "time", formatMatchTime(match.kickoff_at, match.timezone, "HH:mm"))}
                      isDirty={isDraftDirty(match, "time")}
                      onDraftChange={updateDraft}
                      inputClassName="w-[4.7rem]"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1">
                    <EditableTextCell
                      match={match}
                      field="competition"
                      value={match.competition ?? ""}
                      canEdit={canEdit}
                      isEditing={isEditing}
                      draftValue={getDraftValue(match, "competition", match.competition ?? "")}
                      isDirty={isDraftDirty(match, "competition")}
                      onDraftChange={updateDraft}
                      placeholder="Sin liga"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1 font-semibold">
                    <EditableTextCell
                      match={match}
                      field="homeTeam"
                      value={homeTeam}
                      canEdit={canEdit}
                      isEditing={isEditing}
                      draftValue={getDraftValue(match, "homeTeam", homeTeam)}
                      isDirty={isDraftDirty(match, "homeTeam")}
                      onDraftChange={updateDraft}
                      placeholder="Sin local"
                      list="production-planilla-team-options"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1 font-semibold">
                    <EditableTextCell
                      match={match}
                      field="awayTeam"
                      value={awayTeam}
                      canEdit={canEdit}
                      isEditing={isEditing}
                      draftValue={getDraftValue(match, "awayTeam", awayTeam)}
                      isDirty={isDraftDirty(match, "awayTeam")}
                      onDraftChange={updateDraft}
                      placeholder="Sin visitante"
                      list="production-planilla-team-options"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1">
                    <EditableSelectCell
                      match={match}
                      field="owner"
                      value={responsibleId}
                      label={responsibleLabel}
                      options={[
                        { value: "", label: "Sin responsable" },
                        ...people.map((person) => ({
                          value: person.id,
                          label: person.full_name,
                        })),
                      ]}
                      canEdit={canEdit}
                      isEditing={isEditing}
                      draftValue={getDraftValue(match, "owner", responsibleId)}
                      isDirty={isDraftDirty(match, "owner")}
                      onDraftChange={updateDraft}
                      selectClassName="w-[12rem]"
                    />
                  </td>
                  {[
                    ["realizadorId", "Realizador"],
                    ["graphicsOperatorId", "Operador de Grafica"],
                    ["camera1Id", "Camara 1"],
                    ["camera2Id", "Camara 2"],
                    ["camera3Id", "Camara 3"],
                    ["camera4Id", "Camara 4"],
                    ["camera5Id", "Camara 5"],
                  ].map(([field, roleName]) => (
                    <td key={field} className="border-r border-[#e6ebf2] px-2 py-1">
                      <EditableSelectCell
                        match={match}
                        field={field}
                        value={getAssignedPersonId(match, roleName)}
                        label={getAssignmentLabel(match, roleName)}
                        options={personOptions}
                        canEdit={canEdit}
                        isEditing={isEditing}
                        draftValue={getDraftValue(match, field, getAssignedPersonId(match, roleName))}
                        isDirty={isDraftDirty(match, field)}
                        onDraftChange={updateDraft}
                        selectClassName="w-[10rem]"
                      />
                    </td>
                  ))}
                  <td className="border-r border-[#e6ebf2] px-2 py-1">
                    <EditableSelectCell
                      match={match}
                      field="commentaryPlan"
                      value={commentaryPlan}
                      label={commentaryPlan || "Sin definir"}
                      options={[
                        { value: "", label: "Sin definir" },
                        ...COMMENTARY_PLAN_OPTIONS.map((option) => ({
                          value: option,
                          label: option,
                        })),
                      ]}
                      canEdit={canEdit}
                      isEditing={isEditing}
                      draftValue={getDraftValue(match, "commentaryPlan", commentaryPlan)}
                      isDirty={isDraftDirty(match, "commentaryPlan")}
                      onDraftChange={updateDraft}
                      selectClassName="w-[11rem]"
                    />
                  </td>
                  {[
                    ["relatorId", "Relator"],
                    ["commentator1Id", "Comentario 1"],
                    ["commentator2Id", "Comentario 2"],
                    ["controlOperatorId", "Operador de Control"],
                    ["supportTechId", "Soporte tecnico"],
                  ].map(([field, roleName]) => (
                    <td key={field} className="border-r border-[#e6ebf2] px-2 py-1">
                      <EditableSelectCell
                        match={match}
                        field={field}
                        value={getAssignedPersonId(match, roleName)}
                        label={getAssignmentLabel(match, roleName)}
                        options={personOptions}
                        canEdit={canEdit}
                        isEditing={isEditing}
                        draftValue={getDraftValue(match, field, getAssignedPersonId(match, roleName))}
                        isDirty={isDraftDirty(match, field)}
                        onDraftChange={updateDraft}
                        selectClassName="w-[10rem]"
                      />
                    </td>
                  ))}
                  <td className="border-r border-[#e6ebf2] px-2 py-1">
                    <EditableTextCell
                      match={match}
                      field="transport"
                      value={match.transport ?? ""}
                      canEdit={canEdit}
                      isEditing={isEditing}
                      draftValue={getDraftValue(match, "transport", match.transport ?? "")}
                      isDirty={isDraftDirty(match, "transport")}
                      onDraftChange={updateDraft}
                      placeholder="Sin definir"
                      inputClassName="w-[10rem]"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <EditableTextCell
                      match={match}
                      field="notes"
                      value={match.notes ?? ""}
                      canEdit={canEdit}
                      isEditing={isEditing}
                      draftValue={getDraftValue(match, "notes", match.notes ?? "")}
                      isDirty={isDraftDirty(match, "notes")}
                      onDraftChange={updateDraft}
                      placeholder="-"
                      inputClassName="w-[15rem]"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
