"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { quickUpdateMatchFlatFieldAction } from "@/app/actions/matches";
import {
  PRODUCTION_MODE_OPTIONS,
  getProductionModeLabel,
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
  redirectTo: string;
};

function getAssignment(match: MatchListItem, roleName: string) {
  return match.assignments.find((assignment) => assignment.role.name === roleName);
}

function getPersonName(match: MatchListItem, roleName: string) {
  const assignment = getAssignment(match, roleName);
  return assignment?.person?.full_name ?? null;
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
  redirectTo,
  placeholder = "-",
  type = "text",
  inputClassName,
}: {
  match: MatchListItem;
  field: string;
  value: string;
  canEdit: boolean;
  redirectTo: string;
  placeholder?: string;
  type?: "text" | "time";
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (!canEdit) {
    return (
      <span title={value || placeholder} className="block truncate">
        {value || placeholder}
      </span>
    );
  }

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <span title={value || placeholder} className="block min-w-0 flex-1 truncate">
          {value || placeholder}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex size-6 shrink-0 items-center justify-center border border-transparent text-[#8a98aa] hover:border-[#d8e0eb] hover:bg-white hover:text-[#1f2937]"
          aria-label={`Editar ${field}`}
          title={`Editar ${field}`}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={quickUpdateMatchFlatFieldAction}>
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input
        ref={inputRef}
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
            setEditing(false);
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
  redirectTo,
  selectClassName,
}: {
  match: MatchListItem;
  field: string;
  value: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  canEdit: boolean;
  redirectTo: string;
  selectClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    if (editing) {
      selectRef.current?.focus();
    }
  }, [editing]);

  if (!canEdit) {
    return (
      <span title={label || "-"} className="block truncate">
        {label || "-"}
      </span>
    );
  }

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <span title={label || "-"} className="block min-w-0 flex-1 truncate">
          {label || "-"}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex size-6 shrink-0 items-center justify-center border border-transparent text-[#8a98aa] hover:border-[#d8e0eb] hover:bg-white hover:text-[#1f2937]"
          aria-label={`Editar ${field}`}
          title={`Editar ${field}`}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={quickUpdateMatchFlatFieldAction}>
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <select
        ref={selectRef}
        name="value"
        defaultValue={value}
        title={label || "-"}
        onChange={() => formRef.current?.requestSubmit()}
        onBlur={() => setEditing(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setEditing(false);
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
  redirectTo,
}: ProductionPlainTableProps) {
  return (
    <div className="h-full min-h-0 overflow-hidden border border-[#d8dee8] bg-[#fbfcfe]">
      <div className="h-full min-h-0 overflow-auto">
        <table className="min-w-[1340px] border-collapse font-mono text-[12px] text-[#1f2937]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[#d8dee8] bg-[#f4f6f9] text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
              <th className="w-[92px] border-r border-[#e1e7f0] px-2 py-2">Fecha</th>
              <th className="w-[96px] border-r border-[#e1e7f0] px-2 py-2">Hora</th>
              <th className="w-[150px] border-r border-[#e1e7f0] px-2 py-2">Liga</th>
              <th className="w-[220px] border-r border-[#e1e7f0] px-2 py-2">Equipo local</th>
              <th className="w-[220px] border-r border-[#e1e7f0] px-2 py-2">Equipo visitante</th>
              <th className="w-[220px] border-r border-[#e1e7f0] px-2 py-2">Sede</th>
              <th className="w-[160px] border-r border-[#e1e7f0] px-2 py-2">Modo</th>
              <th className="w-[150px] border-r border-[#e1e7f0] px-2 py-2">ID producción</th>
              <th className="w-[210px] border-r border-[#e1e7f0] px-2 py-2">Responsable</th>
              <th className="w-[190px] px-2 py-2">Realizador</th>
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
                    <span title={homeTeam} className="block truncate">
                      {homeTeam}
                    </span>
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1.5 font-semibold">
                    <span title={awayTeam} className="block truncate">
                      {awayTeam}
                    </span>
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1">
                    <EditableTextCell
                      match={match}
                      field="venue"
                      value={match.venue ?? ""}
                      canEdit={canEdit}
                      redirectTo={redirectTo}
                      placeholder="Sin sede"
                      inputClassName="w-[12rem]"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1">
                    <EditableSelectCell
                      match={match}
                      field="productionMode"
                      value={getProductionModeLabel(match.production_mode)}
                      label={getProductionModeLabel(match.production_mode) || "Sin definir"}
                      options={[
                        { value: "", label: "Sin definir" },
                        ...PRODUCTION_MODE_OPTIONS.map((option) => ({
                          value: option,
                          label: option,
                        })),
                      ]}
                      canEdit={canEdit}
                      redirectTo={redirectTo}
                      selectClassName="w-[9rem]"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1">
                    <EditableTextCell
                      match={match}
                      field="productionCode"
                      value={match.production_code ?? ""}
                      canEdit={canEdit}
                      redirectTo={redirectTo}
                      placeholder="Sin ID"
                      inputClassName="w-[8.5rem]"
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
                      redirectTo={redirectTo}
                      selectClassName="w-[12rem]"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <span title={getPersonName(match, "Realizador") ?? "TBD"} className="block truncate">
                      {getPersonName(match, "Realizador") ?? "TBD"}
                    </span>
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
