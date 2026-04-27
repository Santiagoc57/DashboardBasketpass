import { IncidentsWorkspace } from "@/components/incidents/incidents-workspace";
import { getUserContext } from "@/lib/auth";
import { hasFullDashboardAccessRole } from "@/lib/constants";
import { getReportingWorkspaceData } from "@/lib/data/reporting";
import { getSettingsSnapshot } from "@/lib/settings";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchValue(value: string | string[] | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export default async function IncidentsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const query = readSearchValue(resolvedSearchParams.q);
  const [settings, reportingData, user] = await Promise.all([
    getSettingsSnapshot(),
    getReportingWorkspaceData(),
    getUserContext(),
  ]);

  return (
    <IncidentsWorkspace
      incidents={reportingData.incidents}
      hasGeminiKey={settings.hasGeminiKey}
      canManageEvidence={hasFullDashboardAccessRole(user.role)}
      initialQuery={query}
    />
  );
}
