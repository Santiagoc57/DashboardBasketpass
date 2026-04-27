import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TeamIssueReportRow } from "@/lib/database.types";

const TEAM_ISSUE_REPORTS_SELECT =
  "id, team_id, team_official_name, team_display_name, competition, reason, detail, status, reporter_profile_id, reporter_name, reporter_email, resolved_at, resolved_by, created_at, updated_at, created_by, updated_by";

export function isMissingTeamIssueReportsTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode =
    "code" in error && typeof error.code === "string" ? error.code : "";
  const maybeMessage =
    "message" in error && typeof error.message === "string" ? error.message : "";

  return (
    maybeCode === "42P01" ||
    maybeCode === "PGRST205" ||
    maybeMessage.includes("team_issue_reports") ||
    maybeMessage.includes("schema cache") ||
    maybeMessage.includes("Could not find the table")
  );
}

export async function getTeamIssueReportsSnapshot(limit = 12) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("team_issue_reports")
    .select(TEAM_ISSUE_REPORTS_SELECT)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (result.error) {
    if (isMissingTeamIssueReportsTableError(result.error)) {
      return {
        reports: [] as TeamIssueReportRow[],
        missingTable: true,
      };
    }

    throw result.error;
  }

  return {
    reports: (result.data ?? []) as TeamIssueReportRow[],
    missingTable: false,
  };
}
