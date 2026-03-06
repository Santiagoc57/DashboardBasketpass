import { deleteRoleAction, upsertRoleAction } from "@/app/actions/roles";
import { SetupPanel } from "@/components/layout/setup-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageMessage } from "@/components/ui/page-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUserContext } from "@/lib/auth";
import { getRolesData } from "@/lib/data/dashboard";
import { isSupabaseConfigured } from "@/lib/env";
import { parseNotice } from "@/lib/search-params";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RolesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { intent, notice } = parseNotice(resolvedSearchParams);

  if (!isSupabaseConfigured) {
    return <SetupPanel />;
  }

  const user = await requireUserContext();
  const { roles, grouped } = await getRolesData();

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_44px_rgba(28,13,16,0.05)]">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
          Configuracion
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--foreground)]">
          Roles
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Gestiona la plantilla de roles visibles en el detalle del partido y en la importacion CSV.
        </p>
      </section>

      <PageMessage intent={intent} message={notice} />

      <Card className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
            Nuevo rol
          </p>
          <h3 className="mt-2 text-xl font-extrabold text-[var(--foreground)]">
            Crear registro
          </h3>
        </div>
        <form action={upsertRoleAction} className="grid gap-3 lg:grid-cols-4">
          <input type="hidden" name="redirectTo" value="/roles" />
          <Input name="name" placeholder="Camara 6" disabled={!user.canEdit} />
          <Input name="category" placeholder="Camaras" disabled={!user.canEdit} />
          <Input name="sortOrder" type="number" placeholder="170" disabled={!user.canEdit} />
          <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
            <input
              type="checkbox"
              name="active"
              defaultChecked
              disabled={!user.canEdit}
              className="size-4"
            />
            Activo
          </label>
          {user.canEdit ? (
            <SubmitButton pendingLabel="Guardando..." className="lg:col-span-4 lg:w-fit">
              Crear rol
            </SubmitButton>
          ) : (
            <Button variant="secondary" disabled className="lg:col-span-4 lg:w-fit">
              Solo lectura
            </Button>
          )}
        </form>
      </Card>

      {roles.length ? (
        <div className="space-y-6">
          {grouped.map((group) => (
            <Card key={group.category} className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
                  Categoria
                </p>
                <h3 className="mt-2 text-xl font-extrabold text-[var(--foreground)]">
                  {group.category}
                </h3>
              </div>
              <div className="space-y-4">
                {group.roles.map((role) => (
                  <form
                    key={role.id}
                    action={upsertRoleAction}
                    className="rounded-[20px] border border-[var(--border)] bg-[var(--background-soft)] p-4"
                  >
                    <input type="hidden" name="redirectTo" value="/roles" />
                    <input type="hidden" name="roleId" value={role.id} />
                    <div className="grid gap-3 lg:grid-cols-4">
                      <Input
                        name="name"
                        defaultValue={role.name}
                        disabled={!user.canEdit}
                      />
                      <Input
                        name="category"
                        defaultValue={role.category}
                        disabled={!user.canEdit}
                      />
                      <Input
                        type="number"
                        name="sortOrder"
                        defaultValue={role.sort_order}
                        disabled={!user.canEdit}
                      />
                      <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                        <input
                          type="checkbox"
                          name="active"
                          defaultChecked={role.active}
                          disabled={!user.canEdit}
                          className="size-4"
                        />
                        Activo
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {user.canEdit ? (
                        <>
                          <SubmitButton pendingLabel="Guardando...">
                            Guardar rol
                          </SubmitButton>
                          <button
                            type="submit"
                            formAction={deleteRoleAction}
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
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay roles cargados"
          description="Ejecuta el seed inicial o crea roles manualmente para poblar las asignaciones por partido."
        />
      )}
    </div>
  );
}
