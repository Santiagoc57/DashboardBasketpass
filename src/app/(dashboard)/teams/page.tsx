import Link from "next/link";
import { Filter, Plus, Search } from "lucide-react";

import { SectionAiAssistant } from "@/components/ai/section-ai-assistant";
import { PageCanvasTone } from "@/components/layout/page-canvas-tone";
import { SectionPageHeader } from "@/components/layout/section-page-header";
import { TeamCard } from "@/components/teams/team-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { getSettingsSnapshot } from "@/lib/settings";
import {
  getTeamLeagueAccentColor,
  getTeamLeagueCanvasTone,
  getTeamDirectoryData,
  getTeamDirectoryTabs,
  TEAM_DIRECTORY,
} from "@/lib/team-directory";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchValue(
  value: string | string[] | undefined,
  fallback = "",
) {
  return typeof value === "string" ? value : fallback;
}

function buildTeamsHref(
  params: Record<string, string | string[] | undefined>,
  updates: Record<string, string | undefined>,
) {
  const search = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(params)) {
    if (typeof rawValue === "string" && rawValue) {
      search.set(key, rawValue);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      search.delete(key);
      continue;
    }

    search.set(key, value);
  }

  const query = search.toString();
  return query ? `/teams?${query}` : "/teams";
}

export default async function TeamsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const query = readSearchValue(resolvedSearchParams.q);
  const activeLeague = readSearchValue(resolvedSearchParams.league);
  const teams = getTeamDirectoryData({ query, league: activeLeague });
  const settings = await getSettingsSnapshot();
  const tabs = getTeamDirectoryTabs();
  const leagueAccent = activeLeague
    ? getTeamLeagueAccentColor(activeLeague)
    : null;
  const leagueCanvasTone = activeLeague
    ? getTeamLeagueCanvasTone(activeLeague)
    : null;
  const registeredCount = teams.filter((team) => Boolean(team.manager)).length;
  const incidentCount = teams.reduce(
    (sum, team) => sum + team.incident_count,
    0,
  );
  const aiContext = teams.map((team) => ({
    equipo: team.official_name,
    liga: team.competition,
    estadio: team.stadium ?? "Sin estadio cargado",
    responsable: team.manager ?? "Sin responsable",
    web: team.website ?? "",
    instagram: team.instagram ?? "",
    enlace_oficial: team.official_url ?? "",
    incidencias: team.incident_count,
  }));

  return (
    <div className="space-y-10">
      <PageCanvasTone tone={leagueCanvasTone} />

      <SectionPageHeader
        title="Equipos"
        actions={
          <>
          <form
            action="/teams"
            className="flex flex-1 items-center gap-2 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-sm"
          >
            {activeLeague ? (
              <input type="hidden" name="league" value={activeLeague} />
            ) : null}
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--panel-radius)] bg-[var(--background-soft)] px-3">
              <Search className="size-4 text-[var(--accent)]" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Buscar equipo, liga o estadio..."
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border border-[#f0d9de] bg-white px-4 text-sm font-bold text-[var(--foreground)] transition hover:border-[#efc2cb] hover:bg-[#fff6f8]"
            >
              <Filter className="size-4 text-[var(--accent)]" />
              Filtrar equipos
            </button>
          </form>

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

          <button
            type="button"
            disabled
            title="La carga manual llegará con el módulo de equipos persistidos."
            className="inline-flex h-[52px] items-center gap-2 rounded-[var(--panel-radius)] bg-[var(--accent)] px-5 text-sm font-extrabold text-white opacity-65 shadow-[0_14px_28px_rgba(230,18,56,0.18)]"
          >
            <Plus className="size-4" />
            Registrar equipo
          </button>
          </>
        }
      />

      <div className="flex overflow-x-auto border-b border-[#f0d9de]">
        <Link
          href={buildTeamsHref(resolvedSearchParams, { league: undefined })}
          className={cn(
            "whitespace-nowrap border-b-2 px-6 py-3 text-sm font-bold transition",
            !activeLeague
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[#617187] hover:text-[var(--accent)]",
          )}
        >
          Todos ({TEAM_DIRECTORY.length})
        </Link>
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={buildTeamsHref(resolvedSearchParams, { league: tab.value })}
            style={
              activeLeague === tab.value && leagueAccent
                ? {
                    borderColor: leagueAccent,
                    color: leagueAccent,
                  }
                : undefined
            }
            className={cn(
              "whitespace-nowrap border-b-2 px-6 py-3 text-sm font-bold transition",
              activeLeague === tab.value
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[#617187] hover:text-[var(--accent)]",
            )}
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </div>

      {teams.length ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                activeLeague={activeLeague || undefined}
              />
            ))}
          </div>

          <section className="panel-surface grid gap-4 border border-[var(--border)] bg-[var(--background-soft)] p-6 sm:grid-cols-2 xl:grid-cols-4">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#94a3b8]">
                Equipos visibles
              </p>
              <p className="mt-2 text-3xl font-black text-[var(--foreground)]">
                {teams.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#94a3b8]">
                Ligas activas
              </p>
              <p className="mt-2 text-3xl font-black text-[var(--foreground)]">
                {new Set(teams.map((team) => team.competition)).size}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#94a3b8]">
                Incidencias
              </p>
              <p className="mt-2 text-3xl font-black text-[var(--accent)]">
                {incidentCount}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#94a3b8]">
                Con responsable
              </p>
              <p className="mt-2 text-3xl font-black text-[var(--foreground)]">
                {registeredCount}
              </p>
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          title="No encontramos equipos para esta búsqueda"
          description="Prueba con otra liga o elimina el término de búsqueda para volver al directorio completo."
        />
      )}
    </div>
  );
}
