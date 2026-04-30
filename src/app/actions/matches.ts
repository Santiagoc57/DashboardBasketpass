"use server";

import { revalidatePath } from "next/cache";

import {
  getRedirectTarget,
  redirectWithNotice,
  rethrowNavigationError,
} from "@/app/actions/helpers";
import type { Database } from "@/lib/database.types";
import {
  MATCH_STATUS_OPTIONS,
  normalizeProductionMode,
} from "@/lib/constants";
import { buildKickoffAt } from "@/lib/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";
import { emitOperationalAlert } from "@/lib/monitoring";
import { ensureErrorMessage, maybeNull, pickFirstString } from "@/lib/utils";

type MatchModalActionState = {
  status: "idle" | "success" | "error";
  notice: string;
  matchId?: string;
  redirectTo?: string;
  token?: string;
};

const STAFF_ROLE_FIELD_MAP = [
  {
    fields: ["responsableId", "responsableEnCanchaId", "ownerId"],
    roleName: "Responsable",
  },
  { fields: ["realizadorId"], roleName: "Realizador" },
  {
    fields: ["graphicsOperatorId", "graficaId"],
    roleName: "Operador de Grafica",
  },
  {
    fields: ["controlOperatorId", "controlId"],
    roleName: "Operador de Control",
  },
  { fields: ["supportTechId", "soporteId"], roleName: "Soporte tecnico" },
  { fields: ["camera1Id", "camara1Id"], roleName: "Camara 1" },
  { fields: ["camera2Id", "camara2Id"], roleName: "Camara 2" },
  { fields: ["camera3Id", "camara3Id"], roleName: "Camara 3" },
  { fields: ["camera4Id", "camara4Id"], roleName: "Camara 4" },
  { fields: ["camera5Id", "camara5Id"], roleName: "Camara 5" },
  { fields: ["relatorId"], roleName: "Relator" },
  {
    fields: ["commentator1Id", "comentario1Id"],
    roleName: "Comentario 1",
  },
  {
    fields: ["commentator2Id", "comentario2Id"],
    roleName: "Comentario 2",
  },
] as const;
const NOT_APPLICABLE_PERSON_VALUE = "__NOT_APPLICABLE__";

const OPTIONAL_MATCH_COLUMNS = new Set([
  "external_match_id",
  "production_code",
  "commentary_plan",
  "transport",
]);

type MatchInsert = Database["public"]["Tables"]["matches"]["Insert"];
type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];

type MatchPlanillaDraftChange = {
  matchId: string;
  field: string;
  value: string;
};

type MatchPlanillaDraftRow = {
  id: string;
  fields: Record<string, string>;
};

const PLANILLA_ROLE_FIELD_TO_ROLE_NAME: Record<string, string> = {
  owner: "Responsable",
  ownerId: "Responsable",
  realizadorId: "Realizador",
  graphicsOperatorId: "Operador de Grafica",
  camera1Id: "Camara 1",
  camera2Id: "Camara 2",
  camera3Id: "Camara 3",
  camera4Id: "Camara 4",
  camera5Id: "Camara 5",
  relatorId: "Relator",
  commentator1Id: "Comentario 1",
  commentator2Id: "Comentario 2",
  controlOperatorId: "Operador de Control",
  supportTechId: "Soporte tecnico",
};

async function reportMatchesFailure(
  error: unknown,
  details: Record<string, unknown>,
) {
  await emitOperationalAlert({
    area: "matches",
    severity: "critical",
    message: "Falló una operación de partidos.",
    error: ensureErrorMessage(error),
    details,
  });
}

function assertMatchStatus(value: string) {
  if (!MATCH_STATUS_OPTIONS.includes(value as (typeof MATCH_STATUS_OPTIONS)[number])) {
    return "Pendiente";
  }

  return value as (typeof MATCH_STATUS_OPTIONS)[number];
}

function assertProductionMode(value: string) {
  return normalizeProductionMode(value);
}

function getGridRedirectForCreatedMatch(formData: FormData, fallback: string) {
  if (String(formData.get("preserveRedirectTo") ?? "") === "true") {
    return fallback;
  }

  const url = new URL(fallback, "http://localhost");
  const createdDate = String(formData.get("date") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();

  url.pathname = "/grid";
  url.searchParams.set("view", "day");

  if (createdDate) {
    url.searchParams.set("date", createdDate);
  }

  if (timezone) {
    url.searchParams.set("timezone", timezone);
  }

  for (const key of ["q", "league", "mode", "status", "owner", "intent", "notice"]) {
    url.searchParams.delete(key);
  }

  return `${url.pathname}${url.search}`;
}

function getCreateOwnerId(formData: FormData) {
  return normalizeSelectedPersonId(
    pickFirstString([
      formData.get("responsableId"),
      formData.get("responsableEnCanchaId"),
      formData.get("ownerId"),
    ]),
  );
}

function normalizeSelectedPersonId(value: string | null | undefined) {
  const normalized = maybeNull(value);

  if (!normalized || normalized === NOT_APPLICABLE_PERSON_VALUE) {
    return null;
  }

  return normalized;
}

function buildStaffAssignments(params: {
  matchId: string;
  formData: FormData;
  roleIdsByName: Map<string, string>;
}) {
  return STAFF_ROLE_FIELD_MAP.flatMap(({ fields, roleName }) => {
    const personId = normalizeSelectedPersonId(
      pickFirstString(fields.map((field) => params.formData.get(field))),
    );
    const roleId = params.roleIdsByName.get(roleName);

    if (!personId || !roleId) {
      return [];
    }

    return {
      match_id: params.matchId,
      role_id: roleId,
      person_id: personId,
      confirmed: false,
      confirmation_status: "pending",
      confirmation_responded_at: null,
      notes: null,
    };
  });
}

function buildStaffAssignmentsFromFields(params: {
  matchId: string;
  fields: Record<string, string>;
  roleIdsByName: Map<string, string>;
}) {
  return Object.entries(PLANILLA_ROLE_FIELD_TO_ROLE_NAME).flatMap(([field, roleName]) => {
    const roleId = params.roleIdsByName.get(roleName);
    const personId = normalizeSelectedPersonId(params.fields[field]);

    if (!roleId || !personId) {
      return [];
    }

    return {
      match_id: params.matchId,
      role_id: roleId,
      person_id: personId,
      confirmed: false,
      confirmation_status: "pending",
      confirmation_responded_at: null,
      notes: null,
    };
  });
}

function getMissingOptionalMatchColumn(error: unknown) {
  const message = ensureErrorMessage(error);
  const columnMatch = message.match(/Could not find the '([^']+)' column of 'matches'/i);
  const columnName = columnMatch?.[1] ?? null;

  if (!columnName || !OPTIONAL_MATCH_COLUMNS.has(columnName)) {
    return null;
  }

  return columnName;
}

function getDeleteMatchErrorNotice(error: unknown) {
  const message = ensureErrorMessage(error);

  if (message.includes("audit_log_match_id_fkey")) {
    return "No se pudo borrar el partido porque falta aplicar la correccion SQL de auditoria. Ejecuta la migracion 0009_fix_audit_log_match_delete_fk.sql en Supabase y vuelve a intentar.";
  }

  return message;
}

async function insertMatchWithOptionalColumnFallback(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: MatchInsert,
) {
  const currentPayload = { ...payload };

  while (true) {
    const result = await supabase
      .from("matches")
      .insert(currentPayload)
      .select("id")
      .single();

    if (!result.error) {
      return result;
    }

    const missingColumn = getMissingOptionalMatchColumn(result.error);

    if (!missingColumn || !(missingColumn in currentPayload)) {
      return result;
    }

    delete currentPayload[missingColumn as keyof MatchInsert];
  }
}

async function updateMatchWithOptionalColumnFallback(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  matchId: string,
  payload: MatchUpdate,
) {
  const currentPayload = { ...payload };

  while (true) {
    const result = await supabase
      .from("matches")
      .update(currentPayload)
      .eq("id", matchId);

    if (!result.error) {
      return result;
    }

    const missingColumn = getMissingOptionalMatchColumn(result.error);

    if (!missingColumn || !(missingColumn in currentPayload)) {
      return result;
    }

    delete currentPayload[missingColumn as keyof MatchUpdate];
  }
}

async function performCreateMatch(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");
  const createdMatchGridRedirect = getGridRedirectForCreatedMatch(formData, redirectTo);
  await requireEditor();

  const supabase = await createSupabaseServerClient();
  const kickoffAt = buildKickoffAt({
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
  });

  const result = await insertMatchWithOptionalColumnFallback(supabase, {
    competition: maybeNull(String(formData.get("competition") ?? "")),
    external_match_id: maybeNull(String(formData.get("externalMatchId") ?? "")),
    production_code: maybeNull(String(formData.get("productionCode") ?? "")),
    production_mode: assertProductionMode(
      String(formData.get("productionMode") ?? ""),
    ),
    status: assertMatchStatus(String(formData.get("status") ?? "Pendiente")),
    home_team: String(formData.get("homeTeam") ?? "").trim(),
    away_team: String(formData.get("awayTeam") ?? "").trim(),
    venue: maybeNull(String(formData.get("venue") ?? "")),
    commentary_plan: maybeNull(String(formData.get("commentaryPlan") ?? "")),
    transport: maybeNull(String(formData.get("transport") ?? "")),
    kickoff_at: kickoffAt,
    duration_minutes: Number(formData.get("durationMinutes") ?? 150),
    timezone: String(formData.get("timezone") ?? ""),
    owner_id: getCreateOwnerId(formData),
    notes: maybeNull(String(formData.get("notes") ?? "")),
  });

  if (result.error) {
    throw result.error;
  }

  const roleNames = STAFF_ROLE_FIELD_MAP.map((item) => item.roleName);
  const rolesResult = await supabase
    .from("roles")
    .select("id, name")
    .in("name", roleNames);

  if (rolesResult.error) {
    throw rolesResult.error;
  }

  const roleIdsByName = new Map(
    (rolesResult.data ?? []).map((role) => [role.name, role.id]),
  );

  const assignments = buildStaffAssignments({
    matchId: result.data.id,
    formData,
    roleIdsByName,
  });

  if (assignments.length) {
    const assignmentsResult = await supabase
      .from("assignments")
      .upsert(assignments, { onConflict: "match_id,role_id" });

    if (assignmentsResult.error) {
      throw assignmentsResult.error;
    }
  }

  revalidatePath("/grid");
  revalidatePath(`/match/${result.data.id}`);
  revalidatePath(`/match/${result.data.id}/notificar`);

  return {
    matchId: result.data.id,
    redirectTo: createdMatchGridRedirect,
    notice: "Partido creado.",
  };
}

async function performUpdateMatch(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");
  await requireEditor();

  const matchId = String(formData.get("matchId") ?? "");
  const supabase = await createSupabaseServerClient();
  const kickoffAt = buildKickoffAt({
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
  });
  const payload: MatchUpdate = {
    competition: maybeNull(String(formData.get("competition") ?? "")),
    production_mode: assertProductionMode(
      String(formData.get("productionMode") ?? ""),
    ),
    status: assertMatchStatus(String(formData.get("status") ?? "Pendiente")),
    home_team: String(formData.get("homeTeam") ?? "").trim(),
    away_team: String(formData.get("awayTeam") ?? "").trim(),
    venue: maybeNull(String(formData.get("venue") ?? "")),
    kickoff_at: kickoffAt,
    duration_minutes: Number(formData.get("durationMinutes") ?? 150),
    timezone: String(formData.get("timezone") ?? ""),
    owner_id: getCreateOwnerId(formData),
    notes: maybeNull(String(formData.get("notes") ?? "")),
  };

  if (formData.has("externalMatchId")) {
    payload.external_match_id = maybeNull(String(formData.get("externalMatchId") ?? ""));
  }

  if (formData.has("productionCode")) {
    payload.production_code = maybeNull(String(formData.get("productionCode") ?? ""));
  }

  if (formData.has("commentaryPlan")) {
    payload.commentary_plan = maybeNull(String(formData.get("commentaryPlan") ?? ""));
  }

  if (formData.has("transport")) {
    payload.transport = maybeNull(String(formData.get("transport") ?? ""));
  }

  const result = await updateMatchWithOptionalColumnFallback(
    supabase,
    matchId,
    payload,
  );

  if (result.error) {
    throw result.error;
  }

  const roleNames = STAFF_ROLE_FIELD_MAP.map((item) => item.roleName);
  const rolesResult = await supabase
    .from("roles")
    .select("id, name")
    .in("name", roleNames);

  if (rolesResult.error) {
    throw rolesResult.error;
  }

  const roleIdsByName = new Map(
    (rolesResult.data ?? []).map((role) => [role.name, role.id]),
  );
  const roleIds = [...roleIdsByName.values()];

  if (roleIds.length) {
    const deleteAssignmentsResult = await supabase
      .from("assignments")
      .delete()
      .eq("match_id", matchId)
      .in("role_id", roleIds);

    if (deleteAssignmentsResult.error) {
      throw deleteAssignmentsResult.error;
    }
  }

  const assignments = buildStaffAssignments({
    matchId,
    formData,
    roleIdsByName,
  });

  if (assignments.length) {
    const assignmentsResult = await supabase
      .from("assignments")
      .upsert(assignments, { onConflict: "match_id,role_id" });

    if (assignmentsResult.error) {
      throw assignmentsResult.error;
    }
  }

  revalidatePath("/grid");
  revalidatePath(`/match/${matchId}`);
  revalidatePath(`/match/${matchId}/notificar`);

  return {
    matchId,
    redirectTo,
    notice: "Partido actualizado.",
  };
}

export async function createMatchAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");

  try {
    const result = await performCreateMatch(formData);
    redirectWithNotice({
      redirectTo: result.redirectTo,
      intent: "success",
      notice: result.notice,
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportMatchesFailure(error, { action: "create" });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: getDeleteMatchErrorNotice(error),
    });
  }
}

export async function updateMatchAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");

  try {
    const result = await performUpdateMatch(formData);
    redirectWithNotice({
      redirectTo: result.redirectTo,
      intent: "success",
      notice: result.notice,
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportMatchesFailure(error, { action: "update" });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}

export async function createMatchModalAction(
  _previousState: MatchModalActionState,
  formData: FormData,
): Promise<MatchModalActionState> {
  try {
    const result = await performCreateMatch(formData);
    return {
      status: "success",
      notice: result.notice,
      matchId: result.matchId,
      redirectTo: result.redirectTo,
      token: `${Date.now()}-${result.matchId}`,
    };
  } catch (error) {
    rethrowNavigationError(error);
    await reportMatchesFailure(error, { action: "create-modal" });
    return {
      status: "error",
      notice: ensureErrorMessage(error),
      token: `${Date.now()}-error`,
    };
  }
}

export async function updateMatchModalAction(
  _previousState: MatchModalActionState,
  formData: FormData,
): Promise<MatchModalActionState> {
  try {
    const result = await performUpdateMatch(formData);
    return {
      status: "success",
      notice: result.notice,
      matchId: result.matchId,
      redirectTo: result.redirectTo,
      token: `${Date.now()}-${result.matchId}`,
    };
  } catch (error) {
    rethrowNavigationError(error);
    await reportMatchesFailure(error, { action: "update-modal" });
    return {
      status: "error",
      notice: ensureErrorMessage(error),
      token: `${Date.now()}-error`,
    };
  }
}

export async function quickUpdateMatchFieldAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");
  await requireEditor();

  const matchId = String(formData.get("matchId") ?? "");
  const field = String(formData.get("field") ?? "");
  const rawValue = String(formData.get("value") ?? "").trim();

  try {
    const supabase = await createSupabaseServerClient();
    const payload: Record<string, string | number | null> = {};

    switch (field) {
      case "homeTeam":
        payload.home_team = rawValue;
        break;
      case "awayTeam":
        payload.away_team = rawValue;
        break;
      case "competition":
        payload.competition = maybeNull(rawValue);
        break;
      case "productionMode":
        payload.production_mode = assertProductionMode(rawValue);
        break;
      case "status":
        payload.status = assertMatchStatus(rawValue);
        break;
      default:
        throw new Error("Campo de edición rápida no soportado.");
    }

    const result = await supabase.from("matches").update(payload).eq("id", matchId);

    if (result.error) {
      throw result.error;
    }

    revalidatePath("/grid");
    revalidatePath(`/match/${matchId}`);
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Partido actualizado.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportMatchesFailure(error, { action: "quick-update", field });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}

export async function quickUpdateMatchFlatFieldAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");
  await requireEditor();

  const matchId = String(formData.get("matchId") ?? "");
  const field = String(formData.get("field") ?? "");
  const rawValue = String(formData.get("value") ?? "").trim();

  try {
    const supabase = await createSupabaseServerClient();
    const payload: MatchUpdate = {};

    switch (field) {
      case "time": {
        const matchResult = await supabase
          .from("matches")
          .select("kickoff_at, timezone")
          .eq("id", matchId)
          .single();

        if (matchResult.error) {
          throw matchResult.error;
        }

        const date = new Intl.DateTimeFormat("en-CA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          timeZone: matchResult.data.timezone,
        }).format(new Date(matchResult.data.kickoff_at));

        payload.kickoff_at = buildKickoffAt({
          date,
          time: rawValue,
          timezone: matchResult.data.timezone,
        });
        break;
      }
      case "venue":
        payload.venue = maybeNull(rawValue);
        break;
      case "homeTeam":
        payload.home_team = rawValue;
        break;
      case "awayTeam":
        payload.away_team = rawValue;
        break;
      case "productionCode":
        payload.production_code = maybeNull(rawValue);
        break;
      case "productionMode":
        payload.production_mode = assertProductionMode(rawValue);
        break;
      case "commentaryPlan":
        payload.commentary_plan = maybeNull(rawValue);
        break;
      case "transport":
        payload.transport = maybeNull(rawValue);
        break;
      case "notes":
        payload.notes = maybeNull(rawValue);
        break;
      case "owner":
        payload.owner_id = normalizeSelectedPersonId(rawValue);
        break;
      case "status":
        payload.status = assertMatchStatus(rawValue);
        break;
      default:
        throw new Error("Campo de edición plana no soportado.");
    }

    if (Object.keys(payload).length) {
      const updateResult = await updateMatchWithOptionalColumnFallback(
        supabase,
        matchId,
        payload,
      );

      if (updateResult.error) {
        throw updateResult.error;
      }
    }

    if (field === "owner") {
      const roleResult = await supabase
        .from("roles")
        .select("id")
        .eq("name", "Responsable")
        .maybeSingle();

      if (roleResult.error) {
        throw roleResult.error;
      }

      if (roleResult.data?.id) {
        const assignmentResult = await supabase.from("assignments").upsert(
          {
            match_id: matchId,
            role_id: roleResult.data.id,
            person_id: normalizeSelectedPersonId(rawValue),
            confirmed: false,
            confirmation_status: "pending",
            confirmation_responded_at: null,
            notes: null,
          },
          { onConflict: "match_id,role_id" },
        );

        if (assignmentResult.error) {
          throw assignmentResult.error;
        }
      }
    }

    revalidatePath("/grid");
    revalidatePath(`/match/${matchId}`);
    revalidatePath(`/match/${matchId}/notificar`);
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Campo actualizado.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportMatchesFailure(error, { action: "quick-flat-update", field });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}

export async function saveMatchPlanillaChangesAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");
  await requireEditor();

  let changes: MatchPlanillaDraftChange[] = [];
  let creates: MatchPlanillaDraftRow[] = [];
  let deletes: string[] = [];

  try {
    const parsed = JSON.parse(String(formData.get("changes") ?? "[]")) as unknown;

    if (Array.isArray(parsed)) {
      changes = parsed.filter(
        (item): item is MatchPlanillaDraftChange =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as MatchPlanillaDraftChange).matchId === "string" &&
          typeof (item as MatchPlanillaDraftChange).field === "string" &&
          typeof (item as MatchPlanillaDraftChange).value === "string",
      );
    }
  } catch {
    changes = [];
  }

  try {
    const parsed = JSON.parse(String(formData.get("creates") ?? "[]")) as unknown;

    if (Array.isArray(parsed)) {
      creates = parsed.filter(
        (item): item is MatchPlanillaDraftRow =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as MatchPlanillaDraftRow).id === "string" &&
          Boolean((item as MatchPlanillaDraftRow).fields) &&
          typeof (item as MatchPlanillaDraftRow).fields === "object",
      );
    }
  } catch {
    creates = [];
  }

  try {
    const parsed = JSON.parse(String(formData.get("deletes") ?? "[]")) as unknown;

    if (Array.isArray(parsed)) {
      deletes = parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    deletes = [];
  }

  if (!changes.length && !creates.length && !deletes.length) {
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "No había cambios pendientes.",
    });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const roleNames = Array.from(new Set(Object.values(PLANILLA_ROLE_FIELD_TO_ROLE_NAME)));
    const rolesResult = await supabase.from("roles").select("id, name").in("name", roleNames);

    if (rolesResult.error) {
      throw rolesResult.error;
    }

    const roleIdsByName = new Map(
      (rolesResult.data ?? []).map((role) => [role.name, role.id]),
    );

    for (const row of creates) {
      const fields = row.fields;
      const date = fields.date?.trim() ?? "";
      const time = fields.time?.trim() ?? "";
      const timezone = fields.timezone?.trim() || "America/Bogota";
      const homeTeam = fields.homeTeam?.trim() ?? "";
      const awayTeam = fields.awayTeam?.trim() ?? "";

      if (!date || !time || !homeTeam || !awayTeam) {
        throw new Error("Las filas nuevas requieren fecha, hora, equipo local y equipo visitante.");
      }

      const createResult = await insertMatchWithOptionalColumnFallback(supabase, {
        competition: maybeNull(fields.competition ?? ""),
        external_match_id: maybeNull(fields.externalMatchId ?? ""),
        production_code: maybeNull(fields.productionCode ?? ""),
        production_mode: assertProductionMode(fields.productionMode ?? ""),
        status: assertMatchStatus(fields.status ?? "Pendiente"),
        home_team: homeTeam,
        away_team: awayTeam,
        venue: maybeNull(fields.venue ?? ""),
        commentary_plan: maybeNull(fields.commentaryPlan ?? ""),
        transport: maybeNull(fields.transport ?? ""),
        kickoff_at: buildKickoffAt({ date, time, timezone }),
        duration_minutes: Number(fields.durationMinutes ?? 150),
        timezone,
        owner_id: normalizeSelectedPersonId(fields.ownerId),
        notes: maybeNull(fields.notes ?? ""),
      });

      if (createResult.error) {
        throw createResult.error;
      }

      const assignments = buildStaffAssignmentsFromFields({
        matchId: createResult.data.id,
        fields,
        roleIdsByName,
      });

      if (assignments.length) {
        const assignmentsResult = await supabase
          .from("assignments")
          .upsert(assignments, { onConflict: "match_id,role_id" });

        if (assignmentsResult.error) {
          throw assignmentsResult.error;
        }
      }

      revalidatePath(`/match/${createResult.data.id}`);
      revalidatePath(`/match/${createResult.data.id}/notificar`);
    }

    const changesByMatch = new Map<string, MatchPlanillaDraftChange[]>();

    for (const change of changes) {
      const current = changesByMatch.get(change.matchId) ?? [];
      current.push(change);
      changesByMatch.set(change.matchId, current);
    }

    for (const [matchId, matchChanges] of changesByMatch) {
      const payload: MatchUpdate = {};
      let timeValue: string | null = null;
      let dateValue: string | null = null;
      const roleChanges: Record<string, string> = {};

      for (const change of matchChanges) {
        const rawValue = change.value.trim();

        switch (change.field) {
          case "date":
            if (!rawValue) {
              throw new Error("La fecha no puede quedar vacía.");
            }
            dateValue = rawValue;
            break;
          case "time":
            if (!rawValue) {
              throw new Error("La hora no puede quedar vacía.");
            }
            timeValue = rawValue;
            break;
          case "homeTeam":
            if (!rawValue) {
              throw new Error("El equipo local no puede quedar vacío.");
            }
            payload.home_team = rawValue;
            break;
          case "awayTeam":
            if (!rawValue) {
              throw new Error("El equipo visitante no puede quedar vacío.");
            }
            payload.away_team = rawValue;
            break;
          case "competition":
            payload.competition = maybeNull(rawValue);
            break;
          case "venue":
            payload.venue = maybeNull(rawValue);
            break;
          case "productionCode":
            payload.production_code = maybeNull(rawValue);
            break;
          case "productionMode":
            payload.production_mode = assertProductionMode(rawValue);
            break;
          case "commentaryPlan":
            payload.commentary_plan = maybeNull(rawValue);
            break;
          case "transport":
            payload.transport = maybeNull(rawValue);
            break;
          case "notes":
            payload.notes = maybeNull(rawValue);
            break;
          case "owner":
            payload.owner_id = normalizeSelectedPersonId(rawValue);
            roleChanges.owner = rawValue;
            break;
          case "status":
            payload.status = assertMatchStatus(rawValue);
            break;
          default:
            if (change.field in PLANILLA_ROLE_FIELD_TO_ROLE_NAME) {
              roleChanges[change.field] = rawValue;
            }
            break;
        }
      }

      if (timeValue || dateValue) {
        const matchResult = await supabase
          .from("matches")
          .select("kickoff_at, timezone")
          .eq("id", matchId)
          .single();

        if (matchResult.error) {
          throw matchResult.error;
        }

        const existingDate = new Intl.DateTimeFormat("en-CA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          timeZone: matchResult.data.timezone,
        }).format(new Date(matchResult.data.kickoff_at));

        payload.kickoff_at = buildKickoffAt({
          date: dateValue ?? existingDate,
          time:
            timeValue ??
            new Intl.DateTimeFormat("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: matchResult.data.timezone,
            }).format(new Date(matchResult.data.kickoff_at)),
          timezone: matchResult.data.timezone,
        });
      }

      if (Object.keys(payload).length) {
        const updateResult = await updateMatchWithOptionalColumnFallback(
          supabase,
          matchId,
          payload,
        );

        if (updateResult.error) {
          throw updateResult.error;
        }
      }

      if (Object.keys(roleChanges).length) {
        const roleIds = Object.keys(roleChanges)
          .map((field) => roleIdsByName.get(PLANILLA_ROLE_FIELD_TO_ROLE_NAME[field]))
          .filter((roleId): roleId is string => Boolean(roleId));

        if (roleIds.length) {
          const deleteAssignmentsResult = await supabase
            .from("assignments")
            .delete()
            .eq("match_id", matchId)
            .in("role_id", roleIds);

          if (deleteAssignmentsResult.error) {
            throw deleteAssignmentsResult.error;
          }
        }

        const assignments = buildStaffAssignmentsFromFields({
          matchId,
          fields: roleChanges,
          roleIdsByName,
        });

        if (assignments.length) {
          const assignmentResult = await supabase
            .from("assignments")
            .upsert(assignments, { onConflict: "match_id,role_id" });

          if (assignmentResult.error) {
            throw assignmentResult.error;
          }
        }
      }

      revalidatePath(`/match/${matchId}`);
      revalidatePath(`/match/${matchId}/notificar`);
    }

    if (deletes.length) {
      const deleteResult = await supabase.from("matches").delete().in("id", deletes);

      if (deleteResult.error) {
        throw deleteResult.error;
      }
    }

    revalidatePath("/grid");
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Cambios de planilla guardados.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportMatchesFailure(error, { action: "save-planilla-changes" });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}

export async function deleteMatchAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");
  await requireEditor();
  const matchId = String(formData.get("matchId") ?? "");

  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.from("matches").delete().eq("id", matchId);

    if (result.error) {
      throw result.error;
    }

    revalidatePath("/grid");
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Partido eliminado.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportMatchesFailure(error, { action: "delete" });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}

export async function upsertAssignmentAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");
  await requireEditor();

  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.from("assignments").upsert(
      {
        match_id: String(formData.get("matchId") ?? ""),
        role_id: String(formData.get("roleId") ?? ""),
        person_id: maybeNull(String(formData.get("personId") ?? "")),
        confirmed: String(formData.get("confirmed") ?? "") === "on",
        confirmation_status:
          String(formData.get("confirmed") ?? "") === "on" ? "accepted" : "pending",
        confirmation_responded_at: null,
        notes: maybeNull(String(formData.get("notes") ?? "")),
      },
      {
        onConflict: "match_id,role_id",
      },
    );

    if (result.error) {
      throw result.error;
    }

    revalidatePath(redirectTo);
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Asignación actualizada.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportMatchesFailure(error, { action: "upsert-assignment" });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}
