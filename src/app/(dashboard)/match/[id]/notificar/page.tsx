import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  MapPin,
  X,
} from "lucide-react";
import { notFound } from "next/navigation";

import { MatchNotificationWorkspace } from "@/components/match/match-notification-workspace";
import { SetupPanel } from "@/components/layout/setup-panel";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageMessage } from "@/components/ui/page-message";
import { requireUserContext } from "@/lib/auth";
import { buildAssignmentConfirmationLinks } from "@/lib/assignment-confirmation";
import { getProductionModeLabel } from "@/lib/constants";
import { getMatchDetailData } from "@/lib/data/dashboard";
import { formatMatchDate, formatMatchTime } from "@/lib/date";
import { getRoleDisplayName } from "@/lib/display";
import { appEnv, isSupabaseConfigured } from "@/lib/env";
import {
  buildMatchNotificationMailtoHref,
  buildMatchNotificationMessage,
  buildMatchNotificationWhatsAppHref,
} from "@/lib/integrations";
import { getTeamDisplayName } from "@/lib/team-directory";
import { parseNotice } from "@/lib/search-params";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MatchNotifyPage({ params, searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { intent, notice } = parseNotice(resolvedSearchParams);

  if (!isSupabaseConfigured) {
    return <SetupPanel />;
  }

  const user = await requireUserContext();

  if (!user.canEdit) {
    return (
      <Card className="space-y-3 border-[#f2d8ae] bg-[#fffaf0]">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9a5a0f]">
          Sin acceso
        </p>
        <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
          Esta pantalla es solo para coordinación
        </h2>
        <p className="text-sm leading-6 text-[#617187]">
          Necesitas permisos de edición para enviar convocatorias desde la plataforma.
        </p>
      </Card>
    );
  }

  const { id } = await params;
  let data: Awaited<ReturnType<typeof getMatchDetailData>>;

  try {
    data = await getMatchDetailData(id);
  } catch {
    notFound();
  }

  const { match } = data;
  const homeTeamLabel =
    getTeamDisplayName(match.home_team, match.competition).trim() || "Equipo local";
  const awayTeamLabel =
    getTeamDisplayName(match.away_team, match.competition).trim() || "Equipo visitante";
  const notificationMatch = {
    ...match,
    home_team: homeTeamLabel,
    away_team: awayTeamLabel,
  };
  const unassignedRoles = match.assignments
    .filter((assignment) => !assignment.person_id)
    .map((assignment) => getRoleDisplayName(assignment.role.name));

  const recipients = match.assignments
    .filter((assignment) => assignment.person)
    .map((assignment) => {
      const person = assignment.person!;
      const roleLabel = getRoleDisplayName(assignment.role.name);
      const confirmationLinks = buildAssignmentConfirmationLinks({
        appUrl: appEnv.appUrl,
        token: assignment.confirmation_token,
      });

      return {
        id: assignment.id,
        fullName: person.full_name,
        email: person.email,
        phone: person.phone,
        roles: [roleLabel],
        emailHref: "",
        whatsappHref: "",
        personalMessage: "",
        confirmationLinks,
      };
    })
    .map((recipient) => {
      const personalMessage = buildMatchNotificationMessage({
        match: notificationMatch,
        personName: recipient.fullName,
        roleNames: recipient.roles,
        confirmationLinks: recipient.confirmationLinks,
      });

      return {
        ...recipient,
        emailHref: buildMatchNotificationMailtoHref({
          email: recipient.email,
          match: notificationMatch,
          personName: recipient.fullName,
          roleNames: recipient.roles,
          confirmationLinks: recipient.confirmationLinks,
        }),
        whatsappHref: buildMatchNotificationWhatsAppHref({
          phone: recipient.phone,
          match: notificationMatch,
          personName: recipient.fullName,
          roleNames: recipient.roles,
          confirmationLinks: recipient.confirmationLinks,
        }),
        personalMessage,
      };
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName));

  const batchMessage = buildMatchNotificationMessage({ match: notificationMatch });

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--surface)] shadow-[0_32px_80px_rgba(15,23,42,0.22)]">
      <div className="bg-[var(--accent)] px-5 py-5 sm:px-6 sm:py-5 xl:min-h-[95px] xl:px-8 xl:py-3 2xl:px-10">
        <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-3 xl:flex-row xl:items-stretch xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col justify-center py-1.5 text-white">
            <div className="flex items-center gap-3">
              <BackButton ariaLabel="Volver al paso 1" />
              <h1 className="text-[1.6rem] font-extrabold leading-none tracking-tight text-white xl:text-[1.62rem]">
                Paso 2: Notificar personal
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 xl:justify-end xl:py-1.5">
            <Link
              href="/grid"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border-0 bg-white/20 text-white transition hover:bg-white/30"
              aria-label="Cerrar"
            >
              <X className="size-4.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 xl:px-8 xl:py-6 2xl:px-10">
        <div className="mx-auto w-full max-w-[1600px] space-y-5">
          <PageMessage intent={intent} message={notice} />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-sm font-medium text-[var(--muted)]">
            <Badge className="border-[#f0c8d1] bg-[#fff0f3] text-[var(--accent)]">
              {match.production_code ?? "Sin ID"}
            </Badge>
            <Badge>{match.competition ?? "Sin liga"}</Badge>
            <Badge>{getProductionModeLabel(match.production_mode) || "Sin definir"}</Badge>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatMatchDate(match.kickoff_at, match.timezone, "dd MMM yyyy")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-4" />
              {formatMatchTime(match.kickoff_at, match.timezone)} {match.timezone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {match.venue ?? "Sede sin definir"}
            </span>
          </div>

          <MatchNotificationWorkspace
            batchMessage={batchMessage}
            recipients={recipients}
            unassignedRoles={unassignedRoles}
            compact
          />
        </div>
      </div>
    </div>
  );
}
