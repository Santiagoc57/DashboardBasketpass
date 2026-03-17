import Link from "next/link";
import {
  Camera,
  Download,
  LayoutGrid,
  Mic2,
  PencilLine,
  Rows3,
  Search,
  Trash2,
  UserRoundX,
  Users,
  Video,
} from "lucide-react";

import { deletePersonAction, upsertPersonAction } from "@/app/actions/people";
import { SectionAiAssistant } from "@/components/ai/section-ai-assistant";
import { SectionPageHeader } from "@/components/layout/section-page-header";
import { SetupPanel } from "@/components/layout/setup-panel";
import { PeopleDirectoryView } from "@/components/people/people-directory-view";
import { CreatePersonModal } from "@/components/people/create-person-modal";
import { PeopleTable } from "@/components/people/people-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageMessage } from "@/components/ui/page-message";
import { Select } from "@/components/ui/select";
import { SectionTableCard } from "@/components/ui/section-table-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requireUserContext } from "@/lib/auth";
import { ROLE_SEED } from "@/lib/constants";
import { getPeopleData } from "@/lib/data/dashboard";
import { getAssignmentStateDisplayName, getRoleDisplayName } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/env";
import type { PeopleAiContextItem } from "@/lib/people-ai";
import { parsePersonNotesMeta } from "@/lib/people-notes";
import { parseNotice } from "@/lib/search-params";
import { getSettingsSnapshot } from "@/lib/settings";
import { TEAM_DIRECTORY } from "@/lib/team-directory";
import type { PersonListItem } from "@/lib/types";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toCsvHref(people: PersonListItem[]) {
  const rows = [
    [
      "Nombre",
      "Rol principal",
      "Ciudad",
      "Responsable de equipos",
      "Teléfono",
      "Email",
      "Estado",
      "Notas",
    ],
    ...people.map((person) => {
      const meta = parsePersonNotesMeta(person.notes);

      return [
        person.full_name,
        meta.role || person.primary_role || "",
        meta.city || "",
        meta.coverage || "",
        person.phone ?? "",
        person.email ?? "",
        person.assignment_state,
        meta.notes ?? "",
      ];
    }),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

const ROLE_OPTIONS = Array.from(
  new Map(ROLE_SEED.map((role) => [role.name, role])).values(),
).map((role) => role.name);
const TEAM_OPTIONS = Array.from(
  new Set(TEAM_DIRECTORY.map((team) => team.official_name)),
).sort((left, right) => left.localeCompare(right, "es"));

function toPeopleAiContext(people: PersonListItem[]): PeopleAiContextItem[] {
  return people.map((person) => {
    const meta = parsePersonNotesMeta(person.notes);

    return {
      fullName: person.full_name,
      role: meta.role || person.primary_role || "",
      city: meta.city || "",
      coverage: meta.coverage || "",
      phone: person.phone ?? "",
      email: person.email ?? "",
      status: getAssignmentStateDisplayName(person.assignment_state),
      notes: meta.notes ?? "",
    };
  });
}

function getPersonRole(person: PersonListItem) {
  const meta = parsePersonNotesMeta(person.notes);
  return meta.role || person.primary_role || "";
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

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone?: "neutral" | "accent" | "danger" | "info";
}) {
  const toneClassName =
    tone === "accent"
      ? "border-[#d9efe3] bg-[#f4fbf7] text-[#177245]"
      : tone === "danger"
        ? "border-[#f1d3da] bg-[#fff5f7] text-[#b42343]"
        : tone === "info"
          ? "border-[#dbe6f6] bg-[#f7faff] text-[#315e9d]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]";

  const iconToneClassName =
    tone === "accent"
      ? "bg-[#e6f6ed] text-[#179a56]"
      : tone === "danger"
        ? "bg-[#fff0f3] text-[var(--accent)]"
        : tone === "info"
          ? "bg-[#eef4ff] text-[#315e9d]"
          : "bg-[var(--background-soft)] text-[#6b7a90]";

  return (
    <div className={`rounded-[var(--panel-radius)] border px-5 py-4 ${toneClassName}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
            {label}
          </p>
          <p className="mt-3 text-[2rem] font-black leading-none">
            {value}
          </p>
        </div>
        <span className={`inline-flex size-11 items-center justify-center rounded-2xl ${iconToneClassName}`}>
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

export default async function PeoplePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { intent, notice } = parseNotice(resolvedSearchParams);
  const query =
    typeof resolvedSearchParams.q === "string"
      ? resolvedSearchParams.q.trim()
      : "";
  const viewMode =
    resolvedSearchParams.view === "directory" ? "directory" : "table";
  const editPersonId =
    typeof resolvedSearchParams.edit === "string"
      ? resolvedSearchParams.edit
      : undefined;

  if (!isSupabaseConfigured) {
    return <SetupPanel />;
  }

  const user = await requireUserContext();
  const allPeople = await getPeopleData();
  const people = allPeople.filter((person) => {
    if (!query) {
      return true;
    }

    const meta = parsePersonNotesMeta(person.notes);
    const haystack = [
      person.full_name,
      meta.role || person.primary_role || "",
      meta.city || "",
      meta.coverage || "",
      person.phone ?? "",
      person.email ?? "",
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
  const relatorCount = activePeople.filter(
    (person) => getPersonRole(person) === "Relator",
  ).length;
  const producerCount = activePeople.filter(
    (person) => getPersonRole(person) === "Productor",
  ).length;
  const cameraCount = activePeople.filter((person) =>
    getPersonRole(person).startsWith("Camara"),
  ).length;
  const exportHref = toCsvHref(people);
  const aiContext = toPeopleAiContext(people);
  const selectedPerson =
    allPeople.find((person) => person.id === editPersonId) ?? null;
  const selectedMeta = selectedPerson
    ? parsePersonNotesMeta(selectedPerson.notes)
    : null;
  const currentPeopleHref = buildPeopleHref(resolvedSearchParams, {
    edit: undefined,
  });
  const selectedPeopleHref = selectedPerson
    ? buildPeopleHref(resolvedSearchParams, {
        edit: selectedPerson.id,
        view: viewMode === "directory" ? "directory" : undefined,
      })
    : null;

  return (
    <div className="space-y-10">
      <SectionPageHeader
        title="Personal"
        description="Gestiona contactos, roles y disponibilidad del personal operativo."
        actions={
          <>
            <form
              action="/people"
              className="flex min-w-[320px] flex-1 items-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-sm"
            >
              {viewMode === "directory" ? (
                <input type="hidden" name="view" value="directory" />
              ) : null}
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--panel-radius)] bg-[var(--background-soft)] px-3">
                <Search className="size-4 text-[var(--accent)]" />
                <Input
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar nombre, rol, responsable o ciudad..."
                  className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </form>
            {people.length ? (
              <>
                <a
                  href={exportHref}
                  download="basket-production-personal.csv"
                  aria-label="Descargar lista de personal"
                  title="Descargar lista de personal"
                  className="inline-flex size-[52px] items-center justify-center rounded-[var(--panel-radius)] bg-[#7c3aed] text-white shadow-[0_14px_28px_rgba(124,58,237,0.22)] transition hover:bg-[#6d28d9]"
                >
                  <Download className="size-4" />
                </a>
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
                redirectTo={currentPeopleHref}
                roleOptions={ROLE_OPTIONS}
                teamOptions={TEAM_OPTIONS}
              />
            ) : null}
          </>
        }
      />

      <PageMessage intent={intent} message={notice} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Personal activo"
          value={activeCount}
          icon={Users}
          tone="accent"
        />
        <StatCard
          label="Personal inactivo"
          value={inactiveCount}
          icon={UserRoundX}
          tone="danger"
        />
        <StatCard
          label="Relatores activos"
          value={relatorCount}
          icon={Mic2}
          tone="info"
        />
        <StatCard
          label="Productores activos"
          value={producerCount}
          icon={Video}
          tone="neutral"
        />
        <StatCard
          label="Cámaras activas"
          value={cameraCount}
          icon={Camera}
          tone="neutral"
        />
      </div>

      <SectionTableCard
        title={viewMode === "directory" ? "Directorio de Personal" : "Personal de Basquetpass"}
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8dee8] bg-[#f6f8fb] px-3 py-1 text-xs font-bold text-[#596980]">
              <span className="size-1.5 rounded-full bg-[#8ea0b7]" />
              {activeCount} Activos
            </span>
            <div className="flex h-9 items-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-1">
              <Link
                href={buildPeopleHref(resolvedSearchParams, {
                  view: undefined,
                })}
                className={`inline-flex h-full items-center gap-2 rounded-[calc(var(--panel-radius)-4px)] px-3 text-xs font-bold transition ${
                  viewMode === "table"
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Rows3 className="size-3.5" />
                Tabla
              </Link>
              <Link
                href={buildPeopleHref(resolvedSearchParams, {
                  view: "directory",
                })}
                className={`inline-flex h-full items-center gap-2 rounded-[calc(var(--panel-radius)-4px)] px-3 text-xs font-bold transition ${
                  viewMode === "directory"
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <LayoutGrid className="size-3.5" />
                Directorio
              </Link>
            </div>
            {user.canEdit ? (
              <>
                {selectedPerson ? (
                  <Link
                    href={selectedPeopleHref ?? currentPeopleHref}
                    className="inline-flex size-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[#7b8798] transition hover:border-[#f0d9de] hover:bg-[#fff7f8] hover:text-[var(--accent)]"
                    title={`Editar ${selectedPerson.full_name}`}
                  >
                    <PencilLine className="size-4" />
                  </Link>
                ) : (
                  <span
                    aria-label="Selecciona una persona para editar"
                    title="Selecciona una persona para editar"
                    className="inline-flex size-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[#c2cad7] opacity-70"
                  >
                    <PencilLine className="size-4" />
                  </span>
                )}
                {selectedPerson ? (
                  <form
                    action={deletePersonAction}
                    onSubmit={(event) => {
                      const confirmed = window.confirm(
                        `Vas a eliminar el registro de ${selectedPerson.full_name}. Este cambio puede ser permanente y afectar futuras asignaciones. ¿Quieres continuar?`,
                      );

                      if (!confirmed) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="personId" value={selectedPerson.id} />
                    <input type="hidden" name="redirectTo" value={currentPeopleHref} />
                    <button
                      type="submit"
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[#7b8798] transition hover:border-[#f0d9de] hover:bg-[#fff0f3] hover:text-[#bf1e41]"
                      title={`Eliminar ${selectedPerson.full_name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                ) : null}
              </>
            ) : null}
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
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">
                Edición
              </p>
              <h3 className="mt-2 text-xl font-extrabold text-[var(--foreground)]">
                Editar registro de personal
              </h3>
            </div>
            <Link
              href={currentPeopleHref}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[#5c697d] transition hover:bg-[var(--background-soft)]"
            >
              Cerrar
            </Link>
          </div>

          <form action={upsertPersonAction} className="space-y-4">
            <input
              type="hidden"
              name="redirectTo"
              value={
                selectedPerson
                  ? selectedPeopleHref ?? currentPeopleHref
                  : currentPeopleHref
              }
            />
            <input type="hidden" name="personId" value={selectedPerson.id} />
            <input type="hidden" name="active" value="off" />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Nombre
                </span>
                <Input name="fullName" defaultValue={selectedPerson.full_name} disabled={!user.canEdit} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Teléfono
                </span>
                <Input name="phone" defaultValue={selectedPerson.phone ?? ""} disabled={!user.canEdit} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Correo
                </span>
                <Input name="email" defaultValue={selectedPerson.email ?? ""} disabled={!user.canEdit} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Ciudad
                </span>
                <Input name="city" defaultValue={selectedMeta?.city ?? ""} disabled={!user.canEdit} />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
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
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Rol principal
                </span>
                <Select
                  name="roleName"
                  defaultValue={selectedMeta?.role ?? ""}
                  disabled={!user.canEdit}
                >
                  <option value="">Seleccionar rol...</option>
                  {ROLE_OPTIONS.map((roleName) => (
                    <option key={roleName} value={roleName}>
                      {getRoleDisplayName(roleName)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-2 md:col-span-2 xl:col-span-2">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Responsable
                </span>
                <>
                  <Input
                    name="coverageTeams"
                    list="people-team-options-edit"
                    defaultValue={selectedMeta?.coverage ?? ""}
                    placeholder="Escribe o pega equipos y el sistema te sugerirá coincidencias"
                    disabled={!user.canEdit}
                  />
                  <datalist id="people-team-options-edit">
                    {TEAM_OPTIONS.map((teamName) => (
                      <option key={teamName} value={teamName} />
                    ))}
                  </datalist>
                </>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                Notas
              </span>
              <Textarea
                name="notes"
                defaultValue={selectedMeta?.notes ?? ""}
                disabled={!user.canEdit}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              {user.canEdit ? (
                <>
                  <SubmitButton pendingLabel="Guardando...">
                    Guardar cambios
                  </SubmitButton>
                </>
              ) : (
                <Button variant="secondary" disabled>
                  Solo lectura
                </Button>
              )}
            </div>
          </form>
          {user.canEdit ? (
            <form action={deletePersonAction}>
              <input type="hidden" name="personId" value={selectedPerson.id} />
              <input type="hidden" name="redirectTo" value={currentPeopleHref} />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl border border-[#f0c8d1] bg-[#fff4f6] px-4 py-2 text-sm font-semibold text-[#ad1d39] transition hover:bg-[#ffe9ee]"
              >
                Eliminar
              </button>
            </form>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
