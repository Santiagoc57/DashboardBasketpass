import { ReportsWorkspace } from "@/components/reports/reports-workspace";
import { INCIDENT_DIRECTORY } from "@/lib/incidents";
import { REPORT_ACTIVITY_LOG, REPORT_DIRECTORY } from "@/lib/reports";
import { getSettingsSnapshot } from "@/lib/settings";

export default async function ReportsPage() {
  const settings = await getSettingsSnapshot();

  return (
    <ReportsWorkspace
      reports={REPORT_DIRECTORY}
      activities={REPORT_ACTIVITY_LOG}
      incidents={INCIDENT_DIRECTORY}
      hasGeminiKey={settings.hasGeminiKey}
    />
  );
}
