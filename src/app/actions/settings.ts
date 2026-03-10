"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  getRedirectTarget,
  redirectWithNotice,
  rethrowNavigationError,
} from "@/app/actions/helpers";
import { requireUserContext } from "@/lib/auth";
import {
  GEMINI_API_KEY_COOKIE,
  GEMINI_MODEL_COOKIE,
  GEMINI_MODEL_OPTIONS,
  UI_DENSITY_COOKIE,
  UI_DENSITY_OPTIONS,
} from "@/lib/settings";

function isAllowedValue<T extends readonly string[]>(value: string, options: T) {
  return options.includes(value as T[number]);
}

const isSecureCookie = process.env.NODE_ENV === "production";

export async function saveGeminiSettingsAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/settings");
  await requireUserContext();

  try {
    const apiKey = String(formData.get("geminiApiKey") ?? "").trim();
    const model = String(formData.get("geminiModel") ?? "gemini-2.5-flash").trim();
    const store = await cookies();

    if (apiKey) {
      store.set(GEMINI_API_KEY_COOKIE, apiKey, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecureCookie,
        path: "/",
      });
    } else {
      store.delete(GEMINI_API_KEY_COOKIE);
    }

    if (isAllowedValue(model, GEMINI_MODEL_OPTIONS)) {
      store.set(GEMINI_MODEL_COOKIE, model, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecureCookie,
        path: "/",
      });
    }

    revalidatePath("/settings");
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: apiKey
        ? "Configuración de Gemini actualizada."
        : "Clave de Gemini eliminada.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "No pudimos guardar la configuración de Gemini.",
    });
  }
}

export async function savePreferencesAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/settings");
  await requireUserContext();

  try {
    const density = String(formData.get("uiDensity") ?? "comoda").trim();
    const store = await cookies();

    if (isAllowedValue(density, UI_DENSITY_OPTIONS)) {
      store.set(UI_DENSITY_COOKIE, density, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecureCookie,
        path: "/",
      });
    }

    revalidatePath("/settings");
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Preferencias de interfaz actualizadas.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: "No pudimos guardar tus preferencias.",
    });
  }
}
