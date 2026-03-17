"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  Save,
  Trash2,
  UserPlus2,
  UserRound,
  UserSearch,
  X,
} from "lucide-react";

import { upsertPersonAction } from "@/app/actions/people";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { getRoleDisplayName } from "@/lib/display";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ModalFieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold text-[#334155]">
      {children}
      {required ? <span className="inline-block size-1.5 rounded-full bg-[var(--accent)]" /> : null}
    </span>
  );
}

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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [fullNameValue, setFullNameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const initials = useMemo(() => getInitials(fullNameValue), [fullNameValue]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const nextValue = typeof reader.result === "string" ? reader.result : null;
      setAvatarPreview(nextValue);
    };

    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setAvatarPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fieldClassName =
    "h-12 rounded-[18px] border-[#e6e8ec] bg-[#f9f8f8] text-[15px] font-medium text-[#1f2937] placeholder:text-[#98a2b3] focus:border-[var(--accent)] focus:bg-white focus:ring-[3px] focus:ring-[rgba(230,18,56,0.08)]";

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
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.35)] bg-white shadow-[0_26px_80px_rgba(15,23,42,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-8 pb-6 pt-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.28em] text-[var(--accent)]">
                    Personal
                  </p>
                  <h3 className="mt-2 text-[2rem] font-extrabold tracking-[-0.04em] text-[#1b1520]">
                    Crear personal
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex size-11 items-center justify-center rounded-full bg-[#f7f5f6] text-[#98a2b3] transition hover:bg-[#f0edef] hover:text-[#5b6472]"
                  aria-label="Cerrar modal"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-6 h-px w-full bg-[#edf1f5]" />
            </div>

            <form
              action={upsertPersonAction}
              className="flex min-h-0 flex-1 flex-col"
            >
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-8 pb-2">
                <div className="space-y-6">
                  <section className="rounded-[20px] border border-[#eef1f4] bg-[#fbfbfb] p-5">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center">
                      <div className="flex items-center gap-4">
                        <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-[22px] border border-[#e5e7eb] bg-[#f3f4f6] shadow-sm">
                          {avatarPreview ? (
                            <Image
                              src={avatarPreview}
                              alt="Preview del avatar"
                              fill
                              unoptimized
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center bg-[#eef2f6] text-[#7b8798]">
                              {initials ? (
                                <span className="text-2xl font-black tracking-[-0.04em]">
                                  {initials}
                                </span>
                              ) : (
                                <UserRound className="size-9" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-[#344054]">
                            Avatar
                          </p>
                          <p className="max-w-[18rem] text-sm leading-6 text-[#667085]">
                            Sube una foto para reconocer rápido a la persona en el directorio.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 md:ml-auto">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={!canEdit}
                          className="inline-flex h-11 items-center gap-2 rounded-[16px] border border-[#e5e7eb] bg-white px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ImagePlus className="size-4 text-[var(--accent)]" />
                          Subir foto
                        </button>
                        <button
                          type="button"
                          onClick={clearAvatar}
                          disabled={!avatarPreview || !canEdit}
                          className="inline-flex h-11 items-center gap-2 rounded-[16px] border border-[#f0d5da] bg-[#fff7f8] px-4 text-sm font-semibold text-[#ad1d39] transition hover:bg-[#fff0f3] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="size-4" />
                          Quitar
                        </button>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      name="avatarFile"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </section>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <label className="space-y-2">
                      <ModalFieldLabel required>Nombre completo</ModalFieldLabel>
                      <Input
                        name="fullName"
                        placeholder="Ej: Juan Pérez"
                        disabled={!canEdit}
                        className={fieldClassName}
                        value={fullNameValue}
                        onChange={(event) => setFullNameValue(event.target.value)}
                      />
                    </label>
                    <label className="space-y-2">
                      <ModalFieldLabel required>Teléfono</ModalFieldLabel>
                      <Input
                        name="phone"
                        placeholder="+34 000 000 000"
                        disabled={!canEdit}
                        className={fieldClassName}
                      />
                    </label>
                    <label className="space-y-2">
                      <ModalFieldLabel required>Correo electrónico</ModalFieldLabel>
                      <Input
                        name="email"
                        placeholder="juan.perez@basketproduction.com"
                        disabled={!canEdit}
                        className={fieldClassName}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <label className="space-y-2">
                      <ModalFieldLabel>Ciudad</ModalFieldLabel>
                      <Input
                        name="city"
                        placeholder="Madrid"
                        disabled={!canEdit}
                        className={fieldClassName}
                      />
                    </label>
                    <label className="space-y-2">
                      <ModalFieldLabel required>Rol principal</ModalFieldLabel>
                      <div className="relative">
                        <Select
                          name="roleName"
                          defaultValue=""
                          disabled={!canEdit}
                          className={cn(fieldClassName, "appearance-none pr-10")}
                        >
                          <option value="">Seleccionar rol</option>
                          {roleOptions.map((roleName) => (
                            <option key={roleName} value={roleName}>
                              {getRoleDisplayName(roleName)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </label>
                  </div>

                  <label className="space-y-2">
                    <ModalFieldLabel>Responsable</ModalFieldLabel>
                    <div className="group">
                      <div className="relative">
                        <UserSearch className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3] transition group-focus-within:text-[var(--accent)]" />
                        <Input
                          name="coverageTeams"
                          list="people-team-options"
                          placeholder="Buscar y asignar responsable..."
                          disabled={!canEdit}
                          className={cn(fieldClassName, "pl-11")}
                        />
                        <datalist id="people-team-options">
                          {teamOptions.map((teamName) => (
                            <option key={teamName} value={teamName} />
                          ))}
                        </datalist>
                      </div>
                      <p className="pl-1 text-[11px] italic text-[#98a2b3]">
                        Empieza a escribir para ver sugerencias de personal directivo
                      </p>
                    </div>
                  </label>

                  <label className="space-y-2">
                    <ModalFieldLabel>Notas</ModalFieldLabel>
                    <Textarea
                      name="notes"
                      placeholder="Información adicional, experiencia previa o detalles específicos del contrato..."
                      disabled={!canEdit}
                      className="min-h-[150px] rounded-[18px] border-[#e6e8ec] bg-[#f9f8f8] text-[15px] font-medium text-[#1f2937] placeholder:text-[#98a2b3] focus:border-[var(--accent)] focus:bg-white focus:ring-[3px] focus:ring-[rgba(230,18,56,0.08)]"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-4 border-t border-[#edf1f5] bg-[#faf8f8] px-8 py-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-12 items-center justify-center rounded-[16px] px-6 text-sm font-semibold text-[#667085] transition hover:bg-[#eceff3]"
                >
                  Cancelar
                </button>
                {canEdit ? (
                  <SubmitButton
                    pendingLabel="Guardando..."
                    className="h-12 gap-2 rounded-[16px] px-7 text-sm font-bold shadow-[0_14px_32px_rgba(230,18,56,0.18)]"
                  >
                    <Save className="size-4" />
                    Guardar personal
                  </SubmitButton>
                ) : (
                  <Button
                    variant="secondary"
                    disabled
                    className="h-12 rounded-[16px] px-7"
                  >
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
