import { quickUpdateMatchFlatFieldAction } from "@/app/actions/matches";
import {
  MATCH_STATUS_OPTIONS,
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

const KEY_ROLES = [
  "Responsable",
  "Realizador",
  "Operador de Control",
  "Relator",
] as const;

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

function getConfirmationSummary(match: MatchListItem) {
  const assigned = match.assignments.filter((assignment) => assignment.person);
  const accepted = assigned.filter(
    (assignment) =>
      assignment.confirmed || assignment.confirmation_status === "accepted",
  ).length;
  const rejected = assigned.filter(
    (assignment) => assignment.confirmation_status === "declined",
  ).length;

  if (!assigned.length) {
    return "Sin asignaciones";
  }

  return rejected
    ? `${accepted}/${assigned.length} confirmadas · ${rejected} rechazo(s)`
    : `${accepted}/${assigned.length} confirmadas`;
}

function getQualitySummary(match: MatchListItem) {
  const missing = [
    !match.venue?.trim() ? "sede" : null,
    !match.production_code?.trim() ? "ID" : null,
    !getResponsible(match) ? "responsable" : null,
    !match.production_mode?.trim() ? "modo" : null,
  ].filter(Boolean);

  return missing.length ? `Falta ${missing.join(", ")}` : "Completo";
}

function getKeyAssignments(match: MatchListItem) {
  return KEY_ROLES.map((role) => {
    const name = getPersonName(match, role);
    return `${role}: ${name || "TBD"}`;
  }).join(" · ");
}

function FlatTextInput({
  match,
  field,
  value,
  type = "text",
  canEdit,
  redirectTo,
  placeholder = "-",
  className,
}: {
  match: MatchListItem;
  field: string;
  value: string;
  type?: "text" | "time";
  canEdit: boolean;
  redirectTo: string;
  placeholder?: string;
  className?: string;
}) {
  if (!canEdit) {
    return (
      <span title={value || placeholder} className={cn("block truncate", className)}>
        {value || placeholder}
      </span>
    );
  }

  return (
    <form action={quickUpdateMatchFlatFieldAction} className="flex items-center gap-1">
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input
        type={type}
        name="value"
        defaultValue={value}
        title={value || placeholder}
        className={cn(
          "h-7 min-w-0 rounded-none border border-transparent bg-transparent px-1 font-mono text-[12px] text-[#1f2937] outline-none hover:border-[#dbe3ee] hover:bg-white focus:border-[#94a3b8] focus:bg-white",
          className,
        )}
      />
      <button
        type="submit"
        className="h-7 border border-[#d8e0eb] bg-white px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#637083] hover:border-[#aab7c8]"
      >
        OK
      </button>
    </form>
  );
}

function FlatSelect({
  match,
  field,
  value,
  options,
  canEdit,
  redirectTo,
  className,
}: {
  match: MatchListItem;
  field: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  canEdit: boolean;
  redirectTo: string;
  className?: string;
}) {
  if (!canEdit) {
    return (
      <span title={value || "-"} className={cn("block truncate", className)}>
        {value || "-"}
      </span>
    );
  }

  return (
    <form action={quickUpdateMatchFlatFieldAction} className="flex items-center gap-1">
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <select
        name="value"
        defaultValue={value}
        title={value || "-"}
        className={cn(
          "h-7 min-w-0 rounded-none border border-transparent bg-transparent px-1 font-mono text-[12px] text-[#1f2937] outline-none hover:border-[#dbe3ee] hover:bg-white focus:border-[#94a3b8] focus:bg-white",
          className,
        )}
      >
        {options.map((option) => (
          <option key={option.value || "__empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-7 border border-[#d8e0eb] bg-white px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#637083] hover:border-[#aab7c8]"
      >
        OK
      </button>
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
    <div className="overflow-hidden border border-[#d8dee8] bg-[#fbfcfe]">
      <div className="overflow-x-auto">
        <table className="min-w-[1680px] border-collapse font-mono text-[12px] text-[#1f2937]">
          <thead>
            <tr className="border-b border-[#d8dee8] bg-[#f4f6f9] text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
              <th className="w-[92px] border-r border-[#e1e7f0] px-2 py-2">Fecha</th>
              <th className="w-[96px] border-r border-[#e1e7f0] px-2 py-2">Hora</th>
              <th className="w-[150px] border-r border-[#e1e7f0] px-2 py-2">Liga</th>
              <th className="w-[270px] border-r border-[#e1e7f0] px-2 py-2">Partido</th>
              <th className="w-[210px] border-r border-[#e1e7f0] px-2 py-2">Sede</th>
              <th className="w-[150px] border-r border-[#e1e7f0] px-2 py-2">Modo</th>
              <th className="w-[150px] border-r border-[#e1e7f0] px-2 py-2">ID producción</th>
              <th className="w-[190px] border-r border-[#e1e7f0] px-2 py-2">Responsable</th>
              <th className="w-[180px] border-r border-[#e1e7f0] px-2 py-2">Realizador</th>
              <th className="w-[340px] border-r border-[#e1e7f0] px-2 py-2">Asignaciones clave</th>
              <th className="w-[190px] border-r border-[#e1e7f0] px-2 py-2">Confirmaciones</th>
              <th className="w-[135px] border-r border-[#e1e7f0] px-2 py-2">Estado</th>
              <th className="w-[210px] px-2 py-2">Calidad de datos</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const matchLabel = `${getTeamDisplayName(match.home_team, match.competition)} vs ${getTeamDisplayName(match.away_team, match.competition)}`;
              const quality = getQualitySummary(match);

              return (
                <tr
                  key={match.id}
                  className="border-b border-[#e6ebf2] odd:bg-white even:bg-[#fbfcfe] hover:bg-[#f3f7ff]"
                >
                  <td className="border-r border-[#e6ebf2] px-2 py-1.5 text-[#64748b]">
                    {formatMatchDate(match.kickoff_at, match.timezone, "dd/MM/yyyy")}
                  </td>
                  <td className="border-r border-[#e6ebf2] px-1 py-1">
                    <FlatTextInput
                      match={match}
                      field="time"
                      value={formatMatchTime(match.kickoff_at, match.timezone, "HH:mm")}
                      type="time"
                      canEdit={canEdit}
                      redirectTo={redirectTo}
                      className="w-[4.7rem]"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                    <span title={getTeamLeagueLabel(match.competition ?? "Sin liga")} className="block truncate">
                      {getTeamLeagueLabel(match.competition ?? "Sin liga")}
                    </span>
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1.5 font-semibold">
                    <span title={matchLabel} className="block truncate">
                      {matchLabel}
                    </span>
                  </td>
                  <td className="border-r border-[#e6ebf2] px-1 py-1">
                    <FlatTextInput
                      match={match}
                      field="venue"
                      value={match.venue ?? ""}
                      canEdit={canEdit}
                      redirectTo={redirectTo}
                      placeholder="Sin sede"
                      className="w-[10.5rem]"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-1 py-1">
                    <FlatSelect
                      match={match}
                      field="productionMode"
                      value={getProductionModeLabel(match.production_mode)}
                      options={[
                        { value: "", label: "Sin definir" },
                        ...PRODUCTION_MODE_OPTIONS.map((option) => ({
                          value: option,
                          label: option,
                        })),
                      ]}
                      canEdit={canEdit}
                      redirectTo={redirectTo}
                      className="w-[8.5rem]"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-1 py-1">
                    <FlatTextInput
                      match={match}
                      field="productionCode"
                      value={match.production_code ?? ""}
                      canEdit={canEdit}
                      redirectTo={redirectTo}
                      placeholder="Sin ID"
                      className="w-[8.2rem]"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-1 py-1">
                    <FlatSelect
                      match={match}
                      field="owner"
                      value={getResponsibleId(match)}
                      options={[
                        { value: "", label: "Sin responsable" },
                        ...people.map((person) => ({
                          value: person.id,
                          label: person.full_name,
                        })),
                      ]}
                      canEdit={canEdit}
                      redirectTo={redirectTo}
                      className="w-[10.7rem]"
                    />
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                    <span title={getPersonName(match, "Realizador") ?? "TBD"} className="block truncate">
                      {getPersonName(match, "Realizador") ?? "TBD"}
                    </span>
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                    <span title={getKeyAssignments(match)} className="block truncate">
                      {getKeyAssignments(match)}
                    </span>
                  </td>
                  <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                    <span title={getConfirmationSummary(match)} className="block truncate">
                      {getConfirmationSummary(match)}
                    </span>
                  </td>
                  <td className="border-r border-[#e6ebf2] px-1 py-1">
                    <FlatSelect
                      match={match}
                      field="status"
                      value={match.status}
                      options={MATCH_STATUS_OPTIONS.map((option) => ({
                        value: option,
                        label: option,
                      }))}
                      canEdit={canEdit}
                      redirectTo={redirectTo}
                      className="w-[7.6rem]"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <span
                      title={quality}
                      className={cn(
                        "block truncate",
                        quality === "Completo" ? "text-[#047857]" : "text-[#b45309]",
                      )}
                    >
                      {quality}
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
