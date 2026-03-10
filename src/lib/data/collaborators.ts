import { parseISO } from "date-fns";

import {
  formatMatchDate,
  formatMatchTime,
  getDateInputValue,
  getMatchEndIso,
  toDateKey,
} from "@/lib/date";
import type { MatchStatus, PersonRow } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeText } from "@/lib/utils";

type LinkedPerson = Pick<PersonRow, "id" | "full_name" | "email" | "phone" | "active">;

type AssignmentRow = {
  id: string;
  confirmed: boolean;
  notes: string | null;
  role: {
    id: string;
    name: string;
    category: string;
    sort_order: number;
  } | null;
  match: {
    id: string;
    competition: string | null;
    production_mode: string | null;
    status: MatchStatus;
    home_team: string;
    away_team: string;
    venue: string | null;
    kickoff_at: string;
    duration_minutes: number;
    timezone: string;
    owner: {
      id: string;
      full_name: string;
      phone: string | null;
      email: string | null;
    } | null;
  } | null;
};

type MatchAssignmentContextRow = {
  match_id: string;
  role: {
    name: string;
    category: string;
    sort_order: number;
  } | null;
  person: {
    full_name: string;
  } | null;
};

type MatchContextMatchRow = NonNullable<AssignmentRow["match"]>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CollaboratorAssignmentItem = {
  assignmentId: string;
  matchId: string;
  confirmed: boolean;
  notes: string | null;
  roleName: string | null;
  roleCategory: string | null;
  competition: string | null;
  productionMode: string | null;
  status: MatchStatus;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
  kickoffAt: string;
  durationMinutes: number;
  timezone: string;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  responsibleName: string | null;
  realizerName: string | null;
  producerName: string | null;
  talentLabel: string | null;
  dateLabel: string;
  timeLabel: string;
};

export type CollaboratorDayData = {
  person: LinkedPerson | null;
  linkedBy: "email" | "name" | null;
  todayAssignments: CollaboratorAssignmentItem[];
  upcomingAssignments: CollaboratorAssignmentItem[];
  summary: {
    totalToday: number;
    pendingToday: number;
    competitionsToday: number;
    nextKickoffLabel: string | null;
  };
};

export type CollaboratorMatchData = {
  person: LinkedPerson | null;
  linkedBy: "email" | "name" | null;
  assignment: CollaboratorAssignmentItem | null;
  assignmentsForMatch: CollaboratorAssignmentItem[];
  trialAccess: boolean;
};

export function isUuidLike(value: string) {
  return UUID_PATTERN.test(value);
}

async function findLinkedPerson(params: {
  email: string | null;
  profileName: string | null;
}) {
  const supabase = await createSupabaseServerClient();

  if (params.email) {
    const byEmail = await supabase
      .from("people")
      .select("id, full_name, email, phone, active")
      .eq("email", params.email)
      .eq("active", true)
      .maybeSingle();

    if (byEmail.error) {
      throw byEmail.error;
    }

    if (byEmail.data) {
      return {
        person: byEmail.data as LinkedPerson,
        linkedBy: "email" as const,
      };
    }
  }

  if (!params.profileName) {
    return {
      person: null,
      linkedBy: null,
    };
  }

  const candidates = await supabase
    .from("people")
    .select("id, full_name, email, phone, active")
    .eq("active", true);

  if (candidates.error) {
    throw candidates.error;
  }

  const profileName = normalizeText(params.profileName);
  const matched =
    ((candidates.data ?? []) as LinkedPerson[]).find(
      (person) => normalizeText(person.full_name) === profileName,
    ) ?? null;

  return {
    person: matched,
    linkedBy: matched ? ("name" as const) : null,
  };
}

function mapAssignmentRow(assignment: AssignmentRow): CollaboratorAssignmentItem | null {
  if (!assignment.match) {
    return null;
  }

  return buildAssignmentItem({
    assignmentId: assignment.id,
    match: assignment.match,
    confirmed: assignment.confirmed,
    notes: assignment.notes,
    roleName: assignment.role?.name ?? null,
    roleCategory: assignment.role?.category ?? null,
  });
}

function buildAssignmentItem(params: {
  assignmentId: string;
  match: MatchContextMatchRow;
  confirmed?: boolean;
  notes?: string | null;
  roleName?: string | null;
  roleCategory?: string | null;
  responsibleName?: string | null;
  realizerName?: string | null;
  producerName?: string | null;
  talentLabel?: string | null;
}) {
  const match = params.match;

  return {
    assignmentId: params.assignmentId,
    matchId: match.id,
    confirmed: params.confirmed ?? false,
    notes: params.notes ?? null,
    roleName: params.roleName ?? null,
    roleCategory: params.roleCategory ?? null,
    competition: match.competition,
    productionMode: match.production_mode,
    status: match.status,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    venue: match.venue,
    kickoffAt: match.kickoff_at,
    durationMinutes: match.duration_minutes,
    timezone: match.timezone,
    ownerName: match.owner?.full_name ?? null,
    ownerPhone: match.owner?.phone ?? null,
    ownerEmail: match.owner?.email ?? null,
    responsibleName: params.responsibleName ?? null,
    realizerName: params.realizerName ?? null,
    producerName: params.producerName ?? null,
    talentLabel: params.talentLabel ?? null,
    dateLabel: formatMatchDate(match.kickoff_at, match.timezone, "EEE d MMM"),
    timeLabel: formatMatchTime(match.kickoff_at, match.timezone),
  } satisfies CollaboratorAssignmentItem;
}

function pickContextName(
  items: MatchAssignmentContextRow[],
  roleName: string,
): string | null {
  return (
    items.find((item) => item.role?.name === roleName)?.person?.full_name?.trim() ?? null
  );
}

function buildTalentLabel(items: MatchAssignmentContextRow[]) {
  const orderedNames = items
    .filter((item) =>
      ["Relator", "Comentario 1", "Comentario 2", "Campo"].includes(
        item.role?.name ?? "",
      ),
    )
    .sort(
      (left, right) => (left.role?.sort_order ?? 0) - (right.role?.sort_order ?? 0),
    )
    .map((item) => item.person?.full_name?.trim())
    .filter((value): value is string => Boolean(value));

  if (!orderedNames.length) {
    return null;
  }

  return orderedNames.slice(0, 2).join(" / ");
}

async function getMatchContextMap(matchIds: string[]) {
  if (!matchIds.length) {
    return new Map<string, MatchAssignmentContextRow[]>();
  }

  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("assignments")
    .select(
      "match_id, role:roles!assignments_role_id_fkey(name, category, sort_order), person:people!assignments_person_id_fkey(full_name)",
    )
    .in("match_id", matchIds);

  if (result.error) {
    throw result.error;
  }

  const rows = (result.data ?? []) as MatchAssignmentContextRow[];
  const contextMap = new Map<string, MatchAssignmentContextRow[]>();

  rows.forEach((row) => {
    const current = contextMap.get(row.match_id) ?? [];
    current.push(row);
    contextMap.set(row.match_id, current);
  });

  return contextMap;
}

async function getAssignmentsForPerson(personId: string) {
  const supabase = await createSupabaseServerClient();
  const assignmentsResult = await supabase
    .from("assignments")
    .select(
      "id, confirmed, notes, role:roles!assignments_role_id_fkey(id, name, category, sort_order), match:matches!assignments_match_id_fkey(id, competition, production_mode, status, home_team, away_team, venue, kickoff_at, duration_minutes, timezone, owner:people!matches_owner_id_fkey(id, full_name, phone, email))",
    )
    .eq("person_id", personId);

  if (assignmentsResult.error) {
    throw assignmentsResult.error;
  }

  const assignments = ((assignmentsResult.data ?? []) as AssignmentRow[])
    .map(mapAssignmentRow)
    .filter((assignment): assignment is CollaboratorAssignmentItem => Boolean(assignment))
    .sort((left, right) => left.kickoffAt.localeCompare(right.kickoffAt));

  const matchContextMap = await getMatchContextMap(
    assignments.map((assignment) => assignment.matchId),
  );

  return assignments.map((assignment) => {
    const contextRows = matchContextMap.get(assignment.matchId) ?? [];
    const responsibleName =
      pickContextName(contextRows, "Responsable") ?? assignment.ownerName ?? null;

    return {
      ...assignment,
      responsibleName,
      realizerName: pickContextName(contextRows, "Realizador"),
      producerName: pickContextName(contextRows, "Productor"),
      talentLabel: buildTalentLabel(contextRows),
    };
  });
}

async function getFallbackAssignmentForMatch(params: {
  matchId: string;
  profileName: string | null;
}) {
  if (!isUuidLike(params.matchId)) {
    const demoKickoffAt = `${new Date().toISOString().slice(0, 10)}T19:30:00-05:00`;

    return buildAssignmentItem({
      assignmentId: `trial-${params.matchId}`,
      match: {
        id: params.matchId,
        competition: "Liga Nacional",
        production_mode: "Encoder",
        status: "Pendiente",
        home_team: "Boca Juniors",
        away_team: "Atenas de Córdoba",
        venue: "Luis Conde, Buenos Aires",
        kickoff_at: demoKickoffAt,
        duration_minutes: 150,
        timezone: "America/Bogota",
        owner: {
          id: "trial-owner",
          full_name: params.profileName ?? "Modo prueba",
          phone: null,
          email: null,
        },
      },
      roleName: "Colaborador",
      roleCategory: "Produccion",
      notes: "Modo prueba habilitado temporalmente.",
      responsibleName: params.profileName ?? "Modo prueba",
      realizerName: null,
      producerName: null,
      talentLabel: null,
    });
  }

  const supabase = await createSupabaseServerClient();
  const matchResult = await supabase
    .from("matches")
    .select(
      "id, competition, production_mode, status, home_team, away_team, venue, kickoff_at, duration_minutes, timezone, owner:people!matches_owner_id_fkey(id, full_name, phone, email)",
    )
    .eq("id", params.matchId)
    .maybeSingle();

  if (matchResult.error) {
    throw matchResult.error;
  }

  if (!matchResult.data) {
    return null;
  }

  const match = matchResult.data as MatchContextMatchRow;
  const contextRows = (await getMatchContextMap([params.matchId])).get(params.matchId) ?? [];

  return buildAssignmentItem({
    assignmentId: `trial-${params.matchId}`,
    match,
    roleName: "Colaborador",
    roleCategory: "Produccion",
    notes: "Modo prueba habilitado temporalmente.",
    responsibleName:
      pickContextName(contextRows, "Responsable") ??
      match.owner?.full_name ??
      params.profileName,
    realizerName: pickContextName(contextRows, "Realizador"),
    producerName: pickContextName(contextRows, "Productor"),
    talentLabel: buildTalentLabel(contextRows),
  });
}

export async function getCollaboratorDayData(params: {
  email: string | null;
  profileName: string | null;
  selectedDate?: string;
  timezone?: string;
}): Promise<CollaboratorDayData> {
  const selectedDate = params.selectedDate ?? getDateInputValue();
  const { person, linkedBy } = await findLinkedPerson({
    email: params.email,
    profileName: params.profileName,
  });

  if (!person) {
    return {
      person: null,
      linkedBy: null,
      todayAssignments: [],
      upcomingAssignments: [],
      summary: {
        totalToday: 0,
        pendingToday: 0,
        competitionsToday: 0,
        nextKickoffLabel: null,
      },
    };
  }

  const assignments = await getAssignmentsForPerson(person.id);
  const now = new Date();

  const todayAssignments = assignments.filter(
    (assignment) => toDateKey(assignment.kickoffAt, assignment.timezone) === selectedDate,
  );

  const nextAssignments = assignments.filter((assignment) => {
    const end = parseISO(
      getMatchEndIso(assignment.kickoffAt, assignment.durationMinutes),
    );

    return end >= now;
  });

  const upcomingAssignments = nextAssignments
    .filter(
      (assignment) => toDateKey(assignment.kickoffAt, assignment.timezone) !== selectedDate,
    )
    .slice(0, 4);

  return {
    person,
    linkedBy,
    todayAssignments,
    upcomingAssignments,
    summary: {
      totalToday: todayAssignments.length,
      pendingToday: todayAssignments.filter((assignment) => !assignment.confirmed).length,
      competitionsToday: new Set(
        todayAssignments
          .map((assignment) => assignment.competition)
          .filter((value): value is string => Boolean(value)),
      ).size,
      nextKickoffLabel: nextAssignments[0]
        ? `${formatMatchDate(nextAssignments[0].kickoffAt, nextAssignments[0].timezone, "EEE d MMM")} · ${nextAssignments[0].timeLabel}`
        : null,
    },
  };
}

export async function getCollaboratorMatchData(params: {
  email: string | null;
  profileName: string | null;
  matchId: string;
}): Promise<CollaboratorMatchData> {
  const { person, linkedBy } = await findLinkedPerson({
    email: params.email,
    profileName: params.profileName,
  });

  const assignments = person ? await getAssignmentsForPerson(person.id) : [];
  const assignmentsForMatch = assignments.filter(
    (assignment) => assignment.matchId === params.matchId,
  );
  const assignment =
    assignmentsForMatch[0] ??
    (await getFallbackAssignmentForMatch({
      matchId: params.matchId,
      profileName: params.profileName,
    }));

  return {
    person,
    linkedBy,
    assignment,
    assignmentsForMatch,
    trialAccess: assignmentsForMatch.length === 0,
  };
}
