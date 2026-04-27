"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";

import {
  getRedirectTarget,
  redirectWithNotice,
  rethrowNavigationError,
} from "@/app/actions/helpers";
import { requireUserContext } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import { emitOperationalAlert } from "@/lib/monitoring";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLinkedPersonForUserContext } from "@/lib/people-link";
import {
  GEMINI_API_KEY_COOKIE,
  GEMINI_GLOBAL_SETTING_KEY,
  GEMINI_MODEL_COOKIE,
  GEMINI_MODEL_OPTIONS,
  getGeminiRuntimeConfig,
  isGeminiModel,
} from "@/lib/settings";
import { ensureErrorMessage } from "@/lib/utils";

function isAllowedValue<T extends readonly string[]>(value: string, options: T) {
  return options.includes(value as T[number]);
}

function isMissingAppSettingsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode =
    "code" in error && typeof error.code === "string" ? error.code : "";
  const maybeMessage =
    "message" in error && typeof error.message === "string" ? error.message : "";

  return maybeCode === "42P01" || maybeMessage.includes("app_settings");
}

function isMissingAnnouncementsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode =
    "code" in error && typeof error.code === "string" ? error.code : "";
  const maybeMessage =
    "message" in error && typeof error.message === "string" ? error.message : "";

  return (
    maybeCode === "42P01" ||
    maybeCode === "PGRST205" ||
    maybeMessage.includes("announcements")
  );
}

function isMissingAnnouncementSchedulingError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode =
    "code" in error && typeof error.code === "string" ? error.code : "";
  const maybeMessage =
    "message" in error && typeof error.message === "string" ? error.message : "";

  return (
    maybeCode === "42703" ||
    maybeMessage.includes("starts_at") ||
    maybeMessage.includes("ends_at") ||
    maybeMessage.includes("eyebrow_label") ||
    maybeMessage.includes("dismiss_label")
  );
}

function isMissingAnnouncementAudienceError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode =
    "code" in error && typeof error.code === "string" ? error.code : "";
  const maybeMessage =
    "message" in error && typeof error.message === "string" ? error.message : "";

  return (
    maybeCode === "42703" ||
    maybeMessage.includes("audience_type") ||
    maybeMessage.includes("target_role_names") ||
    maybeMessage.includes("target_person_ids")
  );
}

const isSecureCookie = process.env.NODE_ENV === "production";
const ANNOUNCEMENT_REVALIDATE_PATHS = [
  "/settings",
  "/mi-jornada",
  "/grid",
  "/reports",
  "/incidents",
];
const ANNOUNCEMENT_DURATION_OPTIONS = [6, 12, 24, 48, 72] as const;

const PROFILE_REVALIDATE_PATHS = [
  "/settings",
  "/mi-jornada",
  "/grid",
  "/reports",
  "/incidents",
  "/people",
  "/teams",
];

type GeminiSaveScope = "personal" | "portal";
type GeminiSourceLabel = "Sesión personal" | "Global de la plataforma" | "Servidor";

async function reportSettingsFailure(
  error: unknown,
  action: string,
  severity: "warning" | "critical" = "critical",
  details: Record<string, unknown> = {},
) {
  await emitOperationalAlert({
    area: "settings",
    severity,
    message: "Falló una operación de configuración.",
    error: ensureErrorMessage(error),
    details: { action, ...details },
  });
}

function parseOptionalAnnouncementDateTime(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const localDateTime = raw.length === 16 ? `${raw}:00` : raw;
  const parsedDate = fromZonedTime(localDateTime, appEnv.appTimezone);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}

function resolveGeminiSaveScope(rawValue: FormDataEntryValue | null, isAdmin: boolean) {
  const value = String(rawValue ?? "").trim();

  if (isAdmin && value === "portal") {
    return "portal" as GeminiSaveScope;
  }

  return "personal" as GeminiSaveScope;
}

function getGeminiSourceNoticeLabel(source: string): GeminiSourceLabel {
  if (source === "portal") {
    return "Global de la plataforma";
  }

  if (source === "env") {
    return "Servidor";
  }

  return "Sesión personal";
}

function summarizeGeminiFailure(detail: string) {
  const trimmed = detail.trim();
  if (!trimmed) {
    return "Gemini respondió con un error sin detalle.";
  }

  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
}

export async function saveGeminiSettingsAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/settings");
  const user = await requireUserContext();

  try {
    const apiKey = String(formData.get("geminiApiKey") ?? "").trim();
    const model = String(formData.get("geminiModel") ?? "gemini-2.5-flash").trim();
    const clearRequested = String(formData.get("clearGeminiKey") ?? "").trim() === "on";
    const scope = resolveGeminiSaveScope(formData.get("geminiScope"), user.role === "admin");
    const store = await cookies();
    const resolvedModel = isGeminiModel(model) ? model : "gemini-2.5-flash";
    const existingPersonalApiKey = store.get(GEMINI_API_KEY_COOKIE)?.value?.trim() ?? "";

    if (clearRequested && apiKey) {
      redirectWithNotice({
        redirectTo,
        intent: "error",
        notice:
          "No combines una nueva API key con la opción de eliminar la clave actual.",
      });
    }

    let notice = "";

    if (scope === "personal") {
      const finalPersonalApiKey = clearRequested ? "" : apiKey || existingPersonalApiKey;

      if (finalPersonalApiKey) {
        store.set(GEMINI_API_KEY_COOKIE, finalPersonalApiKey, {
          httpOnly: true,
          sameSite: "lax",
          secure: isSecureCookie,
          path: "/",
        });
      } else {
        store.delete(GEMINI_API_KEY_COOKIE);
      }

      if (isAllowedValue(resolvedModel, GEMINI_MODEL_OPTIONS)) {
        store.set(GEMINI_MODEL_COOKIE, resolvedModel, {
          httpOnly: true,
          sameSite: "lax",
          secure: isSecureCookie,
          path: "/",
        });
      }

      if (clearRequested) {
        notice = "Clave personal de Gemini eliminada.";
      } else if (apiKey) {
        notice = "Gemini actualizado para tu sesión.";
      } else if (existingPersonalApiKey) {
        notice = "Modelo personal de Gemini actualizado.";
      } else {
        notice = "No había una clave personal guardada. Solo se actualizó el modelo.";
      }
    } else {
      const supabase = await createSupabaseServerClient();
      const currentPortalResult = await supabase
        .from("app_settings")
        .select("secret_value")
        .eq("setting_key", GEMINI_GLOBAL_SETTING_KEY)
        .maybeSingle();

      if (currentPortalResult.error && isMissingAppSettingsError(currentPortalResult.error)) {
        redirectWithNotice({
          redirectTo,
          intent: "error",
          notice:
            "Falta la migración 0008 para guardar la clave global de Gemini en la plataforma.",
        });
      }

      if (currentPortalResult.error) {
        throw currentPortalResult.error;
      }

      const existingPortalApiKey = currentPortalResult.data?.secret_value?.trim() ?? "";
      const finalPortalApiKey = clearRequested ? "" : apiKey || existingPortalApiKey;

      store.delete(GEMINI_API_KEY_COOKIE);
      store.delete(GEMINI_MODEL_COOKIE);

      if (finalPortalApiKey) {
        const upsertResult = await supabase
          .from("app_settings")
          .upsert(
            {
              setting_key: GEMINI_GLOBAL_SETTING_KEY,
              secret_value: finalPortalApiKey,
              public_value: resolvedModel,
            },
            { onConflict: "setting_key" },
          );

        if (upsertResult.error) {
          throw upsertResult.error;
        }

        if (clearRequested) {
          notice = "Clave global de Gemini eliminada y reemplazada.";
        } else if (apiKey) {
          notice = "Gemini global actualizado para toda la plataforma.";
        } else {
          notice = "Modelo global de Gemini actualizado para toda la plataforma.";
        }
      } else {
        const deleteResult = await supabase
          .from("app_settings")
          .delete()
          .eq("setting_key", GEMINI_GLOBAL_SETTING_KEY);

        if (deleteResult.error) {
          throw deleteResult.error;
        }

        if (clearRequested || existingPortalApiKey) {
          notice = "Clave global de Gemini eliminada de la plataforma.";
        } else {
          notice =
            "No había una clave global guardada. Pega una API key para habilitar Gemini en toda la plataforma.";
        }
      }
    }

    revalidatePath("/settings");
    ANNOUNCEMENT_REVALIDATE_PATHS.forEach((path) => {
      revalidatePath(path);
    });
    revalidatePath("/people");
    revalidatePath("/teams");
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice,
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportSettingsFailure(error, "save-gemini", "critical", {
      role: user.role,
    });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "No pudimos guardar la configuración de Gemini.",
    });
  }
}

export async function testGeminiConnectionAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/settings");

  try {
    await requireUserContext();
    const { apiKey, model, source } = await getGeminiRuntimeConfig();

    if (!apiKey) {
      redirectWithNotice({
        redirectTo,
        intent: "error",
        notice:
          "No hay una configuración activa de Gemini para probar. Guarda primero una clave global o personal.",
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: "Respond only with OK." }],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 8,
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = summarizeGeminiFailure(await response.text());
      redirectWithNotice({
        redirectTo,
        intent: "error",
        notice: `Gemini respondió con error usando ${getGeminiSourceNoticeLabel(source)}: ${detail}`,
      });
    }

    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: `Conexión OK con Gemini (${model}) usando ${getGeminiSourceNoticeLabel(source)}.`,
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportSettingsFailure(error, "test-gemini", "warning");
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: `No pudimos probar Gemini. ${ensureErrorMessage(error)}`,
    });
  }
}

export async function saveAnnouncementAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/settings");
  const user = await requireUserContext();
  const announcementId = String(formData.get("announcementId") ?? "").trim();
  const title = String(formData.get("announcementTitle") ?? "").trim();
  const body = String(formData.get("announcementBody") ?? "").trim();
  const dismissLabel = String(formData.get("announcementDismissLabel") ?? "").trim();
  const startsAt = parseOptionalAnnouncementDateTime(formData.get("announcementStartsAt"));
  const durationHoursRaw = Number(
    String(formData.get("announcementDurationHours") ?? "24").trim(),
  );
  const durationHours = ANNOUNCEMENT_DURATION_OPTIONS.includes(
    durationHoursRaw as (typeof ANNOUNCEMENT_DURATION_OPTIONS)[number],
  )
    ? durationHoursRaw
    : 24;
  const audienceType = String(
    formData.get("announcementAudienceType") ?? "all",
  ).trim();
  const targetRoleNames = formData
    .getAll("announcementRoleTargets")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const targetPersonIds = formData
    .getAll("announcementPersonTargets")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (user.role !== "admin") {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "Solo un administrador puede publicar comunicados generales.",
    });
  }

  if (!title || !body) {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "El comunicado necesita título y mensaje.",
    });
  }

  if (
    String(formData.get("announcementStartsAt") ?? "").trim() &&
    !startsAt
  ) {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "La fecha de inicio del comunicado no es válida.",
    });
  }

  if (!["all", "photographers", "roles", "people"].includes(audienceType)) {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "Selecciona una audiencia válida para el comunicado.",
    });
  }

  if (audienceType === "roles" && targetRoleNames.length === 0) {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "Selecciona al menos un rol para esa audiencia.",
    });
  }

  if (
    (audienceType === "people" || audienceType === "photographers") &&
    targetPersonIds.length === 0
  ) {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "Selecciona al menos una persona para esa audiencia.",
    });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const computedStartsAt = startsAt ?? new Date().toISOString();
    const computedEndsAt = new Date(
      new Date(computedStartsAt).getTime() + durationHours * 60 * 60 * 1000,
    ).toISOString();

    if (announcementId) {
      const updateResult = await supabase
        .from("announcements")
        .update({
          title,
          body,
          active: true,
          eyebrow_label: null,
          dismiss_label: dismissLabel || null,
          starts_at: computedStartsAt,
          ends_at: computedEndsAt,
          audience_type: audienceType,
          target_role_names: audienceType === "roles" ? targetRoleNames : [],
          target_person_ids:
            audienceType === "roles" || audienceType === "all"
              ? []
              : targetPersonIds,
        })
        .eq("id", announcementId)
        .select("id")
        .single();

      if (updateResult.error) {
        throw updateResult.error;
      }
    } else {
      const insertResult = await supabase
        .from("announcements")
        .insert({
          title,
          body,
          active: true,
          eyebrow_label: null,
          dismiss_label: dismissLabel || null,
          starts_at: computedStartsAt,
          ends_at: computedEndsAt,
          audience_type: audienceType,
          target_role_names: audienceType === "roles" ? targetRoleNames : [],
          target_person_ids:
            audienceType === "roles" || audienceType === "all"
              ? []
              : targetPersonIds,
        })
        .select("id")
        .single();

      if (insertResult.error) {
        throw insertResult.error;
      }
    }

    ANNOUNCEMENT_REVALIDATE_PATHS.forEach((path) => {
      revalidatePath(path);
    });

    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice:
        startsAt && new Date(startsAt).getTime() > Date.now()
          ? "Comunicado programado."
          : "Comunicado general publicado.",
    });
  } catch (error) {
    rethrowNavigationError(error);

    if (isMissingAnnouncementsError(error)) {
      await reportSettingsFailure(error, "save-announcement", "warning", {
        reason: "missing-announcements-schema",
      });
      redirectWithNotice({
        redirectTo,
        intent: "error",
        notice:
          "Falta aplicar la migración 0006_add_announcements.sql para habilitar comunicados generales.",
      });
    }

    if (isMissingAnnouncementSchedulingError(error)) {
      await reportSettingsFailure(error, "save-announcement", "warning", {
        reason: "missing-announcement-scheduling-schema",
      });
      redirectWithNotice({
        redirectTo,
        intent: "error",
        notice:
          "Falta aplicar la migración 0010_add_announcement_scheduling_and_customization.sql para habilitar programación y personalización de comunicados.",
      });
    }

    if (isMissingAnnouncementAudienceError(error)) {
      await reportSettingsFailure(error, "save-announcement", "warning", {
        reason: "missing-announcement-audience-schema",
      });
      redirectWithNotice({
        redirectTo,
        intent: "error",
        notice:
          "Falta aplicar la migración 0011_add_announcement_audience_targeting.sql para habilitar audiencias por fotógrafos, roles o personas.",
      });
    }

    await reportSettingsFailure(error, "save-announcement", "critical", {
      announcementId: announcementId || null,
      audienceType,
    });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "No pudimos guardar el comunicado general.",
    });
  }
}

export async function saveProfileNameAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/settings");
  const user = await requireUserContext();
  const firstName = String(formData.get("profileFirstName") ?? "").trim();
  const lastName = String(formData.get("profileLastName") ?? "").trim();

  if (!firstName) {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "Completa al menos el nombre para guardar el perfil.",
    });
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  try {
    const supabase = await createSupabaseServerClient();

    const profileResult = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.userId);

    if (profileResult.error) {
      throw profileResult.error;
    }

    const linkedPerson = await getLinkedPersonForUserContext(user);

    if (linkedPerson) {
      const personResult = await supabase
        .from("people")
        .update({ full_name: fullName })
        .eq("id", linkedPerson.id);

      if (personResult.error) {
        throw personResult.error;
      }
    }

    PROFILE_REVALIDATE_PATHS.forEach((path) => {
      revalidatePath(path);
    });

    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Nombre y apellido actualizados.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportSettingsFailure(error, "save-profile-name", "critical", {
      userId: user.userId,
    });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "No pudimos actualizar el nombre y apellido.",
    });
  }
}

export async function deleteAnnouncementAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/settings");
  const user = await requireUserContext();
  const announcementId = String(formData.get("announcementId") ?? "").trim();

  if (user.role !== "admin") {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "Solo un administrador puede eliminar comunicados generales.",
    });
  }

  if (!announcementId) {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "No encontramos un comunicado para eliminar.",
    });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const deleteResult = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId);

    if (deleteResult.error) {
      throw deleteResult.error;
    }

    ANNOUNCEMENT_REVALIDATE_PATHS.forEach((path) => {
      revalidatePath(path);
    });

    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Comunicado eliminado.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportSettingsFailure(error, "delete-announcement", "critical", {
      announcementId: announcementId || null,
    });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "No pudimos eliminar el comunicado general.",
    });
  }
}

export async function resolveTeamIssueReportAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/settings");
  const user = await requireUserContext();
  const reportId = String(formData.get("reportId") ?? "").trim();

  if (user.role !== "admin") {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "Solo un administrador puede cerrar reportes de equipos.",
    });
  }

  if (!reportId) {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "No encontramos un reporte para cerrar.",
    });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const updateResult = await supabase
      .from("team_issue_reports")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: user.userId,
      })
      .eq("id", reportId)
      .eq("status", "new");

    if (updateResult.error) {
      throw updateResult.error;
    }

    revalidatePath("/settings");
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Reporte de equipo marcado como resuelto.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportSettingsFailure(error, "resolve-team-issue-report", "critical", {
      reportId,
      userId: user.userId,
    });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "No pudimos cerrar el reporte de equipo.",
    });
  }
}

export async function deleteTeamIssueReportAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/settings");
  const user = await requireUserContext();
  const reportId = String(formData.get("reportId") ?? "").trim();

  if (user.role !== "admin") {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "Solo un administrador puede eliminar reportes de equipos.",
    });
  }

  if (!reportId) {
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "No encontramos un reporte para eliminar.",
    });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const deleteResult = await supabase
      .from("team_issue_reports")
      .delete()
      .eq("id", reportId);

    if (deleteResult.error) {
      throw deleteResult.error;
    }

    revalidatePath("/settings");
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Reporte de equipo eliminado.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    await reportSettingsFailure(error, "delete-team-issue-report", "critical", {
      reportId,
      userId: user.userId,
    });
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "No pudimos eliminar el reporte de equipo.",
    });
  }
}
