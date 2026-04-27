"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRightLeft, Copy, Pencil, X } from "lucide-react";

import { ClientTeamLogoMark } from "@/components/team-logo-mark-client";
import { CreateTeamModal } from "@/components/teams/create-team-modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  getCanonicalTeamName,
  getTeamDirectoryCanonicalKey,
  getTeamLeagueAccentColor,
  splitTeamCompetitions,
  type TeamDirectoryItem,
} from "@/lib/team-directory";
import {
  buildCustomTeamId,
  CUSTOM_TEAMS_CHANGED_EVENT,
  readCustomTeams,
  readHiddenTeamKeys,
  slugifyTeamValue,
  writeCustomTeams,
  writeHiddenTeamKeys,
} from "@/lib/teams-local-storage";
import { cn } from "@/lib/utils";

type TeamLeagueTab = {
  value: string;
  label: string;
  count: number;
};

function getCanonicalKey(team: Pick<TeamDirectoryItem, "official_name" | "display_name" | "competition">) {
  return getTeamDirectoryCanonicalKey({
    officialName: team.official_name,
    displayName: team.display_name,
    competition: team.competition,
  });
}

function sortTeams(teams: TeamDirectoryItem[], tabOrder: string[]) {
  return [...teams].sort((left, right) => {
    const leftLeague = splitTeamCompetitions(left.competition)[0] ?? left.competition;
    const rightLeague = splitTeamCompetitions(right.competition)[0] ?? right.competition;
    const leftIndex = tabOrder.indexOf(leftLeague);
    const rightIndex = tabOrder.indexOf(rightLeague);

    if (leftIndex !== rightIndex) {
      return (
        (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
        (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
      );
    }

    return left.display_name.localeCompare(right.display_name, "es");
  });
}

function buildDerivedTeam(source: TeamDirectoryItem, competition: string): TeamDirectoryItem {
  const trimmedCompetition = competition.trim();

  return {
    ...source,
    id: buildCustomTeamId(source.official_name, trimmedCompetition),
    slug: slugifyTeamValue(`${source.official_name}-${trimmedCompetition}`),
    competition: trimmedCompetition,
  };
}

function stripCopySuffix(value: string) {
  return value.replace(/\s+\(Copia(?:\s+\d+)?\)$/i, "").trim();
}

function buildDuplicatedTeam(
  source: TeamDirectoryItem,
  competition: string,
  existingCanonicalKeys: Set<string>,
): TeamDirectoryItem {
  const trimmedCompetition = competition.trim();
  const baseOfficialName = stripCopySuffix(source.official_name);
  const baseDisplayName = stripCopySuffix(source.display_name);
  let copyNumber = 1;

  while (true) {
    const suffix = copyNumber === 1 ? " (Copia)" : ` (Copia ${copyNumber})`;
    const duplicatedTeam: TeamDirectoryItem = {
      ...source,
      id: buildCustomTeamId(`${baseOfficialName}${suffix}`, trimmedCompetition),
      slug: slugifyTeamValue(`${baseOfficialName}${suffix}-${trimmedCompetition}`),
      official_name: `${baseOfficialName}${suffix}`,
      display_name: `${baseDisplayName}${suffix}`,
      competition: trimmedCompetition,
    };

    if (!existingCanonicalKeys.has(getCanonicalKey(duplicatedTeam))) {
      return duplicatedTeam;
    }

    copyNumber += 1;
  }
}

function joinCompetitions(leagues: string[]) {
  return Array.from(new Set(leagues.map((league) => league.trim()).filter(Boolean))).join(" / ");
}

function mergeDirectoryTeams(
  baseTeams: TeamDirectoryItem[],
  customTeams: TeamDirectoryItem[],
  hiddenKeys: string[],
) {
  const hiddenKeySet = new Set(hiddenKeys);
  const mergedByCanonicalKey = new Map<string, TeamDirectoryItem>();

  baseTeams.forEach((team) => {
    const canonicalKey = getCanonicalKey(team);

    if (hiddenKeySet.has(canonicalKey)) {
      return;
    }

    mergedByCanonicalKey.set(canonicalKey, {
      ...team,
      official_name: getCanonicalTeamName(team.official_name),
      display_name: getCanonicalTeamName(team.display_name),
    });
  });

  customTeams.forEach((team) => {
    const canonicalKey = getCanonicalKey(team);

    if (hiddenKeySet.has(canonicalKey)) {
      return;
    }

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
      official_name: getCanonicalTeamName(current.official_name),
      display_name: getCanonicalTeamName(team.display_name || current.display_name),
      incident_count: Math.max(current.incident_count, team.incident_count),
    });
  });

  return Array.from(mergedByCanonicalKey.values());
}

export function TeamsLeagueTabs({
  tabs,
  baseTeams,
  activeLeague,
  canManageTeams,
}: {
  tabs: TeamLeagueTab[];
  baseTeams: TeamDirectoryItem[];
  activeLeague: string;
  canManageTeams: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customTeams, setCustomTeams] = useState<TeamDirectoryItem[]>([]);
  const [hiddenTeamKeys, setHiddenTeamKeys] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetLeagueByTeam, setTargetLeagueByTeam] = useState<Record<string, string>>({});
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const tabOrder = useMemo(() => tabs.map((tab) => tab.value), [tabs]);

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

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!feedbackMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedbackMessage("");
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [feedbackMessage]);

  const mergedTeams = useMemo(
    () => sortTeams(mergeDirectoryTeams(baseTeams, customTeams, hiddenTeamKeys), tabOrder),
    [baseTeams, customTeams, hiddenTeamKeys, tabOrder],
  );
  const visibleTabs = useMemo(() => {
    const counts = mergedTeams.reduce<Map<string, number>>((map, team) => {
      splitTeamCompetitions(team.competition).forEach((league) => {
        map.set(league, (map.get(league) ?? 0) + 1);
      });
      return map;
    }, new Map());

    return tabs.map((tab) => ({
      ...tab,
      count: counts.get(tab.value) ?? 0,
    }));
  }, [mergedTeams, tabs]);
  const mergedCanonicalKeys = useMemo(
    () => new Set(mergedTeams.map((team) => getCanonicalKey(team))),
    [mergedTeams],
  );
  const leagueTeams = useMemo(
    () =>
      activeLeague
        ? mergedTeams.filter((team) => splitTeamCompetitions(team.competition).includes(activeLeague))
        : [],
    [activeLeague, mergedTeams],
  );
  const targetLeagueOptions = useMemo(() => visibleTabs, [visibleTabs]);
  const leagueAccent = activeLeague ? getTeamLeagueAccentColor(activeLeague) : undefined;

  function buildHref(updates: Record<string, string | undefined>) {
    const nextSearch = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        nextSearch.delete(key);
        return;
      }

      nextSearch.set(key, value);
    });

    const query = nextSearch.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function removeTeamsByCanonicalKeys(teams: TeamDirectoryItem[], canonicalKeys: Set<string>) {
    return teams.filter((team) => !canonicalKeys.has(getCanonicalKey(team)));
  }

  function handleCopy(team: TeamDirectoryItem) {
    const sourceKey = getCanonicalKey(team);
    const targetLeague = targetLeagueByTeam[sourceKey]?.trim() ?? "";

    if (!targetLeague) {
      return;
    }

    const currentCustomTeams = readCustomTeams();
    const existingCanonicalKeys = new Set<string>(mergedCanonicalKeys);
    currentCustomTeams.forEach((customTeam) => {
      existingCanonicalKeys.add(getCanonicalKey(customTeam));
    });

    const plainCopy = buildDerivedTeam(team, targetLeague);
    const targetTeam = existingCanonicalKeys.has(getCanonicalKey(plainCopy))
      ? buildDuplicatedTeam(team, targetLeague, existingCanonicalKeys)
      : plainCopy;

    writeCustomTeams(sortTeams([...currentCustomTeams, targetTeam], tabOrder));
    setFeedbackMessage(
      targetLeague === activeLeague
        ? `${team.display_name} duplicado en ${targetLeague}.`
        : `${team.display_name} copiado a ${targetLeague}.`,
    );
  }

  function handleMove(team: TeamDirectoryItem) {
    const sourceKey = getCanonicalKey(team);
    const targetLeague = targetLeagueByTeam[sourceKey]?.trim() ?? "";

    if (!targetLeague || targetLeague === activeLeague) {
      return;
    }

    const currentCustomTeams = readCustomTeams();
    const currentHiddenTeamKeys = readHiddenTeamKeys();
    const sourceLeagues = splitTeamCompetitions(team.competition);
    const remainingLeagues = sourceLeagues.filter((league) => league !== activeLeague);
    const remainderCompetition = joinCompetitions(remainingLeagues);
    const targetTeam = buildDerivedTeam(team, targetLeague);
    const targetCanonicalKey = getCanonicalKey(targetTeam);
    const remainderTeam = remainderCompetition ? buildDerivedTeam(team, remainderCompetition) : null;
    const remainderCanonicalKey = remainderTeam ? getCanonicalKey(remainderTeam) : null;
    const targetAlreadyExists =
      remainingLeagues.includes(targetLeague) || mergedCanonicalKeys.has(targetCanonicalKey);

    const teamsToRemove = new Set<string>([sourceKey, targetCanonicalKey]);
    if (remainderCanonicalKey) {
      teamsToRemove.add(remainderCanonicalKey);
    }

    const nextTeams = removeTeamsByCanonicalKeys(currentCustomTeams, teamsToRemove);
    const nextHiddenTeamKeys = currentHiddenTeamKeys.filter(
      (key) => key !== targetCanonicalKey && key !== remainderCanonicalKey,
    );
    nextHiddenTeamKeys.push(sourceKey);

    const additions: TeamDirectoryItem[] = [];

    if (remainderTeam) {
      additions.push(remainderTeam);
    }

    if (!targetAlreadyExists) {
      additions.push(targetTeam);
    }

    writeCustomTeams(sortTeams([...nextTeams, ...additions], tabOrder));
    writeHiddenTeamKeys(nextHiddenTeamKeys);
    setFeedbackMessage(`${team.display_name} movido a ${targetLeague}.`);
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-[#f0d9de]">
        <div className="flex min-w-0 flex-1 overflow-x-auto">
          <Link
            href={buildHref({ league: undefined })}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-6 py-3 text-sm font-bold transition",
              !activeLeague
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[#617187] hover:text-[var(--accent)]",
            )}
          >
            Todos ({mergedTeams.length})
          </Link>

          {visibleTabs.map((tab) => {
            const isActive = activeLeague === tab.value;

            if (!isActive) {
              return (
                <Link
                  key={tab.value}
                  href={buildHref({ league: tab.value })}
                  className=" -mb-px whitespace-nowrap border-b-2 border-transparent px-6 py-3 text-sm font-bold text-[#617187] transition hover:text-[var(--accent)]"
                >
                  {tab.label} ({tab.count})
                </Link>
              );
            }

            return (
              <div
                key={tab.value}
                style={leagueAccent ? { borderColor: leagueAccent, color: leagueAccent } : undefined}
                className=" -mb-px flex items-center gap-1 border-b-2 px-4 py-1 text-sm font-bold"
              >
                <Link href={buildHref({ league: tab.value })} className="whitespace-nowrap px-2 py-2">
                  {tab.label} ({tab.count})
                </Link>
                {canManageTeams ? (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    aria-label={`Gestionar equipos de ${tab.label}`}
                    title={`Gestionar equipos de ${tab.label}`}
                    className="inline-flex size-8 items-center justify-center rounded-full bg-[#f4f7fb] text-[#70819b] transition hover:bg-[#eef2f6] hover:text-[var(--accent)]"
                  >
                    <Pencil className="size-4" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[300] flex items-center justify-center bg-[#101828]/60 p-4 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            >
              <div
                className="panel-surface relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[68rem] flex-col overflow-hidden rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(15,23,42,0.22)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="shrink-0 border-b border-[var(--border)] px-6 py-5 xl:px-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-11 items-center justify-center rounded-[var(--panel-radius)] bg-[#fff4f6] text-[var(--accent)]">
                        <Pencil className="size-5" />
                      </span>
                      <div>
                        <h3 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                          Equipos de {activeLeague}
                        </h3>
                        <p className="mt-1 text-sm text-[#667085]">
                          Copia, duplica o mueve clubes entre ligas.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--background-soft)] text-[#94a3b8] transition hover:bg-[#eef2f6] hover:text-[#52627a]"
                      aria-label="Cerrar modal"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 xl:px-8 xl:py-6">
                  {feedbackMessage ? (
                    <div className="rounded-[var(--panel-radius)] border border-[#d7e3f4] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#516273]">
                      {feedbackMessage}
                    </div>
                  ) : null}

                  {!leagueTeams.length ? (
                    <div className="rounded-[var(--panel-radius)] border border-dashed border-[var(--border)] bg-[var(--background-soft)] px-5 py-8 text-center text-sm text-[#70819b]">
                      No hay equipos visibles en esta liga.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leagueTeams.map((team) => {
                        const teamKey = getCanonicalKey(team);
                        const targetLeague =
                          targetLeagueByTeam[teamKey]?.trim() || activeLeague || targetLeagueOptions[0]?.value || "";

                        return (
                          <div
                            key={teamKey}
                            className="grid gap-4 rounded-[var(--panel-radius)] border border-[var(--border)] bg-white p-4 xl:grid-cols-[minmax(0,1.25fr)_13rem_auto]"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <ClientTeamLogoMark
                                teamName={team.official_name}
                                competition={team.competition}
                                className="size-12 rounded-[var(--panel-radius)] border-[#e5e7eb] bg-white"
                                imageClassName="p-2"
                                initialsClassName="text-[10px]"
                              />

                              <div className="min-w-0">
                                <p className="truncate text-base font-extrabold text-[var(--foreground)]">
                                  {team.display_name}
                                </p>
                                <p className="mt-1 truncate text-sm text-[#70819b]">
                                  {team.stadium ?? "Sin estadio cargado"}
                                </p>
                              </div>
                            </div>

                            <Select
                              value={targetLeague}
                              onChange={(event) =>
                                setTargetLeagueByTeam((current) => ({
                                  ...current,
                                  [teamKey]: event.target.value,
                                }))
                              }
                              className="h-11 rounded-[var(--panel-radius)]"
                            >
                              {targetLeagueOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>

                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <CreateTeamModal
                                canEdit={canManageTeams}
                                defaultCompetition={activeLeague || team.competition}
                                initialTeam={team}
                                triggerVariant="secondary"
                                triggerLabel="Editar"
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleCopy(team)}
                                disabled={!targetLeague}
                                className="gap-2"
                              >
                                <Copy className="size-4" />
                                Copiar
                              </Button>
                              <Button
                                type="button"
                                onClick={() => handleMove(team)}
                                disabled={!targetLeague}
                                className="gap-2 shadow-none"
                              >
                                <ArrowRightLeft className="size-4" />
                                Mover
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
