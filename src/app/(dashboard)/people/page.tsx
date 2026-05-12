import Link from "next/link";
import {
  LayoutGrid,
  Rows3,
  ShieldCheck,
  X,
} from "lucide-react";

import { upsertPersonAction } from "@/app/actions/people";
import { SectionAiAssistant } from "@/components/ai/section-ai-assistant";
import { SectionPageHeader } from "@/components/layout/section-page-header";
import { SetupPanel } from "@/components/layout/setup-panel";
import { PeopleDirectoryView } from "@/components/people/people-directory-view";
import { CreatePersonModal } from "@/components/people/create-person-modal";
import { PeopleExportButton } from "@/components/people/people-export-button";
import { PersonDeleteButton } from "@/components/people/person-delete-button";
import { PersonRevokeAccessButton } from "@/components/people/person-revoke-access-button";
import { TeamCoverageField } from "@/components/people/team-coverage-field";
import { PeopleTable } from "@/components/people/people-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageMessage } from "@/components/ui/page-message";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { SectionTableCard } from "@/components/ui/section-table-card";
import { Textarea } from "@/components/ui/textarea";
import { ToolbarSearchField } from "@/components/ui/toolbar-search-field";
import { requireUserContext } from "@/lib/auth";
import { SECTION_COPY } from "@/lib/copy";
import {
  PLATFORM_ACCESS_ROLE_OPTIONS,
  resolveDashboardAccessRole,
  ROLE_SEED,
} from "@/lib/constants";
import { getPeopleData } from "@/lib/data/dashboard";
import type { AppRole } from "@/lib/database.types";
import {
  getAppRoleDisplayName,
  getAssignmentStateDisplayName,
  getRoleDisplayName,
} from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/env";
import type { PeopleAiContextItem } from "@/lib/people-ai";
import { getPersonRoleValues, parsePersonNotesMeta } from "@/lib/people-notes";
import { parseNotice } from "@/lib/search-params";
import { getSettingsSnapshot } from "@/lib/settings";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TEAM_DIRECTORY } from "@/lib/team-directory";
import type { PersonListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ROLE_OPTIONS = Array.from(
  new Map(ROLE_SEED.map((role) => [role.name, role])).values(),
).map((role) => role.name);
const TEAM_OPTIONS = Array.from(
  TEAM_DIRECTORY.reduce((map, team) => {
    if (!map.has(team.official_name)) {
      map.set(team.official_name, {
        name: team.official_name,
        stadium: team.stadium,
        competition: team.competition,
      });
    }

    return map;
  }, new Map<string, { name: string; stadium: string | null; competition: string }>())
    .values(),
).sort((left, right) => left.name.localeCompare(right.name, "es"));

type PlatformAccessRole = (typeof PLATFORM_ACCESS_ROLE_OPTIONS)[number];

function isPlatformAccessRole(value: AppRole | null): value is PlatformAccessRole {
  return PLATFORM_ACCESS_ROLE_OPTIONS.some((role) => role === value);
}

function toPeopleAiContext(people: PersonListItem[]): PeopleAiContextItem[] {
  return people.map((person) => {
    const meta = parsePersonNotesMeta(person.notes);
    const roles = getPersonRoleValues(meta, person.primary_role);

    return {
      fullName: person.full_name,
      role: roles.map((role) => getRoleDisplayName(role)).join(", "),
      city: meta.city || "",
      coverage: meta.coverage || "",
      phone: person.phone ?? "",
      email: person.email ?? "",
      status: getAssignmentStateDisplayName(person.assignment_state),
      notes: meta.notes ?? "",
    };
  });
}

function buildPeopleHref(
  params: Record<string, string | string[] | undefined>,
  updates: Record<string, string | undefined>,
) {
  const search = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(params)) {
    if (typeof rawValue === "string" && rawValue) {
      search.set(key, rawValue);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      search.delete(key);
      continue;
    }

    search.set(key, value);
  }

  const query = search.toString();
  return query ? `/people?${query}` : "/people";
}

export default async function PeoplePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { intent, notice } = parseNotice(resolvedSearchParams);
  const query =
    typeof resolvedSearchParams.q === "string"
      ? resolvedSearchParams.q.trim()
      : "";
  const viewMode =
    resolvedSearchParams.view === "table" ? "table" : "directory";
  const editPersonId =
    typeof resolvedSearchParams.edit === "string"
      ? resolvedSearchParams.edit
      : undefined;

  if (!isSupabaseConfigured) {
    return <SetupPanel />;
  }

  const user = await requireUserContext();
  const allPeople = await getPeopleData();
  const platformAccessByEmail = new Map<string, PlatformAccessRole>();

  if (user.role === "admin") {
    try {
      const supabaseAdmin = createSupabaseAdminClient();
      const usersResult = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (!usersResult.error) {
        const authUserIds = usersResult.data.users
          .map((authUser) => authUser.id)
          .filter(Boolean);
        const profilesById = new Map<string, AppRole | null>();

        if (authUserIds.length) {
          const profilesQuery = await supabaseAdmin
            .from("profiles")
            .select("id, role")
            .in("id", authUserIds);

          if (!profilesQuery.error) {
            for (const profile of profilesQuery.data ?? []) {
              profilesById.set(profile.id, profile.role as AppRole | null);
            }
          }
        }

        for (const authUser of usersResult.data.users) {
          const email = authUser.email?.trim().toLowerCase();

          if (!email) {
            continue;
          }

          const resolvedRole = resolveDashboardAccessRole({
            profileRole: profilesById.get(authUser.id) ?? null,
            appMetadata:
              (authUser.app_metadata as Record<string, unknown> | null) ?? null,
          });

          if (isPlatformAccessRole(resolvedRole)) {
            platformAccessByEmail.set(email, resolvedRole);
          }
        }
      }
    } catch {
      platformAccessByEmail.clear();
    }
  }

  const allPeopleWithAccess = allPeople.map((person) => ({
    ...person,
    platform_access_role: person.email
      ? platformAccessByEmail.get(person.email.trim().toLowerCase()) ?? null
      : null,
  }));
  const people = allPeopleWithAccess.filter((person) => {
    if (!query) {
      return true;
    }

    const meta = parsePersonNotesMeta(person.notes);
    const roles = getPersonRoleValues(meta, person.primary_role);
    const haystack = [
      person.full_name,
      ...roles,
      ...roles.map((role) => getRoleDisplayName(role)),
      meta.city || "",
      meta.coverage || "",
      person.phone ?? "",
      person.email ?? "",
      person.platform_access_role
        ? getAppRoleDisplayName(person.platform_access_role)
        : "",
      getAssignmentStateDisplayName(person.assignment_state),
      meta.notes ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("es");

    return haystack.includes(query.toLocaleLowerCase("es"));
  });
  const settings = await getSettingsSnapshot();
  const activePeople = people.filter((person) => person.active);
  const activeCount = activePeople.length;
  const inactiveCount = people.length - activeCount;
  const aiContext = toPeopleAiContext(people);
  const selectedPerson =
    allPeopleWithAccess.find((person) => person.id === editPersonId) ?? null;
  const selectedMeta = selectedPerson
    ? parsePersonNotesMeta(selectedPerson.notes)
    : null;
  const selectedPersonPlatformAccessRole =
    selectedPerson?.platform_access_role ?? null;
  const selectedPersonHasPlatformAccess = Boolean(
    selectedPersonPlatformAccessRole,
  );

  const currentPeopleHref = buildPeopleHref(resolvedSearchParams, {
    edit: undefined,
  });
  const selectedPeopleHref = selectedPerson
    ? buildPeopleHref(resolvedSearchParams, {
        edit: selectedPerson.id,
        view: viewMode === "table" ? "table" : undefined,
      })
    : null;

  return (
    <div className="space-y-10">
      <SectionPageHeader
        title={
          viewMode === "directory"
            ? SECTION_COPY.people.directoryTitle
            : SECTION_COPY.people.title
        }
        description={SECTION_COPY.people.description}
        actions={
          <>
            <ToolbarSearchField
              action="/people"
              defaultValue={query}
              placeholder="Buscar nombre, rol, responsable o ciudad..."
            >
              <input type="hidden" name="view" value={viewMode} />
            </ToolbarSearchField>
            {people.length ? (
              <>
                <PeopleExportButton people={people} />
                <SectionAiAssistant
                  section="Personal"
                  title="Consulta el personal visible"
                  description="Haz preguntas sobre roles, coberturas, disponibilidad, teléfonos o correos del personal cargado en esta pantalla."
                  placeholder="Ej. ¿Qué rol tiene Santiago Córdoba y quién cubre Boca Juniors?"
                  contextLabel="Personal visible en la vista actual"
                  context={aiContext}
                  guidance="Prioriza rol principal, responsable de equipos, estado, teléfono, email y notas. Si preguntan por una persona, responde solo con lo visible en esta pantalla."
                  examples={[
                    "¿Qué rol tiene Santiago Córdoba?",
                    "¿Quién cubre Boca Juniors?",
                    "¿Qué datos hay de Juan Camilo y Samuel Venegas?",
                  ]}
                  hasGeminiKey={settings.hasGeminiKey}
                  buttonVariant="icon"
                />
              </>
            ) : null}
            {user.canEdit ? (
              <CreatePersonModal
                canEdit={user.canEdit}
                canManageAccess={user.role === "admin"}
                redirectTo={currentPeopleHref}
                roleOptions={ROLE_OPTIONS}
                teamOptions={TEAM_OPTIONS}
              />
            ) : null}
          </>
        }
      />

      <PageMessage intent={intent} message={notice} />

      <SectionTableCard
        title=""
        titleClassName="hidden"
        headerClassName="justify-between"
        badge={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8dee8] bg-[#f6f8fb] px-3 py-1 text-xs font-bold text-[#596980]">
                <span className="size-1.5 rounded-full bg-[#8ea0b7]" />
                {activeCount} Activos
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8dee8] bg-[#f6f8fb] px-3 py-1 text-xs font-bold text-[#596980]">
                <span className="size-1.5 rounded-full bg-[#c1cad7]" />
                {inactiveCount} Inactivos
              </span>
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <SegmentedControl
                size="sm"
                items={[
                  {
                    key: "table",
                    href: buildPeopleHref(resolvedSearchParams, { view: "table" }),
                    active: viewMode === "table",
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <Rows3 className="size-3.5" />
                        Tabla
                      </span>
                    ),
                  },
                  {
                    key: "directory",
                    href: buildPeopleHref(resolvedSearchParams, { view: undefined }),
                    active: viewMode === "directory",
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <LayoutGrid className="size-3.5" />
                        Directorio
                      </span>
                    ),
                  },
                ]}
              />
              {user.canEdit && selectedPerson ? (
                <PersonDeleteButton
                  personId={selectedPerson.id}
                  fullName={selectedPerson.full_name}
                  redirectTo={currentPeopleHref}
                />
              ) : null}
            </div>
          </div>
        }
      >
        {people.length ? (
          viewMode === "directory" ? (
            <PeopleDirectoryView
              people={people}
              query={query}
              selectedPersonId={selectedPerson?.id ?? null}
              canEdit={user.canEdit}
            />
          ) : (
            <PeopleTable people={people} canEdit={user.canEdit} />
          )
        ) : (
          <div className="p-6">
            <EmptyState
              title="No hay personal cargado"
              description="Agrega integrantes del equipo técnico, talento y responsables para empezar a asignar."
            />
          </div>
        )}
      </SectionTableCard>

      {selectedPerson ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(15,23,42,0.48)] p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[1000px] flex-col overflow-hidden rounded-[var(--panel-radius)] border border-[#e6e8ec] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.26)]">
            <div className="flex items-center justify-between border-b border-[#f1f3f5] px-8 py-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  Personal
                </p>
                <h3 className="text-[2rem] font-extrabold tracking-[-0.04em] text-[#1b1520]">
                  Editar personal
                </h3>
              </div>
              <Link
                href={currentPeopleHref}
                className="inline-flex size-10 items-center justify-center rounded-xl text-[#98a2b3] transition hover:bg-[#f7f5f6] hover:text-[#5b6472]"
                aria-label="Cerrar modal"
              >
                <X className="size-5" />
              </Link>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#faf7f7]">
              <form id="edit-person-form" action={upsertPersonAction}>
                <input type="hidden" name="redirectTo" value={currentPeopleHref} />
                <input type="hidden" name="personId" value={selectedPerson.id} />
                <input type="hidden" name="active" value="off" />

                <section className="bg-white px-8 py-8">
                  <div className="grid gap-8 2xl:grid-cols-3">
                    <div className="space-y-6 2xl:col-span-2">
                      <div className="grid gap-6 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-[#334155]">
                            Nombre completo
                          </span>
                          <Input
                            name="fullName"
                            defaultValue={selectedPerson.full_name}
                            disabled={!user.canEdit}
                            className="h-12 rounded-[var(--panel-radius)] border-[#e5e7eb] bg-[#f9f9f9] text-[15px] font-medium text-[#1f2937] placeholder:text-[#98a2b3] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] focus:border-[var(--accent)] focus:bg-white focus:ring-[3px] focus:ring-[rgba(230,18,56,0.08)]"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-[#334155]">
                            Teléfono
                          </span>
                          <Input
                            name="phone"
                            defaultValue={selectedPerson.phone ?? ""}
                            disabled={!user.canEdit}
                            className="h-12 rounded-[var(--panel-radius)] border-[#e5e7eb] bg-[#f9f9f9] text-[15px] font-medium text-[#1f2937] placeholder:text-[#98a2b3] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] focus:border-[var(--accent)] focus:bg-white focus:ring-[3px] focus:ring-[rgba(230,18,56,0.08)]"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-[#334155]">
                            Correo electrónico
                          </span>
                          <Input
                            name="email"
                            defaultValue={selectedPerson.email ?? ""}
                            disabled={!user.canEdit}
                            className="h-12 rounded-[var(--panel-radius)] border-[#e5e7eb] bg-[#f9f9f9] text-[15px] font-medium text-[#1f2937] placeholder:text-[#98a2b3] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] focus:border-[var(--accent)] focus:bg-white focus:ring-[3px] focus:ring-[rgba(230,18,56,0.08)]"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-[#334155]">
                            Ciudad
                          </span>
                          <Input
                            name="city"
                            defaultValue={selectedMeta?.city ?? ""}
                            disabled={!user.canEdit}
                            className="h-12 rounded-[var(--panel-radius)] border-[#e5e7eb] bg-[#f9f9f9] text-[15px] font-medium text-[#1f2937] placeholder:text-[#98a2b3] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] focus:border-[var(--accent)] focus:bg-white focus:ring-[3px] focus:ring-[rgba(230,18,56,0.08)]"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-[#334155]">
                            Roles
                          </span>
                          <div className="grid gap-3 md:grid-cols-3">
                            <Select
                              name="roleName"
                              defaultValue={selectedMeta?.roles?.[0] ?? selectedMeta?.role ?? ""}
                              disabled={!user.canEdit}
                              className="h-12 rounded-[var(--panel-radius)] border-[#e5e7eb] bg-[#f9f9f9] text-[15px] font-medium text-[#1f2937] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] focus:border-[var(--accent)] focus:bg-white focus:ring-[3px] focus:ring-[rgba(230,18,56,0.08)]"
                            >
                              <option value="">Rol principal...</option>
                              {ROLE_OPTIONS.map((roleName) => (
                                <option key={roleName} value={roleName}>
                                  {getRoleDisplayName(roleName)}
                                </option>
                              ))}
                            </Select>
                            <Select
                              name="roleName2"
                              defaultValue={selectedMeta?.roles?.[1] ?? ""}
                              disabled={!user.canEdit}
                              className="h-12 rounded-[var(--panel-radius)] border-[#e5e7eb] bg-[#f9f9f9] text-[15px] font-medium text-[#1f2937] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] focus:border-[var(--accent)] focus:bg-white focus:ring-[3px] focus:ring-[rgba(230,18,56,0.08)]"
                            >
                              <option value="">Rol adicional 1...</option>
                              {ROLE_OPTIONS.map((roleName) => (
                                <option key={roleName} value={roleName}>
                                  {getRoleDisplayName(roleName)}
                                </option>
                              ))}
                            </Select>
                            <Select
                              name="roleName3"
                              defaultValue={selectedMeta?.roles?.[2] ?? ""}
                              disabled={!user.canEdit}
                              className="h-12 rounded-[var(--panel-radius)] border-[#e5e7eb] bg-[#f9f9f9] text-[15px] font-medium text-[#1f2937] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] focus:border-[var(--accent)] focus:bg-white focus:ring-[3px] focus:ring-[rgba(230,18,56,0.08)]"
                            >
                              <option value="">Rol adicional 2...</option>
                              {ROLE_OPTIONS.map((roleName) => (
                                <option key={roleName} value={roleName}>
                                  {getRoleDisplayName(roleName)}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 rounded-[var(--panel-radius)] border border-[#e5e7eb] bg-[#f9f9f9] px-4 py-3 text-sm font-semibold text-[#1f2937] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)]">
                          <input
                            type="checkbox"
                            name="active"
                            value="on"
                            defaultChecked={selectedPerson.active}
                            disabled={!user.canEdit}
                            className="size-4"
                          />
                          Activo para asignación
                        </label>
                        <label className="space-y-2 md:col-span-2">
                          <span className="text-sm font-semibold text-[#334155]">
                            Responsable de equipo
                          </span>
                          <TeamCoverageField
                            name="coverageTeams"
                            defaultValue={selectedMeta?.coverage ?? ""}
                            options={TEAM_OPTIONS}
                            placeholder="Escribe uno o varios equipos y el sistema te sugerirá coincidencias"
                            disabled={!user.canEdit}
                            className="h-12 rounded-[var(--panel-radius)] border-[#e5e7eb] bg-[#f9f9f9] text-[15px] font-medium text-[#1f2937] placeholder:text-[#98a2b3] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] focus:border-[var(--accent)] focus:bg-white focus:ring-[3px] focus:ring-[rgba(230,18,56,0.08)]"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-[#334155]">
                        Notas
                      </span>
                      <Textarea
                        name="notes"
                        defaultValue={selectedMeta?.notes ?? ""}
                        disabled={!user.canEdit}
                        className="min-h-[260px] rounded-[var(--panel-radius)] border-[#e5e7eb] bg-[#f9f9f9] text-[15px] font-medium text-[#1f2937] placeholder:text-[#98a2b3] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] focus:border-[var(--accent)] focus:bg-white focus:ring-[3px] focus:ring-[rgba(230,18,56,0.08)]"
                      />

                      {user.role === "admin" ? (
                        <div className="rounded-[var(--panel-radius)] border-2 border-[rgba(211,49,49,0.10)] bg-white p-6 shadow-sm">
                          <div className="flex flex-col gap-5">
                            <div className="flex gap-4">
                              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[rgba(211,49,49,0.1)] text-[var(--accent)]">
                                <ShieldCheck className="size-6" />
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-bold text-[#111827]">
                                  Acceso a la plataforma
                                </h4>
                                <p className="text-sm text-[#667085]">
                                  {selectedPerson.email
                                    ? selectedPersonHasPlatformAccess
                                      ? `Este usuario puede iniciar sesión con rol ${getAppRoleDisplayName(selectedPersonPlatformAccessRole)}.`
                                      : "Este colaborador no tiene acceso activo a la plataforma en este momento."
                                    : "Primero debes guardar un correo electrónico para poder gestionar acceso."}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-start gap-2">
                              <span
                                className={cn(
                                  "relative inline-flex h-7 w-14 items-center rounded-full transition",
                                  selectedPersonHasPlatformAccess
                                    ? "bg-[var(--accent)]"
                                    : "bg-[#d8dee8]",
                                )}
                                aria-hidden="true"
                              >
                                <span
                                  className={cn(
                                    "inline-block size-6 rounded-full border border-white bg-white transition",
                                    selectedPersonHasPlatformAccess
                                      ? "translate-x-7"
                                      : "translate-x-0.5",
                                  )}
                                />
                              </span>

                              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                                {selectedPersonHasPlatformAccess
                                  ? `Acceso ${getAppRoleDisplayName(selectedPersonPlatformAccessRole)}`
                                  : "Acceso desactivado"}
                              </span>
                            </div>

                            {selectedPersonHasPlatformAccess ? (
                              <div className="flex justify-end">
                                <PersonRevokeAccessButton
                                  personId={selectedPerson.id}
                                  redirectTo={selectedPeopleHref ?? currentPeopleHref}
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              </form>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[#f1f3f5] bg-white px-8 py-5">
              <div>
                {user.canEdit ? (
                  <PersonDeleteButton
                    personId={selectedPerson.id}
                    fullName={selectedPerson.full_name}
                    redirectTo={currentPeopleHref}
                    className="h-11 w-auto rounded-[var(--panel-radius)] border-[#111827] bg-[#111827] px-5 text-sm font-bold text-white hover:border-black hover:bg-black hover:text-white"
                    label="Eliminar usuario"
                  />
                ) : null}
              </div>

              <div className="flex items-center gap-4">
                <Link
                  href={currentPeopleHref}
                  className="inline-flex h-11 items-center justify-center rounded-[var(--panel-radius)] px-6 text-sm font-bold text-[#667085] transition hover:bg-[#f2f4f7]"
                >
                  Cancelar
                </Link>

                {user.canEdit ? (
                  <Button
                    type="submit"
                    form="edit-person-form"
                    className="h-11 rounded-[var(--panel-radius)] px-8 text-sm font-bold shadow-[0_14px_32px_rgba(230,18,56,0.18)]"
                  >
                    Guardar cambios
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled
                    className="h-11 rounded-[var(--panel-radius)] px-7"
                  >
                    Solo lectura
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
