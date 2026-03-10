import { IncidentsWorkspace } from "@/components/incidents/incidents-workspace";
import { INCIDENT_DIRECTORY } from "@/lib/incidents";
import { getSettingsSnapshot } from "@/lib/settings";

export default async function IncidentsPage() {
  const settings = await getSettingsSnapshot();

  return (
    <IncidentsWorkspace
      incidents={INCIDENT_DIRECTORY}
      hasGeminiKey={settings.hasGeminiKey}
    />
  );
}
