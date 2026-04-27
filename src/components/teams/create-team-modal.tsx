"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ImagePlus,
  Pencil,
  Plus,
  Save,
  Shield,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  buildCustomTeamId,
  readHiddenTeamKeys,
  readCustomTeams,
  slugifyTeamValue,
  writeHiddenTeamKeys,
  writeCustomTeams,
} from "@/lib/teams-local-storage";
import { CLUB_COMPETITIONS } from "@/lib/club-catalog";
import {
  getTeamDirectoryCanonicalKey,
  getResolvedTeamOfficialUrl,
  sanitizeTeamOfficialUrl,
  type TeamDirectoryItem,
} from "@/lib/team-directory";
import { cn, normalizeText } from "@/lib/utils";
import type { PersonListItem } from "@/lib/types";

export function CreateTeamModal({
  canEdit,
  defaultCompetition = "",
  triggerVariant = "default",
  initialTeam = null,
  people = [],
  triggerClassName,
  triggerLabel,
}: {
  canEdit: boolean;
  defaultCompetition?: string;
  triggerVariant?: "default" | "icon" | "secondary";
  initialTeam?: TeamDirectoryItem | null;
  people?: PersonListItem[];
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [officialName, setOfficialName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [competition, setCompetition] = useState(defaultCompetition);
  const [stadium, setStadium] = useState("");
  const [manager, setManager] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(initialTeam?.logo_data_url ?? null);
  const [resolvedLogoPreview, setResolvedLogoPreview] = useState<{
    key: string;
    src: string | null;
  }>({
    key: "",
    src: null,
  });
  const [officialUrlDirty, setOfficialUrlDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isEditMode = Boolean(initialTeam);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const trimmedOfficialName = officialName.trim();
  const trimmedCompetition = competition.trim();
  const logoQueryKey = `${trimmedOfficialName}::${trimmedCompetition}`;
  const resolvedOfficialUrl = useMemo(
    () =>
      getResolvedTeamOfficialUrl({
        officialName,
        competition,
      }) ?? "",
    [competition, officialName],
  );
  const visibleOfficialUrl = officialUrlDirty ? officialUrl : resolvedOfficialUrl;
  const visibleLogoPreview =
    logoPreview ??
    (trimmedOfficialName && resolvedLogoPreview.key === logoQueryKey
      ? resolvedLogoPreview.src
      : null);
  const normalizedManagerQuery = normalizeText(manager);
  const responsibleSuggestions = useMemo(() => {
    if (!normalizedManagerQuery || manager.trim().length < 2) {
      return [];
    }

    if (people.some((person) => normalizeText(person.full_name) === normalizedManagerQuery)) {
      return [];
    }

    return [...people]
      .filter((person) => normalizeText(person.full_name).includes(normalizedManagerQuery))
      .sort((left, right) => {
        const leftName = normalizeText(left.full_name);
        const rightName = normalizeText(right.full_name);
        const leftStarts = leftName.startsWith(normalizedManagerQuery);
        const rightStarts = rightName.startsWith(normalizedManagerQuery);

        if (leftStarts !== rightStarts) {
          return leftStarts ? -1 : 1;
        }

        if (left.active !== right.active) {
          return Number(right.active) - Number(left.active);
        }

        return left.full_name.localeCompare(right.full_name, "es");
      })
      .slice(0, 6);
  }, [manager, normalizedManagerQuery, people]);

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
  }, [defaultCompetition, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!trimmedOfficialName) {
      return;
    }

    let ignore = false;

    fetch(
      `/api/team-logo?${new URLSearchParams({
        teamName: trimmedOfficialName,
        ...(trimmedCompetition ? { competition: trimmedCompetition } : {}),
      }).toString()}`,
      {
        method: "GET",
        credentials: "same-origin",
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("No se pudo resolver el escudo.");
        }

        const data = (await response.json()) as { src?: string | null };
        if (!ignore) {
          setResolvedLogoPreview({
            key: logoQueryKey,
            src: data.src ?? null,
          });
        }
      })
      .catch(() => {
        if (!ignore) {
          setResolvedLogoPreview({
            key: logoQueryKey,
            src: null,
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, logoQueryKey, trimmedCompetition, trimmedOfficialName]);

  function resetForm() {
    const nextOfficialName = initialTeam?.official_name ?? "";
    const nextDisplayName = initialTeam ? initialTeam.display_name ?? initialTeam.official_name : "";
    const nextCompetition = initialTeam?.competition ?? defaultCompetition;
    const nextStoredOfficialUrl = sanitizeTeamOfficialUrl(initialTeam?.official_url) ?? "";
    const nextResolvedOfficialUrl =
      getResolvedTeamOfficialUrl({
        officialName: nextOfficialName,
        competition: nextCompetition,
      }) ?? "";

    setOfficialName(initialTeam?.official_name ?? "");
    setDisplayName(nextDisplayName);
    setCompetition(nextCompetition);
    setStadium(initialTeam?.stadium ?? "");
    setManager(initialTeam?.manager ?? "");
    setWebsite(initialTeam?.website ?? "");
    setInstagram(initialTeam?.instagram ?? "");
    setOfficialUrl(nextStoredOfficialUrl || nextResolvedOfficialUrl);
    setLogoPreview(initialTeam?.logo_data_url ?? null);
    setResolvedLogoPreview({ key: "", src: null });
    setOfficialUrlDirty(
      Boolean(nextStoredOfficialUrl && nextStoredOfficialUrl !== nextResolvedOfficialUrl),
    );
    setErrorMessage("");
  }

  function closeModal() {
    setIsOpen(false);
    resetForm();
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const nextValue = typeof reader.result === "string" ? reader.result : null;
      setLogoPreview(nextValue);
    };

    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setLogoPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    const trimmedName = officialName.trim();
    const trimmedDisplayName = displayName.trim() || trimmedName;
    const trimmedCompetition = competition.trim();

    if (!trimmedName || !trimmedCompetition) {
      setErrorMessage("Nombre oficial y liga son obligatorios.");
      return;
    }

    const nextTeamId = buildCustomTeamId(trimmedName, trimmedCompetition);
    const nextCanonicalKey = getTeamDirectoryCanonicalKey({
      officialName: trimmedName,
      displayName: trimmedDisplayName,
      competition: trimmedCompetition,
    });
    const previousCanonicalKey = initialTeam
      ? getTeamDirectoryCanonicalKey({
          officialName: initialTeam.official_name,
          displayName: initialTeam.display_name,
          competition: initialTeam.competition,
        })
      : null;

    const nextTeam: TeamDirectoryItem = {
      id: nextTeamId,
      slug: slugifyTeamValue(`${trimmedName}-${trimmedCompetition}`),
      official_name: trimmedName,
      display_name: trimmedDisplayName,
      competition: trimmedCompetition,
      stadium: stadium.trim() || null,
      manager: manager.trim() || null,
      website: website.trim() || null,
      instagram: instagram.trim() || null,
      official_url: sanitizeTeamOfficialUrl(
        officialUrlDirty ? officialUrl.trim() : resolvedOfficialUrl,
      ),
      incident_count: 0,
      logo_data_url: logoPreview,
    };

    const currentTeams = readCustomTeams();
    const dedupedTeams = currentTeams.filter(
      (team) =>
        team.id !== nextTeam.id &&
        (!initialTeam || team.id !== initialTeam.id) &&
        getTeamDirectoryCanonicalKey({
          officialName: team.official_name,
          displayName: team.display_name,
          competition: team.competition,
        }) !== nextCanonicalKey,
    );
    const hiddenTeamKeys = readHiddenTeamKeys();
    const nextHiddenTeamKeys = hiddenTeamKeys.filter((key) => key !== nextCanonicalKey);

    writeCustomTeams(
      [...dedupedTeams, nextTeam].sort((left, right) =>
        left.official_name.localeCompare(right.official_name, "es"),
      ),
    );

    if (previousCanonicalKey && previousCanonicalKey !== nextCanonicalKey) {
      writeHiddenTeamKeys([...nextHiddenTeamKeys, previousCanonicalKey]);
    } else if (nextHiddenTeamKeys.length !== hiddenTeamKeys.length) {
      writeHiddenTeamKeys(nextHiddenTeamKeys);
    }

    closeModal();
  }

  function handleDelete() {
    if (!canEdit || !initialTeam) {
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar ${initialTeam.display_name || initialTeam.official_name} del directorio?`,
    );

    if (!confirmed) {
      return;
    }

    const deletedCanonicalKey = getTeamDirectoryCanonicalKey({
      officialName: initialTeam.official_name,
      displayName: initialTeam.display_name,
      competition: initialTeam.competition,
    });
    const currentTeams = readCustomTeams();

    writeCustomTeams(
      currentTeams.filter(
        (team) =>
          team.id !== initialTeam.id &&
          getTeamDirectoryCanonicalKey({
            officialName: team.official_name,
            displayName: team.display_name,
            competition: team.competition,
          }) !== deletedCanonicalKey,
      ),
    );
    writeHiddenTeamKeys([...readHiddenTeamKeys(), deletedCanonicalKey]);
    closeModal();
  }

  return (
    <>
      {triggerVariant === "icon" ? (
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          aria-label={isEditMode ? "Editar equipo" : "Editar equipos"}
          title={isEditMode ? "Editar equipo" : "Editar equipos"}
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-[#f4f7fb] text-[#70819b] transition hover:bg-[#eef2f6] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60",
            triggerClassName,
          )}
        >
          <Pencil className="size-4" />
        </button>
      ) : triggerVariant === "secondary" ? (
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-[var(--panel-radius)] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[#fafbfd] disabled:cursor-not-allowed disabled:opacity-60",
            triggerClassName,
          )}
        >
          <Pencil className="size-4" />
          {triggerLabel ?? (isEditMode ? "Editar equipo" : "Editar")}
        </button>
      ) : (
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="inline-flex h-[52px] items-center gap-2 rounded-[var(--panel-radius)] bg-[var(--accent)] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isEditMode ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          {isEditMode ? "Editar equipo" : "Registrar equipo"}
        </button>
      )}

      {isOpen && typeof document !== "undefined"
        ? createPortal(
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-[#101828]/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="panel-surface relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[78rem] flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 border-b border-[var(--border)] px-6 py-5 xl:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#fff4f6] text-[var(--accent)]">
                    <Shield className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                      {isEditMode ? "Editar equipo" : "Registrar equipo"}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--background-soft)] text-[#94a3b8] transition hover:bg-[#eef2f6] hover:text-[#52627a]"
                  aria-label="Cerrar modal"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6 xl:px-8 xl:py-5">
                <section className="rounded-[var(--panel-radius)] border border-[#eef1f4] bg-[#fbfbfb] p-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-[var(--panel-radius)] border border-[#e5e7eb] bg-white shadow-sm">
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Preview del escudo"
                          fill
                          unoptimized
                          sizes="96px"
                          className="object-contain p-2"
                        />
                      ) : visibleLogoPreview ? (
                        <Image
                          src={visibleLogoPreview}
                          alt="Preview del escudo"
                          fill
                          sizes="96px"
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-[#f3f4f6] text-[#98a2b3]">
                          <Shield className="size-9" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#344054]">
                        Escudo del equipo
                      </p>
                      <p className="text-sm leading-6 text-[#667085] md:whitespace-nowrap">
                        Sube el escudo en PNG 500 x 500, idealmente sin fondo.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 md:ml-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!canEdit}
                      className="inline-flex h-11 items-center gap-2 rounded-[var(--panel-radius)] border border-[#e5e7eb] bg-white px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ImagePlus className="size-4 text-[var(--accent)]" />
                      Subir escudo
                    </button>
                    <button
                      type="button"
                      onClick={clearLogo}
                      disabled={!logoPreview || !canEdit}
                      className="inline-flex h-11 items-center gap-2 rounded-[var(--panel-radius)] border border-[#f0d5da] bg-[#fff7f8] px-4 text-sm font-semibold text-[#ad1d39] transition hover:bg-[#fff0f3] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                      Quitar
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/webp,image/svg+xml,image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                </section>

                <div className="grid gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">
                    Nombre oficial
                  </span>
                  <Input
                    value={officialName}
                    onChange={(event) => setOfficialName(event.target.value)}
                    placeholder="Ej. 9 de Julio de Morteros"
                    className="h-11 rounded-xl bg-[var(--background-soft)]"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">
                    Nombre visible
                  </span>
                  <Input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Ej. Atenas"
                    className="h-11 rounded-xl bg-[var(--background-soft)]"
                  />
                  <span className="block text-xs text-[#667085]">
                    Opcional. Si lo dejas vacío, usamos el nombre oficial.
                  </span>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">
                    Liga
                  </span>
                  <Select
                    value={competition}
                    onChange={(event) => setCompetition(event.target.value)}
                    className="h-11 rounded-xl bg-[var(--background-soft)]"
                  >
                    <option value="">Seleccionar liga...</option>
                    {CLUB_COMPETITIONS.map((competitionOption) => (
                      <option key={competitionOption} value={competitionOption}>
                        {competitionOption}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">
                    Estadio
                  </span>
                  <Input
                    value={stadium}
                    onChange={(event) => setStadium(event.target.value)}
                    placeholder="Ej. Ángel Sandrín"
                    className="h-11 rounded-xl bg-[var(--background-soft)]"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">
                    Responsable
                  </span>
                  <div className="relative">
                    <Input
                      value={manager}
                      onChange={(event) => setManager(event.target.value)}
                      placeholder="Nombre del responsable"
                      className="h-11 rounded-xl bg-[var(--background-soft)]"
                      autoComplete="off"
                    />
                    {responsibleSuggestions.length ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-20 overflow-hidden rounded-[var(--panel-radius)] border border-[var(--border)] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.14)]">
                        {responsibleSuggestions.map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => setManager(person.full_name)}
                            className="flex w-full items-center justify-between gap-3 border-b border-[#eef1f4] px-4 py-3 text-left text-sm text-[var(--foreground)] transition last:border-b-0 hover:bg-[#f8fafc]"
                          >
                            <span className="font-semibold">{person.full_name}</span>
                            <span className="text-xs text-[#667085]">
                              {person.active ? "Activo" : "Inactivo"}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <span className="block text-xs text-[#667085]">
                    Busca por nombre o apellido y te sugerimos personas del directorio.
                  </span>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">
                    Sitio web
                  </span>
                  <Input
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    placeholder="https://..."
                    className="h-11 rounded-xl bg-[var(--background-soft)]"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#334155]">
                    Instagram
                  </span>
                  <Input
                    value={instagram}
                    onChange={(event) => setInstagram(event.target.value)}
                    placeholder="https://instagram.com/..."
                    className="h-11 rounded-xl bg-[var(--background-soft)]"
                  />
                </label>
                <label className="space-y-2 md:col-span-2 xl:col-span-2">
                <span className="text-sm font-bold text-[#334155]">
                  Enlace oficial
                </span>
                <Input
                  value={visibleOfficialUrl}
                  onChange={(event) => {
                    setOfficialUrl(event.target.value);
                    setOfficialUrlDirty(true);
                  }}
                  placeholder="https://..."
                  className="h-11 rounded-xl bg-[var(--background-soft)]"
                />
                </label>
                </div>

                {errorMessage ? (
                  <div className="rounded-xl border border-[#f0c8d1] bg-[#fff4f6] px-4 py-3 text-sm font-semibold text-[#ad1d39]">
                    {errorMessage}
                  </div>
                ) : null}
              </div>

              <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4 xl:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {isEditMode ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#f0c8d1] bg-[#fff4f6] px-5 text-sm font-bold text-[#ad1d39] transition hover:bg-[#fff0f3]"
                    >
                      <Trash2 className="size-4" />
                      Eliminar equipo
                    </button>
                  ) : (
                    <span />
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 rounded-xl px-5"
                      onClick={closeModal}
                    >
                      Cancelar
                    </Button>
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)]"
                    >
                      <Save className="size-4" />
                      {isEditMode ? "Guardar cambios" : "Guardar equipo"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
