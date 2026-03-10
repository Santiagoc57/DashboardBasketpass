import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Hash,
  PencilLine,
  type LucideIcon,
  MapPin,
  Mic2,
  ShieldUser,
  SlidersHorizontal,
  Video,
} from "lucide-react";

import { MatchCardActions } from "@/components/grid/match-card-actions";
import { TeamLogoMark } from "@/components/team-logo-mark";
import { LeagueLogoMarkClient } from "@/components/league-logo-mark-client";
import { QuickMatchFieldEditor } from "@/components/grid/quick-match-field-editor";
import { badgeBaseClassName } from "@/components/ui/badge";
import { HoverAvatarBadge } from "@/components/ui/hover-avatar-badge";
import { formatMatchTime } from "@/lib/date";
import { getRoleDisplayName } from "@/lib/display";
import { PRODUCTION_MODE_OPTIONS } from "@/lib/constants";
import { getTeamLeagueLabel } from "@/lib/team-directory";
import type { MatchListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type SectionRow = {
  label: string;
  value: string;
  muted?: boolean;
};

function formatGridDate(kickoffAt: string, timezone: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(kickoffAt));
}

function buildProductionId(id: string) {
  const compact = id.replaceAll("-", "").toUpperCase();
  return `PRD-${compact.slice(0, 4)}-${compact.slice(4, 8)}`;
}

function getAssignmentValue(
  match: MatchListItem,
  roleName: string,
  fallback?: string | null,
) {
  const assignment = match.assignments.find((item) => item.role.name === roleName);
  const value = assignment?.person?.full_name ?? fallback ?? "TBD";

  return {
    value,
    muted: !assignment?.person?.full_name && !fallback,
  };
}

function buildProductionRows(match: MatchListItem): SectionRow[] {
  const responsible = getAssignmentValue(
    match,
    "Responsable",
    match.owner?.full_name ?? null,
  );
  const producer = getAssignmentValue(match, "Productor");
  const director = getAssignmentValue(match, "Realizador");

  return [
    {
      label: "Responsable en cancha",
      value: responsible.value,
      muted: responsible.muted,
    },
    {
      label: "Productor",
      value: producer.value,
      muted: producer.muted,
    },
    {
      label: "Realizador",
      value: director.value,
      muted: director.muted,
    },
  ];
}

function buildCategoryRows(
  match: MatchListItem,
  category: string,
  limit = 4,
): SectionRow[] {
  return match.assignments
    .filter((assignment) => assignment.role.category === category)
    .sort((left, right) => left.role.sort_order - right.role.sort_order)
    .slice(0, limit)
    .map((assignment) => ({
      label: assignment.role.name,
      value: assignment.person?.full_name ?? "TBD",
      muted: !assignment.person?.full_name,
    }));
}

function buildNamedRows(
  match: MatchListItem,
  roleNames: string[],
): SectionRow[] {
  return roleNames.map((roleName) => {
    const item = getAssignmentValue(match, roleName);

    return {
      label: roleName,
      value: item.value,
      muted: item.muted,
    };
  });
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getCompactPersonName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length <= 1 || name === "TBD") {
    return name;
  }

  const surnameCandidate =
    parts.length >= 3 ? parts[1] : parts[parts.length - 1];

  return `${parts[0]?.[0]?.toUpperCase() ?? ""}. ${surnameCandidate}`;
}

function Section({
  title,
  icon: Icon,
  rows,
  actionHref,
}: {
  title: string;
  icon: LucideIcon;
  rows: SectionRow[];
  actionHref?: string;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <Icon className="size-4 text-[var(--accent)]" />
        <h4 className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--accent)]">
          {title}
        </h4>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {rows.map((row) => {
          const displayValue = row.muted
            ? row.value
            : getCompactPersonName(row.value);

          return (
            <div key={row.label} className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a08f91]">
              {getRoleDisplayName(row.label)}
            </p>
            <p
              className={cn(
                "text-sm font-bold text-[var(--foreground)]",
                row.muted && "text-[var(--muted)] italic font-semibold",
              )}
            >
              {displayValue}
            </p>
            </div>
          );
        })}
      </div>

      {actionHref ? (
        <Link
          href={actionHref}
          className="mt-auto inline-flex h-10 items-center justify-center gap-2 border border-[var(--border)] bg-[#f4f6f8] px-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#5f6874] transition hover:border-[#d9dde4] hover:bg-[#eceff4] hover:text-[var(--foreground)]"
        >
          <PencilLine className="size-3.5" />
          Editar asignaciones
        </Link>
      ) : null}
    </div>
  );
}

export function MatchCard({
  match,
  redirectTo,
  canEdit,
  people,
}: {
  match: MatchListItem;
  redirectTo: string;
  canEdit: boolean;
  people: Array<{
    id: string;
    full_name: string;
  }>;
}) {
  const cameraRows = buildCategoryRows(match, "Camaras");
  const talentRows = buildNamedRows(match, [
    "Relator",
    "Comentario 1",
    "Comentario 2",
    "Campo",
  ]);
  const controlRows = buildNamedRows(match, [
    "Operador de Control",
    "Soporte tecnico",
    "Encoder",
    "Ingenieria",
  ]);
  const responsible = getAssignmentValue(
    match,
    "Responsable",
    match.owner?.full_name ?? null,
  );
  const director = getAssignmentValue(match, "Realizador");
  const narrator = getAssignmentValue(match, "Relator");
  const commentator1 = getAssignmentValue(match, "Comentario 1");
  const commentator2 = getAssignmentValue(match, "Comentario 2");
  const commentator = commentator1.muted ? commentator2 : commentator1;
  const leagueLabel = getTeamLeagueLabel(match.competition ?? "Sin liga");
  const venueLabel = match.venue ?? "Sede sin definir";
  const statusAccentClass =
    match.status === "Realizado" ? "bg-[#26b36a]" : "bg-[#d7dde7]";
  const mapsHref = match.venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.venue)}`
    : null;
  const detailsId = `match-card-${match.id}`;

  return (
    <details
      id={detailsId}
      className={cn(
        "panel-surface group relative overflow-visible border border-[var(--border)] bg-[var(--surface)] transition [&_summary::-webkit-details-marker]:hidden [&_summary::marker]:hidden",
      )}
    >
      <summary className="relative cursor-pointer list-none">
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-[-14px] top-1/2 z-0 h-[116px] w-[30px] -translate-y-1/2 rounded-l-[18px] rounded-r-[12px] shadow-[inset_-1px_0_0_rgba(255,255,255,0.18),0_8px_24px_rgba(15,23,42,0.08)]",
            statusAccentClass,
          )}
        />
        <div className="relative z-10 overflow-visible rounded-t-[10px] rounded-b-[10px]">
          <div className="overflow-hidden rounded-t-[10px] rounded-b-[10px] flex flex-col xl:grid xl:grid-cols-[7rem_minmax(17.5rem,25rem)_repeat(4,minmax(10.25rem,1fr))] xl:items-stretch">
          <div className="flex flex-col items-center justify-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-center xl:border-b-0 xl:border-r">
            <LeagueLogoMarkClient league={leagueLabel} className="h-16 w-16" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#70819b]">
              {leagueLabel}
            </p>
          </div>

          <div className="flex min-w-0 items-center border-b border-[var(--border)] px-5 py-5 xl:border-b-0 xl:border-r xl:px-6">
            <div className="mx-auto grid max-w-[20.5rem] items-center justify-center gap-3 sm:grid-cols-[8.5rem_2.25rem_8.5rem] sm:gap-4">
              <div className="flex min-w-0 flex-col items-center text-center">
                {canEdit ? (
                  <QuickMatchFieldEditor
                    field="homeTeam"
                    value={match.home_team}
                    matchId={match.id}
                    redirectTo={redirectTo}
                    title="Cambiar local"
                    listId="grid-club-catalog"
                    panelClassName="w-[19rem]"
                  >
                    <TeamLogoMark
                      teamName={match.home_team}
                      competition={match.competition}
                      className="size-14 rounded-full"
                    />
                  </QuickMatchFieldEditor>
                ) : (
                  <TeamLogoMark
                    teamName={match.home_team}
                    competition={match.competition}
                    className="size-14 rounded-full"
                  />
                )}
                <p className="mt-3 text-center text-[0.9rem] font-black leading-[1.08] tracking-[-0.03em] text-[var(--foreground)] xl:text-[0.98rem]">
                  {match.home_team}
                </p>
              </div>

              <span className="self-center justify-self-center text-base font-semibold uppercase tracking-[0.2em] text-[#93a0b2]">
                vs
              </span>

              <div className="flex min-w-0 flex-col items-center text-center">
                {canEdit ? (
                  <QuickMatchFieldEditor
                    field="awayTeam"
                    value={match.away_team}
                    matchId={match.id}
                    redirectTo={redirectTo}
                    title="Cambiar visitante"
                    listId="grid-club-catalog"
                    panelClassName="w-[19rem]"
                  >
                    <TeamLogoMark
                      teamName={match.away_team}
                      competition={match.competition}
                      className="size-14 rounded-full"
                    />
                  </QuickMatchFieldEditor>
                ) : (
                  <TeamLogoMark
                    teamName={match.away_team}
                    competition={match.competition}
                    className="size-14 rounded-full"
                  />
                )}
                <p className="mt-3 text-center text-[0.9rem] font-black leading-[1.08] tracking-[-0.03em] text-[var(--foreground)] xl:text-[0.98rem]">
                  {match.away_team}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-[var(--border)] px-5 py-5 xl:border-b-0 xl:border-r xl:px-6">
            <div className="flex items-center gap-2">
              <ShieldUser className="size-3.5 text-[#a7b4c8]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a7b4c8]">
                Staff
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HoverAvatarBadge
                initials={getInitials(responsible.value)}
                roleLabel="Responsable general"
                showTooltip={false}
                tone="neutral"
                size="sm"
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-sm font-bold text-[var(--foreground)]",
                    responsible.muted && "text-[var(--muted)] italic font-semibold",
                  )}
                >
                  {getCompactPersonName(responsible.value)}
                </p>
                <p className="text-xs font-semibold text-[var(--muted)]">
                  Responsable General
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HoverAvatarBadge
                initials={getInitials(director.value)}
                roleLabel="Realizador integral"
                showTooltip={false}
                tone="neutral"
                size="sm"
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-sm font-bold text-[var(--foreground)]",
                    director.muted && "text-[var(--muted)] italic font-semibold",
                  )}
                >
                  {getCompactPersonName(director.value)}
                </p>
                <p className="text-xs font-semibold text-[var(--muted)]">
                  Realizador Integral
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-[var(--border)] px-5 py-5 xl:border-b-0 xl:border-r xl:px-6">
            <div className="flex items-center gap-2">
              <Mic2 className="size-3.5 text-[#a7b4c8]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a7b4c8]">
                Talento en Aire
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HoverAvatarBadge
                initials={getInitials(narrator.value)}
                roleLabel="Relatos"
                showTooltip={false}
                tone="accent"
                size="sm"
              />
              <div className="min-w-0">
                <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
                  {getCompactPersonName(narrator.value)}
                </p>
                <p className="text-xs font-semibold italic text-[var(--muted)]">
                  Relatos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HoverAvatarBadge
                initials={getInitials(commentator.value)}
                roleLabel="Comentarios"
                showTooltip={false}
                tone="accent"
                size="sm"
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-sm font-bold text-[var(--foreground)]",
                    commentator.muted && "text-[var(--muted)] italic font-semibold",
                  )}
                >
                  {getCompactPersonName(commentator.value)}
                </p>
                <p className="text-xs font-semibold italic text-[var(--muted)]">
                  Comentarios
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-[var(--border)] px-5 py-5 xl:border-b-0 xl:border-r xl:px-6">
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a7b4c8]">
                <Hash className="size-3.5 text-[#a7b4c8]" />
                ID evento
              </p>
              <div className="mt-2">
                <span
                  className={cn(
                    badgeBaseClassName,
                    "border border-[#f3cfd8] bg-[#fff3f6] text-[var(--accent)]",
                  )}
                >
                  {buildProductionId(match.id)}
                </span>
              </div>
            </div>
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a7b4c8]">
                <Video className="size-3.5 text-[#a7b4c8]" />
                Producción
              </p>
              <div className="mt-2">
                <span
                  className={cn(
                    badgeBaseClassName,
                    "border border-[#dbe1ea] bg-[#f7f8fa] text-[#637083]",
                  )}
                >
                  {canEdit ? (
                    <QuickMatchFieldEditor
                      field="productionMode"
                      value={match.production_mode ?? ""}
                      matchId={match.id}
                      redirectTo={redirectTo}
                      title="Cambiar modo"
                      inputType="select"
                      options={[...PRODUCTION_MODE_OPTIONS]}
                    >
                      <span>{match.production_mode}</span>
                    </QuickMatchFieldEditor>
                  ) : (
                    match.production_mode
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-[var(--border)] px-5 py-5 xl:border-b-0 xl:px-6 xl:pr-16">
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a7b4c8]">
                <CalendarDays className="size-3.5 text-[#a7b4c8]" />
                Fecha
              </p>
              <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                {formatGridDate(match.kickoff_at, match.timezone)}
              </p>
            </div>
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a7b4c8]">
                <Clock3 className="size-3.5 text-[#a7b4c8]" />
                Hora
              </p>
              <p className="mt-1 text-4xl font-black tracking-[-0.06em] text-[var(--accent)]">
                {formatMatchTime(match.kickoff_at, match.timezone)}
              </p>
            </div>
          </div>
          </div>

          <MatchCardActions
            canEdit={canEdit}
            detailsId={detailsId}
            match={match}
            people={people}
            redirectTo={redirectTo}
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-1/2"
          />
        </div>
      </summary>

      <div className="overflow-hidden rounded-b-[10px] border-t border-[var(--border)] bg-[#fffefd] px-5 py-5 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 border-b border-[var(--border)] pb-4 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2">
              {venueLabel}
              {mapsHref ? (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir en Google Maps"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 text-[#72829a] transition hover:border-[rgba(230,18,56,0.18)] hover:text-[var(--accent)]"
                >
                  <MapPin className="size-3.5" />
                </a>
              ) : null}
            </span>
          </div>
          <Link
            href={`/match/${match.id}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          >
            Abrir detalle del partido
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-4">
          <Section
            title="Producción y Dirección"
            icon={SlidersHorizontal}
            rows={buildProductionRows(match)}
          />
          <Section title="Cámaras" icon={Video} rows={cameraRows} />
          <Section
            title="Relatos & Comentarios"
            icon={Mic2}
            rows={talentRows}
          />
          <Section
            title="Control & Soporte"
            icon={ShieldUser}
            rows={controlRows}
            actionHref={`/match/${match.id}`}
          />
        </div>
      </div>
    </details>
  );
}
