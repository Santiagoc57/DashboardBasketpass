import {
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Hash,
  MessageCircleMore,
  type LucideIcon,
  Mic2,
  ShieldUser,
  SlidersHorizontal,
  Video,
  XCircle,
} from "lucide-react";

import { MatchCardActions } from "@/components/grid/match-card-actions";
import { TeamLogoMark } from "@/components/team-logo-mark";
import { LeagueLogoMarkClient } from "@/components/league-logo-mark-client";
import { QuickMatchFieldEditor } from "@/components/grid/quick-match-field-editor";
import { badgeBaseClassName } from "@/components/ui/badge";
import { getAssignmentConfirmationPresentation } from "@/lib/assignment-confirmation";
import {
  getProductionModeLabel,
  RESPONSIBLE_DISPLAY_LABEL,
} from "@/lib/constants";
import { formatMatchTime } from "@/lib/date";
import { getCompactRoleDisplayName, getRoleDisplayName } from "@/lib/display";
import { getTeamDisplayName, getTeamLeagueLabel } from "@/lib/team-directory";
import type { MatchListItem } from "@/lib/types";
import { buildWhatsAppUrl, cn } from "@/lib/utils";

type SectionRow = {
  label: string;
  value: string;
  muted?: boolean;
  compactValue?: boolean;
  multiline?: boolean;
  href?: string;
  phone?: string | null;
  confirmed?: boolean;
  confirmationStatus?: string | null;
};

function formatGridDate(kickoffAt: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    timeZone: timezone,
  }).formatToParts(new Date(kickoffAt));

  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";

  return [day, month]
    .filter(Boolean)
    .join(" ")
    .replaceAll(".", "")
    .replaceAll(",", "")
    .toUpperCase();
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
    phone: assignment?.person?.phone ?? null,
    confirmed: assignment?.confirmed ?? false,
    confirmationStatus: assignment?.confirmation_status ?? null,
  };
}

function buildProductionRows(match: MatchListItem): SectionRow[] {
  const responsible = getAssignmentValue(
    match,
    "Responsable",
    match.owner?.full_name ?? null,
  );
  const director = getAssignmentValue(match, "Realizador");
  const control = getAssignmentValue(match, "Operador de Control");
  const support = getAssignmentValue(match, "Soporte tecnico");

  return [
    {
      label: RESPONSIBLE_DISPLAY_LABEL,
      value: responsible.value,
      muted: responsible.muted,
      compactValue: true,
      phone: responsible.phone ?? match.owner?.phone ?? null,
      confirmed: responsible.confirmed,
      confirmationStatus: responsible.confirmationStatus,
    },
    {
      label: "Realizador",
      value: director.value,
      muted: director.muted,
      compactValue: true,
      phone: director.phone,
      confirmed: director.confirmed,
      confirmationStatus: director.confirmationStatus,
    },
    {
      label: "Operador de Control",
      value: control.value,
      muted: control.muted,
      compactValue: true,
      phone: control.phone,
      confirmed: control.confirmed,
      confirmationStatus: control.confirmationStatus,
    },
    {
      label: "Soporte tecnico",
      value: support.value,
      muted: support.muted,
      compactValue: true,
      phone: support.phone,
      confirmed: support.confirmed,
      confirmationStatus: support.confirmationStatus,
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
      compactValue: true,
      phone: assignment.person?.phone ?? null,
      confirmed: assignment.confirmed,
      confirmationStatus: assignment.confirmation_status,
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
      compactValue: true,
      phone: item.phone,
      confirmed: item.confirmed,
      confirmationStatus: item.confirmationStatus,
    };
  });
}

function buildObservationRows(match: MatchListItem): SectionRow[] {
  const transport = match.transport?.trim() ?? "";
  const notes = match.notes?.trim() ?? "";
  const matchLabel = `${getTeamDisplayName(match.home_team, match.competition)} vs ${getTeamDisplayName(match.away_team, match.competition)}`;

  return [
    {
      label: "Transporte",
      value: transport || "Sin datos",
      muted: !transport,
      multiline: true,
    },
    {
      label: "Incidencias",
      value: "Ver incidencias",
      href: `/incidents?q=${encodeURIComponent(matchLabel)}`,
    },
    {
      label: "Observaciones",
      value: notes || "Sin observaciones",
      muted: !notes,
      multiline: true,
    },
  ];
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

function formatTeamDisplayName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 2) {
    return `${parts[0]}\n${parts[1]}`;
  }

  return name;
}

function formatProductionModeLabel(mode: string | null | undefined) {
  return getProductionModeLabel(mode);
}

function isUnassignedLeagueLabel(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim() === "sin liga"
  );
}

function AssignmentContactActions({
  phone,
  muted,
  confirmed,
  confirmationStatus,
  personName,
}: {
  phone?: string | null;
  muted?: boolean;
  confirmed?: boolean;
  confirmationStatus?: string | null;
  personName: string;
}) {
  if (muted) {
    return null;
  }

  const whatsappHref = buildWhatsAppUrl(phone);
  const presentation = getAssignmentConfirmationPresentation(
    confirmationStatus,
    confirmed,
  );
  const confirmationClassName =
    presentation.tone === "success"
      ? "text-[#24a267]"
      : presentation.tone === "danger"
        ? "text-[var(--accent)]"
        : "text-[#96a3b6]";

  return (
    <span className="ml-2 inline-flex h-5 shrink-0 items-center gap-2 border-l border-[var(--border)] pl-2">
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex size-4 items-center justify-center text-[#1b8b56] transition hover:text-[#17784b]"
          aria-label={`Escribir por WhatsApp a ${personName}`}
          title={`WhatsApp de ${personName}`}
        >
          <MessageCircleMore className="size-3" />
        </a>
      ) : null}
      <span
        className={cn(
          "inline-flex size-4 items-center justify-center",
          confirmationClassName,
        )}
        title={presentation.label}
        aria-label={presentation.label}
      >
        {presentation.status === "accepted" ? (
          <span className="inline-flex size-[14px] items-center justify-center rounded-full bg-[#24a267] text-white">
            <CheckCircle2 className="size-[10px]" strokeWidth={4} />
          </span>
        ) : presentation.status === "declined" ? (
          <XCircle className="size-3" />
        ) : (
          <CircleHelp className="size-3" />
        )}
      </span>
    </span>
  );
}

function InlinePersonRoleStack({
  label,
  value,
  initials,
  muted,
  phone,
  confirmed,
  confirmationStatus,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: string;
  initials: string;
  muted?: boolean;
  phone?: string | null;
  confirmed?: boolean;
  confirmationStatus?: string | null;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full border font-black shadow-sm text-[11px]",
          muted
            ? "border-[var(--border)] bg-[#eef2f6] text-[#64748b]"
            : "border-[#cde8d6] bg-[#edf9f1] text-[#3c8a5f]",
        )}
      >
        {initials}
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "font-black uppercase tracking-[0.18em] text-[#8ea0bb] text-[9px]",
            labelClassName,
          )}
        >
          {label}
        </p>
        <div className="mt-1 flex min-w-0 items-center">
          <p
            className={cn(
              "truncate leading-tight text-[13px] font-black text-[var(--foreground)]",
              muted && "font-semibold italic text-[var(--muted)]",
              valueClassName,
            )}
            title={value}
          >
            {value}
          </p>
          <AssignmentContactActions
            phone={phone}
            muted={muted}
            confirmed={confirmed}
            confirmationStatus={confirmationStatus}
            personName={value}
          />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: LucideIcon;
  rows: SectionRow[];
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
          const displayValue =
            row.compactValue && !row.muted
              ? getCompactPersonName(row.value)
              : row.value;
          const displayLabel = row.compactValue
            ? getCompactRoleDisplayName(row.label)
            : getRoleDisplayName(row.label);

          if (row.compactValue && !row.multiline) {
            return (
              <InlinePersonRoleStack
                key={row.label}
                label={displayLabel}
                value={displayValue}
                initials={getInitials(row.value)}
                muted={row.muted}
                phone={row.phone}
                confirmed={row.confirmed}
                confirmationStatus={row.confirmationStatus}
                labelClassName="text-[10px] tracking-[0.16em] text-[#8ea0bb]"
                valueClassName="text-sm"
              />
            );
          }

          const content = (
            <div key={row.label} className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a08f91]">
                {displayLabel}
              </p>
              <span
                className={cn(
                  "block text-sm text-[var(--foreground)]",
                  row.href && "font-bold text-[var(--accent)] underline-offset-4 hover:underline",
                  row.multiline ? "leading-6 font-medium whitespace-pre-line" : "font-bold",
                  row.muted &&
                    (row.multiline
                      ? "text-[var(--muted)] italic"
                      : "text-[var(--muted)] italic font-semibold"),
                )}
              >
                {displayValue}
              </span>
            </div>
          );

          if (row.href) {
            return (
              <a key={row.label} href={row.href}>
                {content}
              </a>
            );
          }

          return content;
        })}
      </div>
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
    phone: string | null;
    email: string | null;
  }>;
}) {
  const cameraRows = buildCategoryRows(match, "Camaras");
  const talentRows = buildNamedRows(match, [
    "Relator",
    "Comentario 1",
    "Comentario 2",
    "Campo",
  ]);
  const observationRows = buildObservationRows(match);
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
  const isUnassignedLeague = isUnassignedLeagueLabel(leagueLabel);
  const statusAccentClass =
    match.status === "Realizado" ? "bg-[#26b36a]" : "bg-[#d7dde7]";
  const teamLogoStyle = {
    width: "clamp(2.82rem, 4.02vw, 5.22rem)",
    height: "clamp(2.82rem, 4.02vw, 5.22rem)",
  } as const;
  const teamLogoClassName =
    "rounded-none border-0 bg-transparent shadow-none";
  const teamLogoImageClassName =
    "p-0.5 xl:origin-center xl:p-0 xl:scale-100 2xl:p-2.5";
  const detailsId = `match-card-${match.id}`;
  const homeTeamLabel = getTeamDisplayName(match.home_team, match.competition);
  const awayTeamLabel = getTeamDisplayName(match.away_team, match.competition);

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
            "pointer-events-none absolute left-[-6px] top-1/2 z-0 h-[118px] w-[20px] -translate-y-1/2 rounded-l-[7px] rounded-r-[6px] shadow-[inset_-1px_0_0_rgba(255,255,255,0.16),0_8px_18px_rgba(15,23,42,0.06)] 2xl:left-[-12px] 2xl:w-[30px] 2xl:rounded-l-[10px]",
            statusAccentClass,
          )}
        />
        <div className="relative z-10 overflow-visible rounded-t-[10px] rounded-b-[10px]">
          <div
            className="flex flex-col overflow-hidden rounded-t-[10px] rounded-b-[10px] xl:grid xl:h-[184px] xl:grid-cols-[7rem_minmax(14.3rem,1.3fr)_minmax(10.5rem,1fr)_minmax(10.5rem,1fr)_minmax(8.5rem,0.85fr)_4.75rem] xl:items-stretch 2xl:h-auto 2xl:grid-cols-[7rem_minmax(16.5rem,24rem)_minmax(11.5rem,1fr)_minmax(11.5rem,1fr)_185px_185px_4.75rem]"
          >
          <div className="relative z-10 flex flex-col items-center justify-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-center xl:border-b-0 xl:border-r xl:px-3 xl:py-3 2xl:px-4 2xl:py-5">
            <LeagueLogoMarkClient
              league={leagueLabel}
              className={cn(
                "h-14 w-14 xl:h-14 xl:w-14 2xl:h-16 2xl:w-16",
                isUnassignedLeague && "rounded-2xl bg-[#e4eaf1]",
              )}
            />
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.18em] text-[#70819b]",
                isUnassignedLeague && "text-[#7f8ca0]",
              )}
            >
              {leagueLabel}
            </p>
          </div>

          <div className="flex min-w-0 flex-col border-b border-[var(--border)] xl:border-b-0 xl:border-r">
            <div className="flex min-h-0 flex-1 items-center px-4 py-4 xl:items-stretch xl:px-4 xl:py-2.5 2xl:px-6 2xl:py-5">
              <div className="mx-auto w-full max-w-[19rem] xl:flex xl:h-full xl:max-w-[15.4rem] xl:flex-col 2xl:max-w-[24rem]">
                <div className="xl:flex xl:flex-1 xl:items-center">
                  <div className="grid items-center justify-center gap-1.5 sm:grid-cols-[minmax(0,1fr)_1.75rem_minmax(0,1fr)] sm:gap-3 xl:w-full xl:gap-1 xl:sm:grid-cols-[6.1rem_1.35rem_6.1rem] 2xl:gap-4 2xl:sm:grid-cols-[8.5rem_2.25rem_8.5rem]">
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
                            className={teamLogoClassName}
                            imageClassName={teamLogoImageClassName}
                            style={teamLogoStyle}
                          />
                        </QuickMatchFieldEditor>
                      ) : (
                        <TeamLogoMark
                          teamName={match.home_team}
                          competition={match.competition}
                          className={teamLogoClassName}
                          imageClassName={teamLogoImageClassName}
                          style={teamLogoStyle}
                        />
                      )}
                      <p
                        title={match.home_team}
                        className="mt-2 min-h-[2.1em] whitespace-pre-line text-center text-[0.84rem] font-black leading-[1.04] tracking-[-0.03em] text-[var(--foreground)] [display:-webkit-box] overflow-hidden text-ellipsis [-webkit-box-orient:vertical] [-webkit-line-clamp:2] xl:mt-1.5 xl:min-h-[2.08em] xl:text-[0.84rem] 2xl:mt-3 2xl:min-h-[2.16em] 2xl:text-[0.98rem]"
                      >
                        {formatTeamDisplayName(homeTeamLabel)}
                      </p>
                    </div>

                    <span className="mt-2 self-start justify-self-center text-sm font-semibold uppercase tracking-[0.18em] text-[#93a0b2] xl:mt-2 xl:text-[0.9rem] 2xl:mt-4 2xl:text-base">
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
                            className={teamLogoClassName}
                            imageClassName={teamLogoImageClassName}
                            style={teamLogoStyle}
                          />
                        </QuickMatchFieldEditor>
                      ) : (
                        <TeamLogoMark
                          teamName={match.away_team}
                          competition={match.competition}
                          className={teamLogoClassName}
                          imageClassName={teamLogoImageClassName}
                          style={teamLogoStyle}
                        />
                      )}
                      <p
                        title={match.away_team}
                        className="mt-2 min-h-[2.1em] whitespace-pre-line text-center text-[0.84rem] font-black leading-[1.04] tracking-[-0.03em] text-[var(--foreground)] [display:-webkit-box] overflow-hidden text-ellipsis [-webkit-box-orient:vertical] [-webkit-line-clamp:2] xl:mt-1.5 xl:min-h-[2.08em] xl:text-[0.84rem] 2xl:mt-3 2xl:min-h-[2.16em] 2xl:text-[0.98rem]"
                      >
                        {formatTeamDisplayName(awayTeamLabel)}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            <div className="grid grid-cols-2 border-t border-[var(--border)] bg-[#fffefd] 2xl:hidden">
              <div className="px-4 py-2 text-center">
                <p className="inline-flex items-center justify-center gap-2 text-[1.05rem] font-black leading-tight tracking-[-0.03em] text-[var(--foreground)]">
                  <CalendarDays className="size-3.5 text-[#a7b4c8]" />
                  {formatGridDate(match.kickoff_at, match.timezone)}
                </p>
              </div>
              <div className="border-l border-[var(--border)] px-4 py-2 text-center">
                <p className="inline-flex items-center justify-center gap-2 text-[1.05rem] font-black leading-tight tracking-[-0.03em] text-[var(--foreground)]">
                  <Clock3 className="size-3.5 text-[#a7b4c8]" />
                  {formatMatchTime(match.kickoff_at, match.timezone)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-b border-[var(--border)] px-4 py-4 xl:border-b-0 xl:border-r xl:px-4 xl:py-3 2xl:px-6 2xl:py-5">
            <div className="flex items-center gap-2">
              <ShieldUser className="size-3.5 text-[#a7b4c8]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a7b4c8]">
                Staff
              </p>
            </div>
            <div className="flex items-center gap-3">
              <InlinePersonRoleStack
                label={RESPONSIBLE_DISPLAY_LABEL}
                value={getCompactPersonName(responsible.value)}
                initials={getInitials(responsible.value)}
                muted={responsible.muted}
                phone={responsible.phone ?? match.owner?.phone ?? null}
                confirmed={responsible.confirmed}
                confirmationStatus={responsible.confirmationStatus}
              />
            </div>
            <div className="flex items-center gap-3">
              <InlinePersonRoleStack
                label="Realizador"
                value={getCompactPersonName(director.value)}
                initials={getInitials(director.value)}
                muted={director.muted}
                phone={director.phone}
                confirmed={director.confirmed}
                confirmationStatus={director.confirmationStatus}
              />
            </div>
          </div>

          <div className="grid gap-3 border-b border-[var(--border)] px-4 py-4 xl:border-b-0 xl:border-r xl:px-4 xl:py-3 2xl:px-6 2xl:py-5">
            <div className="flex items-center gap-2">
              <Mic2 className="size-3.5 text-[#a7b4c8]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a7b4c8]">
                Relatos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <InlinePersonRoleStack
                label="Relatos"
                value={getCompactPersonName(narrator.value)}
                initials={getInitials(narrator.value)}
                muted={narrator.muted}
                phone={narrator.phone}
                confirmed={narrator.confirmed}
                confirmationStatus={narrator.confirmationStatus}
              />
            </div>
            <div className="flex items-center gap-3">
              <InlinePersonRoleStack
                label="Comentarios"
                value={getCompactPersonName(commentator.value)}
                initials={getInitials(commentator.value)}
                muted={commentator.muted}
                phone={commentator.phone}
                confirmed={commentator.confirmed}
                confirmationStatus={commentator.confirmationStatus}
              />
            </div>
          </div>

          <div className="grid gap-3 border-b border-[var(--border)] px-4 py-4 xl:border-b-0 xl:border-r xl:px-4 xl:py-3 2xl:px-6 2xl:py-5">
            <div className="flex items-center gap-2">
              <Hash className="size-3.5 text-[#a7b4c8]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a7b4c8]">
                Operativa
              </p>
            </div>
            <div className="flex min-h-9 items-center">
              <div className="min-w-0">
                <p className="font-black uppercase tracking-[0.18em] text-[#8ea0bb] text-[9px]">
                  ID
                </p>
                <div className="mt-1 min-w-0">
                  <span
                    className={cn(
                      badgeBaseClassName,
                      "max-w-full border border-[#f3cfd8] bg-[#fff3f6] py-0.5 text-[var(--accent)]",
                    )}
                    title={match.production_code?.trim() || "Sin ID"}
                  >
                    <span className="block min-w-0 truncate">
                      {match.production_code?.trim() || "Sin ID"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex min-h-9 items-center">
              <div className="min-w-0">
                <p className="font-black uppercase tracking-[0.18em] text-[#8ea0bb] text-[9px]">
                  Producción
                </p>
                <div className="mt-1 min-w-0">
                  <span
                    className={cn(
                      badgeBaseClassName,
                      "max-w-full border border-[#dbe1ea] bg-[#f7f8fa] py-0.5 text-[#637083]",
                    )}
                    title={formatProductionModeLabel(match.production_mode)}
                  >
                    <span className="block min-w-0 truncate">
                      {formatProductionModeLabel(match.production_mode)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden gap-3 border-b border-[var(--border)] px-4 py-4 xl:border-b-0 xl:border-r 2xl:grid 2xl:px-6 2xl:py-5">
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a7b4c8]">
                <CalendarDays className="size-3.5 text-[#a7b4c8]" />
                Fecha
              </p>
              <p className="mt-2 text-[1.12rem] font-extrabold leading-tight tracking-[-0.03em] text-[var(--foreground)]">
                {formatGridDate(match.kickoff_at, match.timezone)}
              </p>
            </div>
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a7b4c8]">
                <Clock3 className="size-3.5 text-[#a7b4c8]" />
                Hora
              </p>
              <p className="mt-2 text-[1.12rem] font-extrabold leading-tight tracking-[-0.03em] text-[var(--foreground)]">
                {formatMatchTime(match.kickoff_at, match.timezone)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-[var(--border)] px-4 py-4 xl:justify-center xl:border-l xl:border-t-0 xl:px-0 xl:py-0">
            <MatchCardActions
              canEdit={canEdit}
              detailsId={detailsId}
              match={match}
              people={people}
              redirectTo={redirectTo}
            />
          </div>
          </div>

        </div>
      </summary>

      <div className="overflow-hidden rounded-b-[10px] border-t border-[var(--border)] bg-[#fffefd] px-5 py-5 sm:px-6">
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
            title="Observaciones"
            icon={MessageCircleMore}
            rows={observationRows}
          />
        </div>
      </div>
    </details>
  );
}
