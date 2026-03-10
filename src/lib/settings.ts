import { cookies } from "next/headers";

export const GEMINI_API_KEY_COOKIE = "bp_gemini_api_key";
export const GEMINI_MODEL_COOKIE = "bp_gemini_model";
export const UI_DENSITY_COOKIE = "bp_ui_density";

export const GEMINI_MODEL_OPTIONS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
] as const;

export const UI_DENSITY_OPTIONS = ["comoda", "compacta"] as const;

export type UiDensity = (typeof UI_DENSITY_OPTIONS)[number];
export type GeminiModel = (typeof GEMINI_MODEL_OPTIONS)[number];

export async function getSettingsSnapshot() {
  const store = await cookies();
  const geminiApiKey = store.get(GEMINI_API_KEY_COOKIE)?.value ?? "";
  const geminiModel =
    (store.get(GEMINI_MODEL_COOKIE)?.value as GeminiModel | undefined) ??
    "gemini-2.5-flash";
  const uiDensity =
    (store.get(UI_DENSITY_COOKIE)?.value as UiDensity | undefined) ?? "comoda";

  return {
    hasGeminiKey: Boolean(geminiApiKey),
    geminiModel,
    uiDensity,
  };
}

export function maskApiKey(value: string) {
  if (!value) {
    return "";
  }

  if (value.length <= 8) {
    return "********";
  }

  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
