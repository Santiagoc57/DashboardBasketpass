"use client";

import {
  type ReactNode,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Camera,
  CircleHelp,
  MapPin,
  Mic2,
  Plus,
  ShieldUser,
  Sparkles,
  UserRound,
  Video,
  X,
} from "lucide-react";

import {
  createMatchModalAction,
  deleteMatchAction,
  updateMatchModalAction,
} from "@/app/actions/matches";
import { LeagueLogoMarkClient } from "@/components/league-logo-mark-client";
import { ClientTeamLogoMark } from "@/components/team-logo-mark-client";
import { MatchNotificationWorkspace } from "@/components/match/match-notification-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { ALL_CLUB_OPTIONS, CLUB_COMPETITIONS } from "@/lib/club-catalog";
import {
  COMMENTARY_PLAN_OPTIONS,
  DEFAULT_MATCH_DURATION_MINUTES,
  DEFAULT_TIMEZONE,
  normalizeCommentaryPlan,
  PRODUCTION_LABEL,
  PRODUCTION_SHORT_LABEL,
  PRODUCTION_MODE_OPTIONS,
  RESPONSIBLE_DISPLAY_LABEL,
} from "@/lib/constants";
import { formatMatchDate, formatMatchTime, buildKickoffAt } from "@/lib/date";
import { getTeamCompetitionByName, getTeamVenueByName } from "@/lib/team-directory";
import type { PersonRow } from "@/lib/database.types";
import {
  buildBulkMatchNotificationMailtoHref,
  buildMatchNotificationMailtoHref,
  buildMatchNotificationMessage,
  buildMatchNotificationWhatsAppHref,
} from "@/lib/integrations";
import type { MatchListItem } from "@/lib/types";
import { cn, normalizeText } from "@/lib/utils";

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

type CreateMatchModalProps = {
  people: Pick<PersonRow, "id" | "full_name" | "phone" | "email">[];
  redirectTo: string;
  canEdit: boolean;
  initialDate: string;
  match?: MatchListItem;
  mode?: "match" | "staff";
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

const CAMERA_FIELD_CONFIGS = [
  { label: "Cámara 1", name: "camara1Id" },
  { label: "Cámara 2", name: "camara2Id" },
  { label: "Cámara 3", name: "camara3Id" },
  { label: "Cámara 4", name: "camara4Id" },
  { label: "Cámara 5", name: "camara5Id" },
] as const;
const COMMENTARY_FIELD_CONFIGS = [
  { label: "Relator 1", name: "relatorId" },
  { label: "Relator 2", name: "comentario1Id" },
  { label: "Relator 3", name: "comentario2Id" },
] as const;
const NOT_APPLICABLE_PERSON_VALUE = "__NOT_APPLICABLE__";

type NotificationRecipient = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  emailHref: string;
  whatsappHref: string;
  personalMessage: string;
};

type MatchModalActionState = {
  status: "idle" | "success" | "error";
  notice: string;
  matchId?: string;
  redirectTo?: string;
  token?: string;
};

const INITIAL_MATCH_MODAL_ACTION_STATE: MatchModalActionState = {
  status: "idle",
  notice: "",
};

const IDENTIFICATION_FIELDS = [
  "productionCode",
  "competition",
  "homeTeam",
  "awayTeam",
  "date",
  "time",
  "venue",
] as const;

const IDENTIFICATION_META_FIELDS = [
  "productionMode",
  "commentaryPlan",
  "transport",
] as const;

const STAFF_FIELDS = [
  "responsableId",
  "realizadorId",
  "graficaId",
  "controlId",
  "soporteId",
  "relatorId",
] as const;

const STAFF_MODAL_HIDDEN_FIELDS = [
  "externalMatchId",
  "productionCode",
  "competition",
  "homeTeam",
  "awayTeam",
  "date",
  "time",
  "productionMode",
  "venue",
  "commentaryPlan",
  "transport",
  "notes",
] as const;

const MATCH_PREVIEW_EXAMPLE = {
  competition: "Liga Nacional",
  homeTeam: "Bochas Sport Club",
  awayTeam: "River Plate",
  date: "2026-03-05",
  time: "19:00",
  venue: "Luis Conde, Buenos Aires",
  roles: {
    [RESPONSIBLE_DISPLAY_LABEL]: "Juan Pérez",
    Realizador: "Mauro Ruiz",
    Relatos: "Leonardo Chianese",
    Produ: "TV",
  },
} as const;

function getVisibleCameraCount(fields: MatchIntakeFields) {
  const highestFilledIndex = CAMERA_FIELD_CONFIGS.reduce((highest, field, index) => {
    return fields[field.name].trim() ? index + 1 : highest;
  }, 0);

  return Math.max(1, highestFilledIndex);
}

function getVisibleCommentaryCount(fields: MatchIntakeFields) {
  const highestFilledIndex = COMMENTARY_FIELD_CONFIGS.reduce(
    (highest, field, index) => {
      return fields[field.name].trim() ? index + 1 : highest;
    },
    0,
  );

  return Math.max(1, highestFilledIndex);
}

function countCompletedFields<
  TFieldName extends keyof MatchIntakeFields,
>(fields: MatchIntakeFields, fieldNames: readonly TFieldName[]) {
  return fieldNames.reduce(
    (count, fieldName) => count + Number(Boolean(fields[fieldName].trim())),
    0,
  );
}

function isNotApplicablePersonValue(value: string | null | undefined) {
  return value?.trim() === NOT_APPLICABLE_PERSON_VALUE;
}

function formatDraftDateLabel(date: string) {
  if (!date) {
    return "Sin fecha";
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })
    .format(parsed)
    .replaceAll(".", "");
}

function formatDraftTimeLabel(time: string) {
  return time.trim() || "--:--";
}

function getPreviewLeagueAccentColor(league: string | null | undefined) {
  const normalizedLeague = normalizeText(league ?? "");

  if (normalizedLeague.includes("liga nacional")) {
    return "#e61238";
  }

  if (normalizedLeague.includes("liga federal")) {
    return "#e67b18";
  }

  if (
    normalizedLeague.includes("liga proximo") ||
    normalizedLeague.includes("liga próximo")
  ) {
    return "#22a35a";
  }

  if (normalizedLeague.includes("acb") || normalizedLeague.includes("liga endesa")) {
    return "#f08a24";
  }

  if (normalizedLeague.includes("euroleague")) {
    return "#8b5cf6";
  }

  if (normalizedLeague.includes("liga argentina")) {
    return "#2b6be7";
  }

  if (normalizedLeague.includes("nba")) {
    return "#334155";
  }

  return "#e61238";
}

function getPreviewInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PreviewDetailPill({
  icon: Icon,
  label,
  value,
  variant = "icon",
  highlight = false,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  variant?: "icon" | "person";
  highlight?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {variant === "person" ? (
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#ecd9de] bg-[#fff3f6] text-[10px] font-black text-[var(--accent)]">
          {getPreviewInitials(value || "Sin asignar")}
        </span>
      ) : (
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f3f6fa] text-[#9aa8bd]">
          <Icon className="size-4" />
        </span>
      )}

      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9aa8bd]">
          {label}
        </div>
        <p
          className={cn(
            "mt-1 text-[13px] font-extrabold leading-tight text-[var(--foreground)]",
            highlight && "text-[var(--accent)]",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function CreateMatchPreviewCard({
  competition,
  time,
  homeTeam,
  awayTeam,
  venue,
  operationalItems,
}: {
  competition: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  operationalItems: Array<{
    key: string;
    icon: typeof UserRound;
    label: string;
    value: string;
    variant?: "icon" | "person";
    highlight?: boolean;
  }>;
}) {
  const leagueAccent = getPreviewLeagueAccentColor(competition);

  return (
    <div className="overflow-hidden rounded-[var(--panel-radius)] border border-[#eee7e1] bg-[#fffdfa] shadow-[0_10px_24px_rgba(28,13,16,0.05)]">
      <div
        className="px-4 py-2.5"
        style={{ backgroundColor: leagueAccent }}
      >
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex justify-start">
            <LeagueLogoMarkClient
              league={competition}
              className="size-9 rounded-full ring-2 ring-white/20"
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-14">
            <span className="max-w-[10rem] text-center text-[10px] font-black uppercase tracking-[0.16em] text-white">
              {competition}
            </span>
          </div>

          <div className="ml-auto min-w-[64px] text-right">
            <p className="text-[20px] font-black leading-none text-white">
              {time}
            </p>
          </div>
        </div>
      </div>

      <div
        className="border-t-2 bg-[#f6f7fb] px-4 py-3.5"
        style={{ borderTopColor: leagueAccent }}
      >
        <div className="relative z-10 w-full px-1">
          <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-start gap-3 xl:grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)] xl:gap-3.5">
            <div className="flex min-w-0 flex-col items-center">
              <ClientTeamLogoMark
                teamName={homeTeam}
                competition={competition}
                className="size-[4.5rem] rounded-full border border-[#e8edf3] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
                imageClassName="p-2.5"
                initialsClassName="text-sm"
              />
              <p className="mt-3 max-w-full px-1 text-center text-[14px] font-black leading-tight tracking-tight text-[var(--foreground)]">
                {homeTeam}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center justify-center pt-6">
              <div className="h-px w-full max-w-8 bg-[#dfe5ed]" />
              <span className="py-1.5 text-[18px] font-black italic text-[var(--accent)]">
                vs
              </span>
              <div className="h-px w-full max-w-8 bg-[#dfe5ed]" />
            </div>

            <div className="flex min-w-0 flex-col items-center">
              <ClientTeamLogoMark
                teamName={awayTeam}
                competition={competition}
                className="size-[4.5rem] rounded-full border border-[#e8edf3] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
                imageClassName="p-2.5"
                initialsClassName="text-sm"
              />
              <p className="mt-3 max-w-full px-1 text-center text-[14px] font-black leading-tight tracking-tight text-[var(--foreground)]">
                {awayTeam}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-center text-[12px] font-semibold text-[#94a3b8]">
          <MapPin className="size-3.5" />
          <span className="truncate">{venue}</span>
        </div>
      </div>

      <div className="border-t border-[#efe7e1] bg-white px-4 py-3.5">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          {operationalItems.map((item) => (
            <PreviewDetailPill
              key={item.key}
              icon={item.icon}
              label={item.label}
              value={item.value}
              variant={item.variant}
              highlight={item.highlight}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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
    transport: "No aplica",
    notes: "",
  };
}

function getAssignedPersonId(match: MatchListItem, roleName: string) {
  return (
    match.assignments.find((assignment) => assignment.role.name === roleName)?.person?.id ??
    ""
  );
}

function normalizeTransportFieldValue(value?: string | null) {
  const normalized = value?.trim();

  if (!normalized) {
    return "No aplica";
  }

  const lowerValue = normalized.toLowerCase();

  if (
    lowerValue === "x" ||
    lowerValue === "n/a" ||
    lowerValue === "na" ||
    lowerValue === "no aplica"
  ) {
    return "No aplica";
  }

  return normalized;
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
    commentaryPlan: normalizeCommentaryPlan(match.commentary_plan),
    relatorId: getAssignedPersonId(match, "Relator"),
    comentario1Id: getAssignedPersonId(match, "Comentario 1"),
    comentario2Id: getAssignedPersonId(match, "Comentario 2"),
    controlId: getAssignedPersonId(match, "Operador de Control"),
    soporteId: getAssignedPersonId(match, "Soporte tecnico"),
    transport: normalizeTransportFieldValue(match.transport),
    notes: match.notes ?? "",
  };
}

function SectionBlock({
  step,
  title,
  status,
  children,
}: {
  step: string;
  title: string;
  status?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.98rem] font-extrabold uppercase tracking-[0.2em] text-[#8ea0bb]">
            {step}. {title}
          </p>
        </div>
        {status ? (
          <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#617089]">
            {status}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function LabeledField({
  label,
  required,
  alert,
  highlightLabel,
  children,
}: {
  label: string;
  required?: boolean;
  alert?: boolean;
  highlightLabel?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span
        className={cn(
          "flex items-center gap-2 text-[0.82rem] font-semibold",
          highlightLabel ? "text-[var(--accent)]" : "text-[#5f6d84]",
        )}
      >
        {label}
        {required ? <span className="text-[var(--accent)]">*</span> : null}
        {alert ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4f6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#c12d4d]">
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
  className,
}: {
  label: string;
  name: string;
  value: string;
  people: Pick<PersonRow, "id" | "full_name">[];
  onChange: (name: keyof MatchIntakeFields, value: string) => void;
  className?: string;
}) {
  return (
    <LabeledField label={label}>
      <Select
        name={name}
        value={value}
        onChange={(event) =>
          onChange(name as keyof MatchIntakeFields, event.target.value)
        }
        className={className}
      >
        <option value="">Sin asignar</option>
        <option value={NOT_APPLICABLE_PERSON_VALUE}>No aplica</option>
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
  mode = "match",
  triggerVariant = "primary",
  triggerClassName,
  triggerLabel,
  triggerIcon,
}: CreateMatchModalProps) {
  const router = useRouter();
  const isEditing = Boolean(match);
  const isStaffMode = mode === "staff" && isEditing;
  const saveAction = isEditing ? updateMatchModalAction : createMatchModalAction;
  const defaultFields = useMemo(
    () => (match ? buildFieldsFromMatch(match) : buildInitialFields(initialDate)),
    [initialDate, match],
  );
  const [saveState, saveFormAction] = useActionState<MatchModalActionState, FormData>(
    saveAction,
    INITIAL_MATCH_MODAL_ACTION_STATE,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [fields, setFields] = useState<MatchIntakeFields>(defaultFields);
  const [competitionTouched, setCompetitionTouched] = useState(false);
  const [venueTouched, setVenueTouched] = useState(false);
  const [visibleCameraCount, setVisibleCameraCount] = useState(() =>
    getVisibleCameraCount(defaultFields),
  );
  const [visibleCommentaryCount, setVisibleCommentaryCount] = useState(() =>
    getVisibleCommentaryCount(defaultFields),
  );
  const [showInitialNotes, setShowInitialNotes] = useState(() =>
    Boolean(defaultFields.notes.trim()),
  );
  const [showNotificationWorkspace, setShowNotificationWorkspace] = useState(false);
  const [dismissedSaveToken, setDismissedSaveToken] = useState<string | null>(null);
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const activeSaveToken =
    saveState.status === "success" ? (saveState.token ?? null) : null;
  const hasCompletedSave =
    activeSaveToken !== null && activeSaveToken !== dismissedSaveToken;
  const showNotifyPrompt =
    hasCompletedSave && !isStaffMode && !isEditing && !showNotificationWorkspace;

  const syncDraftWithDefaults = useCallback(() => {
    setFields(defaultFields);
    setVisibleCameraCount(getVisibleCameraCount(defaultFields));
    setVisibleCommentaryCount(getVisibleCommentaryCount(defaultFields));
    setShowInitialNotes(Boolean(defaultFields.notes.trim()));
    setCompetitionTouched(false);
    setVenueTouched(false);
    setShowNotificationWorkspace(false);
    setDismissedSaveToken(activeSaveToken);
  }, [activeSaveToken, defaultFields]);

  const resetAndClose = useCallback(() => {
    setIsOpen(false);
    syncDraftWithDefaults();
  }, [syncDraftWithDefaults]);

  const finishSavedFlow = useCallback((targetUrl?: string) => {
    setIsOpen(false);
    syncDraftWithDefaults();

    if (typeof window !== "undefined") {
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (targetUrl && targetUrl !== currentUrl) {
        router.push(targetUrl);
        return;
      }
    }

    router.refresh();
  }, [router, syncDraftWithDefaults]);

  const handleEscape = useCallback(() => {
    if (showNotificationWorkspace || hasCompletedSave) {
      finishSavedFlow(saveState.redirectTo);
      return;
    }

    setIsOpen(false);
    syncDraftWithDefaults();
  }, [
    finishSavedFlow,
    hasCompletedSave,
    saveState.redirectTo,
    showNotificationWorkspace,
    syncDraftWithDefaults,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleEscape();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleEscape, isOpen]);

  const missingFields = CORE_REQUIRED_FIELDS.filter((field) => !fields[field].trim());
  const highlightedMissingFields = missingFields;

  const fieldSurfaceClass =
    "h-[40px] !py-1.5 bg-[var(--background-soft)] text-[14px]";
  const missingFieldClass =
    "border-[#efbcc7] bg-[#fff5f7] focus:border-[#df5575] focus:ring-[rgba(223,85,117,0.12)]";

  const peopleOptions = useMemo(
    () =>
      [...people].sort((left, right) =>
        left.full_name.localeCompare(right.full_name, "es"),
      ),
    [people],
  );
  const competitionOptions = useMemo(() => {
    const options = new Set<string>(CLUB_COMPETITIONS);

    if (fields.competition.trim()) {
      options.add(fields.competition.trim());
    }

    return [...options];
  }, [fields.competition]);
  const peopleById = useMemo(
    () => new Map(peopleOptions.map((person) => [person.id, person])),
    [peopleOptions],
  );
  const identificationCompleted = countCompletedFields(fields, [
    ...IDENTIFICATION_FIELDS,
    ...IDENTIFICATION_META_FIELDS,
  ]);
  const staffCompleted = countCompletedFields(fields, STAFF_FIELDS);
  const previewHomeTeamLabel =
    fields.homeTeam.trim() || MATCH_PREVIEW_EXAMPLE.homeTeam;
  const previewAwayTeamLabel =
    fields.awayTeam.trim() || MATCH_PREVIEW_EXAMPLE.awayTeam;
  const previewCompetitionLabel =
    fields.competition.trim() || MATCH_PREVIEW_EXAMPLE.competition;
  const previewVenueLabel =
    fields.venue.trim() || MATCH_PREVIEW_EXAMPLE.venue;
  const previewDateLabel = formatDraftDateLabel(
    fields.date || MATCH_PREVIEW_EXAMPLE.date,
  );
  const previewTimeLabel = formatDraftTimeLabel(
    fields.time || MATCH_PREVIEW_EXAMPLE.time,
  );
  const previewProductionLabel =
    fields.productionMode.trim() || MATCH_PREVIEW_EXAMPLE.roles.Produ;
  const getPersonRecord = (personId: string) =>
    personId && !isNotApplicablePersonValue(personId)
      ? peopleById.get(personId) ?? null
      : null;
  const getSummaryPersonValue = (personId: string, fallback: string) => {
    if (isNotApplicablePersonValue(personId)) {
      return "No aplica";
    }

    return getPersonRecord(personId)?.full_name ?? fallback;
  };
  const previewCameraUnitLabel = `${Math.max(visibleCameraCount, 1)} ${
    Math.max(visibleCameraCount, 1) === 1 ? "unidad" : "unidades"
  }`;
  const previewCommentaryUnitLabel = `${Math.max(visibleCommentaryCount, 1)} ${
    Math.max(visibleCommentaryCount, 1) === 1 ? "relator" : "relatores"
  }`;
  const notificationMatch = useMemo(
    () => ({
      away_team: previewAwayTeamLabel,
      competition: fields.competition.trim() || null,
      home_team: previewHomeTeamLabel,
      kickoff_at: buildKickoffAt({
        date: fields.date || MATCH_PREVIEW_EXAMPLE.date,
        time: fields.time || MATCH_PREVIEW_EXAMPLE.time,
        timezone: DEFAULT_TIMEZONE,
      }),
      production_mode: fields.productionMode.trim() || null,
      timezone: DEFAULT_TIMEZONE,
      venue: fields.venue.trim() || null,
    }),
    [
      fields.competition,
      fields.date,
      fields.productionMode,
      fields.time,
      fields.venue,
      previewAwayTeamLabel,
      previewHomeTeamLabel,
    ],
  );
  const notificationRoleEntries = useMemo(
    () => [
      { fieldName: "responsableId" as const, label: RESPONSIBLE_DISPLAY_LABEL },
      { fieldName: "realizadorId" as const, label: "Realizador" },
      { fieldName: "graficaId" as const, label: "Operador de gráfica" },
      { fieldName: "controlId" as const, label: "Operador de control" },
      { fieldName: "soporteId" as const, label: "Soporte técnico" },
      ...CAMERA_FIELD_CONFIGS.slice(0, visibleCameraCount).map((field) => ({
        fieldName: field.name,
        label: field.label,
      })),
      ...COMMENTARY_FIELD_CONFIGS.slice(0, visibleCommentaryCount).map((field) => ({
        fieldName: field.name,
        label: field.label,
      })),
    ],
    [visibleCameraCount, visibleCommentaryCount],
  );
  const notificationRecipients = useMemo(() => {
    const recipientsMap = new Map<string, NotificationRecipient>();

    notificationRoleEntries.forEach(({ fieldName, label }) => {
      const personId = fields[fieldName];

      if (!personId || isNotApplicablePersonValue(personId)) {
        return;
      }

      const person = peopleById.get(personId);

      if (!person) {
        return;
      }

      const existing = recipientsMap.get(person.id);

      if (existing) {
        if (!existing.roles.includes(label)) {
          existing.roles.push(label);
        }
        return;
      }

      recipientsMap.set(person.id, {
        id: person.id,
        fullName: person.full_name,
        email: person.email ?? null,
        phone: person.phone ?? null,
        roles: [label],
        emailHref: "",
        whatsappHref: "",
        personalMessage: "",
      });
    });

    return [...recipientsMap.values()]
      .map((recipient) => {
        const personalMessage = buildMatchNotificationMessage({
          match: notificationMatch,
          personName: recipient.fullName,
          roleNames: recipient.roles,
        });

        return {
          ...recipient,
          emailHref: buildMatchNotificationMailtoHref({
            email: recipient.email,
            match: notificationMatch,
            personName: recipient.fullName,
            roleNames: recipient.roles,
          }),
          whatsappHref: buildMatchNotificationWhatsAppHref({
            phone: recipient.phone,
            match: notificationMatch,
            personName: recipient.fullName,
            roleNames: recipient.roles,
          }),
          personalMessage,
        };
      })
      .sort((left, right) => left.fullName.localeCompare(right.fullName, "es"));
  }, [fields, notificationMatch, notificationRoleEntries, peopleById]);
  const notificationUnassignedRoles = useMemo(
    () =>
      notificationRoleEntries.flatMap(({ fieldName, label }) => {
        const personId = fields[fieldName];

        if (!personId || !personId.trim()) {
          return [label];
        }

        if (isNotApplicablePersonValue(personId)) {
          return [];
        }

        return [];
      }),
    [fields, notificationRoleEntries],
  );
  const notificationBatchMessage = useMemo(
    () => buildMatchNotificationMessage({ match: notificationMatch }),
    [notificationMatch],
  );
  const notificationBulkMailtoHref = useMemo(
    () =>
      buildBulkMatchNotificationMailtoHref({
        emails: notificationRecipients
          .map((recipient) => recipient.email)
          .filter(Boolean) as string[],
        match: notificationMatch,
      }),
    [notificationMatch, notificationRecipients],
  );
  const previewOperationalItems = [
    {
      key: "fecha",
      icon: CalendarDays,
      label: "Fecha",
      value: previewDateLabel,
    },
    {
      key: "produ",
      icon: Video,
      label: PRODUCTION_SHORT_LABEL,
      value: previewProductionLabel || "Sin definir",
    },
    {
      key: "responsable",
      icon: ShieldUser,
      label: RESPONSIBLE_DISPLAY_LABEL,
      value: getSummaryPersonValue(fields.responsableId, "Sin asignar"),
      variant: "person" as const,
    },
    {
      key: "realizador",
      icon: UserRound,
      label: "Realizador",
      value: getSummaryPersonValue(fields.realizadorId, "Sin asignar"),
      variant: "person" as const,
    },
    {
      key: "grafica",
      icon: UserRound,
      label: "Gráfica",
      value: getSummaryPersonValue(fields.graficaId, "Sin asignar"),
      variant: "person" as const,
    },
    {
      key: "control",
      icon: UserRound,
      label: "Control",
      value: getSummaryPersonValue(fields.controlId, "Sin asignar"),
      variant: "person" as const,
    },
    {
      key: "soporte",
      icon: UserRound,
      label: "Soporte",
      value: getSummaryPersonValue(fields.soporteId, "Sin asignar"),
      variant: "person" as const,
    },
    {
      key: "relator1",
      icon: Mic2,
      label: "Relator 1",
      value: getSummaryPersonValue(fields.relatorId, "Sin asignar"),
      variant: "person" as const,
    },
    {
      key: "relatores",
      icon: Mic2,
      label: "Relatores",
      value: previewCommentaryUnitLabel,
      highlight: true,
    },
    {
      key: "camaras",
      icon: Camera,
      label: "Cámaras",
      value: previewCameraUnitLabel,
      highlight: true,
    },
  ];
  const modalTitle = isStaffMode
    ? "Agregar personal"
    : isEditing
      ? "Editar partido"
      : "Crear partido";

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
      venue: venueTouched ? current.venue : suggestedVenue ?? current.venue,
      competition: competitionTouched
        ? current.competition
        : suggestedCompetition ?? current.competition,
    }));
  }

  function renderHiddenFieldInputs(
    fieldNames: readonly (keyof MatchIntakeFields)[],
  ) {
    return fieldNames.map((fieldName) => (
      <input
        key={fieldName}
        type="hidden"
        name={fieldName}
        value={fields[fieldName]}
      />
    ));
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
            syncDraftWithDefaults();
            setIsOpen(true);
          }}
          disabled={!canEdit}
          aria-label={
            triggerLabel ??
            (isStaffMode
              ? "Agregar personal"
              : isEditing
                ? "Editar partido"
                : "Crear partido")
          }
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
            syncDraftWithDefaults();
            setIsOpen(true);
          }}
          disabled={!canEdit}
        >
          {triggerIcon ?? <Plus className="size-4" />}
          {triggerLabel ?? (isStaffMode ? "Agregar personal" : "Crear partido")}
        </Button>
      )}

      {isOpen && portalTarget
        ? createPortal(
        <div className="fixed inset-0 z-[300] bg-[rgba(15,23,42,0.48)] backdrop-blur-sm">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onClick={resetAndClose}
          />
          <div className="relative z-[1] flex h-full w-full flex-col overflow-hidden bg-[var(--surface)] shadow-[0_32px_80px_rgba(15,23,42,0.22)]">
            <form
              action={saveFormAction}
              className="flex min-h-0 flex-1 flex-col"
            >
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <input type="hidden" name="timezone" value={DEFAULT_TIMEZONE} />
              {isEditing ? <input type="hidden" name="matchId" value={match?.id} /> : null}
              <div className="border-b border-[var(--border)] px-5 py-2.5 sm:px-6 sm:py-3 xl:px-8 xl:py-0 2xl:px-10">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 xl:min-h-[55px] xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-[1.6rem] font-extrabold leading-none tracking-tight text-[var(--foreground)] xl:text-[1.75rem]">
                      {showNotificationWorkspace ? "Notificar personal" : modalTitle}
                    </h2>
                    {saveState.status === "error" && saveState.notice ? (
                      <p className="mt-1 text-sm font-semibold text-[var(--accent)]">
                        {saveState.notice}
                      </p>
                    ) : null}
                    {isStaffMode && saveState.status === "success" && saveState.notice ? (
                      <p className="mt-1 text-sm font-semibold text-[#1b8b56]">
                        {saveState.notice}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                    {isEditing && !isStaffMode && !showNotificationWorkspace ? (
                      <Button
                        type="submit"
                        variant="secondary"
                        formAction={deleteMatchAction}
                        className="h-10 border-[#efbcc7] bg-[#fff5f7] text-[#b73656] hover:bg-[#ffecee]"
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
                    {showNotificationWorkspace ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9"
                        onClick={() => finishSavedFlow(saveState.redirectTo)}
                      >
                        Cerrar
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9"
                          onClick={() =>
                            hasCompletedSave
                              ? finishSavedFlow(saveState.redirectTo)
                              : resetAndClose()
                          }
                        >
                          Cancelar
                        </Button>
                        <SubmitButton
                          pendingLabel={
                            isStaffMode
                              ? "Guardando personal..."
                              : isEditing
                              ? "Guardando..."
                              : "Creando..."
                          }
                          className="h-9 gap-2"
                        >
                          {isStaffMode ? (
                            <Plus className="size-4" />
                          ) : isEditing ? (
                            <Sparkles className="size-4" />
                          ) : (
                            <Plus className="size-4" />
                          )}
                          {isStaffMode
                            ? "Guardar personal"
                            : isEditing
                              ? "Guardar cambios"
                              : "Crear partido"}
                        </SubmitButton>
                      </>
                    )}
                    <button
                      type="button"
                      className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
                      onClick={() =>
                        showNotificationWorkspace || hasCompletedSave
                          ? finishSavedFlow(saveState.redirectTo)
                          : resetAndClose()
                      }
                      aria-label="Cerrar"
                    >
                      <X className="size-4.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 xl:px-8 xl:py-6 2xl:px-10">
                <div className="mx-auto w-full max-w-[1600px]">
                {showNotificationWorkspace ? (
                  <MatchNotificationWorkspace
                    batchMessage={notificationBatchMessage}
                    bulkMailtoHref={notificationBulkMailtoHref}
                    recipients={notificationRecipients}
                    unassignedRoles={notificationUnassignedRoles}
                  />
                ) : (
                <div
                  className={cn(
                    "grid gap-6",
                    isStaffMode
                      ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                      : "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(24rem,27rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(27rem,30rem)]",
                  )}
                >
                  {isStaffMode ? renderHiddenFieldInputs(STAFF_MODAL_HIDDEN_FIELDS) : null}
                  {!isStaffMode ? (
                    <SectionBlock
                      step="1"
                      title="Identificación"
                      status={`${identificationCompleted}/${IDENTIFICATION_FIELDS.length + IDENTIFICATION_META_FIELDS.length} listos`}
                    >
                      <div className="grid gap-4 lg:grid-cols-2">
                        <LabeledField
                          label="ID de Producción"
                          required
                          alert={highlightedMissingFields.includes("productionCode")}
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
                              highlightedMissingFields.includes("productionCode") &&
                                missingFieldClass,
                            )}
                          />
                        </LabeledField>
                        <LabeledField
                          label="Liga"
                          required
                          alert={highlightedMissingFields.includes("competition")}
                        >
                          <Select
                            name="competition"
                            value={fields.competition}
                            onChange={(event) => {
                              setCompetitionTouched(true);
                              updateField("competition", event.target.value);
                            }}
                            className={cn(
                              fieldSurfaceClass,
                              highlightedMissingFields.includes("competition") &&
                                missingFieldClass,
                            )}
                          >
                            <option value="">Selecciona una liga</option>
                            {competitionOptions.map((competition) => (
                              <option key={competition} value={competition}>
                                {competition}
                              </option>
                            ))}
                          </Select>
                        </LabeledField>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <LabeledField
                          label="Equipo local"
                          required
                          alert={highlightedMissingFields.includes("homeTeam")}
                        >
                          <div className="relative">
                            <Input
                              name="homeTeam"
                              list="match-club-catalog"
                              value={fields.homeTeam}
                              onChange={(event) =>
                                handleHomeTeamChange(event.target.value)
                              }
                              placeholder="Nombre del equipo local"
                              className={cn(
                                fieldSurfaceClass,
                                "pr-16",
                                highlightedMissingFields.includes("homeTeam") &&
                                  missingFieldClass,
                              )}
                            />
                            {fields.homeTeam.trim() ? (
                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <ClientTeamLogoMark
                                  teamName={fields.homeTeam}
                                  competition={fields.competition}
                                  className="size-9 rounded-[10px]"
                                  imageClassName="p-1"
                                  initialsClassName="text-[10px] tracking-[0.16em]"
                                />
                              </div>
                            ) : null}
                          </div>
                        </LabeledField>
                        <LabeledField
                          label="Equipo visitante"
                          required
                          alert={highlightedMissingFields.includes("awayTeam")}
                        >
                          <div className="relative">
                            <Input
                              name="awayTeam"
                              list="match-club-catalog"
                              value={fields.awayTeam}
                              onChange={(event) =>
                                updateField("awayTeam", event.target.value)
                              }
                              placeholder="Nombre del equipo visitante"
                              className={cn(
                                fieldSurfaceClass,
                                "pr-16",
                                highlightedMissingFields.includes("awayTeam") &&
                                  missingFieldClass,
                              )}
                            />
                            {fields.awayTeam.trim() ? (
                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <ClientTeamLogoMark
                                  teamName={fields.awayTeam}
                                  competition={fields.competition}
                                  className="size-9 rounded-[10px]"
                                  imageClassName="p-1"
                                  initialsClassName="text-[10px] tracking-[0.16em]"
                                />
                              </div>
                            ) : null}
                          </div>
                        </LabeledField>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <LabeledField
                          label="Fecha"
                          required
                          highlightLabel
                          alert={highlightedMissingFields.includes("date")}
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
                              "font-semibold text-[var(--accent)]",
                              highlightedMissingFields.includes("date") &&
                                missingFieldClass,
                            )}
                          />
                        </LabeledField>
                        <LabeledField
                          label="Hora"
                          required
                          alert={highlightedMissingFields.includes("time")}
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
                              highlightedMissingFields.includes("time") &&
                                missingFieldClass,
                            )}
                          />
                        </LabeledField>
                      </div>

                      <div className="grid gap-4">
                        <LabeledField
                          label="Sede"
                          required
                          alert={highlightedMissingFields.includes("venue")}
                        >
                          <Input
                            name="venue"
                            value={fields.venue}
                            onChange={(event) => {
                              setVenueTouched(true);
                              updateField("venue", event.target.value);
                            }}
                            placeholder="Sede del local o ubicación remota"
                            className={cn(
                              fieldSurfaceClass,
                              highlightedMissingFields.includes("venue") &&
                                missingFieldClass,
                            )}
                          />
                        </LabeledField>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-3">
                        <LabeledField
                          label={PRODUCTION_LABEL}
                          required
                          alert={highlightedMissingFields.includes("productionMode")}
                        >
                          <Select
                            name="productionMode"
                            value={fields.productionMode}
                            onChange={(event) =>
                              updateField("productionMode", event.target.value)
                            }
                            className={cn(
                              fieldSurfaceClass,
                              highlightedMissingFields.includes("productionMode") &&
                                missingFieldClass,
                            )}
                          >
                            <option value="">Selecciona una producción</option>
                            {PRODUCTION_MODE_OPTIONS.map((mode) => (
                              <option key={mode} value={mode}>
                                {mode}
                              </option>
                            ))}
                          </Select>
                        </LabeledField>
                        <LabeledField label="Tipo de relato">
                          <Select
                            name="commentaryPlan"
                            value={fields.commentaryPlan}
                            onChange={(event) =>
                              updateField("commentaryPlan", event.target.value)
                            }
                            aria-label="Modalidad de relatos"
                            className={fieldSurfaceClass}
                          >
                            <option value="">Sin definir</option>
                            {COMMENTARY_PLAN_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </LabeledField>
                        <LabeledField label="Transporte">
                          <Input
                            name="transport"
                            value={fields.transport}
                            onChange={(event) =>
                              updateField("transport", event.target.value)
                            }
                            placeholder="Proveedor o movilidad"
                            className={fieldSurfaceClass}
                          />
                        </LabeledField>
                      </div>

                      <div className="grid gap-4">
                        {showInitialNotes ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[0.82rem] font-semibold text-[#5f6d84]">
                                Observación inicial
                              </span>
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-9 px-3 text-xs font-semibold"
                                onClick={() => {
                                  updateField("notes", "");
                                  setShowInitialNotes(false);
                                }}
                              >
                                Quitar
                              </Button>
                            </div>
                            <Textarea
                              name="notes"
                              value={fields.notes}
                              onChange={(event) =>
                                updateField("notes", event.target.value)
                              }
                              placeholder="Cualquier contexto editorial, técnico o logístico que convenga dejar visible desde el inicio."
                              className="min-h-28 bg-[var(--background-soft)] text-[15px]"
                            />
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-11 justify-center gap-2 border-dashed border-[#d7dde7] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                            onClick={() => setShowInitialNotes(true)}
                          >
                            <Plus className="size-4" />
                            Agregar observación inicial
                          </Button>
                        )}
                      </div>
                    </SectionBlock>
                  ) : null}

                  <SectionBlock
                    step={isStaffMode ? "1" : "2"}
                    title="Personal"
                    status={`${staffCompleted}/${STAFF_FIELDS.length} roles`}
                  >
                    <div className="space-y-4">
                      <div className="space-y-5">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <PersonSelectField
                            label={RESPONSIBLE_DISPLAY_LABEL}
                            name="responsableId"
                            value={fields.responsableId}
                            people={peopleOptions}
                            onChange={updateField}
                            className={fieldSurfaceClass}
                          />
                          <PersonSelectField
                            label="Realizador"
                            name="realizadorId"
                            value={fields.realizadorId}
                            people={peopleOptions}
                            onChange={updateField}
                            className={fieldSurfaceClass}
                          />
                          <PersonSelectField
                            label="Operador de gráfica"
                            name="graficaId"
                            value={fields.graficaId}
                            people={peopleOptions}
                            onChange={updateField}
                            className={fieldSurfaceClass}
                          />
                          <PersonSelectField
                            label="Operador de control"
                            name="controlId"
                            value={fields.controlId}
                            people={peopleOptions}
                            onChange={updateField}
                            className={fieldSurfaceClass}
                          />
                          <PersonSelectField
                            label="Soporte técnico"
                            name="soporteId"
                            value={fields.soporteId}
                            people={peopleOptions}
                            onChange={updateField}
                            className={fieldSurfaceClass}
                          />
                        </div>

                        <div className="grid gap-5 xl:grid-cols-2">
                          <div className="space-y-4">
                            <div className="grid gap-4">
                              {CAMERA_FIELD_CONFIGS.slice(0, visibleCameraCount).map((field) => (
                                <PersonSelectField
                                  key={field.name}
                                  label={field.label}
                                  name={field.name}
                                  value={fields[field.name]}
                                  people={peopleOptions}
                                  onChange={updateField}
                                  className={fieldSurfaceClass}
                                />
                              ))}
                              {visibleCameraCount < CAMERA_FIELD_CONFIGS.length ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="h-11 justify-center gap-2 border-dashed border-[#d7dde7] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                  onClick={() =>
                                    setVisibleCameraCount((current) =>
                                      Math.min(current + 1, CAMERA_FIELD_CONFIGS.length),
                                    )
                                  }
                                >
                                  <Plus className="size-4" />
                                  Agregar cámara
                                </Button>
                              ) : null}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="grid gap-4">
                              {COMMENTARY_FIELD_CONFIGS.slice(0, visibleCommentaryCount).map(
                                (field) => (
                                  <PersonSelectField
                                    key={field.name}
                                    label={field.label}
                                    name={field.name}
                                    value={fields[field.name]}
                                    people={peopleOptions}
                                    onChange={updateField}
                                    className={fieldSurfaceClass}
                                  />
                                ),
                              )}
                              {visibleCommentaryCount < COMMENTARY_FIELD_CONFIGS.length ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="h-11 justify-center gap-2 border-dashed border-[#d7dde7] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                  onClick={() =>
                                    setVisibleCommentaryCount((current) =>
                                      Math.min(current + 1, COMMENTARY_FIELD_CONFIGS.length),
                                    )
                                  }
                                >
                                  <Plus className="size-4" />
                                  Agregar relator
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SectionBlock>

                  {isStaffMode ? (
                    <section className="space-y-4 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[0.98rem] font-extrabold uppercase tracking-[0.2em] text-[#8ea0bb]">
                            2. Notificar personal
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#617089]">
                          {notificationRecipients.length} contactos
                        </span>
                      </div>
                      <MatchNotificationWorkspace
                        batchMessage={notificationBatchMessage}
                        bulkMailtoHref={notificationBulkMailtoHref}
                        recipients={notificationRecipients}
                        unassignedRoles={notificationUnassignedRoles}
                        compact
                      />
                    </section>
                  ) : (
                    <aside className="order-first self-start xl:order-last xl:col-start-3 xl:sticky xl:top-0">
                      <CreateMatchPreviewCard
                        competition={previewCompetitionLabel}
                        time={previewTimeLabel}
                        homeTeam={previewHomeTeamLabel}
                        awayTeam={previewAwayTeamLabel}
                        venue={previewVenueLabel}
                        operationalItems={previewOperationalItems}
                      />
                    </aside>
                  )}
                </div>
                )}
                </div>
                <input
                  type="hidden"
                  name="durationMinutes"
                  value={fields.durationMinutes}
                />
                <input type="hidden" name="status" value={fields.status} />

                <datalist id="match-club-catalog">
                  {ALL_CLUB_OPTIONS.map((club) => (
                    <option key={club} value={club} />
                  ))}
                </datalist>
              </div>

            </form>

            {showNotifyPrompt ? (
              <div className="absolute inset-0 z-[5] flex items-center justify-center bg-[rgba(15,23,42,0.32)] px-5 backdrop-blur-[2px]">
                <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_28px_70px_rgba(15,23,42,0.24)]">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                      <CircleHelp className="size-5" />
                    </span>
                    <div className="min-w-0 space-y-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                        {saveState.notice || "Partido guardado"}
                      </p>
                      <h3 className="text-xl font-black tracking-tight text-[var(--foreground)]">
                        ¿Deseas notificar al personal?
                      </h3>
                      <p className="text-sm leading-6 text-[#617187]">
                        Puedes abrir ahora mismo la ventana de notificación con el mensaje
                        listo para correo y WhatsApp.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-10"
                      onClick={() => finishSavedFlow(saveState.redirectTo)}
                    >
                      No
                    </Button>
                    <Button
                      type="button"
                      className="h-10 gap-2"
                      onClick={() => {
                        setShowNotificationWorkspace(true);
                      }}
                    >
                      <Sparkles className="size-4" />
                      Sí, notificar
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>,
        portalTarget,
      )
        : null}
    </>
  );
}
