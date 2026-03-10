import { Bot, KeyRound, Settings2, UserRound } from "lucide-react";

import {
  saveGeminiSettingsAction,
  savePreferencesAction,
} from "@/app/actions/settings";
import { SetupPanel } from "@/components/layout/setup-panel";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageMessage } from "@/components/ui/page-message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUserContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { ProfileAvatarSettings } from "@/components/settings/profile-avatar-settings";
import { GEMINI_MODEL_OPTIONS, getSettingsSnapshot, UI_DENSITY_OPTIONS } from "@/lib/settings";
import { parseNotice } from "@/lib/search-params";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { intent, notice } = parseNotice(resolvedSearchParams);

  if (!isSupabaseConfigured) {
    return <SetupPanel />;
  }

  const user = await requireUserContext();
  const settings = await getSettingsSnapshot();
  const displayName =
    user.profile?.full_name?.trim() || user.email?.split("@")[0] || "Usuario";

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-4xl font-black tracking-tight text-[var(--foreground)]">
          Configuración
        </h2>
        <p className="max-w-2xl text-sm font-medium leading-6 text-[#617187]">
          Ajusta tu perfil, la configuración de IA y algunas preferencias de
          interfaz para Basket Production.
        </p>
      </section>

      <PageMessage intent={intent} message={notice} />

      <Card className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <UserRound className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[var(--foreground)]">
              Perfil y avatar
            </h3>
            <p className="text-sm text-[#617187]">
              {displayName} · {user.email}
            </p>
          </div>
        </div>
        <ProfileAvatarSettings
          userId={user.userId}
          email={user.email}
          fullName={displayName}
        />
      </Card>

      <Card className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Bot className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[var(--foreground)]">
              Gemini
            </h3>
            <p className="text-sm text-[#617187]">
              Configura la clave para habilitar el panel &ldquo;Pregúntale a la
              IA&rdquo; en Personal.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-sm text-[#617187]">
          Estado actual:{" "}
          <span className="font-bold text-[var(--foreground)]">
            {settings.hasGeminiKey ? "Configurado" : "Sin configurar"}
          </span>
          {settings.hasGeminiKey ? (
            <span className="ml-2 font-mono text-xs text-[#94a3b8]">
              cookie segura activa
            </span>
          ) : null}
        </div>

        <form action={saveGeminiSettingsAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirectTo" value="/settings" />
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-[#334155]">
              API key de Gemini
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                name="geminiApiKey"
                type="password"
                placeholder="Pega aquí tu API key de Gemini"
                className="h-11 rounded-xl bg-[var(--background-soft)] pl-11"
              />
            </div>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-[#334155]">Modelo</span>
            <Select
              name="geminiModel"
              defaultValue={settings.geminiModel}
              className="h-11 rounded-xl bg-[var(--background-soft)]"
            >
              {GEMINI_MODEL_OPTIONS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end justify-end">
            <SubmitButton
              pendingLabel="Guardando..."
              className="h-11 rounded-xl px-5 text-sm font-bold"
            >
              Guardar Gemini
            </SubmitButton>
          </div>
        </form>
      </Card>

      <Card className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Settings2 className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[var(--foreground)]">
              Preferencias
            </h3>
            <p className="text-sm text-[#617187]">
              Ajustes básicos de interfaz y experiencia de uso.
            </p>
          </div>
        </div>

        <form action={savePreferencesAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirectTo" value="/settings" />
          <label className="space-y-2">
            <span className="text-sm font-bold text-[#334155]">
              Densidad de interfaz
            </span>
            <Select
              name="uiDensity"
              defaultValue={settings.uiDensity}
              className="h-11 rounded-xl bg-[var(--background-soft)]"
            >
              {UI_DENSITY_OPTIONS.map((density) => (
                <option key={density} value={density}>
                  {density === "comoda" ? "Cómoda" : "Compacta"}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end justify-end">
            <SubmitButton
              pendingLabel="Guardando..."
              className="h-11 rounded-xl px-5 text-sm font-bold"
            >
              Guardar preferencias
            </SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
