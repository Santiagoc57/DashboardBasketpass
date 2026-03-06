"use server";

import { revalidatePath } from "next/cache";

import {
  getRedirectTarget,
  redirectWithNotice,
  rethrowNavigationError,
} from "@/app/actions/helpers";
import { MATCH_STATUS_OPTIONS, PRODUCTION_MODE_OPTIONS } from "@/lib/constants";
import { buildKickoffAt } from "@/lib/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";
import { ensureErrorMessage, maybeNull } from "@/lib/utils";

function assertMatchStatus(value: string) {
  if (!MATCH_STATUS_OPTIONS.includes(value as (typeof MATCH_STATUS_OPTIONS)[number])) {
    return "Pendiente";
  }

  return value as (typeof MATCH_STATUS_OPTIONS)[number];
}

function assertProductionMode(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (
    PRODUCTION_MODE_OPTIONS.includes(
      normalized as (typeof PRODUCTION_MODE_OPTIONS)[number],
    )
  ) {
    return normalized;
  }

  return null;
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

export async function createMatchAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");
  const createdMatchGridRedirect = getGridRedirectForCreatedMatch(formData, redirectTo);
  await requireEditor();

  try {
    const supabase = await createSupabaseServerClient();
    const kickoffAt = buildKickoffAt({
      date: String(formData.get("date") ?? ""),
      time: String(formData.get("time") ?? ""),
      timezone: String(formData.get("timezone") ?? ""),
    });

    const result = await supabase
      .from("matches")
      .insert({
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
        owner_id: maybeNull(String(formData.get("ownerId") ?? "")),
        notes: maybeNull(String(formData.get("notes") ?? "")),
      })
      .select("id")
      .single();

    if (result.error) {
      throw result.error;
    }

    revalidatePath("/grid");
    revalidatePath(`/match/${result.data.id}`);
    redirectWithNotice({
      redirectTo: createdMatchGridRedirect,
      intent: "success",
      notice: "Partido creado.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}

export async function updateMatchAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");
  await requireEditor();

  const matchId = String(formData.get("matchId") ?? "");

  try {
    const supabase = await createSupabaseServerClient();
    const kickoffAt = buildKickoffAt({
      date: String(formData.get("date") ?? ""),
      time: String(formData.get("time") ?? ""),
      timezone: String(formData.get("timezone") ?? ""),
    });

    const result = await supabase
      .from("matches")
      .update({
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
        owner_id: maybeNull(String(formData.get("ownerId") ?? "")),
        notes: maybeNull(String(formData.get("notes") ?? "")),
      })
      .eq("id", matchId);

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
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}

export async function deleteMatchAction(formData: FormData) {
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
      redirectTo: "/grid",
      intent: "success",
      notice: "Partido eliminado.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    redirectWithNotice({
      redirectTo: `/match/${matchId}`,
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
      notice: "Asignacion actualizada.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}
