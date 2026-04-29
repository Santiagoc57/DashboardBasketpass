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
