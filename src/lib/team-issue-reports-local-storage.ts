import type { TeamDirectoryItem } from "@/lib/team-directory";

export const TEAM_ISSUE_REPORTS_STORAGE_KEY = "basket-production-team-issue-reports";
export const TEAM_ISSUE_REPORTS_CHANGED_EVENT = "basket-production-team-issue-reports-changed";

export const TEAM_ISSUE_REASON_OPTIONS = [
  "Escudo incorrecto",
  "Nombre incorrecto",
  "Estadio incorrecto",
  "Liga incorrecta",
  "Responsable incorrecto",
  "Enlace o redes incorrectas",
  "Club ya no existe",
  "Club cambió de liga",
  "Club duplicado",
  "Otro",
] as const;

export type TeamIssueReason = (typeof TEAM_ISSUE_REASON_OPTIONS)[number];

export type TeamIssueReportRecord = {
  id: string;
  team_id: string;
  team_official_name: string;
  team_display_name: string;
  competition: string;
  reason: TeamIssueReason;
  detail: string;
  status: "new";
  created_at: string;
};

function parseTeamIssueReport(value: unknown): TeamIssueReportRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.team_id !== "string" ||
    typeof candidate.team_official_name !== "string" ||
    typeof candidate.team_display_name !== "string" ||
    typeof candidate.competition !== "string" ||
    typeof candidate.reason !== "string" ||
    typeof candidate.detail !== "string" ||
    typeof candidate.status !== "string" ||
    typeof candidate.created_at !== "string"
  ) {
    return null;
  }

  if (!TEAM_ISSUE_REASON_OPTIONS.includes(candidate.reason as TeamIssueReason)) {
    return null;
  }

  return {
    id: candidate.id,
    team_id: candidate.team_id,
    team_official_name: candidate.team_official_name,
    team_display_name: candidate.team_display_name,
    competition: candidate.competition,
    reason: candidate.reason as TeamIssueReason,
    detail: candidate.detail,
    status: "new",
    created_at: candidate.created_at,
  };
}

export function readTeamIssueReports() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(TEAM_ISSUE_REPORTS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);

    return Array.isArray(parsed)
      ? parsed
          .map(parseTeamIssueReport)
          .filter((report): report is TeamIssueReportRecord => report !== null)
      : [];
  } catch {
    return [];
  }
}

export function writeTeamIssueReports(reports: TeamIssueReportRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    TEAM_ISSUE_REPORTS_STORAGE_KEY,
    JSON.stringify(reports),
  );
  window.dispatchEvent(new Event(TEAM_ISSUE_REPORTS_CHANGED_EVENT));
}

export function appendTeamIssueReport(params: {
  team: TeamDirectoryItem;
  reason: TeamIssueReason;
  detail: string;
}) {
  const currentReports = readTeamIssueReports();
  const nextReport: TeamIssueReportRecord = {
    id: `${params.team.id}::${Date.now()}`,
    team_id: params.team.id,
    team_official_name: params.team.official_name,
    team_display_name: params.team.display_name,
    competition: params.team.competition,
    reason: params.reason,
    detail: params.detail.trim(),
    status: "new",
    created_at: new Date().toISOString(),
  };

  writeTeamIssueReports([nextReport, ...currentReports]);
}

export async function submitTeamIssueReport(params: {
  team: TeamDirectoryItem;
  reason: TeamIssueReason;
  detail: string;
}): Promise<{ ok: boolean; error?: string }> {
  appendTeamIssueReport(params);

  try {
    const response = await fetch("/api/team-issue-reports", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        team: {
          id: params.team.id,
          official_name: params.team.official_name,
          display_name: params.team.display_name,
          competition: params.team.competition,
        },
        reason: params.reason,
        detail: params.detail.trim(),
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const error =
        body && typeof body === "object" && "error" in body && typeof body.error === "string"
          ? body.error
          : `No pudimos notificar el reporte (${response.status}).`;
      console.error("[team-issue-report] notification failed", response.status, error);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (error) {
    console.error("[team-issue-report] notification failed", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No pudimos notificar el reporte.",
    };
  }
}
