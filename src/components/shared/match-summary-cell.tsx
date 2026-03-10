"use client";

import type { CSSProperties } from "react";
import { CalendarDays, Clock3 } from "lucide-react";

import { badgeBaseClassName } from "@/components/ui/badge";
import { ClientTeamLogoMark } from "@/components/team-logo-mark-client";
import { getTeamLeagueColorSet } from "@/lib/team-directory";

function splitMatchLabel(matchLabel: string) {
  const [homeTeam, awayTeam] = matchLabel.split(/\s+vs\s+/i);

  return {
    homeTeam: homeTeam?.trim() || matchLabel,
    awayTeam: awayTeam?.trim() || matchLabel,
  };
}

function getLeagueBadgeStyle(league: string): CSSProperties {
  const colors = getTeamLeagueColorSet(league);

  return {
    backgroundColor: colors.soft,
    color: colors.accent,
  };
}

export function MatchSummaryCell({
  idLabel,
  matchLabel,
  competition,
  secondaryBadgeLabel,
  metaDate,
  metaTime,
}: {
  idLabel?: string;
  matchLabel: string;
  competition: string;
  secondaryBadgeLabel?: string;
  metaDate?: string;
  metaTime?: string;
}) {
  const teams = splitMatchLabel(matchLabel);
  const hasMetaRow = Boolean(metaDate || metaTime);

  return (
    <div className="flex min-w-[21rem] items-center gap-4">
      <div className="flex -space-x-2">
        <ClientTeamLogoMark
          teamName={teams.homeTeam}
          competition={competition}
          className="size-12 rounded-full border-2 border-[var(--surface)] bg-[#f8fafc]"
          initialsClassName="text-[11px] tracking-[0.12em] text-[#70819b]"
        />
        <ClientTeamLogoMark
          teamName={teams.awayTeam}
          competition={competition}
          className="size-12 rounded-full border-2 border-[var(--surface)] bg-[#f8fafc]"
          initialsClassName="text-[11px] tracking-[0.12em] text-[#70819b]"
        />
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {idLabel ? (
            <span
              className={`${badgeBaseClassName} border border-[#f3cfd8] bg-[#fff3f6] text-[var(--accent)]`}
            >
              {idLabel}
            </span>
          ) : null}
          {secondaryBadgeLabel ? (
            <span
              style={getLeagueBadgeStyle(secondaryBadgeLabel)}
              className={badgeBaseClassName}
            >
              {secondaryBadgeLabel}
            </span>
          ) : null}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold leading-tight text-[var(--foreground)]">
            {teams.homeTeam}
          </p>
          <div className="flex items-start gap-2">
            <p className="shrink-0 pt-0.5 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              vs
            </p>
            <p className="text-sm font-bold leading-tight text-[var(--foreground)]">
              {teams.awayTeam}
            </p>
          </div>
        </div>
        {hasMetaRow ? (
          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs font-medium text-[#70819b]">
            {metaDate ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-[#b1b8c5]" />
                {metaDate}
              </span>
            ) : null}
            {metaTime ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-[#b1b8c5]" />
                {metaTime}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="mt-1 block text-xs font-medium text-[#70819b]">
            {competition}
          </span>
        )}
      </div>
    </div>
  );
}
