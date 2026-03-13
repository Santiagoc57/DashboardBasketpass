"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Camera,
  CircleAlert,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  UserRound,
  Users,
  WandSparkles,
  X,
} from "lucide-react";

import {
  createMatchAction,
  deleteMatchAction,
  updateMatchAction,
} from "@/app/actions/matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { ALL_CLUB_OPTIONS, CLUB_COMPETITIONS } from "@/lib/club-catalog";
import {
  DEFAULT_MATCH_DURATION_MINUTES,
  DEFAULT_TIMEZONE,
  MATCH_STATUS_OPTIONS,
  PRODUCTION_MODE_OPTIONS,
} from "@/lib/constants";
import { formatMatchDate, formatMatchTime } from "@/lib/date";
import { getTeamCompetitionByName, getTeamVenueByName } from "@/lib/team-directory";
import type { PersonRow } from "@/lib/database.types";
import type { MatchListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const CORE_REQUIRED_FIELDS = [
  "productionCode",
  "competition",
  "homeTeam",
  "awayTeam",
  "date",
  "time",
  "productionMode",
  "venue",
] as const;

const CORE_FIELD_LABELS: Record<(typeof CORE_REQUIRED_FIELDS)[number], string> = {
  productionCode: "Producción",
  competition: "Liga",
  homeTeam: "Local",
  awayTeam: "Visitante",
  date: "Día",
  time: "Hora",
  productionMode: "Modo",
  venue: "Sede",
};

type CreateMatchModalProps = {
  people: Pick<PersonRow, "id" | "full_name">[];
  redirectTo: string;
  canEdit: boolean;
  initialDate: string;
  match?: MatchListItem;
  triggerVariant?: "primary" | "icon";
  triggerClassName?: string;
  triggerLabel?: string;
  triggerIcon?: ReactNode;
};

type MatchIntakeFields = {
  externalMatchId: string;
  productionCode: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  productionMode: string;
  status: string;
  venue: string;
  durationMinutes: string;
  responsableId: string;
  realizadorId: string;
  graficaId: string;
  camara1Id: string;
  camara2Id: string;
  camara3Id: string;
  camara4Id: string;
  camara5Id: string;
  commentaryPlan: string;
  relatorId: string;
  comentario1Id: string;
  comentario2Id: string;
  controlId: string;
  soporteId: string;
  transport: string;
  notes: string;
};

function buildInitialFields(initialDate: string): MatchIntakeFields {
  return {
    externalMatchId: "",
    productionCode: "",
    competition: "",
    homeTeam: "",
    awayTeam: "",
    date: initialDate,
    time: "19:00",
    productionMode: "",
    status: "Pendiente",
    venue: "",
    durationMinutes: String(DEFAULT_MATCH_DURATION_MINUTES),
    responsableId: "",
    realizadorId: "",
    graficaId: "",
    camara1Id: "",
    camara2Id: "",
    camara3Id: "",
    camara4Id: "",
    camara5Id: "",
    commentaryPlan: "",
    relatorId: "",
    comentario1Id: "",
    comentario2Id: "",
    controlId: "",
    soporteId: "",
    transport: "",
    notes: "",
  };
}

function getAssignedPersonId(match: MatchListItem, roleName: string) {
  return (
    match.assignments.find((assignment) => assignment.role.name === roleName)?.person?.id ??
    ""
  );
}

function buildFieldsFromMatch(match: MatchListItem): MatchIntakeFields {
  return {
    externalMatchId: match.external_match_id ?? "",
    productionCode: match.production_code ?? "",
    competition: match.competition ?? "",
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    date: formatMatchDate(match.kickoff_at, match.timezone, "yyyy-MM-dd"),
    time: formatMatchTime(match.kickoff_at, match.timezone, "HH:mm"),
    productionMode: match.production_mode ?? "",
    status: match.status ?? "Pendiente",
    venue: match.venue ?? "",
    durationMinutes: String(
      match.duration_minutes ?? DEFAULT_MATCH_DURATION_MINUTES,
    ),
    responsableId:
      getAssignedPersonId(match, "Responsable") || match.owner?.id || "",
    realizadorId: getAssignedPersonId(match, "Realizador"),
    graficaId: getAssignedPersonId(match, "Operador de Grafica"),
    camara1Id: getAssignedPersonId(match, "Camara 1"),
    camara2Id: getAssignedPersonId(match, "Camara 2"),
    camara3Id: getAssignedPersonId(match, "Camara 3"),
    camara4Id: getAssignedPersonId(match, "Camara 4"),
    camara5Id: getAssignedPersonId(match, "Camara 5"),
    commentaryPlan: match.commentary_plan ?? "",
    relatorId: getAssignedPersonId(match, "Relator"),
    comentario1Id: getAssignedPersonId(match, "Comentario 1"),
    comentario2Id: getAssignedPersonId(match, "Comentario 2"),
    controlId: getAssignedPersonId(match, "Operador de Control"),
    soporteId: getAssignedPersonId(match, "Soporte tecnico"),
    transport: match.transport ?? "",
    notes: match.notes ?? "",
  };
}

function SectionBlock({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-visible pl-5">
      <div
        aria-hidden="true"
        className="absolute left-0 top-6 h-16 w-9 rounded-l-[16px] rounded-r-[12px] bg-[var(--accent)]/18"
      />
      <div className="relative z-[1] space-y-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-6 py-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 items-center justify-center rounded-full bg-[var(--background-soft)] text-[var(--accent)]">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-extrabold uppercase tracking-[0.12em] text-[var(--foreground)]">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function LabeledField({
  label,
  required,
  alert,
  children,
}: {
  label: string;
  required?: boolean;
  alert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
        {label}
        {required ? <span className="text-[var(--accent)]">*</span> : null}
        {alert ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4f6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c12d4d]">
            Falta
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function PersonSelectField({
  label,
  name,
  value,
  people,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  people: Pick<PersonRow, "id" | "full_name">[];
  onChange: (name: keyof MatchIntakeFields, value: string) => void;
}) {
  return (
    <LabeledField label={label}>
      <Select
        name={name}
        value={value}
        onChange={(event) =>
          onChange(name as keyof MatchIntakeFields, event.target.value)
        }
      >
        <option value="">Sin asignar</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.full_name}
          </option>
        ))}
      </Select>
    </LabeledField>
  );
}

export function CreateMatchModal({
  people,
  redirectTo,
  canEdit,
  initialDate,
  match,
  triggerVariant = "primary",
  triggerClassName,
  triggerLabel,
  triggerIcon,
}: CreateMatchModalProps) {
  const isEditing = Boolean(match);
  const defaultFields = useMemo(
    () => (match ? buildFieldsFromMatch(match) : buildInitialFields(initialDate)),
    [initialDate, match],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [fields, setFields] = useState<MatchIntakeFields>(defaultFields);
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [competitionTouched, setCompetitionTouched] = useState(false);
  const [venueTouched, setVenueTouched] = useState(false);

  useEffect(() => {
    setFields(defaultFields);
  }, [defaultFields]);

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

  const missingFields = lookupAttempted
    ? CORE_REQUIRED_FIELDS.filter((field) => !fields[field].trim())
    : [];

  const visibleMissingFieldLabels = missingFields.map(
    (field) => CORE_FIELD_LABELS[field],
  );

  const fieldSurfaceClass = "h-11 bg-[var(--background-soft)]";
  const missingFieldClass =
    "border-[#efbcc7] bg-[#fff5f7] focus:border-[#df5575] focus:ring-[rgba(223,85,117,0.12)]";

  const peopleOptions = useMemo(
    () =>
      [...people].sort((left, right) =>
        left.full_name.localeCompare(right.full_name, "es"),
      ),
    [people],
  );

  function updateField(name: keyof MatchIntakeFields, value: string) {
    setFields((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleHomeTeamChange(value: string) {
    const suggestedVenue = getTeamVenueByName(value);
    const suggestedCompetition = getTeamCompetitionByName(value);

    setFields((current) => ({
      ...current,
      homeTeam: value,
      venue:
        venueTouched || current.venue.trim()
          ? current.venue
          : suggestedVenue ?? current.venue,
      competition:
        competitionTouched || current.competition.trim()
          ? current.competition
          : suggestedCompetition ?? current.competition,
    }));
  }

  async function handleLookup() {
    const externalId = fields.externalMatchId.trim();

    if (!externalId) {
      setLookupAttempted(true);
      setLookupMessage("Ingresa un ID antes de intentar autocompletar.");
      return;
    }

    setIsLookingUp(true);
    setLookupAttempted(true);
    setLookupMessage("");

    try {
      const response = await fetch("/api/matches/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ externalId }),
      });

      const payload = (await response.json()) as {
        configured?: boolean;
        message?: string;
        match?: Partial<MatchIntakeFields>;
      };

      if (!response.ok || !payload.match) {
        setLookupMessage(
          payload.message ??
            "No se pudo completar la consulta externa. Continúa la carga manualmente.",
        );
        return;
      }

      const matchPayload = payload.match;

      setFields((current) => {
        const nextHomeTeam = matchPayload.homeTeam?.trim() || current.homeTeam;
        const suggestedCompetition =
          matchPayload.competition?.trim() ||
          getTeamCompetitionByName(nextHomeTeam) ||
          current.competition;
        const suggestedVenue =
          matchPayload.venue?.trim() ||
          getTeamVenueByName(nextHomeTeam) ||
          current.venue;

        return {
          ...current,
          externalMatchId:
            matchPayload.externalMatchId?.trim() || current.externalMatchId,
          productionCode:
            matchPayload.productionCode?.trim() || current.productionCode,
          competition:
            competitionTouched && current.competition.trim()
              ? current.competition
              : suggestedCompetition,
          homeTeam: nextHomeTeam,
          awayTeam: matchPayload.awayTeam?.trim() || current.awayTeam,
          date: matchPayload.date?.trim() || current.date,
          time: matchPayload.time?.trim() || current.time,
          venue:
            venueTouched && current.venue.trim() ? current.venue : suggestedVenue,
        };
      });

      setLookupMessage(
        payload.configured === false
          ? payload.message ??
            "La API todavía no está configurada. Revisa los campos faltantes."
          : "Partido autocompletado. Revisa los campos marcados antes de guardar.",
      );
    } catch (error) {
      setLookupMessage(
        error instanceof Error
          ? error.message
          : "No se pudo consultar el ID externo.",
      );
    } finally {
      setIsLookingUp(false);
    }
  }

  function resetAndClose() {
    setIsOpen(false);
    setFields(defaultFields);
    setLookupMessage("");
    setLookupAttempted(false);
    setCompetitionTouched(false);
    setVenueTouched(false);
  }

  return (
    <>
      {triggerVariant === "icon" ? (
        <button
          type="button"
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full border border-[#d7dde7] bg-[#f4f6fa] text-[#16181d] transition hover:border-[rgba(230,18,56,0.24)] hover:bg-[#fff3f6] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
            isOpen &&
              "border-[rgba(230,18,56,0.24)] bg-[#fff3f6] text-[var(--accent)]",
            triggerClassName,
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsOpen(true);
          }}
          disabled={!canEdit}
          aria-label={triggerLabel ?? (isEditing ? "Editar partido" : "Crear partido")}
        >
          {triggerIcon ?? <Plus className="size-4" />}
        </button>
      ) : (
        <Button
          type="button"
          className={cn("h-[52px] gap-2 px-5 text-sm font-extrabold", triggerClassName)}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsOpen(true);
          }}
          disabled={!canEdit}
        >
          {triggerIcon ?? <Plus className="size-4" />}
          {triggerLabel ?? "Crear partido"}
        </Button>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center bg-[rgba(15,23,42,0.48)] px-4 py-8 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onClick={resetAndClose}
          />
          <div className="relative z-[1] flex max-h-[calc(100vh-4rem)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_32px_80px_rgba(15,23,42,0.22)]">
              <div className="flex items-start justify-between gap-6 border-b border-[var(--border)] px-7 py-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">
                    <Sparkles className="size-3.5" />
                    {isEditing ? "Editar partido" : "Nuevo partido"}
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                      {isEditing ? "Editar partido" : "Crear partido"}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {isEditing
                        ? "Modifica la producción, actualiza asignaciones o elimina la tarjeta si ya no corresponde."
                        : "Completa la producción operativa o pega un ID externo para precargar el juego."}
                    </p>
                  </div>
                </div>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
                onClick={resetAndClose}
                aria-label="Cerrar"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <form
              action={isEditing ? updateMatchAction : createMatchAction}
              className="flex min-h-0 flex-1 flex-col"
            >
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <input type="hidden" name="timezone" value={DEFAULT_TIMEZONE} />
              {isEditing ? <input type="hidden" name="matchId" value={match?.id} /> : null}

              <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.8fr)]">
                <div className="space-y-6">
                    <SectionBlock
                      icon={<WandSparkles className="size-4.5" />}
                      title="Autocompletar por ID"
                    >
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <LabeledField label="ID externo">
                          <Input
                            name="externalMatchId"
                            value={fields.externalMatchId}
                            onChange={(event) =>
                              updateField("externalMatchId", event.target.value)
                            }
                            placeholder="GB56789"
                            className={fieldSurfaceClass}
                          />
                        </LabeledField>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-11 min-w-[12rem] gap-2"
                            onClick={handleLookup}
                            disabled={isLookingUp || isEditing}
                          >
                            {isLookingUp ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Sparkles className="size-4" />
                            )}
                            Autocompletar
                          </Button>
                        </div>
                      </div>
                      {lookupMessage ? (
                        <div
                          className={cn(
                            "rounded-[16px] border px-4 py-3 text-sm",
                            missingFields.length
                              ? "border-[#efc8d0] bg-[#fff7f9] text-[#ad3650]"
                              : "border-[#dbe6ff] bg-[#f5f8ff] text-[#46608e]",
                          )}
                        >
                          {lookupMessage}
                        </div>
                      ) : null}
                      {visibleMissingFieldLabels.length ? (
                        <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-[#f3d6dc] bg-[#fff7f9] px-4 py-3">
                          <CircleAlert className="size-4 text-[#c12d4d]" />
                          <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#c12d4d]">
                            Faltan datos
                          </span>
                          {visibleMissingFieldLabels.map((label) => (
                            <span
                              key={label}
                              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#8c2d43]"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </SectionBlock>

                    <SectionBlock
                      icon={<CalendarDays className="size-4.5" />}
                      title="Partido"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <LabeledField
                          label="Producción"
                          required
                          alert={missingFields.includes("productionCode")}
                        >
                          <Input
                            name="productionCode"
                            value={fields.productionCode}
                            onChange={(event) =>
                              updateField("productionCode", event.target.value)
                            }
                            placeholder="PRD-EC39-E909"
                            className={cn(
                              fieldSurfaceClass,
                              missingFields.includes("productionCode") &&
                                missingFieldClass,
                            )}
                          />
                        </LabeledField>
                        <LabeledField
                          label="Nombre de la liga"
                          required
                          alert={missingFields.includes("competition")}
                        >
                          <Input
                            name="competition"
                            list="match-competition-catalog"
                            value={fields.competition}
                            onChange={(event) => {
                              setCompetitionTouched(true);
                              updateField("competition", event.target.value);
                            }}
                            placeholder="Liga Nacional"
                            className={cn(
                              fieldSurfaceClass,
                              missingFields.includes("competition") &&
                                missingFieldClass,
                            )}
                          />
                        </LabeledField>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <LabeledField
                          label="Local"
                          required
                          alert={missingFields.includes("homeTeam")}
                        >
                          <Input
                            name="homeTeam"
                            list="match-club-catalog"
                            value={fields.homeTeam}
                            onChange={(event) =>
                              handleHomeTeamChange(event.target.value)
                            }
                            placeholder="Equipo local"
                            className={cn(
                              fieldSurfaceClass,
                              missingFields.includes("homeTeam") &&
                                missingFieldClass,
                            )}
                          />
                        </LabeledField>
                        <LabeledField
                          label="Visitante"
                          required
                          alert={missingFields.includes("awayTeam")}
                        >
                          <Input
                            name="awayTeam"
                            list="match-club-catalog"
                            value={fields.awayTeam}
                            onChange={(event) =>
                              updateField("awayTeam", event.target.value)
                            }
                            placeholder="Equipo visitante"
                            className={cn(
                              fieldSurfaceClass,
                              missingFields.includes("awayTeam") &&
                                missingFieldClass,
                            )}
                          />
                        </LabeledField>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <LabeledField
                          label="Día"
                          required
                          alert={missingFields.includes("date")}
                        >
                          <Input
                            type="date"
                            name="date"
                            value={fields.date}
                            onChange={(event) =>
                              updateField("date", event.target.value)
                            }
                            className={cn(
                              fieldSurfaceClass,
                              missingFields.includes("date") &&
                                missingFieldClass,
                            )}
                          />
                        </LabeledField>
                        <LabeledField
                          label="Hora"
                          required
                          alert={missingFields.includes("time")}
                        >
                          <Input
                            type="time"
                            name="time"
                            value={fields.time}
                            onChange={(event) =>
                              updateField("time", event.target.value)
                            }
                            className={cn(
                              fieldSurfaceClass,
                              missingFields.includes("time") && missingFieldClass,
                            )}
                          />
                        </LabeledField>
                        <LabeledField
                          label="Modo"
                          required
                          alert={missingFields.includes("productionMode")}
                        >
                          <Select
                            name="productionMode"
                            value={fields.productionMode}
                            onChange={(event) =>
                              updateField("productionMode", event.target.value)
                            }
                            className={cn(
                              fieldSurfaceClass,
                              missingFields.includes("productionMode") &&
                                missingFieldClass,
                            )}
                          >
                            <option value="">Selecciona un modo</option>
                            {PRODUCTION_MODE_OPTIONS.map((mode) => (
                              <option key={mode} value={mode}>
                                {mode}
                              </option>
                            ))}
                          </Select>
                        </LabeledField>
                        <LabeledField label="Estado">
                          <Select
                            name="status"
                            value={fields.status}
                            onChange={(event) =>
                              updateField("status", event.target.value)
                            }
                            className={fieldSurfaceClass}
                          >
                            {MATCH_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </Select>
                        </LabeledField>
                      </div>

                      <div className="grid gap-4">
                        <LabeledField
                          label="Sede"
                          required
                          alert={missingFields.includes("venue")}
                        >
                          <Input
                            name="venue"
                            value={fields.venue}
                            onChange={(event) => {
                              setVenueTouched(true);
                              updateField("venue", event.target.value);
                            }}
                            placeholder="Sede del local / remoto"
                            className={cn(
                              fieldSurfaceClass,
                              missingFields.includes("venue") && missingFieldClass,
                            )}
                          />
                        </LabeledField>
                      </div>
                    </SectionBlock>

                    <SectionBlock
                      icon={<Users className="size-4.5" />}
                      title="Staff en cancha"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <PersonSelectField
                          label="Responsable en cancha"
                          name="responsableId"
                          value={fields.responsableId}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                        <PersonSelectField
                          label="Realizador"
                          name="realizadorId"
                          value={fields.realizadorId}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                        <PersonSelectField
                          label="Operador de gráfica"
                          name="graficaId"
                          value={fields.graficaId}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                        <PersonSelectField
                          label="Operador de control"
                          name="controlId"
                          value={fields.controlId}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                        <PersonSelectField
                          label="Soporte técnico"
                          name="soporteId"
                          value={fields.soporteId}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                        <LabeledField label="Transporte">
                          <Input
                            name="transport"
                            value={fields.transport}
                            onChange={(event) =>
                              updateField("transport", event.target.value)
                            }
                            placeholder="Proveedor / movilidad"
                            className={fieldSurfaceClass}
                          />
                        </LabeledField>
                      </div>
                    </SectionBlock>
                  </div>

                  <div className="space-y-6">
                    <SectionBlock
                      icon={<Camera className="size-4.5" />}
                      title="Cámaras"
                    >
                      <div className="grid gap-4">
                        <PersonSelectField
                          label="Cámara 1"
                          name="camara1Id"
                          value={fields.camara1Id}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                        <PersonSelectField
                          label="Cámara 2"
                          name="camara2Id"
                          value={fields.camara2Id}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                        <PersonSelectField
                          label="Cámara 3"
                          name="camara3Id"
                          value={fields.camara3Id}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                        <PersonSelectField
                          label="Cámara 4"
                          name="camara4Id"
                          value={fields.camara4Id}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                        <PersonSelectField
                          label="Cámara 5"
                          name="camara5Id"
                          value={fields.camara5Id}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                      </div>
                    </SectionBlock>

                    <SectionBlock
                      icon={<UserRound className="size-4.5" />}
                      title="Relatos / comentarios"
                    >
                      <div className="space-y-4">
                        <LabeledField label="Relatos / Comentarios">
                          <Input
                            name="commentaryPlan"
                            value={fields.commentaryPlan}
                            onChange={(event) =>
                              updateField("commentaryPlan", event.target.value)
                            }
                            placeholder="Cancha, estudio, remoto..."
                            className={fieldSurfaceClass}
                          />
                        </LabeledField>
                        <PersonSelectField
                          label="Relator"
                          name="relatorId"
                          value={fields.relatorId}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                        <PersonSelectField
                          label="Comentarista 1"
                          name="comentario1Id"
                          value={fields.comentario1Id}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                        <PersonSelectField
                          label="Comentarista 2"
                          name="comentario2Id"
                          value={fields.comentario2Id}
                          people={peopleOptions}
                          onChange={updateField}
                        />
                      </div>
                    </SectionBlock>

                    <SectionBlock
                      icon={<MapPin className="size-4.5" />}
                      title="Observación"
                    >
                      <LabeledField label="Observación">
                        <Textarea
                          name="notes"
                          value={fields.notes}
                          onChange={(event) =>
                            updateField("notes", event.target.value)
                          }
                          placeholder="Contexto editorial, técnico o logístico del juego"
                        />
                      </LabeledField>
                    </SectionBlock>
                  </div>
                </div>

                <datalist id="match-competition-catalog">
                  {CLUB_COMPETITIONS.map((competition) => (
                    <option key={competition} value={competition} />
                  ))}
                </datalist>
                <datalist id="match-club-catalog">
                  {ALL_CLUB_OPTIONS.map((club) => (
                    <option key={club} value={club} />
                  ))}
                </datalist>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] bg-[var(--background-soft)] px-7 py-5">
                <div className="text-sm text-[var(--muted)]">
                  {visibleMissingFieldLabels.length ? (
                    <>
                      Revisa antes de guardar:
                      {" "}
                      <span className="font-bold text-[var(--foreground)]">
                        {visibleMissingFieldLabels.join(", ")}
                      </span>
                    </>
                  ) : (
                    isEditing
                      ? "Los cambios impactan esta producción y sus asignaciones visibles en grilla."
                      : "Si luego llega la API por ID, este modal ya está listo para autocompletar y remarcar faltantes."
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <Button
                      type="submit"
                      variant="secondary"
                      formAction={deleteMatchAction}
                      className="h-11 border-[#efbcc7] bg-[#fff5f7] text-[#b73656] hover:bg-[#ffecee]"
                      onClick={(event) => {
                        if (
                          !window.confirm(
                            "Vas a eliminar este partido. Este cambio puede ser permanente y sacar la tarjeta de la grilla. ¿Quieres continuar?",
                          )
                        ) {
                          event.preventDefault();
                        }
                      }}
                    >
                      Borrar partido
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11"
                    onClick={resetAndClose}
                  >
                    Cancelar
                  </Button>
                  <SubmitButton
                    pendingLabel={isEditing ? "Guardando..." : "Creando..."}
                    className="h-11 gap-2"
                  >
                    {isEditing ? <Sparkles className="size-4" /> : <Plus className="size-4" />}
                    {isEditing ? "Guardar cambios" : "Crear partido"}
                  </SubmitButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
