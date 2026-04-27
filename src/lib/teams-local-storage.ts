import {
  sanitizeTeamOfficialUrl,
  type TeamDirectoryItem,
} from "@/lib/team-directory";

export const CUSTOM_TEAMS_STORAGE_KEY = "basket-production-custom-teams";
export const HIDDEN_TEAMS_STORAGE_KEY = "basket-production-hidden-team-keys";
export const CUSTOM_TEAMS_CHANGED_EVENT = "basket-production-custom-teams-changed";

function parseTeamDirectoryItem(value: unknown): TeamDirectoryItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const officialName =
    typeof candidate.official_name === "string" ? candidate.official_name : null;
  const displayName =
    typeof candidate.display_name === "string" && candidate.display_name.trim()
      ? candidate.display_name
      : typeof candidate.common_name === "string" && candidate.common_name.trim()
        ? candidate.common_name
      : officialName;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.slug !== "string" ||
    !officialName ||
    !displayName ||
    typeof candidate.competition !== "string" ||
    (typeof candidate.stadium !== "string" && candidate.stadium !== null) ||
    (typeof candidate.manager !== "string" && candidate.manager !== null) ||
    (typeof candidate.website !== "string" && candidate.website !== null) ||
    (typeof candidate.instagram !== "string" && candidate.instagram !== null) ||
    (typeof candidate.official_url !== "string" && candidate.official_url !== null) ||
    typeof candidate.incident_count !== "number" ||
    (typeof candidate.logo_data_url !== "string" &&
      candidate.logo_data_url !== null &&
      candidate.logo_data_url !== undefined)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    slug: candidate.slug,
    official_name: officialName,
    display_name: displayName,
    competition: candidate.competition,
    stadium: candidate.stadium,
    manager: candidate.manager,
    website: candidate.website,
    instagram: candidate.instagram,
    official_url: sanitizeTeamOfficialUrl(candidate.official_url),
    incident_count: candidate.incident_count,
    logo_data_url: candidate.logo_data_url,
  };
}

export function readCustomTeams(): TeamDirectoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CUSTOM_TEAMS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);

    return Array.isArray(parsed)
      ? parsed
          .map(parseTeamDirectoryItem)
          .filter((team): team is TeamDirectoryItem => team !== null)
      : [];
  } catch {
    return [];
  }
}

export function writeCustomTeams(teams: TeamDirectoryItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    CUSTOM_TEAMS_STORAGE_KEY,
    JSON.stringify(teams),
  );
  window.dispatchEvent(new Event(CUSTOM_TEAMS_CHANGED_EVENT));
}

export function readHiddenTeamKeys() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(HIDDEN_TEAMS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string" && value.trim() !== "")
      : [];
  } catch {
    return [];
  }
}

export function writeHiddenTeamKeys(keys: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    HIDDEN_TEAMS_STORAGE_KEY,
    JSON.stringify(Array.from(new Set(keys))),
  );
  window.dispatchEvent(new Event(CUSTOM_TEAMS_CHANGED_EVENT));
}

export function slugifyTeamValue(value: string) {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-zA-Z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .toLowerCase();
}

export function buildCustomTeamId(name: string, competition: string) {
  return `${name.trim()}::${competition.trim()}`;
}
