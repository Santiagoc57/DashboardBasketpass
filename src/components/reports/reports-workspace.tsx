"use client";

import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  CalendarDays,
  Circle,
  CircleCheckBig,
  CircleX,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Cpu,
  Download,
  Eye,
  FileText,
  Filter,
  Gauge,
  History,
  MapPin,
  Pencil,
  ShieldAlert,
  Upload,
  Wifi,
  X,
} from "lucide-react";

import { SectionAiAssistant } from "@/components/ai/section-ai-assistant";
import { IncidentsWorkspace } from "@/components/incidents/incidents-workspace";
import { LeagueLogoMarkClient } from "@/components/league-logo-mark-client";
import { ClientTeamLogoMark } from "@/components/team-logo-mark-client";
import { SectionPageHeader } from "@/components/layout/section-page-header";
import { MatchSummaryCell } from "@/components/shared/match-summary-cell";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpandDivider } from "@/components/ui/expand-divider";
import { InsightBarRow } from "@/components/ui/insight-bar-row";
import { PersonRoleStack } from "@/components/ui/person-role-stack";
import { PlainViewToggle } from "@/components/ui/plain-view-toggle";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { SectionTableCard } from "@/components/ui/section-table-card";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import { ToolbarIconButton } from "@/components/ui/toolbar-icon-button";
import { ToolbarSearchField } from "@/components/ui/toolbar-search-field";
import type {
  ReportAttachment,
  ReportActivity,
  ReportRecord,
  ReportSeverity,
} from "@/lib/reports";
import type {
  CollaboratorReportAttachment,
  TechnicalCaptureKind,
} from "@/lib/collaborator-report-attachments";
import type { IncidentRecord } from "@/lib/incidents";
import { getTeamLeagueColorSet } from "@/lib/team-directory";
import { cn, formatPersonShortName } from "@/lib/utils";

type ReportSortKey =
  | "league"
  | "id"
  | "idBp"
  | "date"
  | "match"
  | "responsible"
  | "paid"
  | "feed"
  | "severity";
type SortDirection = "asc" | "desc";
type ReportPeriodMode = "day" | "week" | "month";
type ReportView = "summary" | "control" | "incidents";
export type ReportsWorkspaceView = ReportView;
type ReportDrawerTab = "details" | "activity";
type IncidentChartMetric = "count" | "rate";
type SummaryInsightDetail = "league" | "severity" | "venue" | "evolution";
type SummaryInsightDisplayMode = "table" | "chart";
type ReportEvidenceState = {
  speedtestAttachment?: ReportAttachment | null;
  pingAttachment?: ReportAttachment | null;
  gpuAttachment?: ReportAttachment | null;
  speedtest?: string;
  ping?: string;
  gpuLoad?: string;
};
type EvidenceUploadState = {
  state: "idle" | "loading" | "error" | "done";
  message: string;
};
type ReportControlColumn =
  | "league"
  | "id"
  | "idBp"
  | "date"
  | "match"
  | "responsible"
  | "paid"
  | "feed"
  | "severity"
  | "action";
type ReportRankingColumn =
  | "responsible"
  | "matches"
  | "with_incident"
  | "incident_rate"
  | "incidents_per_100_matches"
  | "critical"
  | "high"
  | "medium";

const REPORT_CONTROL_COLUMNS_STORAGE_KEY =
  "basket-production.reports.control-columns";
const REPORT_RANKING_COLUMNS_STORAGE_KEY =
  "basket-production.reports.ranking-columns";
const REPORT_SUMMARY_AI_GUIDANCE = [
  "Si el usuario pide un análisis, informe, resumen ejecutivo, diagnóstico o recomendaciones, responde SIEMPRE con esta estructura y en este orden:",
  "1. Resumen ejecutivo.",
  "2. Distribución por gravedad.",
  "3. Incidencias por liga.",
  "4. Evolución del periodo.",
  "5. Rendimiento por responsable.",
  "6. Incidencias por sede.",
  "7. Tabla cruzada liga x gravedad.",
  "8. Conclusiones y recomendaciones.",
  "En cada bloque usa solo cifras del contexto, destaca top 3, porcentajes y hallazgos accionables.",
  "Si falta información, conserva el bloque y aclara 'sin datos visibles'.",
  "Si la pregunta no pide informe completo, responde puntual.",
].join(" ");
const DEFAULT_REPORT_CONTROL_COLUMNS: ReportControlColumn[] = [
  "league",
  "id",
  "idBp",
  "date",
  "match",
  "responsible",
  "paid",
  "feed",
  "severity",
];
const DEFAULT_REPORT_RANKING_COLUMNS: ReportRankingColumn[] = [
  "responsible",
  "matches",
  "with_incident",
  "incident_rate",
  "incidents_per_100_matches",
  "critical",
  "high",
  "medium",
];
const REPORT_CONTROL_COLUMN_SORT_KEY: Partial<
  Record<ReportControlColumn, ReportSortKey>
> = {
  league: "league",
  id: "id",
  idBp: "idBp",
  date: "date",
  match: "match",
  responsible: "responsible",
  paid: "paid",
  feed: "feed",
  severity: "severity",
};
const REPORT_CONTROL_COLUMN_WIDTH_WEIGHT: Record<ReportControlColumn, number> = {
  league: 0.75,
  id: 1.1,
  idBp: 0.75,
  date: 0.85,
  match: 1.6,
  responsible: 1.55,
  paid: 0.35,
  feed: 0.35,
  severity: 1.05,
  action: 0.4,
};
const REPORT_CONTROL_WIDE_COLUMN_WIDTH_WEIGHT: Record<ReportControlColumn, number> = {
  league: 0.9,
  id: 1.05,
  idBp: 0.95,
  date: 0.95,
  match: 1.65,
  responsible: 1.35,
  paid: 0.65,
  feed: 0.65,
  severity: 1.0,
  action: 0.5,
};
const REPORT_CONTROL_COMPACT_COLUMN_WIDTH_WEIGHT: Record<
  ReportControlColumn,
  number
> = {
  league: 0.85,
  id: 1,
  idBp: 1,
  date: 0.9,
  match: 2.8,
  responsible: 1.1,
  paid: 0.4,
  feed: 0.4,
  severity: 1,
  action: 0.45,
};
const REPORT_EXPORT_COLUMNS = [
  {
    label: "ID FEED",
    value: (report: ReportRecord) => report.id_feed,
  },
  {
    label: "ID BP",
    value: (report: ReportRecord) => report.id_bp,
  },
  {
    label: "DÍA",
    value: (report: ReportRecord) => report.event_date,
  },
  {
    label: "HORA",
    value: (report: ReportRecord) => report.event_time,
  },
  {
    label: "PARTIDO",
    value: (report: ReportRecord) => report.match_label,
  },
  {
    label: "PROBLEMA",
    value: (report: ReportRecord) => report.problem,
  },
  {
    label: "GRAVEDAD",
    value: (report: ReportRecord) => report.severity,
  },
  {
    label: "¿FEED DETECTÓ?",
    value: (report: ReportRecord) => (report.feed_detected ? "Sí" : "No"),
  },
  {
    label: "CONTROL",
    value: (report: ReportRecord) => report.responsible_name,
  },
  {
    label: "¿SE PAGÓ?",
    value: (report: ReportRecord) => (report.paid ? "Sí" : "No"),
  },
] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toReportAttachment(
  attachment: CollaboratorReportAttachment & { signedUrl?: string },
): ReportAttachment {
  return {
    fileName: attachment.fileName,
    fileSizeLabel: formatBytes(attachment.sizeBytes),
    previewUrl: attachment.signedUrl,
  };
}

function normalizeReportControlColumns(
  value: unknown,
): ReportControlColumn[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const nextColumns = value.filter((item): item is ReportControlColumn =>
    DEFAULT_REPORT_CONTROL_COLUMNS.includes(item as ReportControlColumn),
  );

  if (
    nextColumns.length !== DEFAULT_REPORT_CONTROL_COLUMNS.length ||
    new Set(nextColumns).size !== DEFAULT_REPORT_CONTROL_COLUMNS.length
  ) {
    return null;
  }

  return nextColumns;
}

function normalizeReportRankingColumns(
  value: unknown,
): ReportRankingColumn[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const nextColumns = value.filter((item): item is ReportRankingColumn =>
    DEFAULT_REPORT_RANKING_COLUMNS.includes(item as ReportRankingColumn),
  );

  if (
    nextColumns.length !== DEFAULT_REPORT_RANKING_COLUMNS.length ||
    new Set(nextColumns).size !== DEFAULT_REPORT_RANKING_COLUMNS.length
  ) {
    return null;
  }

  return nextColumns;
}

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const MONTHS_ABBR_ES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
] as const;

function parseSpanishShortDate(value: string) {
  const match = value.trim().match(/^(\d{1,2})\s+([a-záéíóúñ]+)\s+(\d{4})$/i);

  if (!match) {
    return new Date(value);
  }

  const [, day, monthLabel, year] = match;
  const monthIndex = MONTHS_ES.findIndex(
    (month) => month === monthLabel.toLowerCase(),
  );

  return new Date(Number(year), Math.max(monthIndex, 0), Number(day));
}

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getMonthKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function getWeekIndexInMonth(date: Date) {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

function getWeekKey(date: Date) {
  return `${getMonthKey(date)}-w${getWeekIndexInMonth(date)}`;
}

function getWeekLabelFromDate(date: Date) {
  return `SEM ${getWeekIndexInMonth(date)} ${MONTHS_ABBR_ES[date.getMonth()]} ${String(
    date.getFullYear(),
  ).slice(-2)}`;
}

function getShortDayLabel(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS_ABBR_ES[date.getMonth()]} ${String(
    date.getFullYear(),
  ).slice(-2)}`;
}

function getPeriodBucketInfo(
  periodMode: ReportPeriodMode,
  reportDate: Date,
  eventTime: string,
) {
  if (periodMode === "day") {
    const hour = Number(eventTime.split(":")[0] ?? "0");

    return {
      key: `h-${String(hour).padStart(2, "0")}`,
      label: `${String(hour).padStart(2, "0")}:00`,
      sort: hour,
    };
  }

  if (periodMode === "week") {
    return {
      key: getDateKey(reportDate),
      label: `${String(reportDate.getDate()).padStart(2, "0")} ${MONTHS_ABBR_ES[reportDate.getMonth()]}`,
      sort: reportDate.getTime(),
    };
  }

  const weekIndex = getWeekIndexInMonth(reportDate);

  return {
    key: `${getMonthKey(reportDate)}-w${weekIndex}`,
    label: `SEM ${weekIndex}`,
    sort: weekIndex,
  };
}

function getReportLeagueCanvasTone(league: string) {
  const normalizedLeague = league.toLowerCase();

  if (normalizedLeague.includes("liga nacional")) {
    return "#fff5f7";
  }

  if (normalizedLeague.includes("liga federal")) {
    return "#fff7ef";
  }

  if (normalizedLeague.includes("liga próximo") || normalizedLeague.includes("liga proximo")) {
    return "#f5fbf6";
  }

  if (normalizedLeague.includes("liga endesa") || normalizedLeague.includes("acb")) {
    return "#fff6ef";
  }

  if (normalizedLeague.includes("euroleague")) {
    return "#f8f5ff";
  }

  if (normalizedLeague.includes("chery")) {
    return "#fff9ee";
  }

  if (normalizedLeague.includes("liga argentina")) {
    return "#f4f8ff";
  }

  return "#fafafa";
}

function getReportLeagueAccentColor(league: string) {
  const normalizedLeague = league.toLowerCase();

  if (normalizedLeague.includes("liga nacional")) {
    return "#e61238";
  }

  if (normalizedLeague.includes("liga federal")) {
    return "#e67b18";
  }

  if (
    normalizedLeague.includes("liga próximo") ||
    normalizedLeague.includes("liga proximo")
  ) {
    return "#22a35a";
  }

  if (normalizedLeague.includes("liga endesa") || normalizedLeague.includes("acb")) {
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

  return "#64748b";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeFileSegment(value: string) {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-zA-Z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .toLowerCase();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => `${value}${value}`)
          .join("")
      : normalized;

  const value = Number.parseInt(safeHex, 16);

  if (Number.isNaN(value)) {
    return { red: 100, green: 116, blue: 139 };
  }

  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
  };
}

function groupReportsByLeague(reports: ReportRecord[]) {
  const groups = new Map<string, ReportRecord[]>();

  reports.forEach((report) => {
    const currentGroup = groups.get(report.league) ?? [];
    currentGroup.push(report);
    groups.set(report.league, currentGroup);
  });

  return Array.from(groups.entries()).map(([league, items]) => ({
    league,
    items,
  }));
}

function buildReportsExcelDocument(
  reportGroups: ReturnType<typeof groupReportsByLeague>,
  periodLabel: string,
) {
  const headerRow = REPORT_EXPORT_COLUMNS.map(
    (column) =>
      `<th style="border:1px solid #dbe4f0;background:#0f172a;color:#ffffff;padding:10px 12px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">${escapeHtml(
        column.label,
      )}</th>`,
  ).join("");

  const sections = reportGroups
    .map(({ league, items }) => {
      const accent = getReportLeagueAccentColor(league);
      const rows = items
        .map((report, rowIndex) => {
          const background = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
          const cells = REPORT_EXPORT_COLUMNS.map((column) => {
            const value = escapeHtml(column.value(report));
            const forceText =
              column.label === "ID FEED" || column.label === "ID BP"
                ? "mso-number-format:'\\@';"
                : "";

            return `<td style="border:1px solid #dbe4f0;background:${background};padding:9px 12px;font-size:12px;color:#0f172a;vertical-align:top;${forceText}">${value}</td>`;
          }).join("");

          return `<tr>${cells}</tr>`;
        })
        .join("");

      return `
        <table style="width:100%;border-collapse:collapse;margin:0 0 20px 0;font-family:Arial,sans-serif;">
          <tr>
            <td colspan="${REPORT_EXPORT_COLUMNS.length}" style="border:1px solid ${accent};background:${accent};color:#ffffff;padding:12px 14px;font-size:14px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">
              ${escapeHtml(league)}
            </td>
          </tr>
          <tr>${headerRow}</tr>
          ${rows}
        </table>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
  <head>
    <meta charset="utf-8" />
    <meta name="ProgId" content="Excel.Sheet" />
    <title>Control de reportes</title>
  </head>
  <body style="margin:16px;background:#f8fafc;font-family:Arial,sans-serif;">
    <div style="margin-bottom:16px;">
      <div style="font-size:18px;font-weight:800;color:#0f172a;">Control de reportes</div>
      <div style="font-size:12px;color:#64748b;">Periodo exportado: ${escapeHtml(periodLabel)}</div>
    </div>
    ${sections}
  </body>
</html>`;
}

function buildChartLinePath(
  values: number[],
  width: number,
  height: number,
  maxValue: number,
) {
  if (!values.length) {
    return "";
  }

  const safeMax = Math.max(maxValue, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : index * stepX;
      const normalized = height - (value / safeMax) * height;
      const y = Number.isFinite(normalized) ? normalized : height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function getSeverityOrder(severity: ReportSeverity) {
  switch (severity) {
    case "Crítica":
      return 4;
    case "Alta":
      return 3;
    case "Media":
      return 2;
    case "Baja":
      return 1;
    default:
      return 0;
  }
}

function getHomeTeamFromMatchLabel(matchLabel: string) {
  const [homeTeam] = matchLabel.split(/\s+vs\s+/i);
  return homeTeam?.trim() || matchLabel;
}

function splitMatchLabel(matchLabel: string) {
  const [homeTeam, awayTeam] = matchLabel.split(/\s+vs\s+/i);

  return {
    homeTeam: homeTeam?.trim() || matchLabel,
    awayTeam: awayTeam?.trim() || matchLabel,
  };
}

function formatCompactReportDate(value: string) {
  const date = parseSpanishShortDate(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS_ABBR_ES[date.getMonth()] ?? "";

  return `${day} ${month}`;
}

function formatSummaryPercentage(value: number, total: number) {
  const percentage = total ? Math.round((value / total) * 1000) / 10 : 0;

  return Number.isInteger(percentage)
    ? `${percentage}%`
    : `${percentage.toFixed(1)}%`;
}

function getPerformanceMetricTone(value: number) {
  if (value >= 50) {
    return {
      badge: "bg-[#fff1f1] text-[#c73737]",
      text: "text-[#c73737]",
    };
  }

  if (value >= 35) {
    return {
      badge: "bg-[#fff5e9] text-[#9b5d00]",
      text: "text-[#9b5d00]",
    };
  }

  if (value >= 30) {
    return {
      badge: "bg-[#edf5ff] text-[#1d64d8]",
      text: "text-[#1d64d8]",
    };
  }

  return {
    badge: "bg-[#eef9ef] text-[#3e7b2f]",
    text: "text-[#3e7b2f]",
  };
}

function getReportRowTone(severity: ReportSeverity) {
  switch (severity) {
    case "Crítica":
      return {
        active: "bg-[#fbf5ff] shadow-[inset_4px_0_0_0_#a12ad6]",
        hover: "hover:bg-[#fdf9ff]",
      };
    case "Alta":
      return {
        active: "bg-[#fff4f6] shadow-[inset_4px_0_0_0_#e63b5b]",
        hover: "hover:bg-[#fff9fa]",
      };
    case "Media":
      return {
        active: "bg-[#fffcef] shadow-[inset_4px_0_0_0_#e8c24a]",
        hover: "hover:bg-[#fffef8]",
      };
    case "Baja":
      return {
        active: "bg-[#fffdf7] shadow-[inset_4px_0_0_0_#e8c76a]",
        hover: "hover:bg-[#fffefa]",
      };
    default:
      return {
        active: "bg-[#eefaf3] shadow-[inset_4px_0_0_0_#10b981]",
        hover: "hover:bg-[#f6fcf8]",
      };
  }
}

function getSeverityDistributionMeta(severity: ReportSeverity) {
  switch (severity) {
    case "Crítica":
      return {
        barClassName: "bg-[#a12ad6]",
        icon: ShieldAlert,
        iconClassName: "text-[#a12ad6]",
      };
    case "Alta":
      return {
        barClassName: "bg-[#e44b68]",
        icon: AlertTriangle,
        iconClassName: "text-[#e44b68]",
      };
    case "Media":
      return {
        barClassName: "bg-[#e7c247]",
        icon: Gauge,
        iconClassName: "text-[#b78611]",
      };
    case "Baja":
      return {
        barClassName: "bg-[#d8e2ef]",
        icon: Circle,
        iconClassName: "text-[#94a3b8]",
      };
    default:
      return {
        barClassName: "bg-[#10b981]",
        icon: CircleCheckBig,
        iconClassName: "text-[#10b981]",
      };
  }
}

function getSeverityColor(severity: ReportSeverity) {
  switch (severity) {
    case "Crítica":
      return "#a12ad6";
    case "Alta":
      return "#e44b68";
    case "Media":
      return "#e7c247";
    case "Baja":
      return "#d8e2ef";
    default:
      return "#10b981";
  }
}

function getLeagueLegendLabel(league: string) {
  const trimmedLeague = league.trim();

  if (!trimmedLeague) {
    return league;
  }

  if (/^[A-Z0-9]{2,4}$/.test(trimmedLeague)) {
    return trimmedLeague;
  }

  const tokens = trimmedLeague
    .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  if (tokens.length >= 2) {
    return tokens
      .map((token) => token[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 3);
  }

  return tokens[0]?.slice(0, 2).toUpperCase() ?? trimmedLeague;
}

function SortHeader({
  label,
  title,
  active,
  direction,
  onClick,
  align = "left",
}: {
  label: string;
  title?: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  align?: "left" | "center" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      className={cn(
        "inline-flex items-center gap-1.5 uppercase transition hover:text-[#617187]",
        align === "center" && "mx-auto",
        align === "right" && "ml-auto",
      )}
    >
      <span>{label}</span>
      {active ? (
        direction === "asc" ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 opacity-60" />
      )}
    </button>
  );
}

function getReportActivityTone(tone: ReportActivity["tone"]) {
  switch (tone) {
    case "accent":
      return {
        dot: "bg-[var(--accent)] ring-[rgba(230,18,56,0.16)]",
        badge: "bg-[#fff3f6] text-[var(--accent)]",
      };
    case "warning":
      return {
        dot: "bg-[#f59e0b] ring-[rgba(245,158,11,0.16)]",
        badge: "bg-[#fff7ed] text-[#d97706]",
      };
    case "success":
      return {
        dot: "bg-[#16a34a] ring-[rgba(22,163,74,0.16)]",
        badge: "bg-[#f0fdf4] text-[#15803d]",
      };
    default:
      return {
        dot: "bg-[#cfd6df] ring-[rgba(148,163,184,0.16)]",
        badge: "bg-[#f4f7fb] text-[#617187]",
      };
  }
}

function getInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");

  return parts.join("") || "BP";
}

function openReportAttachmentPreview(url: string | undefined) {
  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function MetricCard({
  title,
  value,
  chip,
  chipTone = "neutral",
  barClassName,
  barWidth,
  highlight = false,
}: {
  title: string;
  value: number;
  chip: string;
  chipTone?: "neutral" | "accent" | "success" | "warning";
  barClassName: string;
  barWidth: number;
  highlight?: boolean;
}) {
  const chipClassName =
    chipTone === "accent"
      ? "bg-[#ffe3ea] text-[var(--accent)]"
      : chipTone === "success"
        ? "bg-[#eaf9f0] text-[#11915a]"
        : chipTone === "warning"
          ? "bg-[#fff5e7] text-[#c97a13]"
          : "bg-[#f4f7fb] text-[#617187]";

  return (
    <article
      className={cn(
        "panel-surface !h-[120px] !min-h-[120px] flex min-w-0 flex-col overflow-hidden border p-4",
        highlight
          ? "border-[#f2c7d0] bg-[var(--surface)]"
          : "border-[var(--border)] bg-[var(--surface)]",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p
          className={cn(
            "min-w-0 pt-1 text-[11px] font-black uppercase tracking-[0.18em]",
            highlight ? "text-[var(--accent)]" : "text-[#70819b]",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "shrink-0 text-4xl font-black leading-none tracking-[-0.04em]",
            highlight ? "text-[var(--accent)]" : "text-[var(--foreground)]",
          )}
        >
          {value}
        </p>
      </div>
      <div className="mt-auto flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "inline-flex min-w-0 shrink-0 items-center rounded-xl px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
            chipClassName,
          )}
        >
          {chip}
        </span>
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e7edf5]">
          <div
            className={cn("h-full rounded-full", barClassName)}
            style={{ width: `${Math.max(8, Math.min(barWidth, 100))}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function getEstimatedCycleMinutes(report: ReportRecord) {
  let minutes = 54;

  switch (report.severity) {
    case "Crítica":
      minutes += 94;
      break;
    case "Alta":
      minutes += 66;
      break;
    case "Media":
      minutes += 38;
      break;
    case "Baja":
      minutes += 18;
      break;
    default:
      minutes += 6;
      break;
  }

  if (!report.feed_detected) {
    minutes += 18;
  }

  if (!report.paid) {
    minutes += 24;
  }

  return minutes;
}

export function ReportsWorkspace({
  reports,
  activities,
  incidents,
  hasGeminiKey,
  initialView = "summary",
  canManageEvidence = false,
}: {
  reports: ReportRecord[];
  activities: ReportActivity[];
  incidents: IncidentRecord[];
  hasGeminiKey: boolean;
  initialView?: ReportView;
  canManageEvidence?: boolean;
}) {
  const router = useRouter();
  const desktopEvidenceInputRef = useRef<HTMLInputElement | null>(null);
  const [isRefreshingEvidence, startRefreshingEvidence] = useTransition();
  const [activeView, setActiveView] = useState<ReportView>(initialView);
  const [incidentsHeaderActionsPortalTarget, setIncidentsHeaderActionsPortalTarget] =
    useState<HTMLDivElement | null>(null);
  const [incidentsDrawerPortalTarget, setIncidentsDrawerPortalTarget] =
    useState<HTMLDivElement | null>(null);
  const [selectedEmbeddedIncidentId, setSelectedEmbeddedIncidentId] =
    useState<string | null>(null);
  const [reportEvidenceById, setReportEvidenceById] = useState<
    Record<string, ReportEvidenceState>
  >({});
  const [desktopUploadTarget, setDesktopUploadTarget] = useState<{
    reportId: string;
    kind: TechnicalCaptureKind;
  } | null>(null);
  const [uploadStateByReport, setUploadStateByReport] = useState<
    Record<string, Partial<Record<TechnicalCaptureKind, EvidenceUploadState>>>
  >({});
  const [query, setQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("Todas las ligas");
  const latestReportDate = useMemo(() => {
    return reports.reduce((latest, report) => {
      const reportDate = parseSpanishShortDate(report.event_date);
      return reportDate > latest ? reportDate : latest;
    }, parseSpanishShortDate(reports[0]?.event_date ?? "1 enero 2026"));
  }, [reports]);
  const [periodMode, setPeriodMode] = useState<ReportPeriodMode>("month");
  const [selectedDayKey, setSelectedDayKey] = useState(() =>
    getDateKey(latestReportDate),
  );
  const [selectedWeekKey, setSelectedWeekKey] = useState(() =>
    getWeekKey(latestReportDate),
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState(() =>
    getMonthKey(latestReportDate),
  );
  const [incidentChartMetric, setIncidentChartMetric] =
    useState<IncidentChartMetric>("count");
  const [chartTimeOffset, setChartTimeOffset] = useState(0);
  const [selectedChartLeague, setSelectedChartLeague] = useState<string | null>(null);
  const incidentChartLimit = 5;
  const [selectedSummaryInsight, setSelectedSummaryInsight] =
    useState<SummaryInsightDetail>("evolution");
  const [summaryInsightDisplayMode, setSummaryInsightDisplayMode] = useState<
    Record<Exclude<SummaryInsightDetail, "evolution">, SummaryInsightDisplayMode>
  >({
    league: "table",
    severity: "table",
    venue: "table",
  });
  const [sortBy, setSortBy] = useState<ReportSortKey>("severity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [rankingSortBy, setRankingSortBy] =
    useState<ReportRankingColumn>("incident_rate");
  const [rankingSortDirection, setRankingSortDirection] =
    useState<SortDirection>("asc");
  const [columnOrder, setColumnOrder] = useState<ReportControlColumn[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_REPORT_CONTROL_COLUMNS;
    }

    try {
      const normalizedColumns = normalizeReportControlColumns(
        JSON.parse(
          window.localStorage.getItem(REPORT_CONTROL_COLUMNS_STORAGE_KEY) ??
            "null",
        ),
      );

      return normalizedColumns ?? DEFAULT_REPORT_CONTROL_COLUMNS;
    } catch {
      window.localStorage.removeItem(REPORT_CONTROL_COLUMNS_STORAGE_KEY);
      return DEFAULT_REPORT_CONTROL_COLUMNS;
    }
  });
  const [draggedColumn, setDraggedColumn] = useState<ReportControlColumn | null>(
    null,
  );
  const [dragOverColumn, setDragOverColumn] = useState<ReportControlColumn | null>(
    null,
  );
  const [rankingColumnOrder, setRankingColumnOrder] = useState<
    ReportRankingColumn[]
  >(() => {
    if (typeof window === "undefined") {
      return DEFAULT_REPORT_RANKING_COLUMNS;
    }

    try {
      const parsedColumns = normalizeReportRankingColumns(
        JSON.parse(
          window.localStorage.getItem(REPORT_RANKING_COLUMNS_STORAGE_KEY) ??
            "null",
        ),
      );

      return parsedColumns ?? DEFAULT_REPORT_RANKING_COLUMNS;
    } catch {
      window.localStorage.removeItem(REPORT_RANKING_COLUMNS_STORAGE_KEY);
      return DEFAULT_REPORT_RANKING_COLUMNS;
    }
  });
  const [draggedRankingColumn, setDraggedRankingColumn] =
    useState<ReportRankingColumn | null>(null);
  const [dragOverRankingColumn, setDragOverRankingColumn] =
    useState<ReportRankingColumn | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [reportDrawerTab, setReportDrawerTab] =
    useState<ReportDrawerTab>("details");
  const [isExporting, setIsExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState<"summary" | "incidents" | null>(null);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const [showAllLeagueDistribution, setShowAllLeagueDistribution] = useState(false);
  const [showAllSeverityDistribution, setShowAllSeverityDistribution] =
    useState(false);
  const [showAllVenueRecurrence, setShowAllVenueRecurrence] = useState(false);
  const summarySidebarRef = useRef<HTMLElement | null>(null);
  const [summarySidebarHeight, setSummarySidebarHeight] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (activeView !== "incidents") {
      setSelectedEmbeddedIncidentId(null);
    }
  }, [activeView]);

  useEffect(() => {
    if (!selectedReportId && !selectedEmbeddedIncidentId) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setSelectedReportId(null);
      setEditingReportId(null);
      setReportDrawerTab("details");
      setSelectedEmbeddedIncidentId(null);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedEmbeddedIncidentId, selectedReportId]);

  useEffect(() => {
    const sidebar = summarySidebarRef.current;

    if (!sidebar || typeof window === "undefined") {
      return;
    }

    let frameId = 0;
    const updateSidebarHeight = () => {
      if (window.innerWidth < 1280) {
        setSummarySidebarHeight(null);
        return;
      }

      setSummarySidebarHeight(sidebar.getBoundingClientRect().height);
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateSidebarHeight);
    };

    scheduleUpdate();

    const observer = new ResizeObserver(() => {
      scheduleUpdate();
    });

    observer.observe(sidebar);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [activeView]);

  function handleSort(nextSortBy: ReportSortKey) {
    if (sortBy === nextSortBy) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection(nextSortBy === "severity" ? "desc" : "asc");
  }

  function handleRankingSort(nextSortBy: ReportRankingColumn) {
    if (rankingSortBy === nextSortBy) {
      setRankingSortDirection((current) =>
        current === "asc" ? "desc" : "asc",
      );
      return;
    }

    setRankingSortBy(nextSortBy);
    setRankingSortDirection(
      nextSortBy === "responsible" ||
        nextSortBy === "incident_rate" ||
        nextSortBy === "incidents_per_100_matches"
        ? "asc"
        : "desc",
    );
  }

  function toggleSummaryInsight(
    nextInsight: Exclude<SummaryInsightDetail, "evolution">,
  ) {
    setSelectedSummaryInsight((current) =>
      current === nextInsight ? "evolution" : nextInsight,
    );
  }

  function toggleSummaryInsightDisplayMode(
    nextInsight: Exclude<SummaryInsightDetail, "evolution">,
  ) {
    setSummaryInsightDisplayMode((current) => ({
      ...current,
      [nextInsight]: current[nextInsight] === "table" ? "chart" : "table",
    }));
  }

  function handleColumnDragStart(column: ReportControlColumn) {
    setDraggedColumn(column);
  }

  function handleColumnDragOver(
    event: DragEvent<HTMLTableCellElement>,
    column: ReportControlColumn,
  ) {
    event.preventDefault();

    if (draggedColumn && draggedColumn !== column) {
      setDragOverColumn(column);
    }
  }

  function handleColumnDrop(column: ReportControlColumn) {
    if (!draggedColumn || draggedColumn === column) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    setColumnOrder((current) => {
      const next = [...current];
      const draggedIndex = next.indexOf(draggedColumn);
      const targetIndex = next.indexOf(column);

      if (draggedIndex === -1 || targetIndex === -1) {
        return current;
      }

      next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, draggedColumn);
      return next;
    });

    setDraggedColumn(null);
    setDragOverColumn(null);
  }

  function handleColumnDragEnd() {
    setDraggedColumn(null);
    setDragOverColumn(null);
  }

  function handleRankingColumnDragStart(column: ReportRankingColumn) {
    setDraggedRankingColumn(column);
    setDragOverRankingColumn(column);
  }

  function handleRankingColumnDragOver(column: ReportRankingColumn) {
    if (draggedRankingColumn && draggedRankingColumn !== column) {
      setDragOverRankingColumn(column);
    }
  }

  function handleRankingColumnDrop(column: ReportRankingColumn) {
    if (!draggedRankingColumn || draggedRankingColumn === column) {
      setDraggedRankingColumn(null);
      setDragOverRankingColumn(null);
      return;
    }

    setRankingColumnOrder((current) => {
      const next = [...current];
      const draggedIndex = next.indexOf(draggedRankingColumn);
      const targetIndex = next.indexOf(column);

      if (draggedIndex === -1 || targetIndex === -1) {
        return current;
      }

      next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, draggedRankingColumn);
      return next;
    });

    setDraggedRankingColumn(null);
    setDragOverRankingColumn(null);
  }

  function handleRankingColumnDragEnd() {
    setDraggedRankingColumn(null);
    setDragOverRankingColumn(null);
  }

  useEffect(() => {
    if (columnOrder.includes("action")) {
      setColumnOrder(columnOrder.filter((column) => column !== "action"));
    }
  }, [columnOrder]);

  useEffect(() => {
    window.localStorage.setItem(
      REPORT_CONTROL_COLUMNS_STORAGE_KEY,
      JSON.stringify(columnOrder),
    );
  }, [columnOrder]);

  useEffect(() => {
    setEditingReportId(null);
  }, [selectedReportId]);

  useEffect(() => {
    window.localStorage.setItem(
      REPORT_RANKING_COLUMNS_STORAGE_KEY,
      JSON.stringify(rankingColumnOrder),
    );
  }, [rankingColumnOrder]);

  const leagueOptions = useMemo(() => {
    return ["Todas las ligas", ...new Set(reports.map((report) => report.league))];
  }, [reports]);

  const dayOptions = useMemo(() => {
    const options = new Map<string, string>();

    reports.forEach((report) => {
      const date = parseSpanishShortDate(report.event_date);
      options.set(getDateKey(date), getShortDayLabel(date));
    });

    return Array.from(options.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => right.value.localeCompare(left.value));
  }, [reports]);

  const weekOptions = useMemo(() => {
    const options = new Map<string, { label: string; sortValue: number }>();

    reports.forEach((report) => {
      const date = parseSpanishShortDate(report.event_date);
      options.set(getWeekKey(date), {
        label: getWeekLabelFromDate(date),
        sortValue: date.getTime(),
      });
    });

    return Array.from(options.entries())
      .map(([value, meta]) => ({ value, label: meta.label, sortValue: meta.sortValue }))
      .sort((left, right) => right.sortValue - left.sortValue);
  }, [reports]);

  const monthOptions = useMemo(() => {
    const year = latestReportDate.getFullYear();

    return MONTHS_ES.map((_, monthIndex) => ({
      value: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
      label: `${MONTHS_ABBR_ES[monthIndex]} ${String(year).slice(-2)}`,
    }));
  }, [latestReportDate]);

  const baseFilteredReports = useMemo(() => {
    return reports.filter((report) => {
      const reportDate = parseSpanishShortDate(report.event_date);

      if (leagueFilter !== "Todas las ligas" && report.league !== leagueFilter) {
        return false;
      }

      if (periodMode === "day" && getDateKey(reportDate) !== selectedDayKey) {
        return false;
      }

      if (periodMode === "week" && getWeekKey(reportDate) !== selectedWeekKey) {
        return false;
      }

      if (periodMode === "month" && getMonthKey(reportDate) !== selectedMonthKey) {
        return false;
      }

      return true;
    });
  }, [leagueFilter, periodMode, reports, selectedDayKey, selectedMonthKey, selectedWeekKey]);

  const queryFilteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return baseFilteredReports;
    }

    return baseFilteredReports.filter((report) =>
      [
        report.id_feed,
        report.id_bp,
        report.match_label,
        report.competition,
        report.league,
        report.responsible_name,
        report.problem,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [baseFilteredReports, query]);

  const summaryMetrics = useMemo(() => {
    const totalReports = baseFilteredReports.length;
    const completedReports = baseFilteredReports.filter(
      (report) => report.paid && report.feed_detected,
    ).length;
    const pendingReports = totalReports - completedReports;
    const withIncident = baseFilteredReports.filter(
      (report) => report.severity !== "Sin incidencia",
    ).length;
    const criticalAndHighCount = baseFilteredReports.filter(
      (report) => report.severity === "Crítica" || report.severity === "Alta",
    ).length;
    const unpaidCount = baseFilteredReports.filter((report) => !report.paid).length;
    const noIncidentCount = baseFilteredReports.filter(
      (report) => report.severity === "Sin incidencia",
    ).length;
    const feedDetectedCount = baseFilteredReports.filter(
      (report) => report.feed_detected,
    ).length;
    const paidCount = baseFilteredReports.filter((report) => report.paid).length;
    const manualCount = totalReports - feedDetectedCount;
    const averageCycle = totalReports
      ? Math.round(
          baseFilteredReports.reduce(
            (total, report) => total + getEstimatedCycleMinutes(report),
            0,
          ) / totalReports,
        )
      : 0;

    return {
      totalReports,
      completedReports,
      pendingReports,
      withIncident,
      criticalAndHighCount,
      unpaidCount,
      feedDetectedCount,
      paidCount,
      incidentPercent: totalReports
        ? Math.round((withIncident / totalReports) * 1000) / 10
        : 0,
      noIncidentPercent: totalReports
        ? Math.round((noIncidentCount / totalReports) * 1000) / 10
        : 0,
      criticalAndHighPercent: totalReports
        ? Math.round((criticalAndHighCount / totalReports) * 1000) / 10
        : 0,
      feedPercent: totalReports
        ? Math.round((feedDetectedCount / totalReports) * 1000) / 10
        : 0,
      paidPercent: totalReports
        ? Math.round((paidCount / totalReports) * 1000) / 10
        : 0,
      manualPercent: totalReports
        ? Math.round((manualCount / totalReports) * 1000) / 10
        : 0,
      averageCycle,
      activeLeagues: new Set(baseFilteredReports.map((report) => report.league)).size,
    };
  }, [baseFilteredReports]);

  const controlMetrics = useMemo(() => {
    const totalMatches = queryFilteredReports.length;
    const noIncident = queryFilteredReports.filter(
      (report) => report.severity === "Sin incidencia",
    ).length;
    const withIncident = queryFilteredReports.filter(
      (report) => report.severity !== "Sin incidencia",
    ).length;
    const criticalClosures = queryFilteredReports.filter((report) =>
      ["Crítica", "Alta"].includes(report.severity),
    ).length;

    return {
      totalMatches,
      noIncident,
      withIncident,
      criticalClosures,
      leagueCount: new Set(queryFilteredReports.map((report) => report.league)).size,
      noIncidentPercent: totalMatches
        ? Math.round((noIncident / totalMatches) * 100)
        : 0,
      withIncidentPercent: totalMatches
        ? Math.round((withIncident / totalMatches) * 100)
        : 0,
      criticalPercent: totalMatches
        ? Math.round((criticalClosures / totalMatches) * 100)
        : 0,
    };
  }, [queryFilteredReports]);

  const activePeriodValue =
    periodMode === "day"
      ? selectedDayKey
      : periodMode === "week"
        ? selectedWeekKey
        : selectedMonthKey;

  const activePeriodOptions =
    periodMode === "day"
      ? dayOptions
      : periodMode === "week"
        ? weekOptions.map(({ value, label }) => ({ value, label }))
        : monthOptions;
  const activePeriodLabel =
    activePeriodOptions.find((option) => option.value === activePeriodValue)?.label ??
    activePeriodValue;

  const visibleReportsAiContext = useMemo(
    () =>
      queryFilteredReports.map((report) => ({
        id_feed: report.id_feed,
        id_bp: report.id_bp,
        partido: report.match_label,
        competencia: report.competition,
        liga: report.league,
        responsable: report.responsible_name,
        gravedad: report.severity,
        pago: report.paid ? "Sí" : "No",
        feed_detecto: report.feed_detected ? "Sí" : "No",
        problema: report.problem,
        actualizado: report.updated_at,
      })),
    [queryFilteredReports],
  );

  const incidentLeagueChart = useMemo(() => {
    const buckets = new Map<
      string,
      {
        label: string;
        sort: number;
        leagues: Map<string, { incidents: number; total: number }>;
      }
    >();

    baseFilteredReports.forEach((report) => {
      const bucketInfo = getPeriodBucketInfo(
        periodMode,
        parseSpanishShortDate(report.event_date),
        report.event_time,
      );
      const bucket = buckets.get(bucketInfo.key) ?? {
        label: bucketInfo.label,
        sort: bucketInfo.sort,
        leagues: new Map<string, { incidents: number; total: number }>(),
      };

      const currentLeague = bucket.leagues.get(report.league) ?? {
        incidents: 0,
        total: 0,
      };

      currentLeague.total += 1;
      if (report.severity !== "Sin incidencia") {
        currentLeague.incidents += 1;
      }

      bucket.leagues.set(report.league, currentLeague);
      buckets.set(bucketInfo.key, bucket);
    });

    const orderedBuckets = Array.from(buckets.values()).sort(
      (left, right) => left.sort - right.sort,
    );

    const leagueTotals = new Map<string, number>();
    orderedBuckets.forEach((bucket) => {
      bucket.leagues.forEach((value, league) => {
        leagueTotals.set(league, (leagueTotals.get(league) ?? 0) + value.incidents);
      });
    });

    const orderedLeagues = Array.from(leagueTotals.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, incidentChartLimit)
      .map(([league]) => league);

    const series = orderedLeagues.map((league, index) => {
      const points = orderedBuckets.map((bucket) => {
        const leagueValues = bucket.leagues.get(league) ?? { incidents: 0, total: 0 };
        const value =
          incidentChartMetric === "rate"
            ? leagueValues.total
              ? Math.round((leagueValues.incidents / leagueValues.total) * 1000) / 10
              : 0
            : leagueValues.incidents;

        return {
          label: bucket.label,
          value,
        };
      });

      return {
        league,
        totalIncidents: leagueTotals.get(league) ?? 0,
        points,
        color: getReportLeagueAccentColor(league),
        strokeWidth: index === 0 ? 3.5 : index < 3 ? 3 : 2.5,
      };
    });

    const maxValue =
      incidentChartMetric === "rate"
        ? 100
        : Math.max(
            1,
            ...series.flatMap((item) => item.points.map((point) => point.value)),
          );

    return {
      labels: orderedBuckets.map((bucket) => bucket.label),
      series,
      maxValue,
    };
  }, [baseFilteredReports, incidentChartLimit, incidentChartMetric, periodMode]);

  const incidentLeagueChartView = incidentLeagueChart;

  const periodEvolutionRows = useMemo(() => {
    const aggregate = new Map<
      string,
      {
        label: string;
        sort: number;
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
        noIncident: number;
      }
    >();

    baseFilteredReports.forEach((report) => {
      const bucketInfo = getPeriodBucketInfo(
        periodMode,
        parseSpanishShortDate(report.event_date),
        report.event_time,
      );
      const current = aggregate.get(bucketInfo.key) ?? {
        label: bucketInfo.label,
        sort: bucketInfo.sort,
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        noIncident: 0,
      };

      current.total += 1;

      if (report.severity === "Crítica") {
        current.critical += 1;
      } else if (report.severity === "Alta") {
        current.high += 1;
      } else if (report.severity === "Media") {
        current.medium += 1;
      } else if (report.severity === "Baja") {
        current.low += 1;
      } else {
        current.noIncident += 1;
      }

      aggregate.set(bucketInfo.key, current);
    });

    return Array.from(aggregate.values()).sort((left, right) => left.sort - right.sort);
  }, [baseFilteredReports, periodMode]);

  const incidentChartFrame = {
    width: 960,
    height: 628,
    marginTop: 12,
    marginRight: 0,
    marginBottom: 52,
    marginLeft: 0,
  } as const;
  const incidentChartMax = Math.max(5, Math.ceil(incidentLeagueChartView.maxValue));
  const incidentChartPlotWidth =
    incidentChartFrame.width -
    incidentChartFrame.marginLeft -
    incidentChartFrame.marginRight;
  const incidentChartPlotHeight =
    incidentChartFrame.height -
    incidentChartFrame.marginTop -
    incidentChartFrame.marginBottom;

  const leagueDistribution = useMemo(() => {
    const leagueMap = new Map<string, number>();

    baseFilteredReports.forEach((report) => {
      leagueMap.set(report.league, (leagueMap.get(report.league) ?? 0) + 1);
    });

    return Array.from(leagueMap.entries())
      .map(([league, count]) => ({ league, count }))
      .sort((left, right) => right.count - left.count);
  }, [baseFilteredReports]);

  const leagueIncidentDetailRows = useMemo(() => {
    const totalReports = Math.max(baseFilteredReports.length, 1);
    const aggregate = new Map<
      string,
      {
        league: string;
        total: number;
        incidents: number;
      }
    >();

    baseFilteredReports.forEach((report) => {
      const current = aggregate.get(report.league) ?? {
        league: report.league,
        total: 0,
        incidents: 0,
      };

      current.total += 1;
      if (report.severity !== "Sin incidencia") {
        current.incidents += 1;
      }

      aggregate.set(report.league, current);
    });

    return Array.from(aggregate.values())
      .sort((left, right) => right.total - left.total)
      .map((item) => ({
        ...item,
        incidentPercent: item.total ? Math.round((item.incidents / item.total) * 1000) / 10 : 0,
        sharePercent: Math.round((item.total / totalReports) * 1000) / 10,
      }));
  }, [baseFilteredReports]);

  const severityDistribution = useMemo(() => {
    const total = Math.max(baseFilteredReports.length, 1);
    const distribution: ReportSeverity[] = [
      "Crítica",
      "Alta",
      "Media",
      "Baja",
      "Sin incidencia",
    ];

    return distribution.map((severity) => {
      const count = baseFilteredReports.filter(
        (report) => report.severity === severity,
      ).length;

      return {
        severity,
        count,
        percentage: Math.round((count / total) * 100),
      };
    });
  }, [baseFilteredReports]);

  const severityCrossTableRows = useMemo(() => {
    const aggregate = new Map<
      string,
      {
        league: string;
        critical: number;
        high: number;
        medium: number;
        low: number;
        noIncident: number;
        total: number;
      }
    >();

    baseFilteredReports.forEach((report) => {
      const current = aggregate.get(report.league) ?? {
        league: report.league,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        noIncident: 0,
        total: 0,
      };

      current.total += 1;

      if (report.severity === "Crítica") {
        current.critical += 1;
      } else if (report.severity === "Alta") {
        current.high += 1;
      } else if (report.severity === "Media") {
        current.medium += 1;
      } else if (report.severity === "Baja") {
        current.low += 1;
      } else {
        current.noIncident += 1;
      }

      aggregate.set(report.league, current);
    });

    return Array.from(aggregate.values()).sort((left, right) => right.total - left.total);
  }, [baseFilteredReports]);

  const leagueSeverityTotalRow = useMemo(
    () =>
      severityCrossTableRows.reduce(
        (totals, row) => ({
          critical: totals.critical + row.critical,
          high: totals.high + row.high,
          medium: totals.medium + row.medium,
          low: totals.low + row.low,
          noIncident: totals.noIncident + row.noIncident,
          total: totals.total + row.total,
        }),
        {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          noIncident: 0,
          total: 0,
        },
      ),
    [severityCrossTableRows],
  );

  const leagueDetailRows = severityCrossTableRows;
  const leagueDetailTotalRow = leagueSeverityTotalRow;

  const venueRecurrence = useMemo(() => {
    const severityKeys: ReportSeverity[] = ["Crítica", "Alta", "Media", "Baja"];
    const aggregate = new Map<
      string,
      {
        venue: string;
        teamName: string;
        competition: string;
        total: number;
        severities: Record<ReportSeverity, number>;
      }
    >();

    baseFilteredReports.forEach((report) => {
      if (report.severity === "Sin incidencia") {
        return;
      }

      const current = aggregate.get(report.venue) ?? {
        venue: report.venue,
        teamName: getHomeTeamFromMatchLabel(report.match_label),
        competition: report.competition,
        total: 0,
        severities: {
          Crítica: 0,
          Alta: 0,
          Media: 0,
          Baja: 0,
          "Sin incidencia": 0,
        } satisfies Record<ReportSeverity, number>,
      };

      current.total += 1;
      current.severities[report.severity] += 1;
      aggregate.set(report.venue, current);
    });

    return Array.from(aggregate.values())
      .sort((left, right) => {
        if (right.total !== left.total) {
          return right.total - left.total;
        }

        return severityKeys.reduce((acc, severity) => {
          if (acc !== 0) {
            return acc;
          }
          return right.severities[severity] - left.severities[severity];
        }, 0);
      });
  }, [baseFilteredReports]);

  const venueDetailRows = useMemo(() => {
    return venueRecurrence.map((item) => ({
      venue: item.venue,
      total: item.total,
      critical: item.severities["Crítica"],
      high: item.severities.Alta,
      medium: item.severities.Media,
      low: item.severities.Baja,
    }));
  }, [venueRecurrence]);

  const visibleLeagueDistribution = showAllLeagueDistribution
    ? leagueDistribution.slice(0, 10)
    : leagueDistribution.slice(0, 3);
  const visibleSeverityDistribution = showAllSeverityDistribution
    ? severityDistribution
    : severityDistribution.slice(0, 3);
  const visibleVenueRecurrence = showAllVenueRecurrence
    ? venueRecurrence.slice(0, 10)
    : venueRecurrence.slice(0, 3);
  const canExpandLeagueDistribution = leagueDistribution.length > 3;
  const canExpandSeverityDistribution = severityDistribution.length > 3;
  const canExpandVenueRecurrence = venueRecurrence.length > 3;
  const severityDetailRows = severityDistribution.filter((item) => item.count > 0);
  const severityChartGradient = useMemo(() => {
    if (!severityDetailRows.length) {
      return null;
    }

    let currentOffset = 0;

    return `conic-gradient(${severityDetailRows
      .map((item) => {
        const color = getSeverityColor(item.severity);
        const start = currentOffset;
        currentOffset += item.percentage;
        return `${color} ${start}% ${currentOffset}%`;
      })
      .join(", ")})`;
  }, [severityDetailRows]);

  const responsiblePerformanceRows = useMemo(() => {
    const aggregate = new Map<
      string,
      {
        responsible: string;
        matches: number;
        withIncident: number;
        critical: number;
        high: number;
        medium: number;
      }
    >();

    baseFilteredReports.forEach((report) => {
      const current = aggregate.get(report.responsible_name) ?? {
        responsible: report.responsible_name,
        matches: 0,
        withIncident: 0,
        critical: 0,
        high: 0,
        medium: 0,
      };

      current.matches += 1;

      if (report.severity !== "Sin incidencia") {
        current.withIncident += 1;
      }

      if (report.severity === "Crítica") {
        current.critical += 1;
      } else if (report.severity === "Alta") {
        current.high += 1;
      } else if (report.severity === "Media") {
        current.medium += 1;
      }

      aggregate.set(report.responsible_name, current);
    });

    return Array.from(aggregate.values())
      .map((item) => ({
        responsable: item.responsible,
        partidos: item.matches,
        con_inc: item.withIncident,
        inc_percent: item.matches
          ? Math.round((item.withIncident / item.matches) * 1000) / 10
          : 0,
        inc_por_100_partidos: item.matches
          ? Math.round((item.withIncident / item.matches) * 10000) / 100
          : 0,
        criticas: item.critical,
        altas: item.high,
        medias: item.medium,
      }))
      .sort((left, right) => {
        if (right.con_inc !== left.con_inc) {
          return right.con_inc - left.con_inc;
        }

        if (right.partidos !== left.partidos) {
          return right.partidos - left.partidos;
        }

        return left.responsable.localeCompare(right.responsable, "es", {
          sensitivity: "base",
        });
      });
  }, [baseFilteredReports]);

  const responsibleRanking = useMemo(() => {
    const directionFactor = rankingSortDirection === "asc" ? 1 : -1;

    return responsiblePerformanceRows
      .slice()
      .sort((left, right) => {
        if (rankingSortBy === "responsible") {
          return (
            left.responsable.localeCompare(right.responsable, "es", {
              sensitivity: "base",
            }) * directionFactor
          );
        }

        if (rankingSortBy === "matches") {
          return (left.partidos - right.partidos) * directionFactor;
        }

        if (rankingSortBy === "with_incident") {
          return (left.con_inc - right.con_inc) * directionFactor;
        }

        if (rankingSortBy === "incident_rate") {
          return (left.inc_percent - right.inc_percent) * directionFactor;
        }

        if (rankingSortBy === "incidents_per_100_matches") {
          return (
            (left.inc_por_100_partidos - right.inc_por_100_partidos) *
            directionFactor
          );
        }

        if (rankingSortBy === "critical") {
          return (left.criticas - right.criticas) * directionFactor;
        }

        if (rankingSortBy === "high") {
          return (left.altas - right.altas) * directionFactor;
        }

        return (left.medias - right.medias) * directionFactor;
      });
  }, [rankingSortBy, rankingSortDirection, responsiblePerformanceRows]);

  const summaryAiContext = useMemo(
    () => ({
      corte_visible: {
        periodo: activePeriodLabel,
        modo_periodo: periodMode,
        filtro_liga: leagueFilter,
        total_reportes: baseFilteredReports.length,
        total_ligas: summaryMetrics.activeLeagues,
      },
      resumen_ejecutivo: {
        total_reportes: summaryMetrics.totalReports,
        con_incidencia: summaryMetrics.withIncident,
        sin_incidencia: summaryMetrics.totalReports - summaryMetrics.withIncident,
        criticas_y_altas: summaryMetrics.criticalAndHighCount,
        pagos_confirmados: summaryMetrics.paidCount,
        pagos_pendientes: summaryMetrics.unpaidCount,
        feed_detectado: summaryMetrics.feedDetectedCount,
        pendientes_operativos: summaryMetrics.pendingReports,
        ciclo_promedio_min: summaryMetrics.averageCycle,
      },
      distribucion_por_gravedad: severityDistribution.map((item) => ({
        gravedad: item.severity,
        reportes: item.count,
        porcentaje: item.percentage,
      })),
      incidencias_por_liga: leagueIncidentDetailRows.map((item) => ({
        liga: item.league,
        partidos: item.total,
        con_incidencias: item.incidents,
        porcentaje_incidencia: item.incidentPercent,
        porcentaje_del_total: item.sharePercent,
      })),
      evolucion_del_periodo: periodEvolutionRows.map((item) => ({
        tramo: item.label,
        total: item.total,
        sin_incidencia: item.noIncident,
        baja: item.low,
        media: item.medium,
        alta: item.high,
        critica: item.critical,
      })),
      rendimiento_por_responsable: responsiblePerformanceRows.slice(0, 12),
      incidencias_por_sede: venueDetailRows.slice(0, 12).map((item) => ({
        sede: item.venue,
        total: item.total,
        criticas: item.critical,
        altas: item.high,
        medias: item.medium,
        bajas: item.low,
      })),
      tabla_cruzada_liga_gravedad: severityCrossTableRows.map((item) => ({
        liga: item.league,
        critica: item.critical,
        alta: item.high,
        media: item.medium,
        baja: item.low,
        sin_incidencia: item.noIncident,
        total: item.total,
      })),
    }),
    [
      activePeriodLabel,
      baseFilteredReports.length,
      leagueFilter,
      leagueIncidentDetailRows,
      periodEvolutionRows,
      periodMode,
      responsiblePerformanceRows,
      severityCrossTableRows,
      severityDistribution,
      summaryMetrics,
      venueDetailRows,
    ],
  );

  const summaryMetricItems = useMemo(
    () => [
      {
        key: "total",
        title: "Total partidos",
        value: summaryMetrics.totalReports,
        chip: `${summaryMetrics.activeLeagues} ligas activas`,
        chipTone: "success" as const,
        barClassName: "bg-[var(--accent)]",
        barWidth: 100,
      },
      {
        key: "incident",
        title: "Total incidencias",
        value: summaryMetrics.withIncident,
        chip: `${summaryMetrics.incidentPercent}% del total`,
        chipTone: "warning" as const,
        barClassName: "bg-[#f59e0b]",
        barWidth: summaryMetrics.incidentPercent,
      },
      {
        key: "paid",
        title: "Pago de partidos",
        value: summaryMetrics.paidCount,
        chip: `${summaryMetrics.paidPercent}% del total`,
        chipTone: "success" as const,
        barClassName: "bg-[#10b981]",
        barWidth: summaryMetrics.paidPercent,
      },
      {
        key: "critical-high",
        title: "Críticas + altas",
        value: summaryMetrics.criticalAndHighCount,
        chip: `${summaryMetrics.criticalAndHighPercent}% del total`,
        chipTone: "accent" as const,
        barClassName: "bg-[var(--accent)]",
        barWidth: summaryMetrics.criticalAndHighPercent,
        highlight: true,
      },
    ],
    [summaryMetrics],
  );

  const sortedReports = useMemo(() => {
    const directionFactor = sortDirection === "asc" ? 1 : -1;

    return [...queryFilteredReports].sort((left, right) => {
      if (sortBy === "league") {
        return (
          left.league.localeCompare(right.league, "es", {
            sensitivity: "base",
          }) * directionFactor
        );
      }

      if (sortBy === "id") {
        return (
          left.id_feed.localeCompare(right.id_feed, "es", {
            numeric: true,
            sensitivity: "base",
          }) * directionFactor
        );
      }

      if (sortBy === "idBp") {
        return (
          left.id_bp.localeCompare(right.id_bp, "es", {
            numeric: true,
            sensitivity: "base",
          }) * directionFactor
        );
      }

      if (sortBy === "date") {
        return (
          (parseSpanishShortDate(left.event_date).getTime() -
            parseSpanishShortDate(right.event_date).getTime()) *
          directionFactor
        );
      }

      if (sortBy === "match") {
        return (
          left.match_label.localeCompare(right.match_label, "es", {
            sensitivity: "base",
          }) * directionFactor
        );
      }

      if (sortBy === "responsible") {
        return (
          left.responsible_name.localeCompare(right.responsible_name, "es", {
            sensitivity: "base",
          }) * directionFactor
        );
      }

      if (sortBy === "paid") {
        const paidDiff = Number(left.paid) - Number(right.paid);

        if (paidDiff !== 0) {
          return paidDiff * directionFactor;
        }
      }

      if (sortBy === "feed") {
        const feedDiff = Number(left.feed_detected) - Number(right.feed_detected);

        if (feedDiff !== 0) {
          return feedDiff * directionFactor;
        }
      }

      if (sortBy === "severity") {
        const severityDiff =
          getSeverityOrder(left.severity) - getSeverityOrder(right.severity);

        if (severityDiff !== 0) {
          return severityDiff * directionFactor;
        }
      }

      return (
        left.match_label.localeCompare(right.match_label, "es", {
          sensitivity: "base",
        }) * directionFactor
      );
    });
  }, [queryFilteredReports, sortBy, sortDirection]);

  const selectedReport =
    sortedReports.find((report) => report.id_feed === selectedReportId) ?? null;
  const selectedReportEditable =
    Boolean(selectedReport) && selectedReport?.severity !== "Sin incidencia";
  const isSelectedReportEditing =
    canManageEvidence &&
    selectedReportEditable &&
    editingReportId === selectedReport?.id_feed;
  const selectedReportEvidence = selectedReport
    ? reportEvidenceById[selectedReport.id_feed] ?? {}
    : {};
  const selectedReportUploadState = selectedReport
    ? uploadStateByReport[selectedReport.id_feed] ?? {}
    : {};
  const selectedReportTeams = selectedReport
    ? splitMatchLabel(selectedReport.match_label)
    : null;
  const selectedReportSeverityTone = selectedReport
    ? selectedReport.severity === "Sin incidencia"
      ? {
          panel: "border-[#cde9d7] bg-[#f4fcf7]",
          label: "text-[#17945b]",
          value: "text-[#167447]",
        }
      : selectedReport.severity === "Crítica"
        ? {
            panel: "border-[#edd7fb] bg-[#fbf5ff]",
            label: "text-[#a12ad6]",
            value: "text-[#7f1fb2]",
          }
        : selectedReport.severity === "Alta"
          ? {
              panel: "border-[#ffd6df] bg-[#fff4f6]",
              label: "text-[#cf2246]",
              value: "text-[#b51f3e]",
            }
          : selectedReport.severity === "Media"
            ? {
                panel: "border-[#f4e1a6] bg-[#fffdf2]",
                label: "text-[#b78611]",
                value: "text-[#9b730b]",
              }
            : {
                panel: "border-[#f3e7b8] bg-[#fffef8]",
                label: "text-[#b79734]",
                value: "text-[#8f7a2f]",
          }
    : null;
  const selectedReportActivity = selectedReport?.activity ?? activities;
  const resolvedReportSpeedtest =
    selectedReportEvidence.speedtest ?? selectedReport?.speedtest ?? "-";
  const resolvedReportPing =
    selectedReportEvidence.ping ?? selectedReport?.ping ?? "-";
  const resolvedReportGpu =
    selectedReportEvidence.gpuLoad ?? selectedReport?.gpuLoad ?? "-";
  const selectedReportSpeedtestAttachment =
    selectedReportEvidence.speedtestAttachment ??
    selectedReport?.speedtestAttachment ??
    null;
  const selectedReportPingAttachment =
    selectedReportEvidence.pingAttachment ?? selectedReport?.pingAttachment ?? null;
  const selectedReportGpuAttachment =
    selectedReportEvidence.gpuAttachment ?? selectedReport?.gpuAttachment ?? null;
  const isReportEvidenceBusy =
    isRefreshingEvidence ||
    selectedReportUploadState.speedtest?.state === "loading" ||
    selectedReportUploadState.ping?.state === "loading" ||
    selectedReportUploadState.gpu?.state === "loading";

  function setReportUploadState(
    reportId: string,
    kind: TechnicalCaptureKind,
    nextState: EvidenceUploadState,
  ) {
    setUploadStateByReport((current) => ({
      ...current,
      [reportId]: {
        ...current[reportId],
        [kind]: nextState,
      },
    }));
  }

  function openReportEvidencePicker(
    report: ReportRecord,
    kind: TechnicalCaptureKind,
  ) {
    if (!canManageEvidence) {
      return;
    }

    setDesktopUploadTarget({
      reportId: report.id_feed,
      kind,
    });

    if (desktopEvidenceInputRef.current) {
      desktopEvidenceInputRef.current.value = "";
      desktopEvidenceInputRef.current.click();
    }
  }

  async function handleReportEvidenceUpload(
    report: ReportRecord,
    kind: TechnicalCaptureKind,
    file: File,
  ) {
    setReportUploadState(report.id_feed, kind, {
      state: "loading",
      message: "Subiendo evidencia...",
    });

    try {
      const formData = new FormData();
      formData.set("assignmentId", report.assignmentId);
      formData.set("matchId", report.matchId);
      formData.set("reportId", report.sourceReportId);
      formData.set("kind", kind);
      formData.set("image", file);

      const response = await fetch("/api/collaborator-reports/attachments", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            attachment?: CollaboratorReportAttachment & { signedUrl?: string };
            value?: string | null;
            note?: string;
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error?.trim() || "No pudimos subir la evidencia técnica.",
        );
      }

      const uploadedAttachment =
        payload?.attachment && typeof payload.attachment.fileName === "string"
          ? toReportAttachment(payload.attachment)
          : null;
      const uploadedValue =
        typeof payload?.value === "string" && payload.value.trim()
          ? payload.value.trim()
          : null;

      setReportEvidenceById((current) => {
        const reportEvidence = current[report.id_feed] ?? {};

        return {
          ...current,
          [report.id_feed]: {
            ...reportEvidence,
            ...(kind === "speedtest"
              ? {
                  speedtestAttachment:
                    uploadedAttachment ?? reportEvidence.speedtestAttachment ?? null,
                  ...(uploadedValue ? { speedtest: uploadedValue } : {}),
                }
              : kind === "ping"
                ? {
                    pingAttachment:
                      uploadedAttachment ?? reportEvidence.pingAttachment ?? null,
                    ...(uploadedValue ? { ping: uploadedValue } : {}),
                  }
                : {
                    gpuAttachment:
                      uploadedAttachment ?? reportEvidence.gpuAttachment ?? null,
                    ...(uploadedValue ? { gpuLoad: uploadedValue } : {}),
                  }),
          },
        };
      });

      setReportUploadState(report.id_feed, kind, {
        state: "done",
        message: uploadedValue
          ? payload?.note?.trim() ||
            "Evidencia actualizada y sincronizada con el reporte."
          : "Evidencia cargada. Si el valor no cambió, la lectura automática no devolvió dato.",
      });

      startRefreshingEvidence(() => {
        router.refresh();
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "No pudimos subir la evidencia técnica.";

      setReportUploadState(report.id_feed, kind, {
        state: "error",
        message,
      });
    }
  }

  function handleReportEvidenceInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const target = desktopUploadTarget;
    event.currentTarget.value = "";
    setDesktopUploadTarget(null);

    if (!file || !target) {
      return;
    }

    const report = reports.find((item) => item.id_feed === target.reportId);

    if (!report) {
      return;
    }

    void handleReportEvidenceUpload(report, target.kind, file);
  }

  const renderReportControlHeader = (column: ReportControlColumn) => {
    const sortableKey = REPORT_CONTROL_COLUMN_SORT_KEY[column];
    const isDropTarget =
      !!draggedColumn && draggedColumn !== column && dragOverColumn === column;
    const headerPadding =
      column === "match" ? "px-4 py-3" : "px-3 py-3";
    const headerTooltip =
      column === "paid"
        ? "Pago de partido"
        : column === "feed"
          ? "Feed detectado"
          : column === "severity"
            ? "Gravedad del reporte"
            : undefined;

    return (
      <th
        key={column}
        draggable
        onDragStart={() => handleColumnDragStart(column)}
        onDragEnd={handleColumnDragEnd}
        onDragOver={(event) => handleColumnDragOver(event, column)}
        onDrop={() => handleColumnDrop(column)}
        onDragLeave={() => {
          if (dragOverColumn === column) {
            setDragOverColumn(null);
          }
        }}
        className={cn(
          headerPadding,
          "cursor-grab select-none active:cursor-grabbing",
          column === "date" && "text-center",
          isDropTarget && "bg-[#fff6f8]",
          column === "action" && "text-right",
        )}
      >
        <div
          className={cn(
            "flex w-full items-center gap-2",
            column === "date" && "justify-center",
            column === "action" && "justify-end",
          )}
        >
          {sortableKey ? (
            <SortHeader
              title={headerTooltip}
              label={
                column === "league"
                  ? "LIGA"
                  : column === "id"
                    ? "ID FEED"
                    : column === "idBp"
                      ? "ID BP"
                    : column === "date"
                      ? "F.A"
                      : column === "match"
                        ? "PARTIDO"
                          : column === "responsible"
                            ? "RESPONSABLE"
                          : column === "paid"
                            ? isWideScreen
                              ? "PAGO"
                              : "$"
                            : column === "feed"
                              ? isWideScreen
                                ? "FEED"
                                : "F"
                              : "GRAVEDAD"
              }
              active={sortBy === sortableKey}
              direction={sortDirection}
              onClick={() => handleSort(sortableKey)}
              align={
                column === "action"
                  ? "right"
                  : column === "date"
                    ? "center"
                    : "left"
              }
            />
          ) : (
            <span className="ml-auto inline-flex uppercase tracking-[0.18em] text-[#94a3b8]">
              ACCIÓN
            </span>
          )}
        </div>
      </th>
    );
  };

  const reportColumnWidths = useMemo(() => {
    const weights = selectedReport
      ? REPORT_CONTROL_COMPACT_COLUMN_WIDTH_WEIGHT
      : isWideScreen
        ? REPORT_CONTROL_WIDE_COLUMN_WIDTH_WEIGHT
        : REPORT_CONTROL_COLUMN_WIDTH_WEIGHT;
    const totalWeight = columnOrder.reduce(
      (sum, column) => sum + weights[column],
      0,
    );

    return columnOrder.reduce<Record<ReportControlColumn, string>>((acc, column) => {
      acc[column] = `${(((weights[column] / totalWeight) * 100)).toFixed(2)}%`;
      return acc;
    }, {} as Record<ReportControlColumn, string>);
  }, [columnOrder, selectedReport, isWideScreen]);

  const renderReportControlCell = (report: ReportRecord, column: ReportControlColumn) => {
    const cellClassName = "";
    const editable = report.severity !== "Sin incidencia";

    switch (column) {
      case "league":
        return (
          <td key={column} className={cn("px-3 py-3 2xl:px-5 2xl:py-5", cellClassName)}>
            <LeagueLogoMarkClient
              league={report.league}
              className="h-12 w-16"
            />
          </td>
        );
      case "id":
        return (
          <td key={column} className={cn("px-3 py-3 2xl:px-5 2xl:py-5", cellClassName)}>
            <span className="inline-flex rounded-full border border-[#f3cfd8] bg-[#fff3f6] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
              {report.id_feed}
            </span>
          </td>
        );
      case "idBp":
        return (
          <td key={column} className={cn("px-2 py-3 2xl:px-5 2xl:py-5", cellClassName)}>
            <span className="inline-flex rounded-full border border-[#d7e2f6] bg-[#f4f8ff] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#2b6be7]">
              {report.id_bp}
            </span>
          </td>
        );
      case "date":
        return (
          <td
            key={column}
            className={cn(
              "px-2 py-3 text-center 2xl:px-5 2xl:py-5",
              cellClassName,
            )}
          >
            <span className="inline-flex flex-col items-center gap-0.5 leading-none">
              <span className="text-sm font-black uppercase tracking-[0.12em] text-[#617187]">
                {formatCompactReportDate(report.event_date)}
              </span>
              {report.event_time ? (
                <span className="text-[10px] font-semibold text-[#94a3b8]">
                  {report.event_time}
                </span>
              ) : null}
            </span>
          </td>
        );
      case "match":
        return (
          <td
            key={column}
            className={cn(
              selectedReport
                ? "px-3 py-3 2xl:px-5 2xl:py-5"
                : "px-3 py-3 xl:px-4 2xl:px-6 2xl:py-5",
              cellClassName,
            )}
          >
            <MatchSummaryCell
              matchLabel={report.match_label}
              competition={report.competition}
              compact={Boolean(selectedReport)}
            />
          </td>
        );
      case "responsible":
        return (
          <td key={column} className={cn("px-3 py-3 2xl:px-5 2xl:py-5", cellClassName)}>
            <PersonRoleStack
              label="Responsable"
              value={formatPersonShortName(report.responsible_name)}
              initials={getInitials(report.responsible_name)}
              size="sm"
            />
          </td>
        );
      case "paid":
        return (
          <td key={column} className={cn("px-1 py-3 2xl:px-2 2xl:py-5", cellClassName)}>
            <div className="flex min-h-9 items-center justify-center">
              {report.paid ? (
                <CircleCheckBig className="size-5 text-[#10b981]" />
              ) : (
                <CircleX className="size-5 text-[#e44b68]" />
              )}
            </div>
          </td>
        );
      case "feed":
        return (
          <td key={column} className={cn("px-1 py-3 2xl:px-2 2xl:py-5", cellClassName)}>
            <div className="flex min-h-9 items-center justify-center">
              {report.feed_detected ? (
                <CircleCheckBig className="size-5 text-[#10b981]" />
              ) : (
                <CircleX className="size-5 text-[#e44b68]" />
              )}
            </div>
          </td>
        );
      case "severity":
        return (
          <td key={column} className={cn("px-2 py-3 2xl:px-5 2xl:py-5", cellClassName)}>
            <SeverityBadge severity={report.severity} />
          </td>
        );
      case "action":
        return (
          <td key={column} className={cn("px-2 py-3 text-right 2xl:px-5 2xl:py-5", cellClassName)}>
            <button
              type="button"
              title={editable ? "Editar reporte" : "Ver reporte"}
              className="inline-flex size-8 items-center justify-center rounded-lg text-[#94a3b8] transition hover:bg-[var(--accent)] hover:text-white"
            >
              {editable ? <Pencil className="size-4" /> : <Eye className="size-4" />}
            </button>
          </td>
        );
      default:
        return null;
    }
  };

  const renderRankingHeader = (column: ReportRankingColumn) => {
    const isDropTarget =
      !!draggedRankingColumn &&
      draggedRankingColumn !== column &&
      dragOverRankingColumn === column;

    const label =
      column === "responsible"
        ? "Operador"
        : column === "matches"
          ? "Partidos"
        : column === "with_incident"
          ? "Con Inc."
        : column === "incident_rate"
          ? "% Inc."
        : column === "incidents_per_100_matches"
          ? "Inc. c/100 partidos"
        : column === "critical"
          ? "Críticas"
        : column === "high"
          ? "Altas"
          : "Medias";

    return (
      <th
        key={column}
        draggable
        onDragStart={() => handleRankingColumnDragStart(column)}
        onDragEnd={handleRankingColumnDragEnd}
        className={cn(
          "cursor-grab select-none px-2 pb-4 transition-colors active:cursor-grabbing",
          isDropTarget && "bg-[#f8fafc]",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          handleRankingColumnDragOver(column);
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleRankingColumnDrop(column);
        }}
      >
        <div className="flex items-center justify-start gap-2">
          <SortHeader
            label={label}
            active={rankingSortBy === column}
            direction={rankingSortDirection}
            onClick={() => handleRankingSort(column)}
            align="left"
          />
        </div>
      </th>
    );
  };

  const renderRankingCell = (
    item: (typeof responsibleRanking)[number],
    column: ReportRankingColumn,
  ) => {
    switch (column) {
      case "responsible":
        return (
          <td key={column} className="px-2 py-4">
            <PersonRoleStack
              label="Operador"
              value={item.responsable}
              initials={getInitials(item.responsable)}
              size="sm"
            />
          </td>
        );
      case "matches":
        return (
          <td key={column} className="px-2 py-4 text-sm font-medium text-[#24364b]">
            {item.partidos}
          </td>
        );
      case "with_incident":
        return (
          <td key={column} className="px-2 py-4 text-sm font-medium text-[#24364b]">
            {item.con_inc}
          </td>
        );
      case "incident_rate": {
        const tone = getPerformanceMetricTone(item.inc_percent);

        return (
          <td key={column} className="px-2 py-4">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-black",
                tone.badge,
              )}
            >
              {formatSummaryPercentage(item.con_inc, item.partidos)}
            </span>
          </td>
        );
      }
      case "incidents_per_100_matches": {
        const tone = getPerformanceMetricTone(item.inc_por_100_partidos);

        return (
          <td
            key={column}
            className={cn("px-2 py-4 text-sm font-black", tone.text)}
          >
            {item.inc_por_100_partidos.toFixed(1)}
          </td>
        );
      }
      case "critical":
        return (
          <td key={column} className="px-2 py-4 text-sm font-medium text-[#24364b]">
            {item.criticas}
          </td>
        );
      case "high":
        return (
          <td key={column} className="px-2 py-4 text-sm font-medium text-[#24364b]">
            {item.altas}
          </td>
        );
      case "medium":
        return (
          <td key={column} className="px-2 py-4 text-sm font-medium text-[#24364b]">
            {item.medias}
          </td>
        );
      default:
        return null;
    }
  };

  const reportsBlockTitle =
    leagueFilter !== "Todas las ligas" ? leagueFilter : "Control de reportes";
  const canvasTone =
    activeView === "control" && leagueFilter !== "Todas las ligas"
      ? getReportLeagueCanvasTone(leagueFilter)
      : null;

  function toggleReportDrawer(reportId: string) {
    setSelectedReportId((current) => {
      if (current === reportId) {
        return null;
      }

      setReportDrawerTab("details");
      return reportId;
    });
  }

  async function exportVisibleReports(sourceReports: ReportRecord[], format: "excel" | "pdf") {
    if (!sourceReports.length || isExporting) {
      return;
    }

    setIsExporting(true);
    setExportMenuOpen(null);

    try {
      const reportGroups = groupReportsByLeague(sourceReports);
      const fileBaseName = [
        "reportes",
        sanitizeFileSegment(
          leagueFilter !== "Todas las ligas" ? leagueFilter : "todas-las-ligas",
        ),
        sanitizeFileSegment(activePeriodLabel),
      ]
        .filter(Boolean)
        .join("-");

      if (format === "excel") {
        const excelDocument = buildReportsExcelDocument(reportGroups, activePeriodLabel);
        downloadBlob(
          new Blob([excelDocument], { type: "application/vnd.ms-excel;charset=utf-8" }),
          `${fileBaseName}.xls`,
        );
        return;
      }

      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const pdfDocument = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      const pageWidth = pdfDocument.internal.pageSize.getWidth();
      const pageHeight = pdfDocument.internal.pageSize.getHeight();
      const marginX = 32;
      const contentWidth = pageWidth - marginX * 2;
      let currentY = 32;

      pdfDocument.setFont("helvetica", "bold");
      pdfDocument.setFontSize(16);
      pdfDocument.setTextColor(15, 23, 42);
      pdfDocument.text("Control de reportes", marginX, currentY);
      currentY += 18;

      pdfDocument.setFont("helvetica", "normal");
      pdfDocument.setFontSize(10);
      pdfDocument.setTextColor(100, 116, 139);
      pdfDocument.text(`Periodo exportado: ${activePeriodLabel}`, marginX, currentY);
      currentY += 20;

      reportGroups.forEach(({ league, items }, index) => {
        if (index > 0 && currentY > pageHeight - 160) {
          pdfDocument.addPage();
          currentY = 32;
        }

        const accent = hexToRgb(getReportLeagueAccentColor(league));
        pdfDocument.setFillColor(accent.red, accent.green, accent.blue);
        pdfDocument.rect(marginX, currentY, contentWidth, 24, "F");
        pdfDocument.setFont("helvetica", "bold");
        pdfDocument.setFontSize(11);
        pdfDocument.setTextColor(255, 255, 255);
        pdfDocument.text(league, marginX + 10, currentY + 16);

        autoTable(pdfDocument, {
          startY: currentY + 24,
          margin: { left: marginX, right: marginX },
          head: [REPORT_EXPORT_COLUMNS.map((column) => column.label)],
          body: items.map((report) =>
            REPORT_EXPORT_COLUMNS.map((column) => column.value(report)),
          ),
          theme: "grid",
          styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 5,
            textColor: [15, 23, 42],
            lineColor: [219, 228, 240],
            lineWidth: 0.5,
            overflow: "linebreak",
            valign: "top",
          },
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 82 },
            2: { cellWidth: 64 },
            3: { cellWidth: 44 },
            4: { cellWidth: 128 },
            5: { cellWidth: 160 },
            6: { cellWidth: 58 },
            7: { cellWidth: 66 },
            8: { cellWidth: 68 },
            9: { cellWidth: 48 },
          },
        });

        currentY =
          (pdfDocument as { lastAutoTable?: { finalY: number } }).lastAutoTable
            ?.finalY ?? currentY + 48;
        currentY += 20;
      });

      pdfDocument.save(`${fileBaseName}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1536px)");
    setIsWideScreen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsWideScreen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!exportMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [exportMenuOpen]);

  useEffect(() => {
    const root = document.documentElement;

    if (canvasTone) {
      root.style.setProperty("--page-canvas", canvasTone);
      root.style.setProperty("--page-footer-bg", canvasTone);
    } else {
      root.style.removeProperty("--page-canvas");
      root.style.removeProperty("--page-footer-bg");
    }

    return () => {
      root.style.removeProperty("--page-canvas");
      root.style.removeProperty("--page-footer-bg");
    };
  }, [canvasTone]);

  const periodSelector = (
    <>
      <SegmentedControl
        items={[
          { key: "day", label: "Día", active: periodMode === "day", onClick: () => setPeriodMode("day") },
          { key: "week", label: "Semana", active: periodMode === "week", onClick: () => setPeriodMode("week") },
          { key: "month", label: "Mes", active: periodMode === "month", onClick: () => setPeriodMode("month") },
        ]}
      />

      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--accent)]" />
        <select
          value={activePeriodValue}
          onChange={(event) => {
            const value = event.target.value;

            if (periodMode === "day") {
              setSelectedDayKey(value);
              return;
            }

            if (periodMode === "week") {
              setSelectedWeekKey(value);
              return;
            }

            setSelectedMonthKey(value);
          }}
          className="h-12 appearance-none rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] pl-10 pr-10 text-sm font-bold text-[#617187] outline-none transition hover:bg-[#fafbfd]"
        >
          {activePeriodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
      </div>
    </>
  );

  const summaryActions = (
    <div className="flex w-full flex-col items-end gap-3">
      <div className="flex shrink-0 items-center gap-3">
        <SectionAiAssistant
          section="Reportes"
          title="Analiza el resumen actual"
          description="Pide un informe ejecutivo del corte visible o una lectura puntual por gravedad, ligas, sedes y responsables."
          placeholder="Ej. Genera un informe ejecutivo del periodo visible con resumen, gravedad, ligas, responsables y recomendaciones."
          contextLabel="Resumen ejecutivo estructurado del corte visible"
          context={summaryAiContext}
          guidance={REPORT_SUMMARY_AI_GUIDANCE}
          examples={[
            "Genera un informe ejecutivo del periodo visible.",
            "Resume el corte con hallazgos, riesgos y recomendaciones operativas.",
            "¿Qué liga y qué responsable concentran más incidencias visibles?",
          ]}
          hasGeminiKey={hasGeminiKey}
          buttonVariant="icon"
        />
        <div ref={exportMenuOpen === "summary" ? exportMenuRef : undefined} className="relative">
          <ToolbarIconButton
            type="button"
            onClick={() => setExportMenuOpen((o) => o === "summary" ? null : "summary")}
            disabled={!baseFilteredReports.length || isExporting}
            aria-label={isExporting ? "Exportando…" : "Exportar reportes"}
            title={isExporting ? "Exportando…" : "Exportar reportes"}
          >
            <Download className="size-4" />
          </ToolbarIconButton>
          {exportMenuOpen === "summary" && (
            <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[#f6f8fb]"
                onClick={() => void exportVisibleReports(baseFilteredReports, "excel")}
              >
                <FileText className="size-4 text-[#1faa52]" />
                Excel (.xls)
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[#f6f8fb]"
                onClick={() => void exportVisibleReports(baseFilteredReports, "pdf")}
              >
                <FileText className="size-4 text-[var(--accent)]" />
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {periodSelector}
        <div className="relative">
          <select
            value={leagueFilter}
            onChange={(event) => setLeagueFilter(event.target.value)}
            className="h-12 appearance-none rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] px-4 pr-9 text-sm font-bold text-[#617187] outline-none shadow-sm transition hover:bg-[#fafbfd]"
          >
            {leagueOptions.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
        </div>
      </div>
    </div>
  );

  const controlActions = (
    <>
      <ToolbarSearchField
        as="div"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar ID feed, ID BP, liga o responsable..."
        inputClassName="text-sm font-medium text-[var(--foreground)] placeholder:text-[#94a3b8]"
      />
      <div className="flex shrink-0 items-center gap-3">
        <SectionAiAssistant
          section="Reportes"
          title="Consulta los reportes visibles"
          description="Pregunta por gravedad, responsables, pagos, detección de feed o cierres pendientes usando solo los reportes visibles."
          placeholder="Ej. ¿Qué reportes tienen gravedad alta o crítica y quién es el responsable?"
          contextLabel="Reportes visibles en la tabla actual"
          context={visibleReportsAiContext}
          guidance="Prioriza gravedad, responsable, pago, detección de feed, partido, liga y problema. Si preguntan por pendientes, usa los reportes visibles con incidencia."
          examples={[
            "¿Qué reportes tienen Sin incidencia?",
            "¿Qué responsable lleva más cierres críticos?",
            "¿Qué partidos siguen con problemas de pago?",
          ]}
          hasGeminiKey={hasGeminiKey}
          buttonVariant="icon"
        />
        <div ref={exportMenuOpen === "incidents" ? exportMenuRef : undefined} className="relative">
          <ToolbarIconButton
            type="button"
            onClick={() => setExportMenuOpen((o) => o === "incidents" ? null : "incidents")}
            disabled={!sortedReports.length || isExporting}
            aria-label={isExporting ? "Exportando…" : "Exportar reportes"}
            title={isExporting ? "Exportando…" : "Exportar reportes"}
          >
            <Download className="size-4" />
          </ToolbarIconButton>
          {exportMenuOpen === "incidents" && (
            <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[#f6f8fb]"
                onClick={() => void exportVisibleReports(sortedReports, "excel")}
              >
                <FileText className="size-4 text-[#1faa52]" />
                Excel (.xls)
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[#f6f8fb]"
                onClick={() => void exportVisibleReports(sortedReports, "pdf")}
              >
                <FileText className="size-4 text-[var(--accent)]" />
                PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const summaryTitle =
    activeView === "summary"
      ? "Resumen de operaciones"
      : activeView === "control"
        ? "Reportes"
        : "Incidencias";

  const summaryDescription =
    activeView === "summary"
      ? "Panel ejecutivo de control, calidad y seguimiento"
      : activeView === "control"
        ? "Revisa cierres, responsables, pagos y detección de feed del corte visible."
        : "Sigue incidencias, severidad, pruebas y observaciones del periodo visible."

  const summaryPeriodGranularityLabel =
    periodMode === "day"
      ? "Por hora"
      : periodMode === "week"
        ? "Por día"
        : "Por semana";
  const activeSummaryPanel = selectedSummaryInsight;
  const activeSummaryDisplayMode =
    activeSummaryPanel !== "evolution"
      ? summaryInsightDisplayMode[activeSummaryPanel]
      : null;
  const activeSummaryPanelTitle =
    activeSummaryPanel === "league"
      ? "Gravedad por liga"
      : activeSummaryPanel === "severity"
        ? "Distribucion por gravedad"
        : activeSummaryPanel === "venue"
          ? "Incidencias por sede"
          : "Evolución de reportes";
  const activeSummaryPanelSubtitle =
    activeSummaryPanel === "league"
      ? "Cruce de ligas y niveles de gravedad del corte visible"
      : activeSummaryPanel === "severity"
        ? "Peso relativo de cada nivel de severidad"
        : activeSummaryPanel === "venue"
          ? "Reincidencias acumuladas por sede en el corte visible"
          : summaryPeriodGranularityLabel;
  const activeSummaryPanelToggleLabel =
    activeSummaryDisplayMode === "chart" ? "Ver tabla" : "Ver gráfico";
  const leagueTableGridColumns =
    "minmax(180px,1.75fr) repeat(6,minmax(72px,0.82fr))";
  const severityTableGridColumns =
    "minmax(180px,1.45fr) repeat(2,minmax(120px,1fr))";
  const venueTableGridColumns =
    "minmax(220px,1.9fr) repeat(5,minmax(78px,0.82fr))";

  const headerActions =
    activeView === "summary" ? (
      summaryActions
    ) : activeView === "control" ? (
      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        {controlActions}
      </div>
    ) : (
      <div ref={setIncidentsHeaderActionsPortalTarget} />
    );

  const tabsNavigation = (
    <UnderlineTabs
      variant="section"
      className="border-[#edf1f6]"
      items={[
        {
          key: "summary",
          label: "Resumen",
          icon: BarChart3,
          active: activeView === "summary",
          onClick: () => setActiveView("summary"),
        },
        {
          key: "control",
          label: "Reportes",
          icon: Filter,
          active: activeView === "control",
          onClick: () => setActiveView("control"),
        },
        {
          key: "incidents",
          label: "Incidencias",
          icon: AlertTriangle,
          active: activeView === "incidents",
          onClick: () => setActiveView("incidents"),
        },
      ]}
    />
  );

  const reportPlainWorkspaceContent = (
    <div className="overflow-hidden border border-[#d8dee8] bg-[#fbfcfe]">
      {queryFilteredReports.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-[1540px] border-collapse font-mono text-[12px] text-[#1f2937]">
            <thead>
              <tr className="border-b border-[#d8dee8] bg-[#f4f6f9] text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
                <th className="w-[92px] border-r border-[#e1e7f0] px-2 py-2">Fecha</th>
                <th className="w-[72px] border-r border-[#e1e7f0] px-2 py-2">Hora</th>
                <th className="w-[140px] border-r border-[#e1e7f0] px-2 py-2">Liga</th>
                <th className="w-[130px] border-r border-[#e1e7f0] px-2 py-2">ID feed</th>
                <th className="w-[120px] border-r border-[#e1e7f0] px-2 py-2">ID BP</th>
                <th className="w-[300px] border-r border-[#e1e7f0] px-2 py-2">Partido</th>
                <th className="w-[190px] border-r border-[#e1e7f0] px-2 py-2">Responsable</th>
                <th className="w-[80px] border-r border-[#e1e7f0] px-2 py-2">Pago</th>
                <th className="w-[80px] border-r border-[#e1e7f0] px-2 py-2">Feed</th>
                <th className="w-[130px] border-r border-[#e1e7f0] px-2 py-2">Gravedad</th>
                <th className="w-[280px] border-r border-[#e1e7f0] px-2 py-2">Problema</th>
                <th className="w-[130px] px-2 py-2">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.map((report) => {
                const selected = selectedReport?.id_feed === report.id_feed;
                return (
                  <tr
                    key={report.id_feed}
                    onClick={() => toggleReportDrawer(report.id_feed)}
                    className={cn(
                      "cursor-pointer border-b border-[#e6ebf2] odd:bg-white even:bg-[#fbfcfe] hover:bg-[#f3f7ff]",
                      selected && "bg-[#fff1f4] outline outline-1 outline-[#f3b5c2]",
                    )}
                  >
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5 text-[#64748b]">{report.event_date}</td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5 text-[#64748b]">{report.event_time || "-"}</td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                      <span title={report.league} className="block truncate">{report.league}</span>
                    </td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5 font-semibold text-[var(--accent)]">{report.id_feed}</td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5 font-semibold text-[#2563eb]">{report.id_bp}</td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5 font-semibold">
                      <span title={report.match_label} className="block truncate">{report.match_label}</span>
                    </td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                      <span title={report.responsible_name} className="block truncate">{report.responsible_name || "TBD"}</span>
                    </td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">{report.paid ? "Sí" : "No"}</td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">{report.feed_detected ? "Sí" : "No"}</td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">{report.severity}</td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                      <span title={report.problem} className="block truncate">{report.problem || "-"}</span>
                    </td>
                    <td className="px-2 py-1.5 text-[#64748b]">{report.updated_relative || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8">
          <EmptyState
            title={
              reports.length
                ? "No encontramos reportes con esa búsqueda"
                : "Todavía no hay reportes cargados"
            }
            description={
              reports.length
                ? "Prueba con otro ID, responsable o liga para volver al tablero completo de cierres."
                : "Cuando el primer colaborador envíe su reporte desde Mi jornada, aparecerá aquí con su detalle operativo."
            }
          />
        </div>
      )}
    </div>
  );

  const controlVisualWorkspaceContent = (
    <div className="flex min-w-0 flex-col gap-0">
      <section className="grid gap-4 pb-6 pt-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total partidos"
          value={controlMetrics.totalMatches}
          chip={`${controlMetrics.leagueCount} ligas activas`}
          chipTone="success"
          barClassName="bg-[var(--accent)]"
          barWidth={70}
        />
        <MetricCard
          title="Sin incidencia"
          value={controlMetrics.noIncident}
          chip={controlMetrics.noIncident ? "Estable" : "Sin casos"}
          chipTone="success"
          barClassName="bg-[#10b981]"
          barWidth={controlMetrics.noIncidentPercent}
        />
        <MetricCard
          title="Con incidencia"
          value={controlMetrics.withIncident}
          chip={`${controlMetrics.withIncidentPercent}%`}
          chipTone="accent"
          barClassName="bg-[var(--accent)]"
          barWidth={controlMetrics.withIncidentPercent}
          highlight
        />
        <MetricCard
          title="Cierres críticos"
          value={controlMetrics.criticalClosures}
          chip={controlMetrics.criticalClosures ? "Atención" : "Controlado"}
          chipTone="warning"
          barClassName="bg-[#f59e0b]"
          barWidth={controlMetrics.criticalPercent}
        />
      </section>

      <section className="space-y-6">
        <SectionTableCard
          title={reportsBlockTitle}
          icon={FileText}
          badge={
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  value={leagueFilter}
                  onChange={(event) => setLeagueFilter(event.target.value)}
                  className="h-10 appearance-none rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] px-4 pr-9 text-sm font-bold text-[#617187] outline-none transition hover:bg-[#fafbfd]"
                >
                  {leagueOptions.map((league) => (
                    <option key={league} value={league}>
                      {league}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
              </div>

              <SegmentedControl
                size="sm"
                items={[
                  { key: "day", label: "Día", active: periodMode === "day", onClick: () => setPeriodMode("day") },
                  { key: "week", label: "Semana", active: periodMode === "week", onClick: () => setPeriodMode("week") },
                  { key: "month", label: "Mes", active: periodMode === "month", onClick: () => setPeriodMode("month") },
                ]}
              />

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--accent)]" />
                <select
                  value={activePeriodValue}
                  onChange={(event) => {
                    const value = event.target.value;

                    if (periodMode === "day") {
                      setSelectedDayKey(value);
                      return;
                    }

                    if (periodMode === "week") {
                      setSelectedWeekKey(value);
                      return;
                    }

                    setSelectedMonthKey(value);
                  }}
                  className="h-10 appearance-none rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] pl-10 pr-10 text-sm font-bold text-[#617187] outline-none transition hover:bg-[#fafbfd]"
                >
                  {activePeriodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
              </div>
            </div>
          }
          footer={
            <>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#617187]">
                Mostrando {queryFilteredReports.length} de {reports.length} reportes
              </p>
            </>
          }
        >
          {queryFilteredReports.length ? (
            <div className="min-w-0 overflow-x-auto">
              <table className="min-w-full table-fixed text-left">
                <colgroup>
                  {columnOrder.map((column) => (
                    <col
                      key={column}
                      style={{ width: reportColumnWidths[column] }}
                    />
                  ))}
                </colgroup>
                <thead>
                  <tr className="bg-[#fafbfd] text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    {columnOrder.map((column) =>
                      renderReportControlHeader(column),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1f6]">
                  {sortedReports.map((report) => {
                    const editable = report.severity !== "Sin incidencia";
                    const selected = selectedReport?.id_feed === report.id_feed;
                    const rowTone = getReportRowTone(report.severity);

                    return (
                      <tr
                        key={report.id_feed}
                        onClick={() => toggleReportDrawer(report.id_feed)}
                        className={cn(
                          "cursor-pointer transition",
                          selected
                            ? rowTone.active
                            : editable
                              ? rowTone.hover
                              : "opacity-80 hover:bg-[#fafbfd]",
                        )}
                      >
                        {columnOrder.map((column) =>
                          renderReportControlCell(report, column),
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                title={
                  reports.length
                    ? "No encontramos reportes con esa búsqueda"
                    : "Todavía no hay reportes cargados"
                }
                description={
                  reports.length
                    ? "Prueba con otro ID, responsable o liga para volver al tablero completo de cierres."
                    : "Cuando el primer colaborador envíe su reporte desde Mi jornada, aparecerá aquí con su detalle operativo."
                }
              />
            </div>
          )}
        </SectionTableCard>
      </section>
    </div>
  );

  const controlWorkspaceContent = (
    <PlainViewToggle
      storageKey="basket-production.reports.control-view-mode"
      visual={controlVisualWorkspaceContent}
      plain={reportPlainWorkspaceContent}
    />
  );

  const selectedReportDrawer = selectedReport ? (
    <aside className="min-w-0 self-start 2xl:sticky 2xl:top-24">
      <div className="panel-surface fixed inset-x-2 bottom-2 top-2 z-40 flex flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[0_28px_70px_rgba(15,23,42,0.18)] transition md:left-auto md:right-2 md:w-[25rem] md:max-w-[calc(100vw-1rem)] 2xl:static 2xl:h-[calc(100vh-8rem)] 2xl:w-full 2xl:shadow-none">
        <div className="border-b border-[var(--border)] p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-[#f3cfd8] bg-[#fff3f6] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                {selectedReport.id_bp}
              </span>
              <span
                style={{
                  backgroundColor: getTeamLeagueColorSet(selectedReport.league).soft,
                  borderColor: getTeamLeagueColorSet(selectedReport.league).border,
                  color: getTeamLeagueColorSet(selectedReport.league).accent,
                }}
                className="inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
              >
                {selectedReport.league}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedReportId(null);
                setEditingReportId(null);
                setReportDrawerTab("details");
              }}
              aria-label="Cerrar detalle de reporte"
              className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--background-soft)] text-[#94a3b8]"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 text-[1.6rem] font-black leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
                {selectedReportTeams?.homeTeam}
              </p>
              {canManageEvidence && selectedReportEditable ? (
                <button
                  type="button"
                  onClick={() => {
                    setReportDrawerTab("details");
                    setEditingReportId((current) =>
                      current === selectedReport.id_feed ? null : selectedReport.id_feed,
                    );
                  }}
                  aria-label={
                    isSelectedReportEditing
                      ? "Cerrar edición de reporte"
                      : "Editar reporte"
                  }
                  title={
                    isSelectedReportEditing
                      ? "Cerrar edición de reporte"
                      : "Editar reporte"
                  }
                  className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-full transition",
                    isSelectedReportEditing
                      ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]"
                      : "bg-[#f4f7fb] text-[#70819b] hover:bg-[#eef2f6] hover:text-[var(--accent)]",
                  )}
                >
                  <Pencil className="size-4" />
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[1.6rem] font-black leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
              <span className="text-[var(--accent)]">VS</span>
              <span>{selectedReportTeams?.awayTeam}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-[#70819b]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-[#b1b8c5]" />
              {selectedReport.event_date}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-[#b1b8c5]" />
              {selectedReport.event_time}
            </span>
          </div>
          <div className="mt-2 inline-flex items-start gap-2 text-sm text-[#70819b]">
            <MapPin className="mt-0.5 size-4 shrink-0 text-[#b1b8c5]" />
            <span>{selectedReport.venue}</span>
          </div>
        </div>

        <UnderlineTabs
          columns={2}
          items={[
            {
              key: "details",
              label: "Detalle",
              icon: Eye,
              active: reportDrawerTab === "details",
              onClick: () => setReportDrawerTab("details"),
            },
            {
              key: "activity",
              label: "Log",
              icon: History,
              active: reportDrawerTab === "activity",
              onClick: () => setReportDrawerTab("activity"),
            },
          ]}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 2xl:max-h-none">
          {reportDrawerTab === "details" ? (
            <div className="space-y-8">
              <section className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                  Resumen operativo
                </h4>
                <div className="grid gap-3">
                  <div
                    className={cn(
                      "panel-radius border p-4",
                      selectedReportSeverityTone?.panel,
                    )}
                  >
                    <p
                      className={cn(
                        "text-[10px] font-black uppercase tracking-[0.16em]",
                        selectedReportSeverityTone?.label,
                      )}
                    >
                      Gravedad
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-sm font-black",
                        selectedReportSeverityTone?.value,
                      )}
                    >
                      {selectedReport.severity}
                    </p>
                  </div>

                  <div className="panel-radius border border-[var(--border)] bg-white p-4">
                    <PersonRoleStack
                      label="Responsable"
                      value={selectedReport.responsible_name}
                      initials={getInitials(selectedReport.responsible_name)}
                      size="md"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="panel-radius border border-[var(--border)] bg-white p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                        Feed detectó
                      </p>
                      <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                        {selectedReport.feed_detected ? "Sí" : "No"}
                      </p>
                    </div>
                    <div className="panel-radius border border-[var(--border)] bg-white p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                        Pago
                      </p>
                      <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                        {selectedReport.paid ? "Pagado" : "No pagado"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                  Observación técnica
                </h4>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-soft)] p-4">
                  <p className="text-sm leading-7 text-[#4b5c74]">
                    {selectedReport.technicalObservation || "Ninguna"}
                  </p>
                </div>
              </section>

            </div>
          ) : (
            <section className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-[var(--accent)]" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Actividad
                  </h4>
                </div>
                <span className="rounded-full bg-[var(--background-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#7d8ca1]">
                  {selectedReportActivity.slice(0, 3).length} eventos
                </span>
              </div>

              {selectedReportActivity.length ? (
                <div className="space-y-4 border-l border-[var(--border)] pl-5">
                  {selectedReportActivity.slice(0, 3).map((activity) => {
                    const tone = getReportActivityTone(activity.tone);

                    return (
                      <div key={activity.id} className="relative">
                        <div className="absolute -left-[27px] top-1 bg-[var(--surface)] p-1">
                          <div
                            className={cn(
                              "size-3 rounded-full ring-4",
                              tone.dot,
                            )}
                          />
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[var(--foreground)]">
                              {activity.title}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-[#70819b]">
                              {activity.detail}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                              tone.badge,
                            )}
                          >
                            {activity.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--background-soft)] p-4 text-sm text-[#617187]">
                  Todavía no hay actividad registrada para este reporte.
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </aside>
  ) : null;
  const hasEmbeddedIncidentDrawer = activeView === "incidents" && Boolean(selectedEmbeddedIncidentId);
  const hasNonSummaryDrawer = activeView === "control"
    ? Boolean(selectedReportDrawer)
    : hasEmbeddedIncidentDrawer;
  const summaryPanelControls =
    activeSummaryPanel === "evolution" ? (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setChartTimeOffset((o) => o + 1)}
            className="inline-flex size-8 items-center justify-center rounded-full border border-[#d7dde7] bg-white text-[#617187] transition hover:border-[#bbd3f2] hover:bg-[#f6fbff] hover:text-[#194c8f]"
            aria-label="Período anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setChartTimeOffset((o) => Math.max(0, o - 1))}
            disabled={chartTimeOffset === 0}
            className="inline-flex size-8 items-center justify-center rounded-full border border-[#d7dde7] bg-white text-[#617187] transition hover:border-[#bbd3f2] hover:bg-[#f6fbff] hover:text-[#194c8f] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Período siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <SegmentedControl
          size="sm"
          items={[
            {
              key: "count",
              label: "Cantidad",
              active: incidentChartMetric === "count",
              onClick: () => setIncidentChartMetric("count"),
            },
            {
              key: "rate",
              label: "Tasa %",
              active: incidentChartMetric === "rate",
              onClick: () => setIncidentChartMetric("rate"),
            },
          ]}
        />
      </div>
    ) : (
      <button
        type="button"
        onClick={() => toggleSummaryInsightDisplayMode(activeSummaryPanel)}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border-0 bg-[#b12cf0] text-white transition hover:bg-[#9720cf]"
        aria-label={activeSummaryPanelToggleLabel}
        title={activeSummaryPanelToggleLabel}
      >
        {activeSummaryDisplayMode === "chart" ? (
          <FileText className="size-4" />
        ) : (
          <BarChart3 className="size-4" />
        )}
      </button>
    );
  const summaryPanelContent =
    activeSummaryPanel === "league" ? (
      leagueDetailRows.length ? (
        activeSummaryDisplayMode === "chart" ? (
          <div
            className={cn(
              "flex flex-col",
              leagueDetailRows.length <= 4 ? "min-h-full justify-evenly gap-4" : "gap-4",
            )}
          >
            {leagueDetailRows.map((row) => (
              <div
                key={row.league}
                className="rounded-[18px] border border-[#dde6f3] bg-[#fbfcfe] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-black text-[#24364b]">
                    <LeagueLogoMarkClient league={row.league} className="size-7" />
                    {row.league}
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#617187]">
                    {row.total} rep.
                  </span>
                </div>
                <div className="flex h-4 overflow-hidden rounded-full bg-[#ecf1f7]">
                  {row.critical ? (
                    <div
                      className="h-full bg-[#a12ad6]"
                      style={{ width: `${(row.critical / row.total) * 100}%` }}
                    />
                  ) : null}
                  {row.high ? (
                    <div
                      className="h-full bg-[#e44b68]"
                      style={{ width: `${(row.high / row.total) * 100}%` }}
                    />
                  ) : null}
                  {row.medium ? (
                    <div
                      className="h-full bg-[#e7c247]"
                      style={{ width: `${(row.medium / row.total) * 100}%` }}
                    />
                  ) : null}
                  {row.low ? (
                    <div
                      className="h-full bg-[#7cb342]"
                      style={{ width: `${(row.low / row.total) * 100}%` }}
                    />
                  ) : null}
                  {row.noIncident ? (
                    <div
                      className="h-full bg-[#3f83df]"
                      style={{ width: `${(row.noIncident / row.total) * 100}%` }}
                    />
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#70819b]">
                  <span>Cri {row.critical}</span>
                  <span>Alt {row.high}</span>
                  <span>Med {row.medium}</span>
                  <span>Baj {row.low}</span>
                  <span>Sin {row.noIncident}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[6px] border border-[#dbe6f5] bg-[#f8fbff] xl:h-full">
            <div
              className="grid min-w-[48rem] text-sm xl:h-full"
              style={{
                gridTemplateRows: `auto repeat(${leagueDetailRows.length + 1}, minmax(0, 1fr))`,
              }}
            >
              <div
                className="grid border-b border-[#b9d3f2] bg-[#eef5ff] text-[#194c8f]"
                style={{ gridTemplateColumns: leagueTableGridColumns }}
              >
                <div className="flex items-center px-5 py-4 font-black">Liga</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Crítica</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Alta</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Media</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Baja</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Sin inc.</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Total</div>
              </div>
              {leagueDetailRows.map((row, index) => (
                <div
                  key={row.league}
                  className={cn(
                    "grid min-h-0 border-b border-[#e7eef8]",
                    index % 2 === 0 ? "bg-white" : "bg-[#f6f9fd]",
                  )}
                  style={{ gridTemplateColumns: leagueTableGridColumns }}
                >
                  <div className="flex min-h-0 items-center px-5 font-medium text-[#24364b]">
                    {row.league}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 text-[#24364b]">
                    {row.critical}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 text-[#24364b]">
                    {row.high}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 text-[#24364b]">
                    {row.medium}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 text-[#24364b]">
                    {row.low}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 text-[#24364b]">
                    {row.noIncident}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 font-semibold text-[#24364b]">
                    {row.total}
                  </div>
                </div>
              ))}
              <div
                className="grid min-h-0 bg-[#e8f1fb] text-[#194c8f]"
                style={{ gridTemplateColumns: leagueTableGridColumns }}
              >
                <div className="flex min-h-0 items-center px-5 font-black uppercase">Total</div>
                <div className="flex min-h-0 items-center justify-center px-4 font-black">
                  {leagueDetailTotalRow.critical}
                </div>
                <div className="flex min-h-0 items-center justify-center px-4 font-black">
                  {leagueDetailTotalRow.high}
                </div>
                <div className="flex min-h-0 items-center justify-center px-4 font-black">
                  {leagueDetailTotalRow.medium}
                </div>
                <div className="flex min-h-0 items-center justify-center px-4 font-black">
                  {leagueDetailTotalRow.low}
                </div>
                <div className="flex min-h-0 items-center justify-center px-4 font-black">
                  {leagueDetailTotalRow.noIncident}
                </div>
                <div className="flex min-h-0 items-center justify-center px-4 font-black">
                  {leagueDetailTotalRow.total}
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <EmptyState
          title="Sin datos para este corte"
          description="Ajusta el periodo o la liga para desplegar el detalle por gravedad."
        />
      )
    ) : activeSummaryPanel === "severity" ? (
      severityDetailRows.length ? (
        activeSummaryDisplayMode === "chart" ? (
          <div className="grid min-h-full gap-6 xl:grid-cols-[minmax(240px,0.8fr)_minmax(0,1fr)]">
            <div className="flex items-center justify-center">
              <div className="relative flex size-60 items-center justify-center rounded-full bg-[#eef3f8]">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: severityChartGradient ?? "#eef3f8" }}
                />
                <div className="absolute inset-[18%] rounded-full bg-white" />
                <div className="relative z-[1] text-center">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Total
                  </p>
                  <p className="mt-2 text-4xl font-black text-[#24364b]">
                    {baseFilteredReports.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex min-h-full flex-col justify-center gap-3">
              {severityDetailRows.map((item) => {
                const { icon: SeverityIcon, iconClassName } = getSeverityDistributionMeta(
                  item.severity,
                );

                return (
                  <div
                    key={item.severity}
                    className="rounded-[18px] border border-[#e4eaf3] bg-[#fbfcfe] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-3 text-sm font-black text-[#24364b]">
                        <SeverityIcon className={cn("size-4", iconClassName)} />
                        {item.severity}
                      </span>
                      <span className="text-sm font-black text-[#24364b]">
                        {item.percentage}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[#70819b]">
                      {item.count} reportes
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[6px] border border-[#dbe6f5] bg-[#f8fbff] xl:h-full">
            <div
              className="grid min-w-[32rem] text-sm xl:h-full"
              style={{
                gridTemplateRows: `auto repeat(${severityDetailRows.length}, minmax(0, 1fr))`,
              }}
            >
              <div
                className="grid border-b border-[#b9d3f2] bg-[#eef5ff] text-[#194c8f]"
                style={{ gridTemplateColumns: severityTableGridColumns }}
              >
                <div className="flex items-center px-5 py-4 font-black">Gravedad</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Reportes</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">% del total</div>
              </div>
              {severityDetailRows.map((item, index) => (
                <div
                  key={item.severity}
                  className={cn(
                    "grid min-h-0 border-b border-[#e7eef8]",
                    index % 2 === 0 ? "bg-white" : "bg-[#f6f9fd]",
                  )}
                  style={{ gridTemplateColumns: severityTableGridColumns }}
                >
                  <div className="flex min-h-0 items-center px-5 font-medium text-[#24364b]">
                    {item.severity}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 text-[#24364b]">
                    {item.count}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 font-semibold text-[#24364b]">
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <EmptyState
          title="Sin datos de gravedad"
          description="No hay suficiente información visible para construir esta distribución."
        />
      )
    ) : activeSummaryPanel === "venue" ? (
      venueRecurrence.length ? (
        activeSummaryDisplayMode === "chart" ? (
          <div
            className={cn(
              "flex flex-col",
              venueRecurrence.length <= 4 ? "min-h-full justify-evenly gap-4" : "gap-4",
            )}
          >
            {venueRecurrence.map((item) => (
              <div
                key={item.venue}
                className="rounded-[18px] border border-[#dde6f3] bg-[#fbfcfe] px-4 py-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex min-w-0 items-center gap-3 text-sm font-black text-[#24364b]">
                    <ClientTeamLogoMark
                      teamName={item.teamName}
                      competition={item.competition}
                      className="size-9 rounded-[12px] border-transparent bg-transparent shadow-none"
                      imageClassName="object-contain p-0.5"
                      initialsClassName="text-[10px] tracking-[0.12em] text-[#70819b]"
                    />
                    <span className="truncate">{item.venue}</span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#617187]">
                    {item.total} inc.
                  </span>
                </div>
                <div className="flex h-4 overflow-hidden rounded-full bg-[#edf1f6]">
                  {item.severities["Crítica"] ? (
                    <div
                      className="h-full bg-[#a12ad6]"
                      style={{
                        width: `${(item.severities["Crítica"] / item.total) * 100}%`,
                      }}
                    />
                  ) : null}
                  {item.severities.Alta ? (
                    <div
                      className="h-full bg-[#e44b68]"
                      style={{
                        width: `${(item.severities.Alta / item.total) * 100}%`,
                      }}
                    />
                  ) : null}
                  {item.severities.Media ? (
                    <div
                      className="h-full bg-[#e7c247]"
                      style={{
                        width: `${(item.severities.Media / item.total) * 100}%`,
                      }}
                    />
                  ) : null}
                  {item.severities.Baja ? (
                    <div
                      className="h-full bg-[#d8e2ef]"
                      style={{
                        width: `${(item.severities.Baja / item.total) * 100}%`,
                      }}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[6px] border border-[#dbe6f5] bg-[#f8fbff] xl:h-full">
            <div
              className="grid min-w-[46rem] text-sm xl:h-full"
              style={{
                gridTemplateRows: `auto repeat(${venueDetailRows.length}, minmax(0, 1fr))`,
              }}
            >
              <div
                className="grid border-b border-[#b9d3f2] bg-[#eef5ff] text-[#194c8f]"
                style={{ gridTemplateColumns: venueTableGridColumns }}
              >
                <div className="flex items-center px-5 py-4 font-black">Sede</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Total</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Críticas</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Altas</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Medias</div>
                <div className="flex items-center justify-center px-4 py-4 font-black">Bajas</div>
              </div>
              {venueDetailRows.map((row, index) => (
                <div
                  key={row.venue}
                  className={cn(
                    "grid min-h-0 border-b border-[#e7eef8]",
                    index % 2 === 0 ? "bg-white" : "bg-[#f6f9fd]",
                  )}
                  style={{ gridTemplateColumns: venueTableGridColumns }}
                >
                  <div className="flex min-h-0 items-center px-5 font-medium text-[#24364b]">
                    {row.venue}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 font-semibold text-[#24364b]">
                    {row.total}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 text-[#24364b]">
                    {row.critical}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 text-[#24364b]">
                    {row.high}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 text-[#24364b]">
                    {row.medium}
                  </div>
                  <div className="flex min-h-0 items-center justify-center px-4 text-[#24364b]">
                    {row.low}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <EmptyState
          title="Sin incidencias por sede"
          description="No hay reincidencias visibles para representar en este corte."
        />
      )
    ) : incidentLeagueChartView.series.length ? (
      <div className="flex h-full min-h-[28rem] flex-col gap-4">
        <div className="min-h-0 flex-1 overflow-hidden rounded-[var(--panel-radius)] bg-white">
          {(() => {
            const activeSeries = selectedChartLeague
              ? incidentLeagueChartView.series.filter((s) => s.league === selectedChartLeague)
              : incidentLeagueChartView.series;
            const ticks: number[] =
              incidentChartMax <= 6
                ? Array.from({ length: incidentChartMax + 1 }, (_, i) => i)
                : [0, Math.round(incidentChartMax / 2), incidentChartMax];

            return (
              <div className="flex h-full min-h-0 flex-col px-1 pt-4">
                <div className="relative h-[375px] min-h-0 xl:h-[425px] 2xl:h-auto 2xl:flex-1">
                  {/* Grid lines */}
                  {ticks.map((value) => {
                    const bottomPct = (value / incidentChartMax) * 100;
                    const label = incidentChartMetric === "rate" ? `${value}%` : value;
                    return (
                      <div
                        key={value}
                        className="pointer-events-none absolute inset-x-0 h-0"
                        style={{ bottom: `${bottomPct}%` }}
                      >
                        <div className="flex -translate-y-1/2 items-center">
                          <span className="mr-1.5 shrink-0 text-[10px] font-black leading-none text-[#94a3b8]">
                            {label}
                          </span>
                          <div className="h-px flex-1 bg-[#edf1f6]" />
                        </div>
                      </div>
                    );
                  })}
                  {/* Bars — absolute fill so % height works */}
                  <div className="absolute inset-0 flex items-end">
                    {incidentLeagueChartView.labels.map((label, colIndex) => {
                      const colTotal = activeSeries.reduce(
                        (sum, s) => sum + (s.points[colIndex]?.value ?? 0),
                        0,
                      );
                      const colHeightPct = Math.min(colTotal / incidentChartMax, 1) * 100;
                      return (
                        <div key={label} className="flex flex-1 items-end justify-center" style={{ height: "100%" }}>
                          <div
                            className="flex w-1/2 flex-col-reverse overflow-hidden rounded-t-sm transition-all duration-300"
                            style={{ height: `${colHeightPct}%` }}
                          >
                            {activeSeries.map((s) => {
                              const value = s.points[colIndex]?.value ?? 0;
                              const segPct = colTotal > 0 ? (value / colTotal) * 100 : 0;
                              return (
                                <div
                                  key={s.league}
                                  style={{ height: `${segPct}%`, backgroundColor: s.color }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-1.5 flex pb-2">
                  {incidentLeagueChartView.labels.map((label, i) => (
                    <div
                      key={label}
                      className="flex flex-1 flex-col items-center gap-0.5"
                    >
                      <span className="text-[9px] font-black uppercase tracking-[0.06em] text-[#94a3b8]">
                        {periodMode === "week"
                          ? ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"][i] ?? ""
                          : ""}
                      </span>
                      <span className="text-[9px] font-medium text-[#b0bcc9]">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex flex-wrap gap-2">
          {incidentLeagueChartView.series.map((item) => {
            const isActive = selectedChartLeague === item.league;
            const isDimmed = selectedChartLeague !== null && !isActive;
            return (
              <button
                key={item.league}
                type="button"
                title={isActive ? `Quitar filtro: ${item.league}` : `Filtrar por ${item.league}`}
                onClick={() => setSelectedChartLeague(isActive ? null : item.league)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 transition-all",
                  isActive
                    ? "border-transparent shadow-sm scale-105"
                    : isDimmed
                      ? "border-[#edf1f6] bg-white opacity-35"
                      : "border-[#edf1f6] bg-white hover:border-[#d0d8e4] hover:shadow-sm",
                )}
                style={isActive ? { borderColor: item.color, backgroundColor: `${item.color}18` } : undefined}
              >
                <span
                  className="size-1.5 rounded-full transition-transform"
                  style={{ backgroundColor: item.color }}
                />
                <span className={cn("text-[11px] font-bold", isActive ? "text-[var(--foreground)]" : "text-[var(--foreground)]")}>
                  {getLeagueLegendLabel(item.league)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
        ) : (
      <EmptyState
        title="Sin datos para este corte"
        description="Cambia el periodo o la liga para reconstruir la evolución de incidencias por liga."
      />
    );

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col transition-colors",
        activeView === "summary" ? "gap-4" : "gap-3",
      )}
    >
      {activeView === "summary" ? (
        <>
          <SectionPageHeader
            title={summaryTitle}
            description={summaryDescription}
            actions={headerActions}
            className="xl:items-start"
            actionsClassName="xl:items-start"
          />
          {tabsNavigation}
        <div className="space-y-8">
          <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.62fr)_minmax(19.5rem,0.98fr)] 2xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            <div
              className="space-y-8 xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden"
              style={summarySidebarHeight ? { height: `${summarySidebarHeight}px` } : undefined}
            >
              <section className="space-y-4 xl:shrink-0">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {summaryMetricItems.map((item) => (
                    <div
                      key={item.key}
                      className="min-w-0"
                    >
                      <MetricCard
                        title={item.title}
                        value={item.value}
                        chip={item.chip}
                        chipTone={item.chipTone}
                        barClassName={item.barClassName}
                        barWidth={item.barWidth}
                        highlight={item.highlight}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <article
                className="panel-surface border border-[var(--border)] bg-[var(--surface)] p-5 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:p-6"
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-[var(--foreground)]">
                        {activeSummaryPanelTitle}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSelectedSummaryInsight("evolution")}
                        className={cn(
                          "inline-flex size-9 shrink-0 translate-y-0.5 items-center justify-center rounded-full border transition",
                          activeSummaryPanel !== "evolution"
                            ? "border-[#1faa52] bg-[#1faa52] text-white hover:border-[#178546] hover:bg-[#178546]"
                            : "border-[#d7dde7] bg-white text-[#617187] hover:border-[#bbd3f2] hover:bg-[#f6fbff] hover:text-[#194c8f]",
                        )}
                        aria-label={
                          activeSummaryPanel !== "evolution"
                            ? "Volver a evolución"
                            : "Panel general de evolución"
                        }
                        title={
                          activeSummaryPanel !== "evolution"
                            ? "Volver a evolución"
                            : "Panel general de evolución"
                        }
                      >
                        <Eye className="size-3.5" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#617187]">
                      {activeSummaryPanelSubtitle}
                    </p>
                  </div>
                  {summaryPanelControls}
                </div>

                <div className="min-h-0 flex-1 rounded-[var(--panel-radius)] bg-transparent">
                  {summaryPanelContent}
                </div>
              </article>
            </div>

            <article
              ref={summarySidebarRef}
              className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] px-5 pb-5 pt-5 xl:sticky xl:top-24 xl:self-start xl:px-6 xl:pb-6 2xl:px-8 2xl:pb-8 2xl:pt-6"
            >
              <h3 className="text-2xl font-black text-[var(--foreground)]">
                Resumen de reportes
              </h3>
              <div className="mt-6 space-y-4.5">
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                      Por liga
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleSummaryInsight("league")}
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-full border transition",
                        selectedSummaryInsight === "league"
                          ? "border-[#1faa52] bg-[#1faa52] text-white hover:border-[#178546] hover:bg-[#178546]"
                          : "border-[#d9e1eb] bg-[var(--surface)] text-[#617187] hover:border-[#efc2cb] hover:bg-[#fff6f8] hover:text-[var(--accent)]",
                      )}
                      aria-label={
                        selectedSummaryInsight === "league"
                          ? "Cerrar detalle por liga"
                          : "Ver detalle por liga"
                      }
                      title={
                        selectedSummaryInsight === "league"
                          ? "Cerrar detalle por liga"
                          : "Ver detalle por liga"
                      }
                    >
                      <Eye className="size-3.5" />
                    </button>
                  </div>
                  {(() => {
                    const maxCount = Math.max(
                      ...visibleLeagueDistribution.map((entry) => entry.count),
                      1,
                    );
                    const rows = visibleLeagueDistribution.map((item) => (
                      <InsightBarRow
                        key={item.league}
                        icon={<LeagueLogoMarkClient league={item.league} className="size-9" />}
                        label={item.league}
                        value={`${item.count} reportes`}
                        bar={
                          <div
                            className="h-full rounded-full bg-[#1f2937]"
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                          />
                        }
                      />
                    ));
                    const placeholders = Array.from({ length: Math.max(0, 3 - rows.length) }, (_, i) => (
                      <InsightBarRow
                        key={`ph-league-${i}`}
                        icon={<div className="size-9 rounded-full bg-[#f0f3f8]" />}
                        label={<div className="h-2.5 w-24 rounded-full bg-[#edf1f6]" />}
                        value=""
                        bar={null}
                      />
                    ));
                    return [...rows, ...placeholders];
                  })()}
                  {leagueDistribution.length ? (
                    <ExpandDivider
                      expanded={showAllLeagueDistribution}
                      disabled={!canExpandLeagueDistribution}
                      onToggle={() => setShowAllLeagueDistribution((current) => !current)}
                      collapsedLabel="Mostrar más ligas"
                      expandedLabel="Mostrar menos ligas"
                      className="py-[0.25rem]"
                      lineClassName="border-[#edf1f6]"
                      buttonClassName={
                        canExpandLeagueDistribution
                          ? "border-[#d9e1eb] text-[var(--accent)] hover:border-[#efc2cb] hover:bg-[#fff6f8] hover:text-[var(--accent)]"
                          : "cursor-default border-[#e5eaf1] text-[#b8c2d0]"
                      }
                    />
                  ) : null}
                </div>

                <div className="pt-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                      Por gravedad
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleSummaryInsight("severity")}
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-full border transition",
                        selectedSummaryInsight === "severity"
                          ? "border-[#1faa52] bg-[#1faa52] text-white hover:border-[#178546] hover:bg-[#178546]"
                          : "border-[#d9e1eb] bg-[var(--surface)] text-[#617187] hover:border-[#efc2cb] hover:bg-[#fff6f8] hover:text-[var(--accent)]",
                      )}
                      aria-label={
                        selectedSummaryInsight === "severity"
                          ? "Cerrar detalle por gravedad"
                          : "Ver detalle por gravedad"
                      }
                      title={
                        selectedSummaryInsight === "severity"
                          ? "Cerrar detalle por gravedad"
                          : "Ver detalle por gravedad"
                      }
                    >
                      <Eye className="size-3.5" />
                    </button>
                  </div>
                  <div className="mt-3.5 space-y-3.5">
                    {(() => {
                      const rows = visibleSeverityDistribution.map((item) => {
                        const {
                          barClassName,
                          icon: SeverityIcon,
                          iconClassName,
                        } = getSeverityDistributionMeta(item.severity);
                        return (
                          <InsightBarRow
                            key={item.severity}
                            icon={
                              <SeverityIcon
                                className={cn("size-[1.35rem] shrink-0", iconClassName)}
                              />
                            }
                            label={item.severity}
                            value={`${item.percentage}%`}
                            bar={
                              <div
                                className={cn("h-full rounded-full", barClassName)}
                                style={{ width: `${item.percentage}%` }}
                              />
                            }
                          />
                        );
                      });
                      const placeholders = Array.from({ length: Math.max(0, 3 - rows.length) }, (_, i) => (
                        <InsightBarRow
                          key={`ph-sev-${i}`}
                          icon={<div className="size-[1.35rem] rounded-full bg-[#f0f3f8]" />}
                          label={<div className="h-2.5 w-20 rounded-full bg-[#edf1f6]" />}
                          value=""
                          bar={null}
                        />
                      ));
                      return [...rows, ...placeholders];
                    })()}
                    {canExpandSeverityDistribution ? (
                      <ExpandDivider
                        expanded={showAllSeverityDistribution}
                        onToggle={() =>
                          setShowAllSeverityDistribution((current) => !current)
                        }
                        collapsedLabel="Mostrar más rubros de gravedad"
                        expandedLabel="Mostrar menos rubros de gravedad"
                        className="py-[0.25rem]"
                        lineClassName="border-[#edf1f6]"
                        buttonClassName="border-[#d9e1eb] text-[var(--accent)] hover:border-[#efc2cb] hover:bg-[#fff6f8] hover:text-[var(--accent)]"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                        Por sede
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleSummaryInsight("venue")}
                        className={cn(
                          "inline-flex size-7 items-center justify-center rounded-full border transition",
                          selectedSummaryInsight === "venue"
                            ? "border-[#1faa52] bg-[#1faa52] text-white hover:border-[#178546] hover:bg-[#178546]"
                            : "border-[#d9e1eb] bg-[var(--surface)] text-[#617187] hover:border-[#efc2cb] hover:bg-[#fff6f8] hover:text-[var(--accent)]",
                        )}
                        aria-label={
                          selectedSummaryInsight === "venue"
                            ? "Cerrar detalle por sede"
                            : "Ver detalle por sede"
                        }
                        title={
                          selectedSummaryInsight === "venue"
                            ? "Cerrar detalle por sede"
                            : "Ver detalle por sede"
                        }
                      >
                        <Eye className="size-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">
                      Top {Math.min(venueRecurrence.length, showAllVenueRecurrence ? 10 : 3)}
                    </span>
                  </div>
                  <div className="mt-3.5 space-y-3.5">
                    {(() => {
                      const rows = visibleVenueRecurrence.map((item) => (
                        <InsightBarRow
                          key={item.venue}
                          icon={
                            <div title={item.venue} className="flex h-full items-center justify-center">
                              <ClientTeamLogoMark
                                teamName={item.teamName}
                                competition={item.competition}
                                className="size-9 rounded-[12px] border-transparent bg-transparent shadow-none"
                                imageClassName="object-contain p-0.5"
                                initialsClassName="text-[10px] tracking-[0.12em] text-[#70819b]"
                              />
                            </div>
                          }
                          label={item.venue}
                          value={item.total}
                          barContainerClassName="bg-transparent p-0"
                          bar={
                            <div className="flex h-full overflow-hidden rounded-full bg-[#edf1f6]">
                              {item.severities["Crítica"] ? (
                                <div
                                  className="h-full bg-[#a12ad6]"
                                  style={{
                                    width: `${(item.severities["Crítica"] / item.total) * 100}%`,
                                  }}
                                />
                              ) : null}
                              {item.severities.Alta ? (
                                <div
                                  className="h-full bg-[#e44b68]"
                                  style={{
                                    width: `${(item.severities.Alta / item.total) * 100}%`,
                                  }}
                                />
                              ) : null}
                              {item.severities.Media ? (
                                <div
                                  className="h-full bg-[#e7c247]"
                                  style={{
                                    width: `${(item.severities.Media / item.total) * 100}%`,
                                  }}
                                />
                              ) : null}
                              {item.severities.Baja ? (
                                <div
                                  className="h-full bg-[#d8e2ef]"
                                  style={{
                                    width: `${(item.severities.Baja / item.total) * 100}%`,
                                  }}
                                />
                              ) : null}
                            </div>
                          }
                        />
                      ));
                      const placeholders = Array.from({ length: Math.max(0, 3 - rows.length) }, (_, i) => (
                        <InsightBarRow
                          key={`ph-venue-${i}`}
                          icon={<div className="size-9 rounded-[12px] bg-[#f0f3f8]" />}
                          label={<div className="h-2.5 w-28 rounded-full bg-[#edf1f6]" />}
                          value=""
                          barContainerClassName="bg-transparent p-0"
                          bar={
                            <div className="h-full w-full rounded-full bg-[#edf1f6]" />
                          }
                        />
                      ));
                      return [...rows, ...placeholders];
                    })()}
                    {canExpandVenueRecurrence ? (
                      <ExpandDivider
                        expanded={showAllVenueRecurrence}
                        onToggle={() => setShowAllVenueRecurrence((current) => !current)}
                        collapsedLabel="Mostrar más sedes"
                        expandedLabel="Mostrar menos sedes"
                        className="py-[0.25rem]"
                        lineClassName="border-[#edf1f6]"
                        buttonClassName="border-[#d9e1eb] text-[var(--accent)] hover:border-[#efc2cb] hover:bg-[#fff6f8] hover:text-[var(--accent)]"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-8">
            <article className="panel-surface border border-[var(--border)] bg-[var(--surface)] p-5 xl:p-6 2xl:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-black text-[var(--foreground)]">
                  Reportes por personal
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-[#edf1f6] text-[11px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                      {rankingColumnOrder.map((column) =>
                        renderRankingHeader(column),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1f6]">
                    {responsibleRanking.map((item) => (
                      <tr key={item.responsable} className="transition hover:bg-[#fafbfd]">
                        {rankingColumnOrder.map((column) =>
                          renderRankingCell(item, column),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </div>
        </>
      ) : (
        <div
          className={cn(
            "grid gap-6 transition-colors",
            hasNonSummaryDrawer
              ? "2xl:grid-cols-[minmax(0,1fr)_390px]"
              : "grid-cols-1",
          )}
        >
          <div className="flex min-w-0 flex-col gap-3">
            <SectionPageHeader
              title={summaryTitle}
              description={summaryDescription}
              actions={headerActions}
            />
            {tabsNavigation}
            {activeView === "control" ? (
              <div>{controlWorkspaceContent}</div>
            ) : (
              <IncidentsWorkspace
                incidents={incidents}
                hasGeminiKey={hasGeminiKey}
                canManageEvidence={canManageEvidence}
                embedded
                headerActionsPortalTarget={incidentsHeaderActionsPortalTarget}
                drawerPortalTarget={incidentsDrawerPortalTarget}
                onSelectedIdChange={setSelectedEmbeddedIncidentId}
              />
            )}
          </div>
          {hasNonSummaryDrawer && (
            <div
              className="fixed inset-0 z-30 bg-black/40 2xl:hidden"
              onClick={() => {
                if (activeView === "control") {
                  setSelectedReportId(null);
                  setEditingReportId(null);
                } else {
                  setSelectedEmbeddedIncidentId(null);
                }
              }}
            />
          )}
          {activeView === "control" ? selectedReportDrawer : hasEmbeddedIncidentDrawer ? (
            <div ref={setIncidentsDrawerPortalTarget} className="min-w-0 self-start" />
          ) : null}
        </div>
      )}

      <input
        ref={desktopEvidenceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={handleReportEvidenceInputChange}
      />
    </div>
  );
}
