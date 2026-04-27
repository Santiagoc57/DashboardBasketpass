import type { CSSProperties } from "react";
import Image from "next/image";
import {
  ExternalLink,
  Globe,
  Instagram,
  Mail,
  MapPinned,
  MessageCircle,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { ClientTeamLogoMark } from "@/components/team-logo-mark-client";
import { TeamIssueReportModal } from "@/components/teams/team-issue-report-modal";
import { CreateTeamModal } from "@/components/teams/create-team-modal";
import type { TeamResponsibleContact } from "@/lib/team-responsibles";
import {
  getTeamLeagueAccentColor,
  splitTeamCompetitions,
  type TeamDirectoryItem,
} from "@/lib/team-directory";
import type { PersonListItem } from "@/lib/types";
import { buildWhatsAppUrl, cn } from "@/lib/utils";

function getIncidentBadgeClass(incidentCount: number) {
  if (incidentCount >= 4) {
    return "bg-[#fff1f3] text-[#c21e3a]";
  }

  if (incidentCount >= 1) {
    return "bg-[#fff7e8] text-[#c97a13]";
  }

  return "bg-[#f4f7fb] text-[#70819b]";
}

function TeamLinkIcon({
  href,
  children,
}: {
  href: string | null;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span className="inline-flex size-[17px] items-center justify-center rounded-full border border-[#e6e4e6] bg-white text-[#b7b4b8] opacity-75 xl:size-[19px]">
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex size-[17px] items-center justify-center rounded-full border border-[#e6e4e6] bg-white text-[#8b94a6] transition hover:border-[var(--accent)] hover:text-[var(--accent)] xl:size-[19px]"
    >
      {children}
    </a>
  );
}

export function TeamCard({
  team,
  activeLeague,
  responsibleContact,
  canEdit = false,
  people = [],
}: {
  team: TeamDirectoryItem;
  activeLeague?: string;
  responsibleContact?: TeamResponsibleContact | null;
  canEdit?: boolean;
  people?: PersonListItem[];
}) {
  const leagueBadges = splitTeamCompetitions(team.competition);
  const primaryLeague = activeLeague || leagueBadges[0] || team.competition;
  const hoverAccent = getTeamLeagueAccentColor(primaryLeague);
  const responsibleLabel =
    responsibleContact?.fullName ?? team.manager ?? "Sin responsable";

  return (
    <article
      style={
        {
          "--team-league-accent": hoverAccent,
        } as CSSProperties
      }
      className="panel-surface group h-full overflow-hidden border border-[var(--border)] bg-white transition duration-300 hover:-translate-y-0.5 sm:grid sm:grid-cols-[8.75rem_minmax(0,1fr)] xl:grid-cols-[9rem_minmax(0,1fr)]"
    >
      <div className="relative flex flex-col items-center justify-center gap-2 bg-white px-3 pb-2 pt-4 sm:h-full sm:min-h-[13.75rem] sm:gap-3.5 sm:border-r sm:border-[var(--border)] sm:px-3.5 sm:py-5 xl:px-4 xl:py-6">
        {team.logo_data_url ? (
          <div className="panel-surface relative z-10 size-[4.4rem] overflow-hidden border-[#ebe6e8] bg-white sm:size-[5.75rem] xl:size-[6.1rem]">
            <Image
              src={team.logo_data_url}
              alt={`Escudo de ${team.official_name}`}
              fill
              unoptimized
              sizes="(max-width: 640px) 72px, 104px"
              className="object-contain p-2 sm:p-3"
            />
          </div>
        ) : (
          <ClientTeamLogoMark
            teamName={team.official_name}
            competition={team.competition}
            className="panel-surface relative z-10 size-[4.4rem] border-[#ebe6e8] bg-white sm:size-[5.75rem] xl:size-[6.1rem]"
            imageClassName="p-2 sm:p-3"
            initialsClassName="text-sm tracking-[0.12em] sm:text-base sm:tracking-[0.14em]"
          />
        )}

        <div className="hidden items-center gap-1 sm:flex xl:gap-1.5">
          <TeamLinkIcon href={team.website}>
            <Globe className="size-[8px] xl:size-[9px]" />
          </TeamLinkIcon>
          <TeamLinkIcon href={team.instagram}>
            <Instagram className="size-[8px] xl:size-[9px]" />
          </TeamLinkIcon>
          <TeamLinkIcon href={team.official_url}>
            <ExternalLink className="size-[8px] xl:size-[9px]" />
          </TeamLinkIcon>
        </div>
      </div>

      <div className="flex h-full flex-1 flex-col px-3 pb-4 pt-2 text-center sm:p-5 sm:text-left xl:p-5">
        <div className="space-y-2.5 sm:space-y-3.5">
          <div className="flex justify-center sm:justify-start">
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span
                className={cn(
                  "inline-flex h-[26px] items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold",
                  getIncidentBadgeClass(team.incident_count),
                )}
              >
                <ShieldAlert className="size-3.5" />
                {team.incident_count}
              </span>
              {canEdit ? (
                <CreateTeamModal
                  canEdit={canEdit}
                  defaultCompetition={activeLeague || team.competition}
                  initialTeam={team}
                  people={people}
                  triggerVariant="icon"
                  triggerClassName="h-[26px] min-w-[26px] px-2.5 py-1"
                />
              ) : null}
              <TeamIssueReportModal
                team={team}
                triggerClassName="h-[26px] min-w-[26px] px-2.5 py-1"
              />
            </div>
          </div>

          <div className="min-w-0 pr-1">
            <h3
              title={team.official_name}
              className="line-clamp-2 text-[0.98rem] font-extrabold leading-[1.08] tracking-[-0.02em] text-[var(--foreground)] transition group-hover:text-[var(--team-league-accent)] sm:text-[1.12rem] sm:tracking-[-0.03em] xl:text-[1.24rem] 2xl:text-[1.32rem]"
            >
              {team.display_name}
            </h3>
          </div>
        </div>

        <div className="mt-auto hidden space-y-2.5 pt-3 text-sm text-[#70819b] sm:block">
          <div className="flex items-center gap-2.5">
            <MapPinned className="size-4 shrink-0" />
            <span>{team.stadium ?? "Sin estadio cargado"}</span>
          </div>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-2">
            <UserRound className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 truncate">{responsibleLabel}</span>
            <div className="col-span-2 mt-1.5 flex items-center justify-start gap-1.5">
              {responsibleContact?.phone ? (
                <a
                  href={buildWhatsAppUrl(responsibleContact.phone)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Escribir por WhatsApp a ${responsibleContact.fullName}`}
                  className="inline-flex size-[27px] items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a] transition hover:bg-[#dcfce7]"
                >
                  <MessageCircle className="size-[13px]" />
                </a>
              ) : null}
              {responsibleContact?.email ? (
                <a
                  href={`mailto:${responsibleContact.email}`}
                  aria-label={`Escribir por correo a ${responsibleContact.fullName}`}
                  className="inline-flex size-[27px] items-center justify-center rounded-full bg-[#eef2ff] text-[#4f46e5] transition hover:bg-[#e0e7ff]"
                >
                  <Mail className="size-[13px]" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
