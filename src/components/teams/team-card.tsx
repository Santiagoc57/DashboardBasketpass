import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Globe,
  Instagram,
  Mail,
  MapPinned,
  MessageCircle,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { TeamLogoMark } from "@/components/team-logo-mark";
import type { TeamResponsibleContact } from "@/lib/team-responsibles";
import {
  getTeamLeagueAccentColor,
  getTeamLeagueColorSet,
  splitTeamCompetitions,
  type TeamDirectoryItem,
} from "@/lib/team-directory";
import { buildWhatsAppUrl, cn } from "@/lib/utils";

function getLeagueBadgeStyle(competition: string): CSSProperties {
  const colors = getTeamLeagueColorSet(competition);

  return {
    backgroundColor: colors.soft,
    color: colors.accent,
  };
}

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
      <span className="inline-flex size-9 items-center justify-center rounded-full border border-[#e6e4e6] bg-white text-[#b7b4b8] opacity-75">
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex size-9 items-center justify-center rounded-full border border-[#e6e4e6] bg-white text-[#8b94a6] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      {children}
    </a>
  );
}

export function TeamCard({
  team,
  activeLeague,
  responsibleContact,
}: {
  team: TeamDirectoryItem;
  activeLeague?: string;
  responsibleContact?: TeamResponsibleContact | null;
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
      className="panel-surface group overflow-hidden border border-[var(--border)] bg-[#f7f5f6] transition duration-300 hover:-translate-y-0.5 sm:flex"
    >
      <div className="relative flex h-56 flex-col items-center justify-center gap-5 bg-[#f7f5f6] p-8 sm:h-auto sm:w-44 sm:border-r sm:border-[var(--border)]">
        <TeamLogoMark
          teamName={team.official_name}
          competition={team.competition}
          className="panel-surface relative z-10 size-28 border-[#ebe6e8] bg-white"
          imageClassName="p-3"
          initialsClassName="text-base tracking-[0.14em]"
        />

        <div className="flex items-center gap-3">
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

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {leagueBadges.map((league) => (
                <span
                  key={`${team.id}-${league}`}
                  style={getLeagueBadgeStyle(league)}
                  className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                >
                  {league}
                </span>
              ))}
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                getIncidentBadgeClass(team.incident_count),
              )}
            >
              <ShieldAlert className="size-3.5" />
              {team.incident_count}
            </span>
          </div>

          <h3 className="text-xl font-extrabold tracking-tight text-[var(--foreground)] transition group-hover:text-[var(--team-league-accent)]">
            {team.official_name}
          </h3>

          <div className="mt-3 space-y-2 text-sm text-[#70819b]">
            <div className="flex items-center gap-2">
              <MapPinned className="size-4 shrink-0" />
              <span>{team.stadium ?? "Sin estadio cargado"}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserRound className="size-4 shrink-0" />
              <span className="min-w-0 truncate">Resp: {responsibleLabel}</span>
              {responsibleContact?.phone ? (
                <a
                  href={buildWhatsAppUrl(responsibleContact.phone)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Escribir por WhatsApp a ${responsibleContact.fullName}`}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a] transition hover:bg-[#dcfce7]"
                >
                  <MessageCircle className="size-4" />
                </a>
              ) : null}
              {responsibleContact?.email ? (
                <a
                  href={`mailto:${responsibleContact.email}`}
                  aria-label={`Escribir por correo a ${responsibleContact.fullName}`}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#4f46e5] transition hover:bg-[#e0e7ff]"
                >
                  <Mail className="size-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <Link
            href={`/teams/${team.slug}`}
            className="ml-auto inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] transition group-hover:translate-x-1"
          >
            Ver equipo
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
