import {
  ReportsWorkspace,
  type ReportsWorkspaceView,
} from "@/components/reports/reports-workspace";
import { INCIDENT_DIRECTORY } from "@/lib/incidents";
import { REPORT_ACTIVITY_LOG, REPORT_DIRECTORY } from "@/lib/reports";
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
  const settings = await getSettingsSnapshot();
  const initialView = resolveInitialView(resolvedSearchParams.view);

  return (
    <ReportsWorkspace
      reports={REPORT_DIRECTORY}
      activities={REPORT_ACTIVITY_LOG}
      incidents={INCIDENT_DIRECTORY}
      hasGeminiKey={settings.hasGeminiKey}
      initialView={initialView}
    />
  );
}
