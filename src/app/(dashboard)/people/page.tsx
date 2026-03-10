import Link from "next/link";
import {
  AlertTriangle,
  Download,
  Save,
  UserPlus2,
} from "lucide-react";

import { deletePersonAction, upsertPersonAction } from "@/app/actions/people";
import { SectionAiAssistant } from "@/components/ai/section-ai-assistant";
import { SectionPageHeader } from "@/components/layout/section-page-header";
import { SetupPanel } from "@/components/layout/setup-panel";
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
import type { PersonListItem } from "@/lib/types";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toCsvHref(people: PersonListItem[]) {
  const rows = [
    [
      "Nombre",
      "Rol principal",
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

function toPeopleAiContext(people: PersonListItem[]): PeopleAiContextItem[] {
  return people.map((person) => {
    const meta = parsePersonNotesMeta(person.notes);

    return {
      fullName: person.full_name,
      role: meta.role || person.primary_role || "",
      coverage: meta.coverage || "",
      phone: person.phone ?? "",
      email: person.email ?? "",
      status: getAssignmentStateDisplayName(person.assignment_state),
      notes: meta.notes ?? "",
    };
  });
}

export default async function PeoplePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { intent, notice } = parseNotice(resolvedSearchParams);
  const editPersonId =
    typeof resolvedSearchParams.edit === "string"
      ? resolvedSearchParams.edit
      : undefined;

  if (!isSupabaseConfigured) {
    return <SetupPanel />;
  }

  const user = await requireUserContext();
  const people = await getPeopleData();
  const settings = await getSettingsSnapshot();
  const activeCount = people.filter((person) => person.active).length;
  const exportHref = toCsvHref(people);
  const aiContext = toPeopleAiContext(people);
  const selectedPerson =
    people.find((person) => person.id === editPersonId) ?? null;
  const selectedMeta = selectedPerson
    ? parsePersonNotesMeta(selectedPerson.notes)
    : null;

  return (
    <div className="space-y-10">
      <SectionPageHeader
        title="Personal"
        actions={
          people.length ? (
            <>
              <SectionAiAssistant
                section="Personal"
                title="Consulta el personal visible"
                description="Haz preguntas sobre roles, coberturas, disponibilidad, teléfonos o correos del personal cargado en esta pantalla."
                placeholder="Ej. ¿Qué rol tiene Santiago Córdoba y quién cubre Boca Juniors?"
                contextLabel="Personal visible en la tabla actual"
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
              <a
                href={exportHref}
                download="basket-production-personal.csv"
                className="inline-flex h-[52px] items-center gap-2 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[#415067] shadow-sm transition hover:border-[#f0d9de] hover:bg-[#fff7f8]"
              >
                <Download className="size-4" />
                Exportar Lista
              </a>
            </>
          ) : null
        }
      />

      <PageMessage intent={intent} message={notice} />

      {user.role === "admin" ? (
        <div className="panel-radius flex items-start gap-3 border border-[#f2d1d8] bg-[#fff6f8] px-4 py-3 text-sm text-[#7a4150]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
          <p>
            Como administrador puedes editar o eliminar contactos desde la
            tabla. La eliminación puede ser permanente y afectar futuras
            asignaciones, así que el sistema pedirá confirmación antes de
            borrar un registro.
          </p>
        </div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--border)] bg-[#fafbfc] px-6 py-4">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-[var(--foreground)]">
            <UserPlus2 className="size-5 text-[var(--accent)]" />
            Creación Rápida
          </h3>
        </div>
        <div className="p-6">
          <form action={upsertPersonAction} className="space-y-6">
            <input type="hidden" name="redirectTo" value="/people" />
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-bold text-[#334155]">
                  Nombre Completo
                </span>
                <Input
                  name="fullName"
                  placeholder="ej. Sarah Jenkins"
                  disabled={!user.canEdit}
                  className="h-11 rounded-xl bg-[var(--background-soft)]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-[#334155]">
                  Teléfono
                </span>
                <Input
                  name="phone"
                  placeholder="+57 300 000 0000"
                  disabled={!user.canEdit}
                  className="h-11 rounded-xl bg-[var(--background-soft)]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-[#334155]">
                  Correo Electrónico
                </span>
                <Input
                  name="email"
                  placeholder="nombre@canal.com"
                  disabled={!user.canEdit}
                  className="h-11 rounded-xl bg-[var(--background-soft)]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-[#334155]">
                  Rol principal
                </span>
                <Select
                  name="roleName"
                  defaultValue=""
                  disabled={!user.canEdit}
                  className="h-11 rounded-xl bg-[var(--background-soft)]"
                >
                  <option value="">Seleccionar rol...</option>
                  {ROLE_OPTIONS.map((roleName) => (
                    <option key={roleName} value={roleName}>
                      {getRoleDisplayName(roleName)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-[#334155]">
                  Responsable de equipos
                </span>
                <Input
                  name="coverageTeams"
                  placeholder="ej. Boca Juniors, Atenas de Córdoba"
                  disabled={!user.canEdit}
                  className="h-11 rounded-xl bg-[var(--background-soft)]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-[#334155]">
                  Notas
                </span>
                <Input
                  name="notes"
                  placeholder="Contexto operativo"
                  disabled={!user.canEdit}
                  className="h-11 rounded-xl bg-[var(--background-soft)]"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="reset"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-soft)] px-5 text-sm font-semibold text-[#5a677d] transition hover:bg-[#edf0f4]"
              >
                Cancelar
              </button>
              {user.canEdit ? (
                <SubmitButton
                  pendingLabel="Guardando..."
                  className="h-10 gap-2 rounded-xl px-5 text-sm font-bold"
                >
                  <Save className="size-4" />
                  Guardar personal
                </SubmitButton>
              ) : (
                <Button variant="secondary" disabled className="h-10 rounded-xl px-5">
                  Solo lectura
                </Button>
              )}
            </div>
          </form>
        </div>
      </Card>

      <SectionTableCard
        title="Lista de Personal Activo"
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[#5d4d58]">
            <span className="size-1.5 rounded-full bg-[var(--accent)]" />
            {activeCount} Activos
          </span>
        }
      >

        {people.length ? (
          <PeopleTable people={people} canEdit={user.canEdit} />
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
              href="/people"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[#5c697d] transition hover:bg-[var(--background-soft)]"
            >
              Cerrar
            </Link>
          </div>

          <form action={upsertPersonAction} className="space-y-4">
            <input type="hidden" name="redirectTo" value="/people" />
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
                  Responsable de equipos
                </span>
                <Input
                  name="coverageTeams"
                  defaultValue={selectedMeta?.coverage ?? ""}
                  disabled={!user.canEdit}
                />
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
                  <button
                    type="submit"
                    formAction={deletePersonAction}
                    className="inline-flex items-center justify-center rounded-xl border border-[#f0c8d1] bg-[#fff4f6] px-4 py-2 text-sm font-semibold text-[#ad1d39] transition hover:bg-[#ffe9ee]"
                  >
                    Eliminar
                  </button>
                </>
              ) : (
                <Button variant="secondary" disabled>
                  Solo lectura
                </Button>
              )}
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
