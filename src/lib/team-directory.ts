import {
  CLUB_CATALOG,
  INACTIVE_SEASON_COMPETITIONS,
} from "@/lib/club-catalog";
import { LOGO_LIBRARY_INDEX } from "@/lib/logo-library-index";
import {
  GLOBAL_TEAM_METADATA_OVERRIDES,
  TEAM_COMPETITION_DISPLAY_NAME_OVERRIDES,
  TEAM_DIRECTORY_COMPETITION_METADATA_OVERRIDES,
  TEAM_DISPLAY_NAME_OVERRIDES,
} from "@/lib/team-metadata-overrides";
import { TEAM_EXCEL_METADATA_OVERRIDES } from "@/lib/team-excel-metadata-overrides";

export type TeamDirectoryItem = {
  id: string;
  slug: string;
  official_name: string;
  display_name: string;
  competition: string;
  stadium: string | null;
  manager: string | null;
  website: string | null;
  instagram: string | null;
  official_url: string | null;
  incident_count: number;
  logo_data_url?: string | null;
};

const LEAGUE_URL = "https://www.laliganacional.com.ar/";

const BASE_TEAM_DIRECTORY_TAB_ORDER = [
  "Liga Nacional",
  "Liga Próximo",
  "Liga Argentina",
  "Liga Federal",
  "Liga Femenina",
  "Liga Ecuador Fem",
  "Liga Metropolitana",
] as const;

const INACTIVE_SEASON_COMPETITION_SET = new Set<string>(INACTIVE_SEASON_COMPETITIONS);

export const TEAM_DIRECTORY_TAB_ORDER = Array.from(
  new Set([
    ...BASE_TEAM_DIRECTORY_TAB_ORDER,
    ...LOGO_LIBRARY_INDEX
      .map((entry) => entry.competition)
      .filter((competition) => !INACTIVE_SEASON_COMPETITION_SET.has(competition)),
  ]),
);

const TEAM_DIRECTORY_OVERRIDES: Record<
  string,
  Partial<Omit<TeamDirectoryItem, "id" | "slug" | "official_name" | "competition">>
> = {
  "Atenas de Córdoba::Liga Nacional": {
    stadium: "Estructuras Pretensa Atenas",
    website: "https://www.atenas.com.ar/",
    instagram: "https://www.instagram.com/atenascordobaoficial/",
  },
  "Atenas de Córdoba::Liga Próximo": {
    stadium: "Estructuras Pretensa Atenas",
    website: "https://www.atenas.com.ar/",
    instagram: "https://www.instagram.com/atenascordobaoficial/",
  },
  "Boca Juniors::Liga Nacional": {
    stadium: "Luis Conde",
    manager: "Responsable por asignar",
    website: "https://www.bocajuniors.com.ar/",
    instagram: "https://www.instagram.com/bocajrs/",
  },
  "Boca Juniors::Liga Próximo": {
    stadium: "Luis Conde",
    manager: "Responsable por asignar",
    website: "https://www.bocajuniors.com.ar/",
    instagram: "https://www.instagram.com/bocajrs/",
  },
  "Instituto de Córdoba::Liga Nacional": {
    stadium: "Ángel Sandrín",
    instagram: "https://www.instagram.com/institutobasket/",
  },
  "Instituto de Córdoba::Liga Próximo": {
    stadium: "Ángel Sandrín",
    instagram: "https://www.instagram.com/institutobasket/",
  },
  "Obras Basket::Liga Nacional": {
    stadium: "El Templo del Rock",
    website: "https://www.obrasbasket.com/",
    instagram: "https://www.instagram.com/obrasbasket/",
  },
  "Obras Basket::Liga Próximo": {
    stadium: "El Templo del Rock",
    website: "https://www.obrasbasket.com/",
    instagram: "https://www.instagram.com/obrasbasket/",
  },
  "Quimsa::Liga Nacional": {
    stadium: "Ciudad",
    instagram: "https://www.instagram.com/quimsabasquetoficial/",
  },
  "Quimsa::Liga Próximo": {
    stadium: "Ciudad",
    instagram: "https://www.instagram.com/quimsabasquetoficial/",
  },
  "Regatas Corrientes::Liga Nacional": {
    stadium: "José Jorge Contte",
    instagram: "https://www.instagram.com/regatasctes/",
  },
  "Regatas Corrientes::Liga Próximo": {
    stadium: "José Jorge Contte",
    instagram: "https://www.instagram.com/regatasctes/",
  },
  "San Lorenzo de Almagro::Liga Nacional": {
    stadium: "Pando",
    instagram: "https://www.instagram.com/cslabasquet/",
  },
  "San Lorenzo de Almagro::Liga Próximo": {
    stadium: "Pando",
    instagram: "https://www.instagram.com/cslabasquet/",
  },
  "Unión de Santa Fe::Liga Nacional": {
    stadium: "Ángel Malvicino",
  },
  "Unión de Santa Fe::Liga Próximo": {
    stadium: "Ángel Malvicino",
  },
  "Bochas Sport Club::Liga Argentina": {
    stadium: "Bochas Sport Club",
  },
  "Pergamino Básquet::Liga Argentina": {
    stadium: "Ricardo Dorado Merlo",
  },
  "Villa San Martín de Resistencia::Liga Argentina": {
    stadium: "Villa San Martín",
  },
};

const TEAM_DIRECTORY_CANONICAL_NAME_ALIASES: Record<string, string> = {
  "argentino j": "Argentino de Junín",
  "club atletico estudiantes": "Club Atlético Estudiantes de Tucumán",
  "club atletico provincial": "Club Atlético Provincial",
  "colon sf": "Colón de Santa Fe",
  "fenerbahce beko istanbul": "Fenerbahce Beko Istanbul",
  gimnasia: "Gimnasia y Esgrima de La Plata",
  "hindu c": "Hindú Club de Córdoba",
  "hindu club": "Hindú Club de Córdoba",
  "jose hernandez": "José Hernández",
  "maccabi playtika tel aviv": "Maccabi Rapyd Tel Aviv",
  obras: "Obras Basket",
  "velez sarsfield": "Vélez Sarsfield",
  "provincial de rosario": "Club Atlético Provincial",
  "regatas c": "Regatas Corrientes",
  "san martin c": "San Martín de Corrientes",
  "la union f": "La Unión de Formosa",
  "zalgiris kaunas": "Zalgiris Kaunas",
  zarate: "Zárate Basket",
};

function normalizeTeamIdentity(value: string) {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replaceAll(/\s+/g, " ")
    .toLowerCase();
}

export function getCanonicalTeamName(teamName: string) {
  const normalizedName = normalizeTeamIdentity(teamName);
  return TEAM_DIRECTORY_CANONICAL_NAME_ALIASES[normalizedName] ?? teamName.trim();
}

export function getTeamDirectoryCanonicalKey(params: {
  officialName: string;
  displayName?: string | null;
  competition: string;
}) {
  const baseName = params.officialName.trim() || params.displayName?.trim() || "";
  const canonicalName = getCanonicalTeamName(baseName);

  return `${normalizeTeamIdentity(canonicalName)}::${normalizeTeamIdentity(params.competition)}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-zA-Z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .toLowerCase();
}

function buildId(name: string, competition: string) {
  return `${name}::${competition}`;
}

function normalizeComparableUrl(value: string) {
  return value.trim().replace(/\/+$/g, "");
}

export function sanitizeTeamOfficialUrl(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const trimmedValue = value.trim();
  const normalizedValue = normalizeComparableUrl(trimmedValue);

  if (normalizedValue === normalizeComparableUrl(LEAGUE_URL)) {
    return null;
  }

  return trimmedValue;
}

function getTeamMetadataVariants(teamName?: string | null, displayName?: string | null) {
  return Array.from(
    new Set(
      [teamName?.trim(), displayName?.trim()]
        .filter((value): value is string => Boolean(value))
        .flatMap((value) => {
          const canonical = getCanonicalTeamName(value);
          return canonical === value ? [value] : [value, canonical];
        }),
    ),
  );
}

export function getTeamMetadataOverride(params: {
  officialName?: string | null;
  displayName?: string | null;
  competition?: string | null;
}) {
  const names = getTeamMetadataVariants(params.officialName, params.displayName);
  const competition = params.competition?.trim() ?? "";
  const mergedOverride: Partial<
    Omit<TeamDirectoryItem, "id" | "slug" | "official_name" | "competition">
  > = {};

  names.forEach((name) => {
    Object.assign(mergedOverride, GLOBAL_TEAM_METADATA_OVERRIDES[name] ?? {});
    Object.assign(mergedOverride, TEAM_EXCEL_METADATA_OVERRIDES[name] ?? {});

    const displayName = TEAM_DISPLAY_NAME_OVERRIDES[name];

    if (displayName) {
      mergedOverride.display_name = displayName;
    }
  });

  if (competition) {
    names.forEach((name) => {
      const key = buildId(name, competition);
      Object.assign(mergedOverride, TEAM_DIRECTORY_COMPETITION_METADATA_OVERRIDES[key] ?? {});
      Object.assign(mergedOverride, TEAM_DIRECTORY_OVERRIDES[key] ?? {});

      const displayName = TEAM_COMPETITION_DISPLAY_NAME_OVERRIDES[key];

      if (displayName) {
        mergedOverride.display_name = displayName;
      }
    });
  }

  return {
    ...mergedOverride,
    official_url: sanitizeTeamOfficialUrl(mergedOverride.official_url),
  };
}

export function getResolvedTeamOfficialUrl(params: {
  officialName?: string | null;
  displayName?: string | null;
  competition?: string | null;
}) {
  return getTeamMetadataOverride(params).official_url ?? null;
}

function buildTeamDirectory() {
  const catalogEntries = CLUB_CATALOG.flatMap(({ competition, clubs }) =>
    clubs.map((club) => {
      const key = buildId(club, competition);
      const overrides = {
        ...getTeamMetadataOverride({
          officialName: club,
          competition,
        }),
      };

      return {
        id: key,
        slug: slugify(`${club}-${competition}`),
        official_name: club,
        display_name: overrides.display_name ?? club,
        competition,
        stadium: overrides.stadium ?? null,
        manager: overrides.manager ?? null,
        website: overrides.website ?? null,
        instagram: overrides.instagram ?? null,
        official_url: overrides.official_url ?? null,
        incident_count: overrides.incident_count ?? 0,
      } satisfies TeamDirectoryItem;
    }),
  );

  const catalogEntryCanonicalKeys = new Set(
    catalogEntries.map((entry) =>
      getTeamDirectoryCanonicalKey({
        officialName: entry.official_name,
        displayName: entry.display_name,
        competition: entry.competition,
      }),
    ),
  );

  const libraryEntries = LOGO_LIBRARY_INDEX
    .filter(({ competition }) => !INACTIVE_SEASON_COMPETITION_SET.has(competition))
    .flatMap(({ competition, teams }) =>
      teams
        .filter(
          (teamName) =>
            !catalogEntryCanonicalKeys.has(
              getTeamDirectoryCanonicalKey({
                officialName: teamName,
                competition,
              }),
            ),
        )
        .map((teamName) => {
          const overrides = {
            ...getTeamMetadataOverride({
              officialName: teamName,
              competition,
            }),
          };

          return {
            id: buildId(teamName, competition),
            slug: slugify(`${teamName}-${competition}`),
            official_name: teamName,
            display_name: overrides.display_name ?? teamName,
            competition,
            stadium: overrides.stadium ?? null,
            manager: overrides.manager ?? null,
            website: overrides.website ?? null,
            instagram: overrides.instagram ?? null,
            official_url: overrides.official_url ?? null,
            incident_count: overrides.incident_count ?? 0,
          } satisfies TeamDirectoryItem;
        }),
    );

  const entries = [...catalogEntries, ...libraryEntries];
  const dedupedEntries = entries.reduce<Map<string, TeamDirectoryItem>>((map, entry) => {
    const canonicalKey = getTeamDirectoryCanonicalKey({
      officialName: entry.official_name,
      displayName: entry.display_name,
      competition: entry.competition,
    });

    if (!map.has(canonicalKey)) {
      map.set(canonicalKey, {
        ...entry,
        official_name: getCanonicalTeamName(entry.official_name),
        display_name: getCanonicalTeamName(entry.display_name),
      });
      return map;
    }

    const current = map.get(canonicalKey)!;
    map.set(canonicalKey, {
      ...current,
      official_name: getCanonicalTeamName(current.official_name),
      display_name: getCanonicalTeamName(current.display_name),
      stadium: current.stadium ?? entry.stadium,
      manager: current.manager ?? entry.manager,
      website: current.website ?? entry.website,
      instagram: current.instagram ?? entry.instagram,
      official_url: sanitizeTeamOfficialUrl(current.official_url ?? entry.official_url),
      incident_count: Math.max(current.incident_count, entry.incident_count),
    });
    return map;
  }, new Map());

  return Array.from(dedupedEntries.values()).sort((left, right) => {
    const leftPrimaryLeague = splitTeamCompetitions(left.competition)[0] ?? left.competition;
    const rightPrimaryLeague =
      splitTeamCompetitions(right.competition)[0] ?? right.competition;
    const leagueIndexLeft = TEAM_DIRECTORY_TAB_ORDER.indexOf(
      leftPrimaryLeague,
    );
    const leagueIndexRight = TEAM_DIRECTORY_TAB_ORDER.indexOf(
      rightPrimaryLeague,
    );

    if (leagueIndexLeft !== leagueIndexRight) {
      return (
        (leagueIndexLeft === -1 ? Number.MAX_SAFE_INTEGER : leagueIndexLeft) -
        (leagueIndexRight === -1 ? Number.MAX_SAFE_INTEGER : leagueIndexRight)
      );
    }

    return left.display_name.localeCompare(right.display_name, "es");
  });
}

export const TEAM_DIRECTORY = buildTeamDirectory();

export const TEAM_DIRECTORY_LEAGUES = TEAM_DIRECTORY_TAB_ORDER.filter((league) =>
  TEAM_DIRECTORY.some((team) => splitTeamCompetitions(team.competition).includes(league)),
);

function normalizeLeagueName(value: string) {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getTeamLeagueColorSet(league: string) {
  const normalizedLeague = normalizeLeagueName(league);

  if (normalizedLeague.includes("liga nacional")) {
    return {
      accent: "#d61b46",
      border: "#f5c0cc",
      soft: "#fff1f4",
      canvas: "#fff5f7",
    };
  }

  if (normalizedLeague.includes("liga argentina")) {
    return {
      accent: "#2b6be7",
      border: "#c2d4f8",
      soft: "#eef5ff",
      canvas: "#f4f8ff",
    };
  }

  if (normalizedLeague.includes("liga federal")) {
    return {
      accent: "#e67b18",
      border: "#f8d4b0",
      soft: "#fff4ea",
      canvas: "#fff7ef",
    };
  }

  if (
    normalizedLeague.includes("liga proximo") ||
    normalizedLeague.includes("liga próximo")
  ) {
    return {
      accent: "#2f9d57",
      border: "#b8e8cb",
      soft: "#eef9f1",
      canvas: "#f5fbf6",
    };
  }

  if (normalizedLeague.includes("liga femenina")) {
    return {
      accent: "#d73cb8",
      border: "#f5bcea",
      soft: "#fff0fb",
      canvas: "#fff6fd",
    };
  }

  if (normalizedLeague.includes("liga ecuador fem")) {
    return {
      accent: "#0f766e",
      border: "#b2deda",
      soft: "#edf8f6",
      canvas: "#f5fbfa",
    };
  }

  if (normalizedLeague.includes("liga metropolitana fem")) {
    return {
      accent: "#d73cb8",
      border: "#f5bcea",
      soft: "#fff0fb",
      canvas: "#fff6fd",
    };
  }

  if (normalizedLeague.includes("liga metropolitana")) {
    return {
      accent: "#5f78a7",
      border: "#c8d5ea",
      soft: "#f1f5fb",
      canvas: "#f7faff",
    };
  }

  if (normalizedLeague.includes("liga metro")) {
    return {
      accent: "#5f78a7",
      border: "#c8d5ea",
      soft: "#f1f5fb",
      canvas: "#f7faff",
    };
  }

  return {
    accent: "#64748b",
    border: "#d0d8e4",
    soft: "#f5f7fb",
    canvas: "#fafafa",
  };
}

export function getTeamLeagueAccentColor(league: string) {
  return getTeamLeagueColorSet(league).accent;
}

export function getTeamLeagueCanvasTone(league: string) {
  return getTeamLeagueColorSet(league).canvas;
}

function teamMatchesCompetition(team: TeamDirectoryItem, competition?: string | null) {
  const normalizedCompetition = normalizeTeamIdentity(competition ?? "");

  if (!normalizedCompetition) {
    return true;
  }

  return splitTeamCompetitions(team.competition).some(
    (entry) => normalizeTeamIdentity(entry) === normalizedCompetition,
  );
}

function teamMatchesName(team: TeamDirectoryItem, normalizedName: string) {
  return [team.official_name, team.display_name]
    .flatMap((name) => [name, getCanonicalTeamName(name)])
    .some((name) => normalizeTeamIdentity(name) === normalizedName);
}

function findTeamDirectoryItemByName(params: {
  teamName?: string | null;
  competition?: string | null;
}) {
  const normalizedName = normalizeTeamIdentity(
    getCanonicalTeamName(params.teamName ?? ""),
  );

  if (!normalizedName) {
    return null;
  }

  const competitionMatches = TEAM_DIRECTORY.filter((team) =>
    teamMatchesCompetition(team, params.competition),
  );

  return (
    competitionMatches.find((team) => teamMatchesName(team, normalizedName)) ??
    TEAM_DIRECTORY.find((team) => teamMatchesName(team, normalizedName)) ??
    null
  );
}

export function getTeamDisplayName(teamName?: string | null, competition?: string | null) {
  const trimmedTeamName = teamName?.trim() ?? "";

  if (!trimmedTeamName) {
    return "";
  }

  return (
    findTeamDirectoryItemByName({
      teamName: trimmedTeamName,
      competition,
    })?.display_name ?? trimmedTeamName
  );
}

export function getTeamVenueByName(teamName?: string | null, competition?: string | null) {
  return (
    findTeamDirectoryItemByName({
      teamName,
      competition,
    })?.stadium ?? null
  );
}

export function getTeamCompetitionByName(teamName?: string | null) {
  return (
    findTeamDirectoryItemByName({
      teamName,
    })?.competition ?? null
  );
}

const LEAGUE_SHORT_LABELS: Record<string, string> = {
  "Liga Nacional": "Liga Nacional",
  "Liga Próximo": "Liga Próximo",
  "Liga Argentina": "Liga Argentina",
  "Liga Federal": "Liga Federal",
  "Liga Femenina": "Liga Femenina",
  "Liga Ecuador Fem": "Ecuador Fem",
  "Liga Metropolitana": "Metropolitana",
  Euroliga: "Euroliga",
  "Libo Basquet": "Libo Basquet",
  "Liga Brasil LDB": "Brasil LDB",
  "Liga Brasil NBB": "Brasil NBB",
  "LNF Chile": "LNF Chile",
  "Liga Chery": "Liga Chery",
  "Liga Dos": "Liga Dos",
  LDA: "LDA",
  "Liga Endesa": "Liga Endesa",
  "LBA Serie A": "LBA Serie A",
  LUB: "LUB",
  "LUB Ascenso": "LUB Asc.",
  "Primera FEB": "Primera FEB",
  "Liga U22": "Liga U22",
};

export function getTeamDirectoryData(params?: {
  query?: string;
  league?: string;
}) {
  const query = normalizeTeamIdentity(params?.query ?? "");
  const league = params?.league?.trim() ?? "";

  return TEAM_DIRECTORY.filter((team) => {
    if (league && !splitTeamCompetitions(team.competition).includes(league)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchableText = normalizeTeamIdentity(
      [
        team.official_name,
        team.display_name,
        getCanonicalTeamName(team.official_name),
        getCanonicalTeamName(team.display_name),
        team.competition,
        team.stadium ?? "",
        team.manager ?? "",
      ].join(" "),
    );

    return searchableText.includes(query);
  });
}

export function getTeamDirectoryTabs() {
  const counts = TEAM_DIRECTORY.reduce<Map<string, number>>((map, team) => {
    splitTeamCompetitions(team.competition).forEach((league) => {
      map.set(league, (map.get(league) ?? 0) + 1);
    });
    return map;
  }, new Map());

  return TEAM_DIRECTORY_LEAGUES.map((league) => ({
    value: league,
    label: LEAGUE_SHORT_LABELS[league] ?? league,
    count: counts.get(league) ?? 0,
  }));
}

export function getTeamBySlug(slug: string) {
  return TEAM_DIRECTORY.find((team) => team.slug === slug) ?? null;
}

export function getTeamLeagueLabel(league: string) {
  return LEAGUE_SHORT_LABELS[league] ?? league;
}

export function splitTeamCompetitions(competition: string) {
  return competition
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}
