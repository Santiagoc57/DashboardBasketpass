import { SectionAiAssistant } from "@/components/ai/section-ai-assistant";
import { CreateTeamModal } from "@/components/teams/create-team-modal";
import { PageCanvasTone } from "@/components/layout/page-canvas-tone";
import { SectionPageHeader } from "@/components/layout/section-page-header";
import { TeamsLeagueTabs } from "@/components/teams/teams-league-tabs";
import { TeamsExportButton } from "@/components/teams/teams-export-button";
import { TeamsWorkspaceClient } from "@/components/teams/teams-workspace-client";
import { ToolbarSearchField } from "@/components/ui/toolbar-search-field";
import { getUserContext } from "@/lib/auth";
import { SECTION_COPY } from "@/lib/copy";
import { isCollaboratorLimitedRole } from "@/lib/constants";
import { getPeopleData } from "@/lib/data/dashboard";
import { getSettingsSnapshot } from "@/lib/settings";
import {
  getTeamLeagueCanvasTone,
  getTeamDirectoryData,
  getTeamDirectoryTabs,
  TEAM_DIRECTORY,
} from "@/lib/team-directory";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchValue(
  value: string | string[] | undefined,
  fallback = "",
) {
  return typeof value === "string" ? value : fallback;
}

export default async function TeamsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await getUserContext();
  const query = readSearchValue(resolvedSearchParams.q);
  const activeLeague = readSearchValue(resolvedSearchParams.league);
  const teams = getTeamDirectoryData({ query, league: activeLeague });
  const people = user.userId ? await getPeopleData() : [];
  const canManageTeams = user.canEdit && !isCollaboratorLimitedRole(user.role);
  const settings = await getSettingsSnapshot();
  const tabs = getTeamDirectoryTabs();
  const leagueCanvasTone = activeLeague
    ? getTeamLeagueCanvasTone(activeLeague)
    : null;
  const aiContext = teams.map((team) => ({
    equipo: team.display_name,
    nombre_oficial: team.official_name,
    liga: team.competition,
    estadio: team.stadium ?? "Sin estadio cargado",
    responsable: team.manager ?? "Sin responsable",
    web: team.website ?? "",
    instagram: team.instagram ?? "",
    enlace_oficial: team.official_url ?? "",
    incidencias: team.incident_count,
  }));

  return (
    <div className="space-y-4 md:space-y-10">
      <PageCanvasTone tone={leagueCanvasTone} />

      <SectionPageHeader
        title={SECTION_COPY.teams.title}
        description={SECTION_COPY.teams.description}
        contentClassName="hidden md:block"
        descriptionClassName="hidden md:block"
        actions={
          <>
            <ToolbarSearchField
              action="/teams"
              defaultValue={query}
              placeholder="Buscar equipo, liga o estadio..."
              className="basis-full sm:basis-[20rem] xl:min-w-[20rem] xl:flex-1"
            >
              {activeLeague ? (
                <input type="hidden" name="league" value={activeLeague} />
              ) : null}
            </ToolbarSearchField>

            <div className="hidden md:block">
              <SectionAiAssistant
                section="Equipos"
                title="Consulta el directorio visible"
                description="Pregunta por clubes, responsables, estadios, ligas o incidencias usando solo el directorio visible en esta pantalla."
                placeholder="Ej. ¿Qué equipos de Liga Argentina tienen responsable y cuántas incidencias acumulan?"
                contextLabel="Equipos visibles del directorio actual"
                context={aiContext}
                guidance="Prioriza equipo, liga, estadio, responsable, enlaces oficiales e incidencias. Si el usuario pide comparar equipos, responde en bullets claros."
                examples={[
                  "¿Qué equipos no tienen responsable?",
                  "¿Qué estadio tiene Atenas de Córdoba?",
                  "¿Qué clubes acumulan más incidencias?",
                ]}
                hasGeminiKey={settings.hasGeminiKey}
                buttonVariant="icon"
              />
            </div>

            <div className="hidden md:block">
              <TeamsExportButton
                initialTeams={teams}
                query={query}
                activeLeague={activeLeague}
              />
            </div>

            <div className="hidden md:block">
              <CreateTeamModal
                canEdit={canManageTeams}
                defaultCompetition={activeLeague}
                people={people}
              />
            </div>
          </>
        }
      />

      <TeamsLeagueTabs
        tabs={tabs}
        baseTeams={TEAM_DIRECTORY}
        activeLeague={activeLeague}
        canManageTeams={canManageTeams}
      />

      <TeamsWorkspaceClient
        initialTeams={teams}
        people={people}
        activeLeague={activeLeague}
        query={query}
        canManageTeams={canManageTeams}
      />
    </div>
  );
}
