"use client";

import { useRef, useState } from "react";

import {
  createMatchAction,
  deleteMatchAction,
  quickUpdateMatchFlatFieldAction,
} from "@/app/actions/matches";
import {
  COMMENTARY_PLAN_OPTIONS,
  normalizeCommentaryPlan,
} from "@/lib/constants";
import { formatMatchDate, formatMatchTime } from "@/lib/date";
import { getTeamDisplayName, getTeamLeagueLabel } from "@/lib/team-directory";
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
  redirectTo: string;
};

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
  return [
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
  ] as const;
}

function EditableTextCell({
  match,
  field,
  value,
  canEdit,
  isEditing,
  redirectTo,
  placeholder = "-",
  type = "text",
  inputClassName,
}: {
  match: MatchListItem;
  field: string;
  value: string;
  canEdit: boolean;
  isEditing: boolean;
  redirectTo: string;
  placeholder?: string;
  type?: "text" | "time";
  inputClassName?: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);

  if (!canEdit || !isEditing) {
    return (
      <span title={value || placeholder} className="block truncate">
        {value || placeholder}
      </span>
    );
  }

  return (
    <form ref={formRef} action={quickUpdateMatchFlatFieldAction}>
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input
        type={type}
        name="value"
        defaultValue={value}
        title={value || placeholder}
        onBlur={() => formRef.current?.requestSubmit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            formRef.current?.requestSubmit();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={cn(
          "h-7 min-w-0 rounded-none border border-[#94a3b8] bg-white px-1 font-mono text-[12px] text-[#1f2937] outline-none",
          inputClassName,
        )}
      />
    </form>
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
  redirectTo,
  selectClassName,
}: {
  match: MatchListItem;
  field: string;
  value: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  canEdit: boolean;
  isEditing: boolean;
  redirectTo: string;
  selectClassName?: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);

  if (!canEdit || !isEditing) {
    return (
      <span title={label || "-"} className="block truncate">
        {label || "-"}
      </span>
    );
  }

  return (
    <form ref={formRef} action={quickUpdateMatchFlatFieldAction}>
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <select
        name="value"
        defaultValue={value}
        title={label || "-"}
        onChange={() => formRef.current?.requestSubmit()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={cn(
          "h-7 min-w-0 rounded-none border border-[#94a3b8] bg-white px-1 font-mono text-[12px] text-[#1f2937] outline-none",
          selectClassName,
        )}
      >
        {options.map((option) => (
          <option key={option.value || "__empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}

export function ProductionPlainTable({
  matches,
  people,
  canEdit,
  isEditing,
  redirectTo,
}: ProductionPlainTableProps) {
  const [showNewRow, setShowNewRow] = useState(false);

  return (
    <div className="h-full min-h-0 overflow-hidden border border-[#d8dee8] bg-[#fbfcfe]">
      {canEdit && isEditing ? (
        <div className="flex items-center justify-between border-b border-[#d8dee8] bg-white px-3 py-2">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#64748b]">
            Acciones de edición
          </p>
          <button
            type="button"
            onClick={() => setShowNewRow((current) => !current)}
            className="inline-flex h-8 items-center rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-[#f8fafc] px-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#64748b] hover:border-[#f3b5c2] hover:text-[var(--accent)]"
          >
            {showNewRow ? "Cancelar nueva fila" : "Añadir fila"}
          </button>
        </div>
      ) : null}
      <div className="h-full min-h-0 overflow-auto">
        <table className="min-w-[3410px] border-collapse font-mono text-[12px] text-[#1f2937]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[#d8dee8] bg-[#f4f6f9] text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
              {canEdit && isEditing ? (
                <th className="w-[150px] border-r border-[#e1e7f0] px-2 py-2">
                  Acciones
                </th>
              ) : null}
              <th className="w-[92px] border-r border-[#e1e7f0] px-2 py-2">Fecha</th>
              <th className="w-[82px] border-r border-[#e1e7f0] px-2 py-2">Hora</th>
              <th className="w-[150px] border-r border-[#e1e7f0] px-2 py-2">Liga</th>
              <th className="w-[290px] border-r border-[#e1e7f0] px-2 py-2">Produccion</th>
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
            {canEdit && isEditing && showNewRow ? (
              <tr className="border-b border-[#d8dee8] bg-[#fffdf7]">
                <td className="border-r border-[#e6ebf2] px-2 py-1">
                  <button
                    type="submit"
                    form="production-planilla-new-row"
                    className="h-8 rounded-[var(--panel-radius)] bg-[var(--accent)] px-3 text-[11px] font-black uppercase tracking-[0.12em] text-white"
                  >
                    Crear
                  </button>
                </td>
                <td colSpan={20} className="px-2 py-1">
                  <form
                    id="production-planilla-new-row"
                    action={createMatchAction}
                    onSubmit={(event) => {
                      const confirmed = window.confirm(
                        "Vas a crear una nueva fila en la grilla de producción. Revisa fecha, hora y equipos antes de continuar.",
                      );

                      if (!confirmed) {
                        event.preventDefault();
                      }
                    }}
                    className="grid min-w-[980px] grid-cols-[120px_90px_160px_220px_220px_140px_minmax(220px,1fr)] gap-2"
                  >
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <input type="hidden" name="timezone" value="America/Bogota" />
                    <input type="hidden" name="durationMinutes" value="150" />
                    <input type="hidden" name="status" value="Pendiente" />
                    <input type="hidden" name="productionMode" value="" />
                    <input
                      type="date"
                      name="date"
                      required
                      className="h-8 border border-[#94a3b8] bg-white px-2"
                    />
                    <input
                      type="time"
                      name="time"
                      required
                      className="h-8 border border-[#94a3b8] bg-white px-2"
                    />
                    <input
                      name="competition"
                      placeholder="Liga"
                      className="h-8 border border-[#94a3b8] bg-white px-2"
                    />
                    <input
                      name="homeTeam"
                      required
                      placeholder="Local"
                      className="h-8 border border-[#94a3b8] bg-white px-2"
                    />
                    <input
                      name="awayTeam"
                      required
                      placeholder="Visitante"
                      className="h-8 border border-[#94a3b8] bg-white px-2"
                    />
                    <select
                      name="ownerId"
                      className="h-8 border border-[#94a3b8] bg-white px-2"
                    >
                      <option value="">Responsable</option>
                      {people.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.full_name}
                        </option>
                      ))}
                    </select>
                    <input
                      name="notes"
                      placeholder="Observacion"
                      className="h-8 border border-[#94a3b8] bg-white px-2"
                    />
                  </form>
                </td>
              </tr>
            ) : null}
            {matches.map((match) => {
              const homeTeam = getTeamDisplayName(match.home_team, match.competition);
              const awayTeam = getTeamDisplayName(match.away_team, match.competition);
              const responsibleId = getResponsibleId(match);
              const responsibleLabel =
                people.find((person) => person.id === responsibleId)?.full_name ??
                getResponsible(match) ??
                "Sin responsable";
              const productionLabel = `${homeTeam} vs ${awayTeam}`;
              const commentaryPlan = normalizeCommentaryPlan(match.commentary_plan);

              return (
                <tr
                  key={match.id}
                  className="border-b border-[#e6ebf2] odd:bg-white even:bg-[#fbfcfe] hover:bg-[#f3f7ff]"
                >
                  {canEdit && isEditing ? (
                    <td className="border-r border-[#e6ebf2] px-2 py-1">
                      <div className="flex items-center gap-1.5">
                        <form
                          action={createMatchAction}
                          onSubmit={(event) => {
                            const confirmed = window.confirm(
                              "Vas a copiar esta fila y crear un nuevo partido con la misma información base. Podrás ajustar la copia después de crearla.",
                            );

                            if (!confirmed) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="redirectTo" value={redirectTo} />
                          {getCreateActionHiddenFields(match).map(([name, value]) => (
                            <input key={name} type="hidden" name={name} value={value} />
                          ))}
                          <button
                            type="submit"
                            className="h-7 rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white px-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#64748b] hover:border-[#b7e4c7] hover:text-[#15803d]"
                          >
                            Copiar
                          </button>
                        </form>
                        <form
                          action={deleteMatchAction}
                          onSubmit={(event) => {
                            const confirmed = window.confirm(
                              "Vas a eliminar esta fila de la grilla de producción. Esta acción puede afectar asignaciones, reportes y vistas relacionadas. ¿Quieres continuar?",
                            );

                            if (!confirmed) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="matchId" value={match.id} />
                          <input type="hidden" name="redirectTo" value={redirectTo} />
                          <button
                            type="submit"
                            className="h-7 rounded-[var(--panel-radius)] border border-[#ffd7df] bg-[#fff5f7] px-2 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--accent)] hover:bg-[#ffe7ec]"
                          >
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </td>
                  ) : null}
                  <td className="border-r border-[#e6ebf2] px-2 py-1.5 text-[#64748b]">
                    {formatMatchDate(match.kickoff_at, match.timezone, "dd/MM/yyyy")}
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1">
                    <EditableTextCell
                      match={match}
                      field="time"
                      value={formatMatchTime(match.kickoff_at, match.timezone, "HH:mm")}
                      type="time"
                      canEdit={canEdit}
                      isEditing={isEditing}
                      redirectTo={redirectTo}
                      inputClassName="w-[4.7rem]"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                    <span title={getTeamLeagueLabel(match.competition ?? "Sin liga")} className="block truncate">
                      {getTeamLeagueLabel(match.competition ?? "Sin liga")}
                    </span>
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1.5 font-semibold">
                    <span title={productionLabel} className="block truncate">
                      {productionLabel}
                    </span>
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
                      redirectTo={redirectTo}
                      selectClassName="w-[12rem]"
                    />
                  </td>
                  {[
                    "Realizador",
                    "Operador de Grafica",
                    "Camara 1",
                    "Camara 2",
                    "Camara 3",
                    "Camara 4",
                    "Camara 5",
                  ].map((roleName) => (
                    <td key={roleName} className="border-r border-[#e6ebf2] px-2 py-1.5">
                      <span title={getAssignmentLabel(match, roleName)} className="block truncate">
                        {getAssignmentLabel(match, roleName)}
                      </span>
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
                      redirectTo={redirectTo}
                      selectClassName="w-[11rem]"
                    />
                  </td>
                  {[
                    ["Relator", "Relator"],
                    ["Comentarista 1", "Comentario 1"],
                    ["Comentarista 2", "Comentario 2"],
                    ["Operador de Control", "Operador de Control"],
                    ["Soporte tecnico", "Soporte tecnico"],
                  ].map(([label, roleName]) => (
                    <td key={label} className="border-r border-[#e6ebf2] px-2 py-1.5">
                      <span title={getAssignmentLabel(match, roleName)} className="block truncate">
                        {getAssignmentLabel(match, roleName)}
                      </span>
                    </td>
                  ))}
                  <td className="border-r border-[#e6ebf2] px-2 py-1">
                    <EditableTextCell
                      match={match}
                      field="transport"
                      value={match.transport ?? ""}
                      canEdit={canEdit}
                      isEditing={isEditing}
                      redirectTo={redirectTo}
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
                      redirectTo={redirectTo}
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
