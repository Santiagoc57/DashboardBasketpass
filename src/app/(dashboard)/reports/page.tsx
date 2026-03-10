import { ReportsWorkspace } from "@/components/reports/reports-workspace";
import { REPORT_ACTIVITY_LOG, REPORT_DIRECTORY } from "@/lib/reports";
import { getSettingsSnapshot } from "@/lib/settings";

export default async function ReportsPage() {
  const settings = await getSettingsSnapshot();

  return (
    <ReportsWorkspace
      reports={REPORT_DIRECTORY}
      activities={REPORT_ACTIVITY_LOG}
      hasGeminiKey={settings.hasGeminiKey}
    />
  );
}
