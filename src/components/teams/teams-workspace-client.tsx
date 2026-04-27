"use client";

import { useEffect, useMemo, useState } from "react";

import { TeamCard } from "@/components/teams/team-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  buildTeamResponsibleLookup,
  getTeamResponsibleContact,
} from "@/lib/team-responsibles";
import {
  getCanonicalTeamName,
  getTeamDirectoryCanonicalKey,
  type TeamDirectoryItem,
} from "@/lib/team-directory";
import type { PersonListItem } from "@/lib/types";
import {
  CUSTOM_TEAMS_CHANGED_EVENT,
  readHiddenTeamKeys,
  readCustomTeams,
} from "@/lib/teams-local-storage";

function filterCustomTeams(
  teams: TeamDirectoryItem[],
  params: { query?: string; league?: string },
) {
  const query = params.query?.trim().toLowerCase() ?? "";
  const league = params.league?.trim() ?? "";

  return teams.filter((team) => {
    if (league && !team.competition.split("/").map((part) => part.trim()).includes(league)) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      team.official_name,
      team.display_name,
      team.competition,
      team.stadium ?? "",
      team.manager ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

export function TeamsWorkspaceClient({
  initialTeams,
  people,
  activeLeague,
  query,
  canManageTeams = false,
}: {
  initialTeams: TeamDirectoryItem[];
  people: PersonListItem[];
  activeLeague: string;
  query: string;
  canManageTeams?: boolean;
}) {
  const [customTeams, setCustomTeams] = useState<TeamDirectoryItem[]>([]);
  const [hiddenTeamKeys, setHiddenTeamKeys] = useState<string[]>([]);

  useEffect(() => {
    const syncTeams = () => {
      setCustomTeams(readCustomTeams());
      setHiddenTeamKeys(readHiddenTeamKeys());
    };

    syncTeams();
    window.addEventListener("storage", syncTeams);
    window.addEventListener(CUSTOM_TEAMS_CHANGED_EVENT, syncTeams);

    return () => {
      window.removeEventListener("storage", syncTeams);
      window.removeEventListener(CUSTOM_TEAMS_CHANGED_EVENT, syncTeams);
    };
  }, []);

  const hiddenTeamKeySet = useMemo(() => new Set(hiddenTeamKeys), [hiddenTeamKeys]);

  const visibleCustomTeams = useMemo(
    () =>
      filterCustomTeams(customTeams, { query, league: activeLeague }).filter(
        (team) =>
          !hiddenTeamKeySet.has(
            getTeamDirectoryCanonicalKey({
              officialName: team.official_name,
              displayName: team.display_name,
              competition: team.competition,
            }),
          ),
      ),
    [activeLeague, customTeams, hiddenTeamKeySet, query],
  );

  const mergedTeams = useMemo(() => {
    const mergedByCanonicalKey = new Map<string, TeamDirectoryItem>();

    initialTeams.forEach((team) => {
      const canonicalKey = getTeamDirectoryCanonicalKey({
        officialName: team.official_name,
        displayName: team.display_name,
        competition: team.competition,
      });

      if (hiddenTeamKeySet.has(canonicalKey)) {
        return;
      }

      if (!mergedByCanonicalKey.has(canonicalKey)) {
        mergedByCanonicalKey.set(canonicalKey, team);
      }
    });

    visibleCustomTeams.forEach((team) => {
      const canonicalKey = getTeamDirectoryCanonicalKey({
        officialName: team.official_name,
        displayName: team.display_name,
        competition: team.competition,
      });
      const current = mergedByCanonicalKey.get(canonicalKey);

      if (!current) {
        mergedByCanonicalKey.set(canonicalKey, {
          ...team,
          official_name: getCanonicalTeamName(team.official_name),
          display_name: getCanonicalTeamName(team.display_name),
        });
        return;
      }

      mergedByCanonicalKey.set(canonicalKey, {
        ...current,
        ...team,
        id: current.id,
        slug: current.slug,
        official_name: getCanonicalTeamName(current.official_name),
        display_name: getCanonicalTeamName(team.display_name || current.display_name),
        competition: current.competition,
        incident_count: Math.max(current.incident_count, team.incident_count),
        stadium: team.stadium ?? current.stadium,
        manager: team.manager ?? current.manager,
        website: team.website ?? current.website,
        instagram: team.instagram ?? current.instagram,
        official_url: team.official_url ?? current.official_url,
        logo_data_url: team.logo_data_url ?? current.logo_data_url,
      });
    });

    return Array.from(mergedByCanonicalKey.values());
  }, [hiddenTeamKeySet, initialTeams, visibleCustomTeams]);

  const responsibleLookup = useMemo(
    () => buildTeamResponsibleLookup(people),
    [people],
  );
  const registeredCount = mergedTeams.filter((team) => Boolean(team.manager)).length;
  const incidentCount = mergedTeams.reduce(
    (sum, team) => sum + team.incident_count,
    0,
  );

  if (!mergedTeams.length) {
    return (
      <EmptyState
        title="No encontramos equipos para este filtro"
        description="Prueba otro nombre, cambia de liga o registra un equipo nuevo desde el botón superior."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
        {mergedTeams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            activeLeague={activeLeague || undefined}
            responsibleContact={getTeamResponsibleContact(
              team.official_name,
              team.manager,
              responsibleLookup,
            )}
            canEdit={canManageTeams}
            people={people}
          />
        ))}
      </div>

      <section className="panel-surface grid gap-4 border border-[var(--border)] bg-white p-5 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 xl:p-6">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#94a3b8]">
            Equipos visibles
          </p>
          <p className="mt-2 text-3xl font-black text-[var(--foreground)]">
            {mergedTeams.length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#94a3b8]">
            Ligas activas
          </p>
          <p className="mt-2 text-3xl font-black text-[var(--foreground)]">
            {new Set(mergedTeams.map((team) => team.competition)).size}
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
  );
}
