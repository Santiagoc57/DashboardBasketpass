import Link from "next/link";
import {
  Download,
  PencilLine,
  Save,
  Trash2,
  UserPlus2,
} from "lucide-react";

import { deletePersonAction, upsertPersonAction } from "@/app/actions/people";
import { SetupPanel } from "@/components/layout/setup-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageMessage } from "@/components/ui/page-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requireUserContext } from "@/lib/auth";
import { getPeopleData } from "@/lib/data/dashboard";
import { isSupabaseConfigured } from "@/lib/env";
import { parseNotice } from "@/lib/search-params";
import type { PersonListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getStatusBadgeClass(state: PersonListItem["assignment_state"]) {
  switch (state) {
    case "En asignacion":
      return "border-[#b8e7c7] bg-[#eefbf2] text-[#1b7d43] [&>span]:bg-[#23b25f]";
    case "Inactivo":
      return "border-[#f2c6ce] bg-[#fff3f5] text-[#b42343] [&>span]:bg-[var(--accent)]";
    default:
      return "border-[#d8dee8] bg-[#f6f8fb] text-[#596980] [&>span]:bg-[#8ea0b7]";
  }
}

function toCsvHref(people: PersonListItem[]) {
  const rows = [
    ["Nombre", "Rol principal", "Telefono", "Email", "Estado", "Notas"],
    ...people.map((person) => [
      person.full_name,
      person.primary_role ?? "",
      person.phone ?? "",
      person.email ?? "",
      person.assignment_state,
      person.notes ?? "",
    ]),
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
  const activeCount = people.filter((person) => person.active).length;
  const exportHref = toCsvHref(people);
  const selectedPerson =
    people.find((person) => person.id === editPersonId) ?? null;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-[var(--foreground)]">
            Gestión de Personal
          </h2>
          <p className="text-sm font-medium text-[#617187]">
            Coordinación de transmisiones en vivo, talento y equipos técnicos.
          </p>
        </div>
        {people.length ? (
          <a
            href={exportHref}
            download="basket-production-personal.csv"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[#415067] shadow-sm transition hover:border-[#f0d9de] hover:bg-[#fff7f8]"
          >
            <Download className="size-4" />
            Exportar Lista
          </a>
        ) : null}
      </section>

      <PageMessage intent={intent} message={notice} />

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
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
                  Guardar Personal
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

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[#fafbfc] px-6 py-4">
          <h3 className="text-lg font-extrabold text-[var(--foreground)]">
            Lista de Personal Activo
          </h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[#5d4d58]">
            <span className="size-1.5 rounded-full bg-[var(--accent)]" />
            {activeCount} Activos
          </span>
        </div>

        {people.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-soft)] text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#64748b]">
                  <th className="px-6 py-4">Nombre y perfil</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Notas</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {people.map((person) => (
                  <tr
                    key={person.id}
                    className="group transition hover:bg-[#fff7f8]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[#eef2f6] text-sm font-extrabold text-[#64748b]">
                          {getInitials(person.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[var(--foreground)]">
                            {person.full_name}
                          </p>
                          <p className="truncate text-xs font-medium text-[#70819b]">
                            {person.primary_role ?? "Sin rol frecuente"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {person.phone ?? "Sin teléfono"}
                      </p>
                      <p className="text-xs font-medium text-[#70819b]">
                        {person.email ?? "Sin correo"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold",
                          getStatusBadgeClass(person.assignment_state),
                        )}
                      >
                        <span className="size-1.5 rounded-full" />
                        {person.assignment_state}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-[22rem] truncate text-sm font-medium text-[#516173]">
                        {person.notes ?? "Sin notas operativas"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                        {user.canEdit ? (
                          <>
                            <Link
                              href={`/people?edit=${person.id}`}
                              className="inline-flex size-9 items-center justify-center rounded-lg text-[#7b8798] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                              title="Editar"
                            >
                              <PencilLine className="size-4" />
                            </Link>
                            <form action={deletePersonAction}>
                              <input type="hidden" name="personId" value={person.id} />
                              <input type="hidden" name="redirectTo" value="/people" />
                              <button
                                type="submit"
                                className="inline-flex size-9 items-center justify-center rounded-lg text-[#7b8798] transition hover:bg-[#fff0f3] hover:text-[#bf1e41]"
                                title="Eliminar"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </form>
                          </>
                        ) : (
                          <Button variant="secondary" disabled className="h-9">
                            Solo lectura
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No hay personal cargado"
              description="Agrega integrantes del equipo técnico, talento y responsables para empezar a asignar."
            />
          </div>
        )}
      </Card>

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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            </div>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                Notas
              </span>
              <Textarea
                name="notes"
                defaultValue={selectedPerson.notes ?? ""}
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
