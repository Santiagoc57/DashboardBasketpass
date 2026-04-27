import {
  ReportsWorkspace,
  type ReportsWorkspaceView,
} from "@/components/reports/reports-workspace";
import { getUserContext } from "@/lib/auth";
import { hasFullDashboardAccessRole } from "@/lib/constants";
import { getReportingWorkspaceData } from "@/lib/data/reporting";
import { getSettingsSnapshot } from "@/lib/settings";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function resolveInitialView(
  value: string | string[] | undefined,
): ReportsWorkspaceView {
  const normalizedValue = typeof value === "string" ? value : "";

  if (
    normalizedValue === "summary" ||
    normalizedValue === "control" ||
    normalizedValue === "incidents"
  ) {
    return normalizedValue;
  }

  return "summary";
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const [settings, reportingData, user] = await Promise.all([
    getSettingsSnapshot(),
    getReportingWorkspaceData(),
    getUserContext(),
  ]);
  const initialView = resolveInitialView(resolvedSearchParams.view);

  return (
    <ReportsWorkspace
      reports={reportingData.reports}
      activities={reportingData.activities}
      incidents={reportingData.incidents}
      hasGeminiKey={settings.hasGeminiKey}
      initialView={initialView}
      canManageEvidence={hasFullDashboardAccessRole(user.role)}
    />
  );
}
