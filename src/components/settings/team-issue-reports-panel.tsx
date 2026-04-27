import Link from "next/link";
import { CircleCheckBig, CircleHelp, Flag, X } from "lucide-react";

import {
  deleteTeamIssueReportAction,
  resolveTeamIssueReportAction,
} from "@/app/actions/settings";
import { LeagueLogoMarkClient } from "@/components/league-logo-mark-client";
import { TeamLogoMark } from "@/components/team-logo-mark";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import type { TeamIssueReportRow } from "@/lib/database.types";
import { TEAM_DIRECTORY } from "@/lib/team-directory";

function formatReportDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCompactReportDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
  })
    .format(new Date(value))
    .replace(".", "")
    .toUpperCase();
}

function getReportDestinationHref(report: TeamIssueReportRow) {
  const team =
    TEAM_DIRECTORY.find((item) => item.id === report.team_id) ??
    TEAM_DIRECTORY.find((item) =>
      item.official_name === report.team_official_name &&
      item.competition === report.competition
    ) ??
    TEAM_DIRECTORY.find((item) =>
      item.display_name === report.team_display_name &&
      item.competition === report.competition
    );

  return team ? `/teams/${team.slug}` : "/teams";
}

function StatusBadge({ status }: { status: TeamIssueReportRow["status"] }) {
  if (status === "resolved") {
    return (
      <Badge className="h-7 border-[#cce8db] bg-[#effaf4] px-3 text-[10px] text-[#17654d]">
        Resuelto
      </Badge>
    );
  }

  return (
    <Badge className="h-7 border-[#f2ddb1] bg-[#fff7e8] px-3 text-[10px] text-[#b7791f]">
      Pendiente
    </Badge>
  );
}

function ReportsTableHeader({ resolved = false }: { resolved?: boolean }) {
  return (
    <thead>
      <tr className="bg-[#fafbfd] text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
        <th className="border-r border-[#edf1f6] px-4 py-1.5 text-center sm:px-5">Club</th>
        <th className="border-r border-[#edf1f6] px-4 py-1.5 text-center sm:px-5">Liga</th>
        <th className="border-r border-[#edf1f6] px-4 py-1.5 text-center sm:px-5">Fecha</th>
        <th className="border-r border-[#edf1f6] px-4 py-1.5 text-center sm:px-5">Ir</th>
        <th className="px-4 py-1.5 text-center sm:px-5">{resolved ? "Estado" : "Resolver"}</th>
      </tr>
    </thead>
  );
}

function ReportItem({
  report,
  resolved = false,
}: {
  report: TeamIssueReportRow;
  resolved?: boolean;
}) {
  const detailTitle = [report.reason, report.detail].filter(Boolean).join(": ");
  const teamTitle = [report.team_display_name, report.team_official_name]
    .filter(Boolean)
    .join(" · ");
  const reportHref = getReportDestinationHref(report);

  return (
    <tr className="transition hover:bg-[#fafbfd]">
      <td className="border-r border-[#edf1f6] px-4 py-1.5 text-center align-middle sm:px-5">
        <Link
          href={reportHref}
          title={teamTitle}
          aria-label={`Abrir ficha de ${report.team_display_name}`}
          className="inline-flex size-8 items-center justify-center rounded-xl transition hover:bg-[#fff7f8]"
        >
          <TeamLogoMark
            teamName={report.team_official_name || report.team_display_name}
            competition={report.competition}
            className="size-7 border-none bg-transparent shadow-none"
            imageClassName="p-0"
            initialsClassName="text-[10px] tracking-[0.14em]"
          />
          <span className="sr-only">{report.team_display_name}</span>
        </Link>
      </td>
      <td className="border-r border-[#edf1f6] px-4 py-1.5 text-center align-middle sm:px-5">
        <div
          className="inline-flex size-8 items-center justify-center"
          title={report.competition}
        >
          <LeagueLogoMarkClient league={report.competition} className="size-7" />
          <span className="sr-only">{report.competition}</span>
        </div>
      </td>
      <td className="border-r border-[#edf1f6] px-4 py-1.5 text-center align-middle sm:px-5">
        <p
          className="inline-flex min-w-[90px] items-center justify-center text-[13px] font-black uppercase tracking-[0.12em] text-[#475569]"
          title={formatReportDate(report.created_at)}
        >
          {formatCompactReportDate(report.created_at)}
        </p>
      </td>
      <td className="border-r border-[#edf1f6] px-4 py-1.5 text-center align-middle sm:px-5">
        <Link
          href={reportHref}
          title={detailTitle || "Abrir ficha del equipo"}
          aria-label={`Abrir ayuda para revisar ${report.team_display_name}`}
          className="inline-flex size-7 items-center justify-center rounded-full border border-[#dbe3ee] bg-[#f8fafc] text-[#64748b] transition hover:border-[#c9d5e4] hover:bg-[#eef2f6] hover:text-[var(--foreground)]"
        >
          <CircleHelp className="size-3" />
        </Link>
      </td>
      <td className="px-4 py-1.5 text-center align-middle sm:px-5">
        <div className="flex justify-center">
          {resolved ? (
            <div className="flex items-center gap-2">
              <StatusBadge status={report.status} />
              <form action={deleteTeamIssueReportAction}>
                <input type="hidden" name="redirectTo" value="/settings" />
                <input type="hidden" name="reportId" value={report.id} />
                <SubmitButton
                  variant="secondary"
                  pendingLabel="..."
                  aria-label={`Eliminar reporte ${report.team_display_name}`}
                  title="Eliminar reporte"
                  className="size-7 rounded-full border-[#f0d9de] bg-[#fff4f6] p-0 text-[var(--accent)] hover:bg-[#ffe9ee]"
                >
                  <X className="size-3" />
                </SubmitButton>
              </form>
            </div>
          ) : (
            <form action={resolveTeamIssueReportAction}>
              <input type="hidden" name="redirectTo" value="/settings" />
              <input type="hidden" name="reportId" value={report.id} />
              <SubmitButton
                variant="secondary"
                pendingLabel="..."
                aria-label={`Marcar como resuelto ${report.team_display_name}`}
                title="Marcar como resuelto"
                className="size-7 rounded-full border-[#cce8db] bg-[#effaf4] p-0 text-[#17654d] hover:bg-[#dff5ea]"
              >
                <CircleCheckBig className="size-3" />
              </SubmitButton>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}

export function TeamIssueReportsPanel({
  openReports,
  resolvedReports,
  missingTable = false,
}: {
  openReports: TeamIssueReportRow[];
  resolvedReports: TeamIssueReportRow[];
  missingTable?: boolean;
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <Flag className="size-[18px]" strokeWidth={1.9} />
        </span>
        <div>
          <h3 className="text-lg font-extrabold text-[var(--foreground)]">
            Reportes de equipos
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className="border-[#f2ddb1] bg-[#fff7e8] text-[#b7791f]">
          {openReports.length} abiertos
        </Badge>
        <Badge className="border-[#cce8db] bg-[#effaf4] text-[#17654d]">
          {resolvedReports.length} resueltos
        </Badge>
      </div>

      {openReports.length ? (
        <div className="overflow-x-auto rounded-[var(--panel-radius)] border border-[var(--border)] bg-[#fbfcfe]">
          <table className="min-w-full table-fixed text-left">
            <colgroup>
              <col className="w-[88px]" />
              <col className="w-[88px]" />
              <col className="w-[136px]" />
              <col className="w-[88px]" />
              <col className="w-[112px]" />
            </colgroup>
            <ReportsTableHeader />
            <tbody className="divide-y divide-[#e7edf5]">
              {openReports.map((report) => (
                <ReportItem key={report.id} report={report} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-[var(--panel-radius)] border border-dashed border-[#d9e1ec] bg-[#fbfcfe] px-4 py-6 text-sm text-[#70819b]">
          {missingTable
            ? (
                <div className="space-y-1.5">
                  <p className="font-semibold text-[var(--foreground)]">
                    Falta aplicar la migración{" "}
                    <code className="rounded bg-[var(--background-soft)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--foreground)]">
                      0013_add_team_issue_reports.sql
                    </code>
                    .
                  </p>
                  <p>Ejecuta esa migración para ver los reportes aquí.</p>
                </div>
              )
            : "No hay reportes pendientes."}
        </div>
      )}

      {resolvedReports.length ? (
        <div className="space-y-3 border-t border-[var(--border)] pt-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#94a3b8]">
            Últimos resueltos
          </p>
          <div className="overflow-x-auto rounded-[var(--panel-radius)] border border-[var(--border)] bg-[#fbfcfe]">
            <table className="min-w-full table-fixed text-left">
              <colgroup>
                <col className="w-[88px]" />
                <col className="w-[88px]" />
                <col className="w-[136px]" />
                <col className="w-[88px]" />
                <col className="w-[112px]" />
              </colgroup>
              <ReportsTableHeader resolved />
              <tbody className="divide-y divide-[#e7edf5]">
                {resolvedReports.map((report) => (
                  <ReportItem key={report.id} report={report} resolved />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
