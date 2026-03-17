"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Save, Shield, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  buildCustomTeamId,
  readCustomTeams,
  slugifyTeamValue,
  writeCustomTeams,
} from "@/lib/teams-local-storage";
import { CLUB_COMPETITIONS } from "@/lib/club-catalog";
import type { TeamDirectoryItem } from "@/lib/team-directory";

function defaultLeagueUrl(competition: string) {
  if (!competition.trim()) {
    return "";
  }

  return "https://www.laliganacional.com.ar/";
}

export function CreateTeamModal({
  canEdit,
  defaultCompetition = "",
  triggerVariant = "default",
}: {
  canEdit: boolean;
  defaultCompetition?: string;
  triggerVariant?: "default" | "icon";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [officialName, setOfficialName] = useState("");
  const [competition, setCompetition] = useState(defaultCompetition);
  const [stadium, setStadium] = useState("");
  const [manager, setManager] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  function resetForm() {
    setOfficialName("");
    setCompetition(defaultCompetition);
    setStadium("");
    setManager("");
    setWebsite("");
    setInstagram("");
    setOfficialUrl("");
    setErrorMessage("");
  }

  function closeModal() {
    setIsOpen(false);
    resetForm();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    const trimmedName = officialName.trim();
    const trimmedCompetition = competition.trim();

    if (!trimmedName || !trimmedCompetition) {
      setErrorMessage("Nombre oficial y liga son obligatorios.");
      return;
    }

    const nextTeam: TeamDirectoryItem = {
      id: buildCustomTeamId(trimmedName, trimmedCompetition),
      slug: slugifyTeamValue(`${trimmedName}-${trimmedCompetition}`),
      official_name: trimmedName,
      competition: trimmedCompetition,
      stadium: stadium.trim() || null,
      manager: manager.trim() || null,
      website: website.trim() || null,
      instagram: instagram.trim() || null,
      official_url: officialUrl.trim() || defaultLeagueUrl(trimmedCompetition) || null,
      incident_count: 0,
    };

    const currentTeams = readCustomTeams();
    const dedupedTeams = currentTeams.filter((team) => team.id !== nextTeam.id);

    writeCustomTeams(
      [...dedupedTeams, nextTeam].sort((left, right) =>
        left.official_name.localeCompare(right.official_name, "es"),
      ),
    );

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
            setCompetition(defaultCompetition);
            setIsOpen(true);
          }}
          aria-label="Editar equipos"
          title="Editar equipos"
          className="inline-flex size-11 items-center justify-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] text-[#617187] shadow-sm transition hover:border-[#efc2cb] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Pencil className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            resetForm();
            setCompetition(defaultCompetition);
            setIsOpen(true);
          }}
          className="inline-flex h-[52px] items-center gap-2 rounded-[var(--panel-radius)] bg-[var(--accent)] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="size-4" />
          Registrar equipo
        </button>
      )}

      {isOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#101828]/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="panel-surface relative flex w-full max-w-3xl flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[var(--border)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#fff4f6] text-[var(--accent)]">
                    <Shield className="size-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                      Equipos
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                      Registrar equipo
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Se guardará en este navegador y aparecerá de inmediato en el directorio.
                    </p>
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

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div className="grid gap-6 md:grid-cols-2">
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
                  <Input
                    value={manager}
                    onChange={(event) => setManager(event.target.value)}
                    placeholder="Nombre del responsable"
                    className="h-11 rounded-xl bg-[var(--background-soft)]"
                  />
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
              </div>

              <label className="space-y-2">
                <span className="text-sm font-bold text-[#334155]">
                  Enlace oficial
                </span>
                <Input
                  value={officialUrl}
                  onChange={(event) => setOfficialUrl(event.target.value)}
                  placeholder="https://..."
                  className="h-11 rounded-xl bg-[var(--background-soft)]"
                />
              </label>

              {errorMessage ? (
                <div className="rounded-xl border border-[#f0c8d1] bg-[#fff4f6] px-4 py-3 text-sm font-semibold text-[#ad1d39]">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-5">
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
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)]"
                >
                  <Save className="size-4" />
                  Guardar equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
