"use client";

import { useEffect, useState } from "react";
import { Save, UserPlus2, X } from "lucide-react";

import { upsertPersonAction } from "@/app/actions/people";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { getRoleDisplayName } from "@/lib/display";

export function CreatePersonModal({
  canEdit,
  redirectTo,
  roleOptions,
  teamOptions,
}: {
  canEdit: boolean;
  redirectTo: string;
  roleOptions: string[];
  teamOptions: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-[52px] items-center gap-2 rounded-[var(--panel-radius)] bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_16px_32px_rgba(230,18,56,0.22)] transition hover:bg-[var(--accent-strong)]"
      >
        <UserPlus2 className="size-4" />
        Crear personal
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#101828]/60 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="panel-surface relative w-full max-w-5xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                  Personal
                </p>
                <h3 className="mt-2 text-xl font-extrabold text-[var(--foreground)]">
                  Crear personal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--background-soft)] text-[#94a3b8] transition hover:bg-[#eef2f6] hover:text-[#52627a]"
                aria-label="Cerrar modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <form action={upsertPersonAction} className="space-y-6 p-6">
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">
                    Nombre completo
                  </span>
                  <Input
                    name="fullName"
                    placeholder="ej. Sarah Jenkins"
                    disabled={!canEdit}
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
                    disabled={!canEdit}
                    className="h-11 rounded-xl bg-[var(--background-soft)]"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">
                    Correo electrónico
                  </span>
                  <Input
                    name="email"
                    placeholder="nombre@canal.com"
                    disabled={!canEdit}
                    className="h-11 rounded-xl bg-[var(--background-soft)]"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">
                    Ciudad
                  </span>
                  <Input
                    name="city"
                    placeholder="ej. Medellin"
                    disabled={!canEdit}
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
                    disabled={!canEdit}
                    className="h-11 rounded-xl bg-[var(--background-soft)]"
                  >
                    <option value="">Seleccionar rol...</option>
                    {roleOptions.map((roleName) => (
                      <option key={roleName} value={roleName}>
                        {getRoleDisplayName(roleName)}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="space-y-2 xl:col-span-2">
                  <span className="text-sm font-bold text-[#334155]">
                    Responsable
                  </span>
                  <>
                    <Input
                      name="coverageTeams"
                      list="people-team-options"
                      placeholder="Escribe o pega equipos y el sistema te sugerirá coincidencias"
                      disabled={!canEdit}
                      className="h-11 rounded-xl bg-[var(--background-soft)]"
                    />
                    <datalist id="people-team-options">
                      {teamOptions.map((teamName) => (
                        <option key={teamName} value={teamName} />
                      ))}
                    </datalist>
                  </>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-bold text-[#334155]">
                  Notas
                </span>
                <Textarea
                  name="notes"
                  placeholder="Contexto operativo"
                  disabled={!canEdit}
                  className="min-h-[110px] bg-[var(--background-soft)]"
                />
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-soft)] px-5 text-sm font-semibold text-[#5a677d] transition hover:bg-[#edf0f4]"
                >
                  Cancelar
                </button>
                {canEdit ? (
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
        </div>
      ) : null}
    </>
  );
}
