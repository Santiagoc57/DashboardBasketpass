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
import { CreateTeamModal } from "@/components/teams/create-team-modal";
import type { TeamResponsibleContact } from "@/lib/team-responsibles";
import {
  getTeamLeagueAccentColor,
  splitTeamCompetitions,
  type TeamDirectoryItem,
} from "@/lib/team-directory";
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
      <span className="inline-flex size-8 items-center justify-center rounded-full border border-[#e6e4e6] bg-white text-[#b7b4b8] opacity-75 xl:size-9">
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex size-8 items-center justify-center rounded-full border border-[#e6e4e6] bg-white text-[#8b94a6] transition hover:border-[var(--accent)] hover:text-[var(--accent)] xl:size-9"
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
}: {
  team: TeamDirectoryItem;
  activeLeague?: string;
  responsibleContact?: TeamResponsibleContact | null;
  canEdit?: boolean;
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
      className="panel-surface group overflow-hidden border border-[var(--border)] bg-white transition duration-300 hover:-translate-y-0.5 sm:grid sm:grid-cols-[8.75rem_minmax(0,1fr)] xl:grid-cols-[9rem_minmax(0,1fr)]"
    >
      <div className="relative flex h-[13.25rem] flex-col items-center justify-center gap-3.5 bg-white px-5 py-6 sm:h-full sm:min-h-[13.75rem] sm:border-r sm:border-[var(--border)] sm:px-3.5 sm:py-5 xl:px-4 xl:py-6">
        {team.logo_data_url ? (
          <div className="panel-surface relative z-10 size-[5.75rem] overflow-hidden border-[#ebe6e8] bg-white xl:size-[6.1rem]">
            <Image
              src={team.logo_data_url}
              alt={`Escudo de ${team.official_name}`}
              fill
              unoptimized
              sizes="104px"
              className="object-contain p-3"
            />
          </div>
        ) : (
          <ClientTeamLogoMark
            teamName={team.official_name}
            competition={team.competition}
            className="panel-surface relative z-10 size-[5.75rem] border-[#ebe6e8] bg-white xl:size-[6.1rem]"
            imageClassName="p-3"
            initialsClassName="text-base tracking-[0.14em]"
          />
        )}

        <div className="flex items-center gap-2.5 xl:gap-3">
          <TeamLinkIcon href={team.website}>
            <Globe className="size-4" />
          </TeamLinkIcon>
          <TeamLinkIcon href={team.instagram}>
            <Instagram className="size-4" />
          </TeamLinkIcon>
          <TeamLinkIcon href={team.official_url}>
            <ExternalLink className="size-4" />
          </TeamLinkIcon>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 xl:p-5">
        <div className="space-y-3.5">
          <div className="flex justify-start">
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
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
                  triggerVariant="icon"
                  triggerClassName="h-[26px] min-w-[26px] px-2.5 py-1"
                />
              ) : null}
            </div>
          </div>

          <div className="min-w-0 pr-1">
            <h3 className="text-[1.12rem] font-extrabold leading-[1.06] tracking-[-0.03em] text-[var(--foreground)] transition group-hover:text-[var(--team-league-accent)] xl:text-[1.24rem] 2xl:text-[1.32rem]">
              {team.official_name}
            </h3>
          </div>

          <div className="space-y-3 text-sm text-[#70819b]">
            <div className="flex items-center gap-2.5">
              <MapPinned className="size-4 shrink-0" />
              <span>{team.stadium ?? "Sin estadio cargado"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <UserRound className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{responsibleLabel}</span>
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                {responsibleContact?.phone ? (
                  <a
                    href={buildWhatsAppUrl(responsibleContact.phone)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Escribir por WhatsApp a ${responsibleContact.fullName}`}
                    className="inline-flex size-8 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a] transition hover:bg-[#dcfce7]"
                  >
                    <MessageCircle className="size-4" />
                  </a>
                ) : null}
                {responsibleContact?.email ? (
                  <a
                    href={`mailto:${responsibleContact.email}`}
                    aria-label={`Escribir por correo a ${responsibleContact.fullName}`}
                    className="inline-flex size-8 items-center justify-center rounded-full bg-[#eef2ff] text-[#4f46e5] transition hover:bg-[#e0e7ff]"
                  >
                    <Mail className="size-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
