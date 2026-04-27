"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AudienceType = "all" | "photographers" | "roles" | "people";

export type AudienceRoleOption = {
  id: string;
  label: string;
  value: string;
};

export type AudiencePersonOption = {
  id: string;
  label: string;
  subtitle?: string;
  isPhotographer: boolean;
};

function getAudienceModalTitle(audienceType: AudienceType) {
  if (audienceType === "photographers") {
    return "Selecciona fotógrafos / cámaras";
  }

  if (audienceType === "roles") {
    return "Selecciona roles específicos";
  }

  return "Selecciona personas específicas";
}

function getAudienceModalDescription(audienceType: AudienceType) {
  if (audienceType === "photographers") {
    return "Marca las personas de cámara o fotografía que verán el comunicado.";
  }

  if (audienceType === "roles") {
    return "Marca los roles operativos que deben ver el comunicado.";
  }

  return "Marca las personas concretas que deben ver el comunicado.";
}

function AudienceOptionList({
  items,
  selectedValues,
  onToggle,
}: {
  items: Array<{
    id: string;
    label: string;
    subtitle?: string;
  }>;
  selectedValues: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const isSelected = selectedValues.includes(item.id);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition",
              isSelected
                ? "border-[var(--accent)] bg-[#fff7f9]"
                : "border-[var(--border)] bg-[var(--background-soft)] hover:border-[#f0c8d1] hover:bg-[var(--surface)]",
            )}
          >
            <span
              className={cn(
                "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-transparent",
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[var(--foreground)]">
                {item.label}
              </span>
              {item.subtitle ? (
                <span className="mt-0.5 block text-xs leading-5 text-[#617187]">
                  {item.subtitle}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function AnnouncementAudienceSelector({
  defaultAudienceType,
  roleOptions,
  personOptions,
  defaultRoleTargets,
  defaultPersonTargets,
}: {
  defaultAudienceType: AudienceType;
  roleOptions: AudienceRoleOption[];
  personOptions: AudiencePersonOption[];
  defaultRoleTargets: string[];
  defaultPersonTargets: string[];
}) {
  const [audienceType, setAudienceType] = useState<AudienceType>(defaultAudienceType);
  const [selectedRoleTargets, setSelectedRoleTargets] = useState<string[]>(
    defaultRoleTargets,
  );
  const [selectedPersonTargets, setSelectedPersonTargets] = useState<string[]>(
    defaultPersonTargets,
  );
  const [openModal, setOpenModal] = useState<AudienceType | null>(null);

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    if (!openModal) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenModal(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openModal]);

  const modalItems = useMemo(() => {
    if (openModal === "roles") {
      return roleOptions.map((role) => ({
        id: role.value,
        label: role.label,
        subtitle: "Rol operativo",
      }));
    }

    const filteredPeople =
      openModal === "photographers"
        ? personOptions.filter((person) => person.isPhotographer)
        : personOptions;

    return filteredPeople.map((person) => ({
      id: person.id,
      label: person.label,
      subtitle: person.subtitle,
    }));
  }, [openModal, personOptions, roleOptions]);

  const selectedValues =
    openModal === "roles" ? selectedRoleTargets : selectedPersonTargets;

  const toggleSelection = (id: string) => {
    if (openModal === "roles") {
      setSelectedRoleTargets((current) =>
        current.includes(id)
          ? current.filter((value) => value !== id)
          : [...current, id],
      );
      return;
    }

    setSelectedPersonTargets((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const openAudienceModal = (nextAudienceType: AudienceType) => {
    setAudienceType(nextAudienceType);
    setOpenModal(nextAudienceType === "all" ? null : nextAudienceType);
  };

  return (
    <div className="space-y-4">
      <label className="space-y-2">
        <span className="text-sm font-bold text-[#334155]">Mostrar a</span>
        <Select
          name="announcementAudienceType"
          value={audienceType}
          onChange={(event) => {
            const nextValue = event.target.value as AudienceType;
            openAudienceModal(nextValue);
          }}
          className="h-11 rounded-xl bg-[var(--background-soft)]"
        >
          <option value="all">Todos</option>
          <option value="photographers">Fotógrafos / cámaras</option>
          <option value="roles">Roles específicos</option>
          <option value="people">Personas específicas</option>
        </Select>
      </label>

      <div className="flex flex-wrap gap-2 text-xs text-[#617187]">
        {audienceType === "all" ? (
          <span className="rounded-full border border-[var(--border)] bg-[var(--background-soft)] px-3 py-1">
            No requiere selección adicional
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setOpenModal(audienceType)}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Elegir destinatarios
          </button>
        )}

        {selectedRoleTargets.length ? (
          <span className="rounded-full border border-[#f0c8d1] bg-[#fff0f3] px-3 py-1 font-semibold text-[var(--accent)]">
            {selectedRoleTargets.length} rol{selectedRoleTargets.length === 1 ? "" : "es"}
          </span>
        ) : null}

        {selectedPersonTargets.length ? (
          <span className="rounded-full border border-[#f0c8d1] bg-[#fff0f3] px-3 py-1 font-semibold text-[var(--accent)]">
            {selectedPersonTargets.length} persona
            {selectedPersonTargets.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {selectedRoleTargets.map((value) => (
        <input key={value} type="hidden" name="announcementRoleTargets" value={value} />
      ))}
      {selectedPersonTargets.map((value) => (
        <input key={value} type="hidden" name="announcementPersonTargets" value={value} />
      ))}

      {portalTarget && openModal && openModal !== "all"
        ? createPortal(
            <div
              className="fixed inset-0 z-[220] flex items-start justify-center overflow-y-auto bg-[#101828]/60 p-4 backdrop-blur-sm sm:items-center"
              onClick={() => setOpenModal(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="announcement-audience-title"
                className="relative my-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(15,23,42,0.22)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                      Audiencia
                    </p>
                    <h3
                      id="announcement-audience-title"
                      className="mt-2 text-xl font-extrabold text-[var(--foreground)]"
                    >
                      {getAudienceModalTitle(openModal)}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#617187]">
                      {getAudienceModalDescription(openModal)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenModal(null)}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--background-soft)] text-[#94a3b8] transition hover:bg-[#eef2f6] hover:text-[#52627a]"
                    aria-label="Cerrar selector"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
                  {modalItems.length ? (
                    <AudienceOptionList
                      items={modalItems}
                      selectedValues={selectedValues}
                      onToggle={toggleSelection}
                    />
                  ) : (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-soft)] px-4 py-5 text-sm text-[#617187]">
                      No hay opciones disponibles para esta audiencia.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] px-5 py-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOpenModal(null)}
                    className="rounded-xl px-4 py-2.5"
                  >
                    Listo
                  </Button>
                </div>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </div>
  );
}
