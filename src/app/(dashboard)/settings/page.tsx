import {
  Bot,
  CheckCircle2,
  KeyRound,
  Megaphone,
  type LucideIcon,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  deleteAnnouncementAction,
  saveAnnouncementAction,
  saveGeminiSettingsAction,
  testGeminiConnectionAction,
} from "@/app/actions/settings";
import { SetupPanel } from "@/components/layout/setup-panel";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageMessage } from "@/components/ui/page-message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  AnnouncementAudienceSelector,
} from "@/components/settings/announcement-audience-selector";
import { OperationsAdminPanel } from "@/components/settings/operations-admin-panel";
import { AnnouncementPreviewButton } from "@/components/settings/announcement-preview-button";
import { TeamIssueReportsPanel } from "@/components/settings/team-issue-reports-panel";
import { requireUserContext } from "@/lib/auth";
import { SECTION_COPY } from "@/lib/copy";
import { getLatestAnnouncement } from "@/lib/data/announcements";
import { getOperationsSnapshot } from "@/lib/data/operations";
import { getTeamIssueReportsSnapshot } from "@/lib/data/team-issue-reports";
import { type PersonRow, type TeamIssueReportRow } from "@/lib/database.types";
import {
  getAppRoleDisplayName,
  getRoleDisplayName,
} from "@/lib/display";
import { appEnv, isSupabaseConfigured } from "@/lib/env";
import {
  getPersonRoleValues,
  parsePersonNotesMeta,
} from "@/lib/people-notes";
import { getLinkedPersonForUser } from "@/lib/people-link";
import { ProfileAvatarSettings } from "@/components/settings/profile-avatar-settings";
import { getSettingsSnapshot } from "@/lib/settings";
import { parseNotice } from "@/lib/search-params";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatInTimeZone } from "date-fns-tz";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function SettingsSectionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <Icon className="size-[18px]" strokeWidth={1.9} />
    </span>
  );
}

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return formatInTimeZone(value, appEnv.appTimezone, "yyyy-MM-dd'T'HH:mm");
}

type AudienceType = "all" | "photographers" | "roles" | "people";
const ANNOUNCEMENT_DURATION_OPTIONS = [6, 12, 24, 48, 72] as const;

function isAudienceType(value: string | null | undefined): value is AudienceType {
  return (
    value === "all" ||
    value === "photographers" ||
    value === "roles" ||
    value === "people"
  );
}

function getAnnouncementDurationHours(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
) {
  if (!startsAt || !endsAt) {
    return 24;
  }

  const durationHours = Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / (1000 * 60 * 60),
  );

  return ANNOUNCEMENT_DURATION_OPTIONS.includes(
    durationHours as (typeof ANNOUNCEMENT_DURATION_OPTIONS)[number],
  )
    ? durationHours
    : 24;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { intent, notice } = parseNotice(resolvedSearchParams);

  if (!isSupabaseConfigured) {
    return <SetupPanel />;
  }

  const user = await requireUserContext();
  const settings = await getSettingsSnapshot();
  const latestAnnouncement = user.role === "admin"
    ? await getLatestAnnouncement()
    : null;
  const displayName =
    user.profile?.full_name?.trim() || user.email?.split("@")[0] || "Usuario";
  const supabase = await createSupabaseServerClient();
  const linkedPerson = await getLinkedPersonForUser({
    email: user.email,
    displayName,
  });
  const [
    audiencePeopleResult,
    audienceRolesResult,
    teamIssueReportsSnapshot,
    operationsSnapshot,
  ] = await Promise.all([
    user.role === "admin"
      ? supabase
          .from("people")
          .select("id, full_name, email, active, notes")
          .eq("active", true)
          .order("full_name", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    user.role === "admin"
      ? supabase
          .from("roles")
          .select("id, name, category, active, sort_order")
          .eq("active", true)
          .order("category", { ascending: true })
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    user.role === "admin"
      ? getTeamIssueReportsSnapshot(12)
      : Promise.resolve({ reports: [], missingTable: false }),
    user.role === "admin"
      ? getOperationsSnapshot()
      : Promise.resolve(null),
  ]);

  const linkedPersonMeta = parsePersonNotesMeta(linkedPerson?.notes);
  const linkedRoles = getPersonRoleValues(linkedPersonMeta).map((role) =>
    getRoleDisplayName(role),
  );
  const audiencePeople = (audiencePeopleResult.data ?? []) as Array<
    Pick<PersonRow, "id" | "full_name" | "email" | "active" | "notes">
  >;
  const audienceRoles = ((audienceRolesResult.data ?? []) as Array<{
    id: string;
    name: string;
    category: string;
    active: boolean;
    sort_order: number;
  }>).map((role) => ({
    ...role,
    label: `${getRoleDisplayName(role.name)} · ${role.category}`,
  }));
  const audienceRoleOptions = audienceRoles.map((role) => ({
    id: role.id,
    value: role.name,
    label: role.label,
  }));
  const teamIssueReports = teamIssueReportsSnapshot.reports as TeamIssueReportRow[];
  const teamIssueReportsMissingTable = teamIssueReportsSnapshot.missingTable;
  const openTeamIssueReports = teamIssueReports.filter(
    (report) => report.status === "new",
  );
  const resolvedTeamIssueReports = teamIssueReports.filter(
    (report) => report.status === "resolved",
  );
  const audiencePersonOptions = audiencePeople.map((person) => {
    const personRoles = getPersonRoleValues(parsePersonNotesMeta(person.notes)).map(
      (role) => getRoleDisplayName(role),
    );
    const normalizedRoles = personRoles
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return {
      id: person.id,
      label: person.full_name,
      subtitle: [
        personRoles.length ? personRoles.join(" · ") : null,
        person.email ?? null,
      ]
        .filter(Boolean)
        .join(" · "),
      isPhotographer:
        normalizedRoles.includes("camara") || normalizedRoles.includes("fotografo"),
    };
  });
  const selectedAudienceType = isAudienceType(latestAnnouncement?.audience_type)
    ? latestAnnouncement.audience_type
    : "all";

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
          {SECTION_COPY.settings.title}
        </h2>
        <p className="max-w-2xl text-sm font-medium leading-6 text-[#617187]">
          {SECTION_COPY.settings.description}
        </p>
      </section>

      <PageMessage intent={intent} message={notice} />

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] xl:items-start">

        {/* Column 1: Perfil + Gemini */}
        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <SettingsSectionIcon icon={UserRound} />
              <div>
                <h3 className="text-lg font-extrabold text-[var(--foreground)]">
                  Perfil y avatar
                </h3>
              </div>
            </div>
            <ProfileAvatarSettings
              userId={user.userId}
              email={user.email}
              fullName={displayName}
              editHref={linkedPerson ? `/people?edit=${linkedPerson.id}` : "/people"}
              roleLabel={getAppRoleDisplayName(user.role)}
              linkedPersonStatus={
                linkedPerson
                  ? linkedPerson.active
                    ? "Activo en Personal"
                    : "Inactivo en Personal"
                  : "Sin ficha en Personal"
              }
              phone={linkedPerson?.phone ?? null}
              city={linkedPersonMeta.city || null}
              coverage={linkedPersonMeta.coverage || null}
              notes={linkedPersonMeta.notes || null}
              roles={linkedRoles}
            />
          </Card>

          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <SettingsSectionIcon icon={Bot} />
              <div>
                <h3 className="text-lg font-extrabold text-[var(--foreground)]">
                  Gemini
                </h3>
              </div>
            </div>
            <form action={saveGeminiSettingsAction} className="grid gap-4">
              <input type="hidden" name="redirectTo" value="/settings" />
              <input
                type="hidden"
                name="geminiScope"
                value={user.role === "admin" ? "portal" : "personal"}
              />
              <div className="grid gap-3">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">
                    API key de Gemini
                  </span>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <Input
                      name="geminiApiKey"
                      type="password"
                      placeholder="Pega aquí la API key de Gemini"
                      className="h-11 rounded-xl bg-[var(--background-soft)] pl-11"
                    />
                  </div>
                </label>

                <div className="flex flex-nowrap items-center gap-3">
                  <button
                    type="submit"
                    formAction={testGeminiConnectionAction}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[#334155] transition hover:bg-[var(--background-soft)]"
                    title="Probar conexión"
                  >
                    Probar conexión
                  </button>
                  <SubmitButton
                    pendingLabel="..."
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl px-0 text-sm font-bold"
                    aria-label="Guardar Gemini"
                    title="Guardar Gemini"
                  >
                    <Save className="size-4" />
                  </SubmitButton>

                  {settings.hasGeminiKey ? (
                    <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-soft)] px-3 text-sm font-semibold text-[#617187]">
                      <CheckCircle2 className="size-4 text-[#22c55e]" />
                      Listo
                    </span>
                  ) : (
                    <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-soft)] px-3 text-sm font-semibold text-[#617187]">
                      Sin clave
                    </span>
                  )}

                  <label className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-soft)] text-[#617187] transition hover:border-[#f0c8d1] hover:bg-[#fff4f6] hover:text-[var(--accent)]">
                    <input
                      type="checkbox"
                      name="clearGeminiKey"
                      className="sr-only"
                    />
                    <Trash2 className="size-4" />
                  </label>
                </div>
              </div>

              <input type="hidden" name="geminiModel" value={settings.geminiModel} />
            </form>
          </Card>

          {user.role === "admin" && operationsSnapshot ? (
            <OperationsAdminPanel snapshot={operationsSnapshot} />
          ) : null}
        </div>

        {/* Column 2: Comunicado + Reportes + Operaciones */}
        <div className="space-y-6">
          {user.role === "admin" ? (
            <Card className="space-y-5">
              <div className="flex items-center gap-3">
                <SettingsSectionIcon icon={Megaphone} />
                <div>
                  <h3 className="text-lg font-extrabold text-[var(--foreground)]">
                    Comunicado general
                  </h3>
                </div>
              </div>

              <form action={saveAnnouncementAction} className="grid gap-4">
                <input type="hidden" name="redirectTo" value="/settings" />
                <input
                  type="hidden"
                  name="announcementId"
                  value={latestAnnouncement?.id ?? ""}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-[#334155]">Título</span>
                    <Input
                      name="announcementTitle"
                      defaultValue=""
                      placeholder="Ej. Ajuste de horarios para la jornada de hoy"
                      className="h-11 rounded-xl bg-[var(--background-soft)]"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-[#334155]">
                      Texto del botón
                    </span>
                    <Input
                      name="announcementDismissLabel"
                      defaultValue={latestAnnouncement?.dismiss_label ?? ""}
                      placeholder="Entendido"
                      className="h-11 rounded-xl bg-[var(--background-soft)]"
                    />
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">Mensaje</span>
                  <Textarea
                    name="announcementBody"
                    defaultValue=""
                    placeholder="Escribe aquí el comunicado que verán todos al iniciar sesión."
                    className="bg-[var(--background-soft)]"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-[#334155]">
                      Visible desde
                    </span>
                    <Input
                      name="announcementStartsAt"
                      type="datetime-local"
                      defaultValue={toDateTimeLocalValue(latestAnnouncement?.starts_at)}
                      className="h-11 rounded-xl bg-[var(--background-soft)]"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-[#334155]">
                      Visible por
                    </span>
                    <Select
                      name="announcementDurationHours"
                      defaultValue={String(
                        getAnnouncementDurationHours(
                          latestAnnouncement?.starts_at,
                          latestAnnouncement?.ends_at,
                        ),
                      )}
                      className="h-11 rounded-xl bg-[var(--background-soft)]"
                    >
                      {ANNOUNCEMENT_DURATION_OPTIONS.map((hours) => (
                        <option key={hours} value={hours}>
                          {hours} horas
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>

                <p className="text-xs text-[#94a3b8]">
                  El popup se mostrará desde la fecha elegida y se ocultará
                  automáticamente después de la duración seleccionada en{" "}
                  {appEnv.appTimezone}.
                </p>

                <AnnouncementAudienceSelector
                  defaultAudienceType={selectedAudienceType}
                  roleOptions={audienceRoleOptions}
                  personOptions={audiencePersonOptions}
                  defaultRoleTargets={latestAnnouncement?.target_role_names ?? []}
                  defaultPersonTargets={latestAnnouncement?.target_person_ids ?? []}
                />

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <AnnouncementPreviewButton />
                  {latestAnnouncement ? (
                    <button
                      type="submit"
                      formAction={deleteAnnouncementAction}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-[#f0c8d1] bg-[#fff4f6] px-5 text-sm font-bold text-[#ad1d39] transition hover:bg-[#ffe9ee]"
                    >
                      Eliminar comunicado
                    </button>
                  ) : null}
                  <SubmitButton
                    pendingLabel="Publicando..."
                    className="h-11 rounded-xl px-5 text-sm font-bold"
                  >
                    Publicar comunicado
                  </SubmitButton>
                </div>
              </form>
            </Card>
          ) : null}

          {user.role === "admin" ? (
            <TeamIssueReportsPanel
              openReports={openTeamIssueReports}
              resolvedReports={resolvedTeamIssueReports}
              missingTable={teamIssueReportsMissingTable}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
