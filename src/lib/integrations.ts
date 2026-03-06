import { toCalendarDates } from "@/lib/date";
import type { AssignmentDetail, MatchDetail } from "@/lib/types";
import { buildWhatsAppUrl } from "@/lib/utils";

export function buildGroupName(match: MatchDetail) {
  return `${match.home_team.toUpperCase()} VS ${match.away_team.toUpperCase()}`;
}

export function buildGoogleCalendarLink(match: MatchDetail) {
  const title = `${match.home_team} vs ${match.away_team}`;
  const details = [
    `Competencia: ${match.competition ?? "Sin definir"}`,
    `Modo: ${match.production_mode ?? "Sin definir"}`,
    `Responsable: ${match.owner?.full_name ?? "Sin definir"}`,
    "",
    "Asignaciones:",
    ...match.assignments
      .filter((assignment) => assignment.person)
      .map(
        (assignment) =>
          `${assignment.role.name}: ${assignment.person?.full_name ?? "Pendiente"}`,
      ),
    "",
    `Observaciones: ${match.notes ?? "Sin observaciones"}`,
  ].join("\n");

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set(
    "dates",
    toCalendarDates({
      kickoffAt: match.kickoff_at,
      durationMinutes: match.duration_minutes,
    }),
  );
  url.searchParams.set("details", details);
  url.searchParams.set("location", match.venue ?? "");

  return url.toString();
}

export function buildGroupMessage(match: MatchDetail) {
  const lines = [
    `GRUPO ${buildGroupName(match)}`,
    "",
    `Hora: ${match.kickoff_at}`,
    `Liga: ${match.competition ?? "Sin definir"}`,
    "",
    ...match.assignments
      .filter((assignment) => assignment.person)
      .map((assignment) => {
        const phone = assignment.person?.phone ?? "sin telefono";
        return `${assignment.role.name}: ${assignment.person?.full_name} (${phone})`;
      }),
  ];

  return lines.join("\n");
}

export function getWhatsAppRoster(assignments: AssignmentDetail[]) {
  return assignments
    .filter((assignment) => assignment.person?.phone)
    .map((assignment) => ({
      assignmentId: assignment.id,
      roleName: assignment.role.name,
      personName: assignment.person?.full_name ?? "Sin asignar",
      phone: assignment.person?.phone ?? "",
      href: buildWhatsAppUrl(assignment.person?.phone),
    }));
}
