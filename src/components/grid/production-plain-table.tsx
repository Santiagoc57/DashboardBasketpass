"use client";

import { useRef } from "react";

import { quickUpdateMatchFlatFieldAction } from "@/app/actions/matches";
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
  return (
    <div className="h-full min-h-0 overflow-hidden border border-[#d8dee8] bg-[#fbfcfe]">
      <div className="h-full min-h-0 overflow-auto">
        <table className="min-w-[3260px] border-collapse font-mono text-[12px] text-[#1f2937]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[#d8dee8] bg-[#f4f6f9] text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
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
