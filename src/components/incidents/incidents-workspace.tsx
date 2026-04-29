"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type SyntheticEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  CircleX,
  Cpu,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  Eye,
  FileText,
  Gauge,
  History,
  Image as ImageIcon,
  MapPin,
  Palette,
  Pencil,
  ScanText,
  Sparkles,
  Upload,
  Wifi,
  X,
} from "lucide-react";

import { SectionAiAssistant } from "@/components/ai/section-ai-assistant";
import { LeagueLogoMarkClient } from "@/components/league-logo-mark-client";
import { SectionPageHeader } from "@/components/layout/section-page-header";
import { MatchSummaryCell } from "@/components/shared/match-summary-cell";
import { EmptyState } from "@/components/ui/empty-state";
import { PersonRoleStack } from "@/components/ui/person-role-stack";
import { PlainFullscreenWorkspace } from "@/components/ui/plain-fullscreen-workspace";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { SectionTableCard } from "@/components/ui/section-table-card";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import { ToolbarIconButton } from "@/components/ui/toolbar-icon-button";
import { ToolbarSearchField } from "@/components/ui/toolbar-search-field";
import type {
  CollaboratorReportAttachment,
  TechnicalCaptureKind,
} from "@/lib/collaborator-report-attachments";
import type {
  IncidentProblem,
  IncidentRecord,
} from "@/lib/incidents";
import { getTeamLeagueColorSet } from "@/lib/team-directory";
import { cn, formatPersonShortName } from "@/lib/utils";

type IncidentAttachment = {
  fileName: string;
  fileSizeLabel: string;
  previewUrl?: string;
};

type IncidentEvidenceState = {
  speedtestAttachment?: IncidentAttachment | null;
  pingAttachment?: IncidentAttachment | null;
  gpuAttachment?: IncidentAttachment | null;
  speedtest?: string;
  ping?: string;
  gpuLoad?: string;
  venueImages?: IncidentAttachment[];
};

type IncidentEvidencePreview = {
  title: string;
  fileName: string;
  src: string;
};

type EvidenceUploadState = {
  state: "idle" | "loading" | "error" | "done";
  message: string;
};

type IncidentSortKey =
  | "league"
  | "id"
  | "date"
  | "match"
  | "severity"
  | "operator"
  | "streamer"
  | "issue"
  | "updated";
type SortDirection = "asc" | "desc";
type IncidentControlColumn =
  | "league"
  | "id"
  | "date"
  | "match"
  | "severity"
  | "operator"
  | "streamer"
  | "issue"
  | "updated";
type IncidentPeriodMode = "day" | "week" | "month";
type IncidentPlanillaColumn =
  | "date"
  | "time"
  | "league"
  | "id"
  | "home"
  | "away"
  | "operator"
  | "streamer"
  | "severity"
  | "technicalObservation"
  | "buildingObservation"
  | "generalObservation"
  | "other"
  | "st"
  | "club"
  | "speedtest"
  | "ping"
  | "gpu"
  | "testTime"
  | "test"
  | "start"
  | "graphics"
  | "internetProblem"
  | "feedProblem"
  | "ocr"
  | "overlays"
  | "transmissionType"
  | "signalDelivery"
  | "images"
  | "aptoLineal";

const INCIDENT_CONTROL_COLUMNS_STORAGE_KEY =
  "basket-production.incidents.control-columns";
const INCIDENT_PLANILLA_WIDTHS_STORAGE_KEY =
  "basket-production.incidents.planilla-widths";

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
const DEFAULT_INCIDENT_CONTROL_COLUMNS: IncidentControlColumn[] = [
  "league",
  "id",
  "date",
  "match",
  "severity",
  "operator",
  "streamer",
  "issue",
];
const INCIDENT_CONTROL_COLUMN_SORT_KEY: Record<
  IncidentControlColumn,
  IncidentSortKey
> = {
  league: "league",
  id: "id",
  date: "date",
  match: "match",
  severity: "severity",
  operator: "operator",
  streamer: "streamer",
  issue: "issue",
  updated: "updated",
};
const INCIDENT_CONTROL_COLUMN_WIDTH_WEIGHT: Record<IncidentControlColumn, number> = {
  league: 0.75,
  id: 1,
  date: 0.55,
  match: 1.6,
  severity: 1,
  operator: 1.25,
  streamer: 1.25,
  issue: 0.85,
  updated: 0.65,
};
const INCIDENT_CONTROL_WIDE_COLUMN_WIDTH_WEIGHT: Record<IncidentControlColumn, number> = {
  league: 0.9,
  id: 1.05,
  date: 0.9,
  match: 1.7,
  severity: 1.1,
  operator: 1.35,
  streamer: 1.35,
  issue: 1.0,
  updated: 0.8,
};
const INCIDENT_CONTROL_COMPACT_COLUMN_WIDTH_WEIGHT: Record<
  IncidentControlColumn,
  number
> = {
  league: 0.8,
  id: 0.95,
  date: 0.55,
  match: 2.9,
  severity: 1,
  operator: 1.05,
  streamer: 1.05,
  issue: 0.8,
  updated: 0.75,
};
const INCIDENT_PLANILLA_COLUMNS: Array<{
  key: IncidentPlanillaColumn;
  label: string;
  width: number;
}> = [
  { key: "date", label: "Fecha", width: 92 },
  { key: "time", label: "Hora", width: 72 },
  { key: "league", label: "Liga", width: 140 },
  { key: "id", label: "ID", width: 130 },
  { key: "home", label: "Local", width: 210 },
  { key: "away", label: "Visitante", width: 210 },
  { key: "operator", label: "Operador Control", width: 190 },
  { key: "streamer", label: "Streamer", width: 180 },
  { key: "severity", label: "Gravedad", width: 120 },
  { key: "technicalObservation", label: "Observaciones Técnicas", width: 270 },
  { key: "buildingObservation", label: "Observaciones Edilicias", width: 260 },
  { key: "generalObservation", label: "Observaciones Generales", width: 260 },
  { key: "other", label: "OTRO", width: 70 },
  { key: "st", label: "ST", width: 70 },
  { key: "club", label: "CLUB", width: 80 },
  { key: "speedtest", label: "Speedtest", width: 120 },
  { key: "ping", label: "PING", width: 100 },
  { key: "gpu", label: "GPU", width: 100 },
  { key: "testTime", label: "Hora Prueba", width: 120 },
  { key: "test", label: "Prueba", width: 140 },
  { key: "start", label: "Inicio", width: 150 },
  { key: "graphics", label: "Gráfica", width: 170 },
  { key: "internetProblem", label: "Problema Internet", width: 140 },
  { key: "feedProblem", label: "Problema FEED", width: 120 },
  { key: "ocr", label: "OCR", width: 80 },
  { key: "overlays", label: "Overlays (GES)", width: 140 },
  { key: "transmissionType", label: "Tipo de transmisión", width: 170 },
  { key: "signalDelivery", label: "Envíos de señal", width: 150 },
  { key: "images", label: "Imágenes", width: 100 },
  { key: "aptoLineal", label: "Apto Lineal", width: 110 },
];
const INCIDENT_PLANILLA_MIN_COLUMN_WIDTH = 56;

function formatIncidentExportDate(value: string) {
  const date = parseIncidentEventDate(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${day}/${month}/${year}`;
}

function formatIncidentExportBoolean(value: boolean) {
  return value ? "SI" : "NO";
}

function formatIncidentExportCheck(value: string) {
  return getBinaryIncidentCheckState(value).label === "Sí" ? "SI" : "NO";
}

function getIncidentProblemValue(incident: IncidentRecord, label: string) {
  return formatIncidentExportBoolean(
    incident.problems.some((problem) => problem.label === label && problem.active),
  );
}

const INCIDENT_EXPORT_COLUMNS = [
  {
    label: "ID",
    value: (incident: IncidentRecord) => incident.id,
  },
  {
    label: "Liga",
    value: (incident: IncidentRecord) => getIncidentLeagueLabel(incident.competition),
  },
  {
    label: "Fecha",
    value: (incident: IncidentRecord) => formatIncidentExportDate(incident.eventDate),
  },
  {
    label: "Hora",
    value: (incident: IncidentRecord) => getIncidentTimeLabel(incident.updatedAt),
  },
  {
    label: "Local",
    value: (incident: IncidentRecord) =>
      splitIncidentMatchLabel(incident.matchLabel).homeTeam,
  },
  {
    label: "Visitante",
    value: (incident: IncidentRecord) =>
      splitIncidentMatchLabel(incident.matchLabel).awayTeam,
  },
  {
    label: "Operador Control",
    value: (incident: IncidentRecord) => incident.operatorControl,
  },
  {
    label: "Streamer",
    value: (incident: IncidentRecord) => incident.streamer,
  },
  {
    label: "Gravedad",
    value: (incident: IncidentRecord) => incident.severity,
  },
  {
    label: "Observaciones Técnicas",
    value: (incident: IncidentRecord) => incident.observations,
  },
  {
    label: "Observaciones Edilicias",
    value: () => "",
  },
  {
    label: "Observaciones Generales",
    value: (incident: IncidentRecord) => incident.mainIssue,
  },
  {
    label: "OTRO",
    value: () => "-",
  },
  {
    label: "ST",
    value: () => "-",
  },
  {
    label: "CLUB",
    value: () => "-",
  },
  {
    label: "Speedtest",
    value: (incident: IncidentRecord) => incident.speedtest,
  },
  {
    label: "PING",
    value: (incident: IncidentRecord) => incident.ping,
  },
  {
    label: "GPU",
    value: (incident: IncidentRecord) => incident.gpuLoad,
  },
  {
    label: "Hora Prueba",
    value: (incident: IncidentRecord) => incident.testTime,
  },
  {
    label: "Prueba",
    value: (incident: IncidentRecord) => formatIncidentExportCheck(incident.testCheck),
  },
  {
    label: "Inicio",
    value: (incident: IncidentRecord) => formatIncidentExportCheck(incident.startCheck),
  },
  {
    label: "Gráfica",
    value: (incident: IncidentRecord) => formatIncidentExportCheck(incident.graphicsCheck),
  },
  {
    label: "Problema Internet",
    value: (incident: IncidentRecord) => getIncidentProblemValue(incident, "Problema Internet"),
  },
  {
    label: "Problema IMG",
    value: (incident: IncidentRecord) => getIncidentProblemValue(incident, "Problema IMG"),
  },
  {
    label: "OCR",
    value: (incident: IncidentRecord) => getIncidentProblemValue(incident, "OCR"),
  },
  {
    label: "Overlays (GES)",
    value: (incident: IncidentRecord) => getIncidentProblemValue(incident, "Overlays (GES)"),
  },
  {
    label: "Tipo de transmisión",
    value: (incident: IncidentRecord) => incident.transmissionType,
  },
  {
    label: "Envíos de señal",
    value: (incident: IncidentRecord) => incident.signalDelivery,
  },
  {
    label: "Imágenes",
    value: (incident: IncidentRecord) =>
      formatIncidentExportBoolean((incident.venueImages?.length ?? 0) > 0),
  },
  {
    label: "Apto Lineal",
    value: (incident: IncidentRecord) => formatIncidentExportBoolean(incident.aptoLineal),
  },
] as const;

function normalizeIncidentControlColumns(
  value: unknown,
): IncidentControlColumn[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const nextColumns = value.filter((item): item is IncidentControlColumn =>
    DEFAULT_INCIDENT_CONTROL_COLUMNS.includes(item as IncidentControlColumn),
  );

  if (
    nextColumns.length !== DEFAULT_INCIDENT_CONTROL_COLUMNS.length ||
    new Set(nextColumns).size !== DEFAULT_INCIDENT_CONTROL_COLUMNS.length
  ) {
    return null;
  }

  return nextColumns;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toIncidentAttachment(
  attachment: CollaboratorReportAttachment & { signedUrl?: string },
): IncidentAttachment {
  return {
    fileName: attachment.fileName,
    fileSizeLabel: formatBytes(attachment.sizeBytes),
    previewUrl: attachment.signedUrl,
  };
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getIncidentLeagueLabel(competition: string) {
  return competition.split(/\s[-•]\s/)[0]?.trim() || competition;
}

function getIncidentTimeLabel(updatedAt: string) {
  const match = updatedAt.match(/\b(\d{1,2}:\d{2})/);
  return match?.[1] ?? updatedAt;
}

function parseIncidentEventDate(value: string) {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(\d{1,2})\s+([a-záéíóúñ]+)\s+(\d{4})$/i);

  if (!match) {
    return new Date(value);
  }

  const [, day, monthLabel, year] = match;
  const monthIndex = MONTHS_ES.findIndex((month) => month === monthLabel);

  return new Date(Number(year), Math.max(monthIndex, 0), Number(day));
}

function getIncidentDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getIncidentMonthKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function getIncidentWeekIndexInMonth(date: Date) {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

function getIncidentWeekKey(date: Date) {
  return `${getIncidentMonthKey(date)}-w${getIncidentWeekIndexInMonth(date)}`;
}

function getIncidentWeekLabelFromDate(date: Date) {
  return `SEM ${getIncidentWeekIndexInMonth(date)} ${MONTHS_ABBR_ES[date.getMonth()]} ${String(
    date.getFullYear(),
  ).slice(-2)}`;
}

function getIncidentShortDayLabel(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS_ABBR_ES[date.getMonth()]} ${String(
    date.getFullYear(),
  ).slice(-2)}`;
}

function formatCompactIncidentDate(value: string) {
  const date = parseIncidentEventDate(value);
  const day = String(date.getDate()).padStart(2, "0");

  return `${day} ${MONTHS_ABBR_ES[date.getMonth()] ?? ""}`;
}

function splitIncidentMatchLabel(matchLabel: string) {
  const [homeTeam, awayTeam] = matchLabel.split(/\s+vs\s+/i);

  return {
    homeTeam: homeTeam?.trim() || matchLabel,
    awayTeam: awayTeam?.trim() || "",
  };
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

function getIncidentLeagueAccentColor(league: string) {
  return getTeamLeagueColorSet(league).accent;
}

function groupIncidentsByLeague(incidents: IncidentRecord[]) {
  const groups = new Map<string, IncidentRecord[]>();

  incidents.forEach((incident) => {
    const league = getIncidentLeagueLabel(incident.competition);
    const currentGroup = groups.get(league) ?? [];
    currentGroup.push(incident);
    groups.set(league, currentGroup);
  });

  return Array.from(groups.entries()).map(([league, items]) => ({
    league,
    items,
  }));
}

function buildIncidentsExcelDocument(
  incidentGroups: ReturnType<typeof groupIncidentsByLeague>,
) {
  const documentTitle =
    incidentGroups.length === 1
      ? incidentGroups[0]?.league ?? "Incidencias"
      : "Todas las incidencias";
  const headerRow = INCIDENT_EXPORT_COLUMNS.map(
    (column) =>
      `<th style="border:1px solid #dbe4f0;background:#0f172a;color:#ffffff;padding:10px 12px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">${escapeHtml(
        column.label,
      )}</th>`,
  ).join("");

  const sections = incidentGroups
    .map(({ league, items }) => {
      const accent = getIncidentLeagueAccentColor(league);
      const leagueHeader =
        incidentGroups.length > 1
          ? `
          <tr>
            <td colspan="${INCIDENT_EXPORT_COLUMNS.length}" style="border:1px solid ${accent};background:${accent};color:#ffffff;padding:12px 14px;font-size:14px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">
              ${escapeHtml(league)}
            </td>
          </tr>
        `
          : "";
      const rows = items
        .map((incident, rowIndex) => {
          const background = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
          const cells = INCIDENT_EXPORT_COLUMNS.map((column) => {
            const value = escapeHtml(column.value(incident));
            const forceText = column.label === "ID" ? "mso-number-format:'\\@';" : "";

            return `<td style="border:1px solid #dbe4f0;background:${background};padding:9px 12px;font-size:12px;color:#0f172a;vertical-align:top;${forceText}">${value}</td>`;
          }).join("");

          return `<tr>${cells}</tr>`;
        })
        .join("");

      return `
        <table style="width:100%;border-collapse:collapse;margin:0 0 20px 0;font-family:Arial,sans-serif;">
          ${leagueHeader}
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
    <title>${escapeHtml(documentTitle)}</title>
  </head>
  <body style="margin:16px;background:#f8fafc;font-family:Arial,sans-serif;">
    <div style="margin-bottom:16px;">
      <div style="font-size:18px;font-weight:800;color:#0f172a;">${escapeHtml(documentTitle)}</div>
    </div>
    ${sections}
  </body>
</html>`;
}

function getIncidentSeverityOrder(severity: string) {
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

function getIncidentUpdatedOrder(updatedAt: string) {
  const [hours, minutes] = getIncidentTimeLabel(updatedAt)
    .split(":")
    .map((value) => Number(value));

  return (hours || 0) * 60 + (minutes || 0);
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

function getIncidentRowTone(severity: string) {
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

function getIncidentSeverityPanelTone(severity: string) {
  switch (severity) {
    case "Crítica":
      return {
        panel: "border-[#edd7fb] bg-[#fbf5ff]",
        label: "text-[#a12ad6]",
        value: "text-[#7f1fb2]",
      };
    case "Alta":
      return {
        panel: "border-[#ffd6df] bg-[#fff4f6]",
        label: "text-[#cf2246]",
        value: "text-[#b51f3e]",
      };
    case "Media":
      return {
        panel: "border-[#f4e1a6] bg-[#fffdf2]",
        label: "text-[#b78611]",
        value: "text-[#9b730b]",
      };
    case "Baja":
      return {
        panel: "border-[#f3e7b8] bg-[#fffef8]",
        label: "text-[#b79734]",
        value: "text-[#8f7a2f]",
      };
    default:
      return {
        panel: "border-[#cde9d7] bg-[#f4fcf7]",
        label: "text-[#17945b]",
        value: "text-[#167447]",
      };
  }
}

function getIncidentActivityTone(tone?: "accent" | "warning" | "neutral" | "success") {
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

function ProblemPill({ problem }: { problem: IncidentProblem }) {
  const { Icon } = getProblemMeta(problem.label);

  return (
    <div
      className={cn(
        "panel-radius flex min-h-[42px] items-center gap-3.5 border px-3 py-2",
        problem.active
          ? "border-[#ffd8df] bg-[#fff3f6]"
          : "border-[#e7eaef] bg-white",
      )}
    >
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
          problem.active ? "bg-[#ffe7ed] text-[var(--accent)]" : "bg-[#f4f7fb] text-[#b0b8c5]",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span
        className={cn(
          "text-sm font-semibold leading-tight",
          problem.active ? "text-[#9f1633]" : "text-[#70819b]",
        )}
      >
        {problem.label}
      </span>
    </div>
  );
}

function getProblemMeta(label: string) {
  const normalizedLabel = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (normalizedLabel === "ST" || normalizedLabel.includes("SPEEDTEST")) {
    return { label: "ST", Icon: Gauge };
  }

  if (normalizedLabel.includes("PING")) {
    return { label: "PING", Icon: Wifi };
  }

  if (normalizedLabel.includes("GPU")) {
    return { label: "GPU", Icon: Cpu };
  }

  if (normalizedLabel.includes("CLUB")) {
    return { label: "CLUB", Icon: Building2 };
  }

  if (normalizedLabel.includes("OTRO")) {
    return { label: "OTRO", Icon: CircleHelp };
  }

  if (normalizedLabel.includes("INTERNET")) {
    return { label: "INTERNET", Icon: Wifi };
  }

  if (normalizedLabel.includes("OCR")) {
    return { label: "OCR", Icon: ScanText };
  }

  if (normalizedLabel.includes("OVERLAYS")) {
    return { label: "GES", Icon: Sparkles };
  }

  if (normalizedLabel.includes("IMG")) {
    return { label: "IMG", Icon: ImageIcon };
  }

  if (normalizedLabel.includes("GRAFICA")) {
    return { label: "GRÁFICA", Icon: Palette };
  }

  return { label: label.toUpperCase(), Icon: AlertTriangle };
}

function getIncidentIssueSortValue(incident: IncidentRecord) {
  const activeLabels = incident.problems
    .filter((problem) => problem.active)
    .map((problem) => getProblemMeta(problem.label).label)
    .join(" ");

  return activeLabels || "SIN MARCAS";
}

function buildIncidentAttachmentPreview(
  title: string,
  fileName: string,
  accentColor: string,
) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" fill="none">
      <rect width="1200" height="900" rx="48" fill="#F8FAFC"/>
      <rect x="56" y="56" width="1088" height="788" rx="36" fill="white" stroke="#E2E8F0" stroke-width="4"/>
      <rect x="96" y="96" width="260" height="54" rx="27" fill="${accentColor}" fill-opacity="0.12"/>
      <text x="128" y="130" fill="${accentColor}" font-size="26" font-family="Arial, sans-serif" font-weight="700">${title}</text>
      <text x="96" y="236" fill="#0F172A" font-size="56" font-family="Arial, sans-serif" font-weight="700">Vista asociada</text>
      <text x="96" y="302" fill="#64748B" font-size="30" font-family="Arial, sans-serif">${fileName}</text>
      <rect x="96" y="368" width="1008" height="356" rx="28" fill="${accentColor}" fill-opacity="0.08" stroke="${accentColor}" stroke-opacity="0.22" stroke-width="3"/>
      <circle cx="214" cy="484" r="64" fill="${accentColor}" fill-opacity="0.14"/>
      <path d="M180 516h68l26-34 32 42 44-60 70 52H180z" fill="${accentColor}" fill-opacity="0.85"/>
      <circle cx="264" cy="450" r="18" fill="${accentColor}" fill-opacity="0.9"/>
      <text x="96" y="790" fill="#94A3B8" font-size="24" font-family="Arial, sans-serif">Adjunto disponible para revisión operativa</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getIncidentAttachmentPreviewSource(
  attachment: IncidentAttachment | null | undefined,
  title: string,
  accentColor: string,
) {
  if (!attachment) {
    return null;
  }

  return (
    attachment.previewUrl ??
    buildIncidentAttachmentPreview(title, attachment.fileName, accentColor)
  );
}

function getBinaryIncidentCheckState(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  const negativeTerms = [
    "incompleta",
    "parcial",
    "incidencia",
    "demora",
    "seguimiento",
    "manual",
    "reinici",
  ];
  const positiveTerms = ["ok", "normal", "estable", "sin novedad", "completa"];

  const isNegative = negativeTerms.some((term) => normalizedValue.includes(term));
  const isPositive = positiveTerms.some((term) => normalizedValue.includes(term));

  if (!isNegative && isPositive) {
    return {
      label: "Sí",
      Icon: Check,
      iconClassName: "text-white",
      iconWrapClassName: "bg-[#22c55e]",
      panelClassName: "border-[#d7eadf] bg-[#f3fcf6]",
      labelClassName: "text-[#178a56]",
    };
  }

  return {
    label: "No",
    Icon: CircleX,
    iconClassName: "text-[#f04461]",
    iconWrapClassName: "bg-[#ffe7ed]",
    panelClassName: "border-[#ffd8df] bg-[#fff3f6]",
    labelClassName: "text-[#b42318]",
  };
}

function getBooleanCheckState(isOk: boolean) {
  if (isOk) {
    return {
      label: "Sí",
      Icon: Check,
      iconClassName: "text-white",
      iconWrapClassName: "bg-[#22c55e]",
      panelClassName: "border-[#d7eadf] bg-[#f3fcf6]",
      labelClassName: "text-[#178a56]",
    };
  }
  return {
    label: "No",
    Icon: CircleX,
    iconClassName: "text-[#f04461]",
    iconWrapClassName: "bg-[#ffe7ed]",
    panelClassName: "border-[#ffd8df] bg-[#fff3f6]",
    labelClassName: "text-[#b42318]",
  };
}

function ActiveProblemSummary({ problems }: { problems: IncidentProblem[] }) {
  const activeProblems = problems.filter((problem) => problem.active);

  if (activeProblems.length === 0) {
    return (
      <span
        title="SIN MARCAS"
        className="inline-flex size-8 items-center justify-center rounded-full bg-[#22c55e] text-white"
      >
        <Check className="size-4" />
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeProblems.map((problem) => {
        const { label, Icon } = getProblemMeta(problem.label);

        return (
          <span
            key={problem.label}
            title={label}
            className="inline-flex size-8 items-center justify-center rounded-full border border-[#ffd8df] bg-[#fff3f6] text-[var(--accent)]"
          >
            <Icon className="size-4" />
          </span>
        );
      })}
    </div>
  );
}

export function IncidentsWorkspace({
  incidents,
  hasGeminiKey,
  canManageEvidence = false,
  embedded = false,
  initialQuery = "",
  headerActionsPortalTarget = null,
  drawerPortalTarget = null,
  onSelectedIdChange,
  plainPeriodLabel = "Corte visible",
}: {
  incidents: IncidentRecord[];
  hasGeminiKey: boolean;
  canManageEvidence?: boolean;
  embedded?: boolean;
  initialQuery?: string;
  headerActionsPortalTarget?: HTMLElement | null;
  drawerPortalTarget?: HTMLElement | null;
  onSelectedIdChange?: (selectedId: string | null) => void;
  plainPeriodLabel?: string;
}) {
  const router = useRouter();
  const desktopEvidenceInputRef = useRef<HTMLInputElement | null>(null);
  const [isRefreshingEvidence, startRefreshingEvidence] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);
  const [editedChecksByIncident, setEditedChecksByIncident] = useState<
    Record<string, {
      testCheck?: boolean;
      startCheck?: boolean;
      graphicsCheck?: boolean;
      aptoLineal?: boolean;
      testTime?: string;
      technicalObservation?: string;
      buildingObservation?: string;
      generalObservation?: string;
    }>
  >({});
  const [drawerTab, setDrawerTab] = useState<
    "details" | "activity" | "notes" | "images"
  >("details");
  const [query, setQuery] = useState(initialQuery);
  const [leagueFilter, setLeagueFilter] = useState("Todas las ligas");
  const latestIncidentDate = useMemo(() => {
    return incidents.reduce((latest, incident) => {
      const incidentDate = parseIncidentEventDate(incident.eventDate);
      return incidentDate > latest ? incidentDate : latest;
    }, parseIncidentEventDate(incidents[0]?.eventDate ?? "1 enero 2026"));
  }, [incidents]);
  const [periodMode, setPeriodMode] = useState<IncidentPeriodMode>("month");
  const [selectedDayKey, setSelectedDayKey] = useState(() =>
    getIncidentDateKey(latestIncidentDate),
  );
  const [selectedWeekKey, setSelectedWeekKey] = useState(() =>
    getIncidentWeekKey(latestIncidentDate),
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState(() =>
    getIncidentMonthKey(latestIncidentDate),
  );
  const [sortBy, setSortBy] = useState<IncidentSortKey>("severity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [columnOrder, setColumnOrder] = useState<IncidentControlColumn[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_INCIDENT_CONTROL_COLUMNS;
    }

    try {
      const parsedColumns = normalizeIncidentControlColumns(
        JSON.parse(
          window.localStorage.getItem(INCIDENT_CONTROL_COLUMNS_STORAGE_KEY) ??
            "null",
        ),
      );

      return parsedColumns ?? DEFAULT_INCIDENT_CONTROL_COLUMNS;
    } catch {
      window.localStorage.removeItem(INCIDENT_CONTROL_COLUMNS_STORAGE_KEY);
      return DEFAULT_INCIDENT_CONTROL_COLUMNS;
    }
  });
  const [draggedColumn, setDraggedColumn] =
    useState<IncidentControlColumn | null>(null);
  const [dragOverColumn, setDragOverColumn] =
    useState<IncidentControlColumn | null>(null);
  const planillaResizeStateRef = useRef<{
    column: IncidentPlanillaColumn;
    startX: number;
    startWidth: number;
  } | null>(null);
  const [resizingPlanillaColumn, setResizingPlanillaColumn] =
    useState<IncidentPlanillaColumn | null>(null);
  const [incidentPlanillaWidths, setIncidentPlanillaWidths] = useState<
    Record<IncidentPlanillaColumn, number>
  >(() => {
    const defaults = INCIDENT_PLANILLA_COLUMNS.reduce(
      (accumulator, column) => {
        accumulator[column.key] = column.width;
        return accumulator;
      },
      {} as Record<IncidentPlanillaColumn, number>,
    );

    if (typeof window === "undefined") {
      return defaults;
    }

    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(INCIDENT_PLANILLA_WIDTHS_STORAGE_KEY) ??
          "null",
      ) as Partial<Record<IncidentPlanillaColumn, number>> | null;

      if (!parsed) {
        return defaults;
      }

      return INCIDENT_PLANILLA_COLUMNS.reduce(
        (accumulator, column) => {
          const width = parsed[column.key];
          accumulator[column.key] =
            typeof width === "number" && Number.isFinite(width)
              ? Math.max(INCIDENT_PLANILLA_MIN_COLUMN_WIDTH, width)
              : column.width;
          return accumulator;
        },
        {} as Record<IncidentPlanillaColumn, number>,
      );
    } catch {
      window.localStorage.removeItem(INCIDENT_PLANILLA_WIDTHS_STORAGE_KEY);
      return defaults;
    }
  });
  const [isExporting, setIsExporting] = useState(false);
  const [evidenceByIncident, setEvidenceByIncident] = useState<
    Record<string, IncidentEvidenceState>
  >({});
  const [evidencePreview, setEvidencePreview] =
    useState<IncidentEvidencePreview | null>(null);
  const [desktopUploadTarget, setDesktopUploadTarget] = useState<{
    incidentId: string;
    kind: TechnicalCaptureKind;
  } | null>(null);
  const [uploadStateByIncident, setUploadStateByIncident] = useState<
    Record<string, Partial<Record<TechnicalCaptureKind, EvidenceUploadState>>>
  >({});

  function handleSort(nextSortBy: IncidentSortKey) {
    if (sortBy === nextSortBy) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection(nextSortBy === "severity" || nextSortBy === "updated" ? "desc" : "asc");
  }

  function startIncidentPlanillaResize(
    column: IncidentPlanillaColumn,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
    planillaResizeStateRef.current = {
      column,
      startX: event.clientX,
      startWidth: incidentPlanillaWidths[column],
    };
    setResizingPlanillaColumn(column);
  }

  function handleColumnDragStart(column: IncidentControlColumn) {
    setDraggedColumn(column);
    setDragOverColumn(column);
  }

  function handleColumnDragOver(column: IncidentControlColumn) {
    if (draggedColumn && draggedColumn !== column) {
      setDragOverColumn(column);
    }
  }

  function handleColumnDrop(column: IncidentControlColumn) {
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

  useEffect(() => {
    window.localStorage.setItem(
      INCIDENT_CONTROL_COLUMNS_STORAGE_KEY,
      JSON.stringify(columnOrder),
    );
  }, [columnOrder]);

  useEffect(() => {
    window.localStorage.setItem(
      INCIDENT_PLANILLA_WIDTHS_STORAGE_KEY,
      JSON.stringify(incidentPlanillaWidths),
    );
  }, [incidentPlanillaWidths]);

  useEffect(() => {
    if (!resizingPlanillaColumn) {
      return undefined;
    }

    function handleMouseMove(event: MouseEvent) {
      const state = planillaResizeStateRef.current;

      if (!state) {
        return;
      }

      const delta = event.clientX - state.startX;
      const width = Math.max(
        INCIDENT_PLANILLA_MIN_COLUMN_WIDTH,
        state.startWidth + delta,
      );

      setIncidentPlanillaWidths((current) => ({
        ...current,
        [state.column]: width,
      }));
    }

    function handleMouseUp() {
      planillaResizeStateRef.current = null;
      setResizingPlanillaColumn(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingPlanillaColumn]);

  useEffect(() => {
    setEvidencePreview(null);
  }, [selectedId]);

  useEffect(() => {
    onSelectedIdChange?.(selectedId);
  }, [onSelectedIdChange, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedId(null);
        setDrawerTab("details");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  const leagueOptions = useMemo(() => {
    return [
      "Todas las ligas",
      ...new Set(incidents.map((incident) => getIncidentLeagueLabel(incident.competition))),
    ];
  }, [incidents]);

  const dayOptions = useMemo(() => {
    const options = new Map<string, string>();

    incidents.forEach((incident) => {
      const date = parseIncidentEventDate(incident.eventDate);
      options.set(getIncidentDateKey(date), getIncidentShortDayLabel(date));
    });

    return Array.from(options.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => right.value.localeCompare(left.value));
  }, [incidents]);

  const weekOptions = useMemo(() => {
    const options = new Map<string, { label: string; sortValue: number }>();

    incidents.forEach((incident) => {
      const date = parseIncidentEventDate(incident.eventDate);
      options.set(getIncidentWeekKey(date), {
        label: getIncidentWeekLabelFromDate(date),
        sortValue: date.getTime(),
      });
    });

    return Array.from(options.entries())
      .map(([value, meta]) => ({
        value,
        label: meta.label,
        sortValue: meta.sortValue,
      }))
      .sort((left, right) => right.sortValue - left.sortValue);
  }, [incidents]);

  const monthOptions = useMemo(() => {
    const year = latestIncidentDate.getFullYear();

    return MONTHS_ES.map((_, monthIndex) => ({
      value: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
      label: `${MONTHS_ABBR_ES[monthIndex]} ${String(year).slice(-2)}`,
    }));
  }, [latestIncidentDate]);

  const activePeriodOptions =
    periodMode === "day"
      ? dayOptions
      : periodMode === "week"
        ? weekOptions
        : monthOptions;
  const activePeriodValue =
    periodMode === "day"
      ? selectedDayKey
      : periodMode === "week"
        ? selectedWeekKey
        : selectedMonthKey;
  const activeIncidentPeriodLabel =
    activePeriodOptions.find((option) => option.value === activePeriodValue)
      ?.label ?? plainPeriodLabel;

  const baseFilteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const incidentDate = parseIncidentEventDate(incident.eventDate);

      if (
        leagueFilter !== "Todas las ligas" &&
        getIncidentLeagueLabel(incident.competition) !== leagueFilter
      ) {
        return false;
      }

      if (
        periodMode === "day" &&
        getIncidentDateKey(incidentDate) !== selectedDayKey
      ) {
        return false;
      }

      if (
        periodMode === "week" &&
        getIncidentWeekKey(incidentDate) !== selectedWeekKey
      ) {
        return false;
      }

      if (
        periodMode === "month" &&
        getIncidentMonthKey(incidentDate) !== selectedMonthKey
      ) {
        return false;
      }

      return true;
    });
  }, [
    incidents,
    leagueFilter,
    periodMode,
    selectedDayKey,
    selectedMonthKey,
    selectedWeekKey,
  ]);

  const filteredIncidents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return baseFilteredIncidents;
    }

    return baseFilteredIncidents.filter((incident) =>
      [
        incident.id,
        incident.matchCode,
        incident.matchLabel,
        incident.competition,
        incident.operatorControl,
        incident.streamer,
        incident.mainIssue,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [baseFilteredIncidents, query]);

  const sortedIncidents = useMemo(() => {
    const nextItems = [...filteredIncidents];

    nextItems.sort((left, right) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1;

      const comparison =
        sortBy === "league"
          ? getIncidentLeagueLabel(left.competition).localeCompare(
              getIncidentLeagueLabel(right.competition),
              "es",
              { sensitivity: "base" },
            )
          : sortBy === "id"
            ? left.id.localeCompare(right.id, "es", {
                numeric: true,
                sensitivity: "base",
              })
            : sortBy === "date"
              ? parseIncidentEventDate(left.eventDate).getTime() -
                parseIncidentEventDate(right.eventDate).getTime()
            : sortBy === "match"
              ? left.matchLabel.localeCompare(right.matchLabel, "es")
              : sortBy === "severity"
                ? getIncidentSeverityOrder(left.severity) - getIncidentSeverityOrder(right.severity)
                : sortBy === "operator"
                  ? left.operatorControl.localeCompare(right.operatorControl, "es")
                  : sortBy === "streamer"
                    ? left.streamer.localeCompare(right.streamer, "es")
                    : sortBy === "issue"
                      ? getIncidentIssueSortValue(left).localeCompare(
                          getIncidentIssueSortValue(right),
                          "es",
                        )
                      : getIncidentUpdatedOrder(left.updatedAt) -
                        getIncidentUpdatedOrder(right.updatedAt);

      return comparison * directionFactor;
    });

    return nextItems;
  }, [filteredIncidents, sortBy, sortDirection]);

  const selectedIncident =
    sortedIncidents.find((incident) => incident.id === selectedId) ?? null;
  const selectedEvidence = selectedIncident ? evidenceByIncident[selectedIncident.id] ?? {} : {};
  const selectedUploadState =
    selectedIncident ? uploadStateByIncident[selectedIncident.id] ?? {} : {};
  const resolvedSpeedtest =
    selectedEvidence.speedtest ?? selectedIncident?.speedtest ?? "";
  const resolvedPingValue = selectedEvidence.ping ?? selectedIncident?.ping ?? "";
  const resolvedGpuValue = selectedEvidence.gpuLoad ?? selectedIncident?.gpuLoad ?? "";
  const selectedPingAttachment =
    selectedEvidence.pingAttachment ?? selectedIncident?.pingAttachment ?? null;
  const selectedGpuAttachment =
    selectedEvidence.gpuAttachment ?? selectedIncident?.gpuAttachment ?? null;
  const selectedSpeedtestAttachment =
    selectedEvidence.speedtestAttachment ?? selectedIncident?.speedtestAttachment ?? null;
  const selectedVenueImages =
    selectedEvidence.venueImages ?? selectedIncident?.venueImages ?? [];
  const selectedSeverityTone = selectedIncident
    ? getIncidentSeverityPanelTone(selectedIncident.severity)
    : null;
  const selectedIncidentTeams = selectedIncident
    ? splitIncidentMatchLabel(selectedIncident.matchLabel)
    : null;
  const isSelectedIncidentEditing = editingIncidentId === selectedIncident?.id;
  const editedChecks = selectedIncident ? editedChecksByIncident[selectedIncident.id] : undefined;
  const resolvedTestCheckBool = selectedIncident
    ? (editedChecks?.testCheck ?? (getBinaryIncidentCheckState(selectedIncident.testCheck).label === "Sí"))
    : null;
  const resolvedStartCheckBool = selectedIncident
    ? (editedChecks?.startCheck ?? (getBinaryIncidentCheckState(selectedIncident.startCheck).label === "Sí"))
    : null;
  const resolvedGraphicsCheckBool = selectedIncident
    ? (editedChecks?.graphicsCheck ?? (getBinaryIncidentCheckState(selectedIncident.graphicsCheck).label === "Sí"))
    : null;
  const resolvedAptoLineal = selectedIncident
    ? (editedChecks?.aptoLineal ?? selectedIncident.aptoLineal)
    : null;
  const selectedTestCheck = resolvedTestCheckBool !== null ? getBooleanCheckState(resolvedTestCheckBool) : null;
  const selectedStartCheck = resolvedStartCheckBool !== null ? getBooleanCheckState(resolvedStartCheckBool) : null;
  const selectedGraphicsCheck = resolvedGraphicsCheckBool !== null ? getBooleanCheckState(resolvedGraphicsCheckBool) : null;
  const resolvedTestTime = selectedIncident
    ? (editedChecks?.testTime ?? selectedIncident.testTime)
    : null;
  const resolvedTechnicalObservation = selectedIncident
    ? (editedChecks?.technicalObservation ?? selectedIncident.technicalObservation)
    : null;
  const resolvedBuildingObservation = selectedIncident
    ? (editedChecks?.buildingObservation ?? selectedIncident.buildingObservation)
    : null;
  const resolvedGeneralObservation = selectedIncident
    ? (editedChecks?.generalObservation ?? selectedIncident.generalObservation)
    : null;
  const selectedSpeedtestPreviewSrc = getIncidentAttachmentPreviewSource(
    selectedSpeedtestAttachment,
    "Speedtest",
    "#E61238",
  );
  const selectedPingPreviewSrc = getIncidentAttachmentPreviewSource(
    selectedPingAttachment,
    "Ping",
    "#0F766E",
  );
  const selectedGpuPreviewSrc = getIncidentAttachmentPreviewSource(
    selectedGpuAttachment,
    "GPU",
    "#7C3AED",
  );
  const isDesktopEvidenceBusy =
    isRefreshingEvidence ||
    selectedUploadState.speedtest?.state === "loading" ||
    selectedUploadState.ping?.state === "loading" ||
    selectedUploadState.gpu?.state === "loading";

  function handleVenueImagesChange(incident: IncidentRecord, files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setEvidenceByIncident((current) => ({
      ...current,
      [incident.id]: {
        ...current[incident.id],
        venueImages: Array.from(files).map((file) => ({
          fileName: file.name,
          fileSizeLabel: formatBytes(file.size),
          previewUrl: URL.createObjectURL(file),
        })),
      },
    }));
  }

  function toggleEditedCheck(
    incidentId: string,
    field: "testCheck" | "startCheck" | "graphicsCheck" | "aptoLineal",
    currentValue: boolean,
  ) {
    setEditedChecksByIncident((prev) => ({
      ...prev,
      [incidentId]: { ...prev[incidentId], [field]: !currentValue },
    }));
  }

  function setEditedField(
    incidentId: string,
    field: "testTime" | "technicalObservation" | "buildingObservation" | "generalObservation",
    value: string,
  ) {
    setEditedChecksByIncident((prev) => ({
      ...prev,
      [incidentId]: { ...prev[incidentId], [field]: value },
    }));
  }

  async function updateIncidentPlanillaField(
    incident: IncidentRecord,
    payload: {
      severity?: string;
      technicalObservations?: string;
      buildingObservations?: string;
      generalObservations?: string;
      testTime?: string;
      testCheck?: boolean;
      startCheck?: boolean;
      graphicsCheck?: boolean;
      aptoLineal?: boolean;
    },
  ) {
    const response = await fetch("/api/collaborator-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: incident.sourceReportId,
        ...payload,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(body?.error ?? "No pudimos actualizar la incidencia.");
    }

    router.refresh();
  }

  function openEvidencePreview(
    title: string,
    attachment: IncidentAttachment | null | undefined,
    src: string | null,
  ) {
    if (!attachment || !src) {
      return;
    }

    setEvidencePreview({
      title,
      fileName: attachment.fileName,
      src,
    });
  }

  function setIncidentUploadState(
    incidentId: string,
    kind: TechnicalCaptureKind,
    nextState: EvidenceUploadState,
  ) {
    setUploadStateByIncident((current) => ({
      ...current,
      [incidentId]: {
        ...current[incidentId],
        [kind]: nextState,
      },
    }));
  }

  function openDesktopEvidencePicker(
    incident: IncidentRecord,
    kind: TechnicalCaptureKind,
  ) {
    if (!canManageEvidence) {
      return;
    }

    setDesktopUploadTarget({
      incidentId: incident.id,
      kind,
    });

    if (desktopEvidenceInputRef.current) {
      desktopEvidenceInputRef.current.value = "";
      desktopEvidenceInputRef.current.click();
    }
  }

  async function handleDesktopEvidenceUpload(
    incident: IncidentRecord,
    kind: TechnicalCaptureKind,
    file: File,
  ) {
    setIncidentUploadState(incident.id, kind, {
      state: "loading",
      message: "Subiendo evidencia...",
    });

    try {
      const formData = new FormData();
      formData.set("assignmentId", incident.assignmentId);
      formData.set("matchId", incident.matchId);
      formData.set("reportId", incident.sourceReportId);
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
          ? toIncidentAttachment(payload.attachment)
          : null;
      const uploadedValue =
        typeof payload?.value === "string" && payload.value.trim()
          ? payload.value.trim()
          : null;

      setEvidenceByIncident((current) => {
        const incidentEvidence = current[incident.id] ?? {};

        return {
          ...current,
          [incident.id]: {
            ...incidentEvidence,
            ...(kind === "speedtest"
              ? {
                  speedtestAttachment:
                    uploadedAttachment ?? incidentEvidence.speedtestAttachment ?? null,
                  ...(uploadedValue ? { speedtest: uploadedValue } : {}),
                }
              : kind === "ping"
                ? {
                    pingAttachment:
                      uploadedAttachment ?? incidentEvidence.pingAttachment ?? null,
                    ...(uploadedValue ? { ping: uploadedValue } : {}),
                  }
                : {
                    gpuAttachment:
                      uploadedAttachment ?? incidentEvidence.gpuAttachment ?? null,
                    ...(uploadedValue ? { gpuLoad: uploadedValue } : {}),
                  }),
          },
        };
      });

      setIncidentUploadState(incident.id, kind, {
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

      setIncidentUploadState(incident.id, kind, {
        state: "error",
        message,
      });
    }
  }

  function handleDesktopEvidenceInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const target = desktopUploadTarget;
    event.currentTarget.value = "";
    setDesktopUploadTarget(null);

    if (!file || !target) {
      return;
    }

    const incident = incidents.find((item) => item.id === target.incidentId);

    if (!incident) {
      return;
    }

    void handleDesktopEvidenceUpload(incident, target.kind, file);
  }

  const metrics = useMemo(() => {
    const total = filteredIncidents.length;
    const critical = filteredIncidents.filter(
      (incident) => incident.severity === "Crítica",
    ).length;
    const mediumHigh = filteredIncidents.filter((incident) =>
      ["Alta", "Media"].includes(incident.severity),
    ).length;
    const affectedMatches = new Set(
      filteredIncidents.map((incident) => incident.matchCode),
    ).size;
    const competitionCount = new Set(
      filteredIncidents.map((incident) => incident.competition),
    ).size;

    return {
      total,
      critical,
      mediumHigh,
      affectedMatches,
      competitionCount,
      affectedMatchesPercent: total ? Math.round((affectedMatches / total) * 100) : 0,
      criticalPercent: total ? Math.round((critical / total) * 100) : 0,
      mediumHighPercent: total ? Math.round((mediumHigh / total) * 100) : 0,
    };
  }, [filteredIncidents]);
  const aiContext = useMemo(
    () =>
      filteredIncidents.map((incident) => ({
        id: incident.id,
        partido: incident.matchLabel,
        competencia: incident.competition,
        gravedad: incident.severity,
        operador_control: incident.operatorControl,
        streamer: incident.streamer,
        problema_principal: incident.mainIssue,
        prueba: incident.testCheck,
        inicio: incident.startCheck,
        grafica: incident.graphicsCheck,
        hora_prueba: incident.testTime,
        speedtest: incident.speedtest,
        ping: incident.ping,
        gpu: incident.gpuLoad,
        sede: incident.venue,
        tipo_transmision: incident.transmissionType,
        envios_senal: incident.signalDelivery,
        apto_lineal: incident.aptoLineal ? "Sí" : "No",
        overlays: incident.problems.find((problem) => problem.label === "Overlays (GES)")?.active
          ? "Sí"
          : "No",
        actualizado: incident.updatedAt,
      })),
    [filteredIncidents],
  );

  async function exportVisibleIncidents(sourceIncidents: IncidentRecord[]) {
    if (!sourceIncidents.length || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const incidentGroups = groupIncidentsByLeague(sourceIncidents);
      const documentTitle =
        incidentGroups.length === 1
          ? incidentGroups[0]?.league ?? "Incidencias"
          : "Todas las incidencias";
      const fileBaseName = [
        "incidencias",
        sanitizeFileSegment("visibles"),
      ].join("-");

      const excelDocument = buildIncidentsExcelDocument(incidentGroups);

      downloadBlob(
        new Blob([excelDocument], {
          type: "application/vnd.ms-excel;charset=utf-8",
        }),
        `${fileBaseName}.xls`,
      );

      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const pdfDocument = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a3",
      });
      const pageWidth = pdfDocument.internal.pageSize.getWidth();
      const pageHeight = pdfDocument.internal.pageSize.getHeight();
      const marginX = 32;
      const contentWidth = pageWidth - marginX * 2;
      let currentY = 32;

      pdfDocument.setFont("helvetica", "bold");
      pdfDocument.setFontSize(16);
      pdfDocument.setTextColor(15, 23, 42);
      pdfDocument.text(documentTitle, marginX, currentY);
      currentY += 20;

      incidentGroups.forEach(({ league, items }, index) => {
        if (index > 0 && currentY > pageHeight - 160) {
          pdfDocument.addPage();
          currentY = 32;
        }

        if (incidentGroups.length > 1) {
          const accent = hexToRgb(getIncidentLeagueAccentColor(league));
          pdfDocument.setFillColor(accent.red, accent.green, accent.blue);
          pdfDocument.rect(marginX, currentY, contentWidth, 24, "F");
          pdfDocument.setFont("helvetica", "bold");
          pdfDocument.setFontSize(11);
          pdfDocument.setTextColor(255, 255, 255);
          pdfDocument.text(league, marginX + 10, currentY + 16);
        }

        autoTable(pdfDocument, {
          startY: currentY + (incidentGroups.length > 1 ? 24 : 0),
          margin: { left: marginX, right: marginX },
          head: [INCIDENT_EXPORT_COLUMNS.map((column) => column.label)],
          body: items.map((incident) =>
            INCIDENT_EXPORT_COLUMNS.map((column) => column.value(incident)),
          ),
          theme: "grid",
          styles: {
            font: "helvetica",
            fontSize: 6,
            cellPadding: 3,
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
            fontSize: 6,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
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

  function toggleIncidentDrawer(incidentId: string) {
    setSelectedId((current) => {
      if (current === incidentId) {
        return null;
      }

      setDrawerTab("details");
      return incidentId;
    });
  }

  const renderIncidentControlHeader = (column: IncidentControlColumn) => {
    const sortKey = INCIDENT_CONTROL_COLUMN_SORT_KEY[column];
    const isDropTarget =
      !!draggedColumn && draggedColumn !== column && dragOverColumn === column;
    const isRightAligned = column === "updated";

    const label =
      column === "league"
        ? "LIGA"
        : column === "id"
          ? "ID"
          : column === "date"
            ? "F.A"
          : column === "match"
            ? "PARTIDO"
            : column === "severity"
              ? "GRAVEDAD"
              : column === "operator"
                ? "OPERADOR"
                : column === "streamer"
                  ? "STREAMER"
                  : column === "issue"
                    ? "PROBLEMAS"
                    : "ACT.";
    const headerTooltip =
      column === "severity"
        ? "Gravedad de la incidencia"
        : column === "issue"
          ? "Problemas reportados"
          : column === "updated"
            ? "Última actualización"
            : undefined;

    return (
      <th
        key={column}
        draggable
        onDragStart={() => handleColumnDragStart(column)}
        onDragEnd={handleColumnDragEnd}
        className={cn(
          "px-3 py-2 transition-colors",
          column === "match" && "px-4",
          column === "date" && "text-center",
          "cursor-grab select-none active:cursor-grabbing",
          isRightAligned && "px-3 text-right",
          isDropTarget && "bg-[#f8fafc]",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          handleColumnDragOver(column);
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleColumnDrop(column);
        }}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            column === "date" && "justify-center",
            isRightAligned ? "justify-end" : "justify-between",
          )}
        >
          {sortKey ? (
            <SortHeader
              label={label}
              title={headerTooltip}
              active={sortBy === sortKey}
              direction={sortDirection}
              onClick={() => handleSort(sortKey)}
              align={isRightAligned ? "right" : column === "date" ? "center" : "left"}
            />
          ) : (
            <span>{label}</span>
          )}
        </div>
      </th>
    );
  };

  const renderIncidentControlCell = (
    incident: IncidentRecord,
    column: IncidentControlColumn,
  ) => {
    switch (column) {
      case "league":
        return (
          <td key={column} className="px-3 py-2 2xl:px-5 2xl:py-3">
            <LeagueLogoMarkClient
              league={getIncidentLeagueLabel(incident.competition)}
              className="h-9 w-12"
            />
          </td>
        );
      case "id":
        return (
          <td key={column} className="px-3 py-2 2xl:px-5 2xl:py-3">
            <span className="inline-flex rounded-full border border-[#f3cfd8] bg-[#fff3f6] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
              {incident.id}
            </span>
          </td>
        );
      case "date": {
        const [dateDay, dateMonth] = formatCompactIncidentDate(incident.eventDate).split(" ");
        return (
          <td key={column} className="px-2 py-2 text-center 2xl:px-5 2xl:py-3">
            <span className="inline-flex flex-col items-center gap-0.5 leading-none">
              <span className="text-sm font-black uppercase tracking-[0.12em] text-[#617187]">{dateDay}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#94a3b8]">{dateMonth}</span>
              {incident.eventTime ? (
                <span className="text-[10px] font-semibold text-[#94a3b8]">
                  {incident.eventTime}
                </span>
              ) : null}
            </span>
          </td>
        );
      }
      case "match":
        return (
          <td
            key={column}
            className={cn(
              selectedIncident
                ? "px-3 py-2 2xl:px-5 2xl:py-3"
                : "px-3 py-2 xl:px-4 2xl:px-6 2xl:py-3",
            )}
          >
            <MatchSummaryCell
              matchLabel={incident.matchLabel}
              competition={incident.competition}
              compact={Boolean(selectedIncident)}
            />
          </td>
        );
      case "severity":
        return (
          <td key={column} className="px-2 py-2 2xl:px-5 2xl:py-3">
            <SeverityBadge
              severity={incident.severity}
              className="rounded-full text-xs"
            />
          </td>
        );
      case "operator":
        return (
          <td key={column} className="px-3 py-2 2xl:px-5 2xl:py-3">
            <PersonRoleStack
              label="Operador"
              value={formatPersonShortName(incident.operatorControl)}
              initials={getInitials(incident.operatorControl)}
              size="sm"
            />
          </td>
        );
      case "streamer":
        return (
          <td key={column} className="px-3 py-2 2xl:px-5 2xl:py-3">
            <PersonRoleStack
              label="Streamer"
              value={formatPersonShortName(incident.streamer)}
              initials={getInitials(incident.streamer)}
              size="sm"
            />
          </td>
        );
      case "issue":
        return (
          <td
            key={column}
            className="max-w-[260px] px-2 py-2 text-sm font-medium text-[#4b5c74] 2xl:px-5 2xl:py-3"
          >
            <ActiveProblemSummary problems={incident.problems} />
          </td>
        );
      case "updated":
        return (
          <td key={column} className="px-2 py-2 text-right text-sm text-[#70819b] 2xl:px-5 2xl:py-3">
            {incident.updatedRelative}
          </td>
        );
      default:
        return null;
    }
  };

  const workspaceActions = (
    <div className="flex flex-wrap items-center gap-3 md:justify-end">
      <ToolbarSearchField
        as="div"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar incidencia, partido u operador..."
        inputClassName="text-sm font-medium text-[var(--foreground)] placeholder:text-[#94a3b8]"
      />

      <div className="flex shrink-0 items-center gap-3">
        <SectionAiAssistant
          section="Incidencias"
          title="Consulta las incidencias visibles"
          description="Pregunta por gravedad, operador, streamer, partido afectado o problema principal usando solo la tabla filtrada actual."
          placeholder="Ej. ¿Qué incidencias críticas hay y cómo quedó la prueba?"
          contextLabel="Incidencias visibles en la tabla actual"
          context={aiContext}
          guidance="Prioriza gravedad, operador control, streamer, partido, competencia, problema principal y checks de prueba, inicio y gráfica. Si preguntan por prioridad, ordena de crítica a baja."
          examples={[
            "¿Qué incidencias críticas hay ahora?",
            "¿Qué streamer tiene más incidencias visibles?",
            "¿Qué partidos tienen problemas de Internet?",
            "¿Qué incidencias tienen la gráfica manual o con observación?",
          ]}
          hasGeminiKey={hasGeminiKey}
          buttonVariant="icon"
        />
        <ToolbarIconButton
          type="button"
          onClick={() => void exportVisibleIncidents(sortedIncidents)}
          disabled={!sortedIncidents.length || isExporting}
          aria-label={isExporting ? "Exportando incidencias" : "Exportar incidencias"}
          title={isExporting ? "Exportando incidencias" : "Exportar incidencias"}
        >
          <Download className="size-4" />
        </ToolbarIconButton>
      </div>
    </div>
  );

  const incidentTableControls = (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="relative">
        <select
          value={leagueFilter}
          onChange={(event) => setLeagueFilter(event.target.value)}
          className="h-10 min-w-[176px] appearance-none rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] px-4 pr-9 text-sm font-bold text-[#617187] outline-none shadow-sm transition hover:bg-[#fafbfd]"
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
          {
            key: "day",
            label: "Día",
            active: periodMode === "day",
            onClick: () => setPeriodMode("day"),
          },
          {
            key: "week",
            label: "Semana",
            active: periodMode === "week",
            onClick: () => setPeriodMode("week"),
          },
          {
            key: "month",
            label: "Mes",
            active: periodMode === "month",
            onClick: () => setPeriodMode("month"),
          },
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

      <PlainFullscreenWorkspace
        eyebrow="Incidencias"
        title="Planilla de incidencias"
        periodLabel={activeIncidentPeriodLabel}
        countLabel={`${sortedIncidents.length} incidencias`}
        disabled={!sortedIncidents.length}
        canEdit={canManageEvidence}
        triggerClassName="size-10"
      >
        {({ isEditing }) => renderIncidentPlainWorkspaceContent(isEditing)}
      </PlainFullscreenWorkspace>
    </div>
  );
  const headerActionsPortal =
    embedded && headerActionsPortalTarget
      ? createPortal(workspaceActions, headerActionsPortalTarget)
      : null;
  const [isWideScreen, setIsWideScreen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1536px)");
    setIsWideScreen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsWideScreen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const incidentColumnWidths = useMemo(() => {
    const weights = selectedIncident
      ? INCIDENT_CONTROL_COMPACT_COLUMN_WIDTH_WEIGHT
      : isWideScreen
        ? INCIDENT_CONTROL_WIDE_COLUMN_WIDTH_WEIGHT
        : INCIDENT_CONTROL_COLUMN_WIDTH_WEIGHT;
    const totalWeight = columnOrder.reduce((sum, column) => sum + weights[column], 0);

    return columnOrder.reduce<Record<IncidentControlColumn, string>>((acc, column) => {
      acc[column] = `${((weights[column] / totalWeight) * 100).toFixed(2)}%`;
      return acc;
    }, {} as Record<IncidentControlColumn, string>);
  }, [columnOrder, selectedIncident, isWideScreen]);

  function renderIncidentPlainWorkspaceContent(isEditing: boolean) {
    const stopPropagation = (event: SyntheticEvent) => {
      event.stopPropagation();
    };
    const centeredHeaderClassName =
      "border-r border-[#e1e7f0] px-2 py-2 text-center";
    const centeredCellClassName =
      "border-r border-[#e6ebf2] px-2 py-1.5 text-center";
    const inputClassName =
      "h-7 w-full rounded-none border border-[#94a3b8] bg-white px-1 text-center font-mono text-[12px] text-[#1f2937] outline-none";
    const renderEditableText = (
      incident: IncidentRecord,
      value: string,
      payloadKey:
        | "technicalObservations"
        | "buildingObservations"
        | "generalObservations"
        | "testTime",
    ) =>
      isEditing ? (
        <input
          defaultValue={value}
          onClick={stopPropagation}
          onBlur={(event) =>
            void updateIncidentPlanillaField(incident, {
              [payloadKey]: event.target.value,
            })
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className={inputClassName}
        />
      ) : (
        <span title={value || "-"} className="block truncate">
          {value || "-"}
        </span>
      );
    const renderEditableBoolean = (
      incident: IncidentRecord,
      value: boolean,
      payloadKey: "testCheck" | "startCheck" | "graphicsCheck" | "aptoLineal",
    ) =>
      isEditing ? (
        <select
          defaultValue={value ? "si" : "no"}
          onClick={stopPropagation}
          onChange={(event) =>
            void updateIncidentPlanillaField(incident, {
              [payloadKey]: event.target.value === "si",
            })
          }
          className={inputClassName}
        >
          <option value="si">Sí</option>
          <option value="no">No</option>
        </select>
      ) : value ? (
        "Sí"
      ) : (
        "No"
      );

    return (
      <div className="h-full min-h-0 overflow-hidden border border-[#d8dee8] bg-[#fbfcfe]">
      {filteredIncidents.length ? (
        <div className="h-full min-h-0 overflow-auto">
          <table
            className="border-collapse font-mono text-[12px] text-[#1f2937]"
            style={{
              minWidth: `${INCIDENT_PLANILLA_COLUMNS.reduce(
                (sum, column) => sum + incidentPlanillaWidths[column.key],
                0,
              )}px`,
            }}
          >
            <colgroup>
              {INCIDENT_PLANILLA_COLUMNS.map((column) => (
                <col
                  key={column.key}
                  style={{ width: `${incidentPlanillaWidths[column.key]}px` }}
                />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[#d8dee8] bg-[#f4f6f9] text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
                {INCIDENT_PLANILLA_COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className={`relative ${centeredHeaderClassName} last:border-r-0`}
                  >
                    <span className="block truncate">{column.label}</span>
                    <button
                      type="button"
                      onMouseDown={(event) =>
                        startIncidentPlanillaResize(column.key, event)
                      }
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize border-r border-transparent hover:border-[#94a3b8]"
                      aria-label={`Ajustar ancho de ${column.label}`}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedIncidents.map((incident) => {
                const active = selectedIncident?.id === incident.id;
                const teams = splitIncidentMatchLabel(incident.matchLabel);
                const isProblemActive = (label: string) =>
                  incident.problems.some(
                    (problem) => problem.label === label && problem.active,
                  )
                    ? "Sí"
                    : "No";

                return (
                  <tr
                    key={incident.id}
                    onClick={() => toggleIncidentDrawer(incident.id)}
                    className={cn(
                      "cursor-pointer border-b border-[#e6ebf2] odd:bg-white even:bg-[#fbfcfe] hover:bg-[#f3f7ff]",
                      active && "bg-[#fff1f4] outline outline-1 outline-[#f3b5c2]",
                    )}
                  >
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5 text-[#64748b]">{incident.eventDate}</td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5 text-[#64748b]">{incident.eventTime || getIncidentTimeLabel(incident.updatedAt)}</td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                      <span title={getIncidentLeagueLabel(incident.competition)} className="block truncate">
                        {getIncidentLeagueLabel(incident.competition)}
                      </span>
                    </td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5 font-semibold text-[var(--accent)]">{incident.id}</td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5 font-semibold">
                      <span title={teams.homeTeam} className="block truncate">{teams.homeTeam}</span>
                    </td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                      <span title={teams.awayTeam} className="block truncate">{teams.awayTeam}</span>
                    </td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                      <span title={incident.operatorControl} className="block truncate">{incident.operatorControl || "TBD"}</span>
                    </td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                      <span title={incident.streamer} className="block truncate">{incident.streamer || "TBD"}</span>
                    </td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                      {isEditing ? (
                        <select
                          defaultValue={incident.severity}
                          onClick={stopPropagation}
                          onChange={(event) =>
                            void updateIncidentPlanillaField(incident, {
                              severity: event.target.value,
                            })
                          }
                          className={inputClassName}
                        >
                          {["Sin incidencia", "Baja", "Media", "Alta", "Crítica"].map((severity) => (
                            <option key={severity} value={severity}>
                              {severity}
                            </option>
                          ))}
                        </select>
                      ) : (
                        incident.severity
                      )}
                    </td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                      {renderEditableText(
                        incident,
                        incident.technicalObservation,
                        "technicalObservations",
                      )}
                    </td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                      {renderEditableText(
                        incident,
                        incident.buildingObservation,
                        "buildingObservations",
                      )}
                    </td>
                    <td className="border-r border-[#e6ebf2] px-2 py-1.5">
                      {renderEditableText(
                        incident,
                        incident.generalObservation,
                        "generalObservations",
                      )}
                    </td>
                    <td className={centeredCellClassName}>{isProblemActive("OTRO")}</td>
                    <td className={centeredCellClassName}>{isProblemActive("ST")}</td>
                    <td className={centeredCellClassName}>{isProblemActive("CLUB")}</td>
                    <td className={centeredCellClassName}>{incident.speedtest}</td>
                    <td className={centeredCellClassName}>{incident.ping}</td>
                    <td className={centeredCellClassName}>{incident.gpuLoad}</td>
                    <td className={centeredCellClassName}>
                      {renderEditableText(incident, incident.testTime, "testTime")}
                    </td>
                    <td className={centeredCellClassName}>
                      {renderEditableBoolean(
                        incident,
                        getBinaryIncidentCheckState(incident.testCheck).label === "Sí",
                        "testCheck",
                      )}
                    </td>
                    <td className={centeredCellClassName}>
                      {renderEditableBoolean(
                        incident,
                        getBinaryIncidentCheckState(incident.startCheck).label === "Sí",
                        "startCheck",
                      )}
                    </td>
                    <td className={centeredCellClassName}>
                      {renderEditableBoolean(
                        incident,
                        getBinaryIncidentCheckState(incident.graphicsCheck).label === "Sí",
                        "graphicsCheck",
                      )}
                    </td>
                    <td className={centeredCellClassName}>{isProblemActive("Problema Internet")}</td>
                    <td className={centeredCellClassName}>{isProblemActive("Problema IMG")}</td>
                    <td className={centeredCellClassName}>{isProblemActive("OCR")}</td>
                    <td className={centeredCellClassName}>{isProblemActive("Overlays (GES)")}</td>
                    <td className={centeredCellClassName}>{incident.transmissionType}</td>
                    <td className={centeredCellClassName}>{incident.signalDelivery}</td>
                    <td className={centeredCellClassName}>{incident.venueImages?.length ?? 0}</td>
                    <td className="px-2 py-1.5 text-center">
                      {renderEditableBoolean(incident, incident.aptoLineal, "aptoLineal")}
                    </td>
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
              incidents.length
                ? "No encontramos incidencias con ese filtro"
                : "Todavía no hay incidencias cargadas"
            }
            description={
              incidents.length
                ? "Prueba con otra liga o búsqueda para volver al tablero completo."
                : "Cuando un colaborador reporte una incidencia desde Mi jornada, aparecerá aquí con su detalle técnico."
            }
          />
        </div>
      )}
      </div>
    );
  }

  const workspaceVisualContent = (
    <div className="flex min-w-0 flex-col gap-0">
      {embedded && !headerActionsPortal ? workspaceActions : null}
      <section
        className={cn(
          "grid gap-4 pb-6 pt-5 sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        <article className="panel-surface !h-[120px] !min-h-[120px] flex flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <p className="min-w-0 pt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#70819b]">
              Total incidencias
            </p>
            <p className="shrink-0 text-4xl font-black leading-none tracking-[-0.04em] text-[var(--foreground)]">
              {metrics.total}
            </p>
          </div>
          <div className="mt-auto flex items-center gap-3">
            <span className="inline-flex items-center rounded-xl bg-[#f4f7fb] px-2.5 py-1 text-[11px] font-bold text-[#617187]">
              {metrics.competitionCount} competencias
            </span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e7edf5]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${Math.max(10, Math.min(metrics.total * 18, 100))}%` }}
              />
            </div>
          </div>
        </article>

        <article className="panel-surface !h-[120px] !min-h-[120px] flex flex-col overflow-hidden border border-[#ffd7df] bg-[#fff5f7] p-4 ring-1 ring-[#ffd7df]">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <p className="min-w-0 pt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              Críticas
            </p>
            <p className="shrink-0 text-4xl font-black leading-none tracking-[-0.04em] text-[var(--accent)]">
              {metrics.critical}
            </p>
          </div>
          <div className="mt-auto flex items-center gap-3">
            <span className="inline-flex items-center rounded-xl bg-[#ffe4ea] px-2.5 py-1 text-[11px] font-bold text-[var(--accent)]">
              Atención inmediata
            </span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#f3c8d4]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${metrics.criticalPercent}%` }}
              />
            </div>
          </div>
        </article>

        <article className="panel-surface !h-[120px] !min-h-[120px] flex flex-col overflow-hidden border border-[#ffe6c7] bg-white p-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <p className="min-w-0 pt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6a27]">
              Altas y medias
            </p>
            <p className="shrink-0 text-4xl font-black leading-none tracking-[-0.04em] text-[var(--foreground)]">
              {metrics.mediumHigh}
            </p>
          </div>
          <div className="mt-auto flex items-center gap-3">
            <span className="inline-flex items-center rounded-xl bg-[#fff4e8] px-2.5 py-1 text-[11px] font-bold text-[#d97706]">
              {metrics.mediumHighPercent}% del total
            </span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#fae5c5]">
              <div
                className="h-full rounded-full bg-[#f59e0b]"
                style={{ width: `${metrics.mediumHighPercent}%` }}
              />
            </div>
          </div>
        </article>

        <article className="panel-surface !h-[120px] !min-h-[120px] flex flex-col overflow-hidden border border-[#d8f0e3] bg-[var(--surface)] p-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <p className="min-w-0 pt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#4b7a61]">
              Partidos afectados
            </p>
            <p className="shrink-0 text-4xl font-black leading-none tracking-[-0.04em] text-[var(--foreground)]">
              {metrics.affectedMatches}
            </p>
          </div>
          <div className="mt-auto flex items-center gap-3">
            <span className="inline-flex items-center rounded-xl bg-[#ebfaf1] px-2.5 py-1 text-[11px] font-bold text-[#0f9f61]">
              {metrics.affectedMatchesPercent}% del total
            </span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#dcefe5]">
              <div
                className="h-full rounded-full bg-[#10b981]"
                style={{ width: `${metrics.affectedMatchesPercent}%` }}
              />
            </div>
          </div>
        </article>
      </section>

      <div className="min-h-0 flex-1">
        <SectionTableCard
          title="Control de Incidencias"
          icon={AlertTriangle}
          badge={
            incidentTableControls
          }
          footer={
            <>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#617187]">
                Mostrando {filteredIncidents.length} de {incidents.length} incidencias
              </p>
            </>
          }
          className="flex h-full min-h-0 min-w-0 flex-col"
        >
          {filteredIncidents.length ? (
            <div className="min-w-0 flex-1 overflow-auto">
              <table className="min-w-full table-fixed text-left">
                <colgroup>
                  {columnOrder.map((column) => (
                    <col
                      key={column}
                      style={{ width: incidentColumnWidths[column] }}
                    />
                  ))}
                </colgroup>
                <thead>
                  <tr className="bg-[#fafbfd] text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    {columnOrder.map((column) =>
                      renderIncidentControlHeader(column),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1f6]">
                  {sortedIncidents.map((incident) => {
                    const active = selectedIncident?.id === incident.id;
                    const rowTone = getIncidentRowTone(incident.severity);

                    return (
                      <tr
                        key={incident.id}
                        onClick={() => toggleIncidentDrawer(incident.id)}
                        className={cn(
                          "cursor-pointer transition",
                          active
                            ? rowTone.active
                            : rowTone.hover,
                        )}
                      >
                        {columnOrder.map((column) =>
                          renderIncidentControlCell(incident, column),
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
                  incidents.length
                    ? "No encontramos incidencias con ese filtro"
                    : "Todavía no hay incidencias cargadas"
                }
                description={
                  incidents.length
                    ? "Prueba con otra liga o búsqueda para volver al tablero completo."
                    : "Cuando un colaborador reporte una incidencia desde Mi jornada, aparecerá aquí con su detalle técnico."
                }
              />
            </div>
          )}
        </SectionTableCard>
      </div>
    </div>
  );

  const workspaceContent = workspaceVisualContent;

  const selectedIncidentDrawer = selectedIncident ? (
    <aside className="min-w-0 self-start 2xl:sticky 2xl:top-24">
      <div className="panel-surface fixed inset-x-2 bottom-2 top-2 z-40 flex flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[0_28px_70px_rgba(15,23,42,0.18)] transition md:left-auto md:right-2 md:w-[25rem] md:max-w-[calc(100vw-1rem)] 2xl:static 2xl:h-[calc(100vh-6rem)] 2xl:w-full 2xl:shadow-none">
        <div className="border-b border-[var(--border)] p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-[#f3cfd8] bg-[#fff3f6] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
              {selectedIncident.id}
            </span>
            <span
              style={{
                backgroundColor: getTeamLeagueColorSet(
                  getIncidentLeagueLabel(selectedIncident.competition),
                ).soft,
                borderColor: getTeamLeagueColorSet(
                  getIncidentLeagueLabel(selectedIncident.competition),
                ).accent,
                color: getTeamLeagueColorSet(
                  getIncidentLeagueLabel(selectedIncident.competition),
                ).accent,
              }}
              className="inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
            >
              {getIncidentLeagueLabel(selectedIncident.competition)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setDrawerTab("details");
            }}
            aria-label="Cerrar detalle de incidencia"
            className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--background-soft)] text-[#94a3b8]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
          <div className="space-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 text-[1.6rem] font-black leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
                {selectedIncidentTeams?.homeTeam ?? selectedIncident.matchLabel}
              </p>
              {canManageEvidence ? (
                <button
                  type="button"
                  onClick={() =>
                    setEditingIncidentId((current) =>
                      current === selectedIncident.id ? null : selectedIncident.id,
                    )
                  }
                  aria-label={isSelectedIncidentEditing ? "Cerrar edición" : "Editar incidencia"}
                  className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-full transition",
                    isSelectedIncidentEditing
                      ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]"
                      : "bg-[#f4f7fb] text-[#70819b] hover:bg-[#eef2f6] hover:text-[var(--accent)]",
                  )}
                >
                  <Pencil className="size-4" />
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[1.6rem] font-black leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
              <span className="text-[var(--accent)]">vs</span>
              <span>{selectedIncidentTeams?.awayTeam || selectedIncident.matchLabel}</span>
            </div>
          </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-[#70819b]">
              <span className="inline-flex items-center gap-2">
                <Clock3 className="size-4 text-[#b1b8c5]" />
                {selectedIncident.eventDate}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="size-4 text-[#b1b8c5]" />
                {getIncidentTimeLabel(selectedIncident.updatedAt)}
              </span>
            </div>
            <div className="mt-2 inline-flex items-start gap-2 text-sm text-[#70819b]">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#b1b8c5]" />
              <span>{selectedIncident.venue}</span>
            </div>
          </div>
        </div>
        </div>

        <UnderlineTabs
          columns={4}
          items={[
            {
              key: "details",
              label: "Detalle",
              icon: Eye,
              active: drawerTab === "details",
              onClick: () => setDrawerTab("details"),
            },
            {
              key: "notes",
              label: "Obs.",
              icon: FileText,
              active: drawerTab === "notes",
              onClick: () => setDrawerTab("notes"),
            },
            {
              key: "activity",
              label: "Log",
              icon: History,
              active: drawerTab === "activity",
              onClick: () => setDrawerTab("activity"),
            },
            {
              key: "images",
              label: "Imgs",
              icon: ImageIcon,
              active: drawerTab === "images",
              onClick: () => setDrawerTab("images"),
            },
          ]}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 xl:max-h-none">
          {drawerTab === "details" ? (
            <div className="space-y-8">
        <section className="space-y-4">
          <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
            Gravedad
          </h4>
          <div className="grid gap-3">
            <div
              className={cn(
                "panel-radius border p-4",
                selectedSeverityTone?.panel,
              )}
            >
              <p
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.16em]",
                  selectedSeverityTone?.label,
                )}
              >
                Nivel actual
              </p>
              <p
                className={cn(
                  "mt-2 text-sm font-black",
                  selectedSeverityTone?.value,
                )}
              >
                {selectedIncident.severity}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
            Responsables
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="panel-radius min-w-0 border border-[var(--border)] bg-white p-3">
              <PersonRoleStack
                label="Operador"
                value={selectedIncident.operatorControl}
                initials={getInitials(selectedIncident.operatorControl)}
                size="sm"
              />
            </div>
            <div className="panel-radius min-w-0 border border-[var(--border)] bg-white p-3">
              <PersonRoleStack
                label="Streamer"
                value={selectedIncident.streamer}
                initials={getInitials(selectedIncident.streamer)}
                size="sm"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
            Contexto del partido
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="panel-radius flex min-h-[42px] flex-col items-center justify-center gap-1 border border-[var(--border)] bg-white px-2 py-2">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f4f7fb] text-[#7c8aa0]">
                <Cpu className="size-4" />
              </span>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">Tipo</p>
              <p className="truncate text-center text-xs font-bold text-[var(--foreground)]">
                {selectedIncident.transmissionType}
              </p>
            </div>
            <div className="panel-radius flex min-h-[42px] flex-col items-center justify-center gap-1 border border-[var(--border)] bg-white px-2 py-2">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f4f7fb] text-[#7c8aa0]">
                <Wifi className="size-4" />
              </span>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">Señal</p>
              <p className="truncate text-center text-xs font-bold text-[var(--foreground)]">
                {selectedIncident.signalDelivery}
              </p>
            </div>
            <div
              role={isSelectedIncidentEditing ? "button" : undefined}
              tabIndex={isSelectedIncidentEditing ? 0 : undefined}
              onClick={
                isSelectedIncidentEditing
                  ? () => toggleEditedCheck(selectedIncident.id, "aptoLineal", resolvedAptoLineal!)
                  : undefined
              }
              onKeyDown={
                isSelectedIncidentEditing
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleEditedCheck(selectedIncident.id, "aptoLineal", resolvedAptoLineal!);
                      }
                    }
                  : undefined
              }
              className={cn(
                "panel-radius flex min-h-[42px] flex-col items-center justify-center gap-1 border px-2 py-2 transition",
                isSelectedIncidentEditing && "cursor-pointer hover:opacity-80",
                resolvedAptoLineal
                  ? "border-[#d7eadf] bg-[#f3fcf6]"
                  : "border-[#ffd8df] bg-[#fff3f6]",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-full",
                  resolvedAptoLineal ? "bg-[#dcfce7] text-[#12b76a]" : "bg-[#ffe7ed] text-[#f04461]",
                )}
              >
                {resolvedAptoLineal ? <CheckCircle2 className="size-5" /> : <CircleX className="size-5" />}
              </span>
              <p className={cn(
                "text-[9px] font-black uppercase tracking-[0.14em]",
                resolvedAptoLineal ? "text-[#178a56]" : "text-[#b42318]",
              )}>
                Apto lineal
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
            Pruebas de salida
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="panel-radius flex min-h-[42px] items-center gap-3 border border-[var(--border)] bg-white px-3 py-2">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f4f7fb] text-[#94a3b8]">
                <Clock3 className="size-7" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                  Hora
                </p>
                {isSelectedIncidentEditing ? (
                  <input
                    type="time"
                    value={resolvedTestTime ?? ""}
                    onChange={(e) => setEditedField(selectedIncident.id, "testTime", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[#f8fafc] px-2 py-1 text-sm font-bold text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                  />
                ) : (
                  <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                    {resolvedTestTime}
                  </p>
                )}
              </div>
            </div>
            {(
              [
                { field: "testCheck" as const, label: "Prueba", check: selectedTestCheck, bool: resolvedTestCheckBool },
                { field: "startCheck" as const, label: "Inicio", check: selectedStartCheck, bool: resolvedStartCheckBool },
                { field: "graphicsCheck" as const, label: "Gráfica", check: selectedGraphicsCheck, bool: resolvedGraphicsCheckBool },
              ] as const
            ).map(({ field, label, check, bool }) => (
              <div
                key={field}
                role={isSelectedIncidentEditing ? "button" : undefined}
                tabIndex={isSelectedIncidentEditing ? 0 : undefined}
                onClick={
                  isSelectedIncidentEditing
                    ? () => toggleEditedCheck(selectedIncident.id, field, bool!)
                    : undefined
                }
                onKeyDown={
                  isSelectedIncidentEditing
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleEditedCheck(selectedIncident.id, field, bool!);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "panel-radius flex min-h-[42px] items-center gap-3 border px-3 py-2 transition",
                  isSelectedIncidentEditing && "cursor-pointer hover:opacity-80",
                  check?.panelClassName,
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
                    check?.iconWrapClassName,
                    check?.iconClassName,
                  )}
                >
                  {check ? <check.Icon className="size-7" /> : null}
                </span>
                <div>
                  <p
                    className={cn(
                      "text-[10px] font-black uppercase tracking-[0.16em]",
                      check?.labelClassName,
                    )}
                  >
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
            Bloque técnico
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  label: "Speed Test",
                  kind: "speedtest" as const,
                  attachment: selectedSpeedtestAttachment,
                  previewSrc: selectedSpeedtestPreviewSrc,
                  value: resolvedSpeedtest,
                  uploadState: selectedUploadState.speedtest,
                },
                {
                  label: "Ping",
                  kind: "ping" as const,
                  attachment: selectedPingAttachment,
                  previewSrc: selectedPingPreviewSrc,
                  value: resolvedPingValue,
                  uploadState: selectedUploadState.ping,
                },
                {
                  label: "GPU",
                  kind: "gpu" as const,
                  attachment: selectedGpuAttachment,
                  previewSrc: selectedGpuPreviewSrc,
                  value: resolvedGpuValue,
                  uploadState: selectedUploadState.gpu,
                },
              ] as const
            ).map(({ label, kind, attachment, previewSrc, value, uploadState }) => (
              <div
                key={kind}
                className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[#fafbfd] p-2"
              >
                <p className="text-center text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">{label}</p>
                {isSelectedIncidentEditing ? (
                  <button
                    type="button"
                    onClick={() => openDesktopEvidencePicker(selectedIncident, kind)}
                    disabled={!canManageEvidence || isDesktopEvidenceBusy}
                    className="mx-auto inline-flex size-9 items-center justify-center rounded-full bg-[#f5f0e8] text-[#b07d3c] shadow-sm transition hover:bg-[#ede5d6] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Adjuntar ${label}`}
                  >
                    <Upload className="size-3.5" />
                  </button>
                ) : null}
                <p className="text-center text-sm font-bold text-[var(--foreground)]">{value}</p>
                {uploadState?.message ? (
                  <p className={cn(
                    "text-center text-[10px] leading-4",
                    uploadState.state === "error" ? "text-[#cf2246]"
                      : uploadState.state === "done" ? "text-[#178a56]"
                      : "text-[#70819b]",
                  )}>
                    {uploadState.message}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
            Problemas detectados
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {selectedIncident.problems.map((problem) => (
              <ProblemPill key={problem.label} problem={problem} />
            ))}
          </div>
        </section>
            </div>
          ) : drawerTab === "activity" ? (
            <section className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <History className="size-4 text-[var(--accent)]" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                  Actividad
                </h4>
              </div>
              <span className="rounded-full bg-[var(--background-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#7d8ca1]">
                {selectedIncident.activity.length} eventos
              </span>
            </div>

            {selectedIncident.activity.length ? (
              <div className="space-y-4 border-l border-[var(--border)] pl-5">
                {selectedIncident.activity.map((entry, index) => {
                  const tone = getIncidentActivityTone(entry.tone);

                  return (
                    <div key={`${selectedIncident.id}-${entry.time}-${index}`} className="relative">
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
                            {entry.actor}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-[#4b5c74]">
                            {entry.action}
                          </p>
                          {entry.detail ? (
                            <p className="mt-2 text-xs leading-5 text-[#70819b]">
                              {entry.detail}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                            tone.badge,
                          )}
                        >
                          {entry.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--background-soft)] p-4 text-sm text-[#617187]">
                Todavía no hay actividad registrada para esta incidencia.
              </div>
            )}
            </section>
          ) : drawerTab === "notes" ? (
            <section className="space-y-4">
              {(
                [
                  { field: "technicalObservation" as const, label: "Obs. técnica", value: resolvedTechnicalObservation },
                  { field: "buildingObservation" as const, label: "Obs. edilicia", value: resolvedBuildingObservation },
                  { field: "generalObservation" as const, label: "Obs. general", value: resolvedGeneralObservation },
                ] as const
              ).map(({ field, label, value }) => (
                <div key={field} className="space-y-3">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    {label}
                  </h4>
                  {isSelectedIncidentEditing ? (
                    <textarea
                      value={value ?? ""}
                      onChange={(e) => setEditedField(selectedIncident.id, field, e.target.value)}
                      placeholder="Agregar observación..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-[var(--border)] bg-[#f8fafc] px-3 py-2 text-sm text-[#4b5c74] placeholder:text-[#c3ccd9] focus:border-[var(--accent)] focus:outline-none"
                    />
                  ) : value ? (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-soft)] px-3 py-2.5">
                      <p className="text-sm leading-6 text-[#4b5c74]">{value}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[#fafbfd] px-3 py-2.5">
                      <p className="text-sm text-[#c3ccd9]">Sin observación</p>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-[11px] font-bold text-[#94a3b8]">
                  {selectedIncident.reporter}
                </span>
                <span className="text-[11px] font-bold text-[#94a3b8]">
                  {selectedIncident.updatedAt}
                </span>
              </div>
            </section>
          ) : (
            <section className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-[var(--accent)]" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                  Imágenes
                </h4>
              </div>
              <span className="rounded-full bg-[var(--background-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#7d8ca1]">
                {selectedVenueImages.length} adjuntas
              </span>
            </div>

            {canManageEvidence ? (
              <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-[#d7dee8] bg-[#fafbfd] px-4 py-3 transition hover:border-[var(--accent)] hover:bg-[#fff7f9]">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-[#94a3b8] shadow-sm">
                  <Upload className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-[var(--foreground)]">
                    Subir imágenes de la cancha
                  </span>
                  <span className="block text-xs text-[#94a3b8]">
                    Puedes cargar una o varias fotos del estadio, cabina o contexto operativo.
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  multiple
                  className="hidden"
                  onChange={(event) =>
                    handleVenueImagesChange(
                      selectedIncident,
                      event.target.files ?? null,
                    )
                  }
                />
              </label>
            ) : null}

            {selectedVenueImages.length ? (
              <div className="space-y-2">
                {selectedVenueImages.map((image, index) => (
                  <div
                    key={`${selectedIncident.id}-venue-${image.fileName}-${index}`}
                    className="rounded-[10px] border border-[var(--border)] bg-[#fcfcfd] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[#eef2f6] text-[#7c8aa0]">
                        <ImageIcon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[var(--foreground)]">
                          {image.fileName}
                        </p>
                        <p className="text-xs text-[#94a3b8]">
                          {image.fileSizeLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--background-soft)] p-4 text-sm text-[#617187]">
                Todavía no hay imágenes cargadas para esta incidencia.
              </div>
            )}
            </section>
          )}
        </div>

      </div>
    </aside>
  ) : null;
  const selectedIncidentDrawerPortal =
    selectedIncidentDrawer && drawerPortalTarget
      ? createPortal(selectedIncidentDrawer, drawerPortalTarget)
      : null;
  const useExternalDrawer = embedded && Boolean(onSelectedIdChange);
  const showInlineEmbeddedDrawer = Boolean(selectedIncidentDrawer) && !useExternalDrawer;

  return (
    <div className="flex min-h-[42rem] flex-col gap-6">
      {headerActionsPortal}
      {embedded ? (
        <>
          <div
            className={cn(
              "grid min-h-0 gap-6",
              embedded && "-mt-1",
              showInlineEmbeddedDrawer
                ? "2xl:grid-cols-[minmax(0,1fr)_390px]"
                : "grid-cols-1",
            )}
          >
            {workspaceContent}
            {showInlineEmbeddedDrawer ? selectedIncidentDrawer : null}
          </div>
          {selectedIncidentDrawerPortal}
        </>
      ) : selectedIncidentDrawer ? (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="flex min-w-0 flex-col gap-6">
            <SectionPageHeader
              title="Incidencias"
              description="Monitorea incidencias, seguimiento técnico y evidencias del corte visible."
              actions={workspaceActions}
            />
            {workspaceContent}
          </div>
          {selectedIncidentDrawer}
        </div>
      ) : (
        <>
          <SectionPageHeader
            title="Incidencias"
            description="Monitorea incidencias, seguimiento técnico y evidencias del corte visible."
            actions={workspaceActions}
          />
          {workspaceContent}
        </>
      )}

      <input
        ref={desktopEvidenceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={handleDesktopEvidenceInputChange}
      />

      {evidencePreview ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#101828]/72 p-6 backdrop-blur-sm"
          onClick={() => setEvidencePreview(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-[28px] bg-white p-4 shadow-[0_32px_80px_rgba(15,23,42,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setEvidencePreview(null)}
              className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-[#f8fafc] text-[#94a3b8] transition hover:bg-[#eef2f6] hover:text-[#52627a]"
              aria-label="Cerrar vista previa"
            >
              <X className="size-5" />
            </button>

            <div className="mb-4 pr-14">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                {evidencePreview.title}
              </p>
              <p className="mt-2 truncate text-sm font-bold text-[var(--foreground)]">
                {evidencePreview.fileName}
              </p>
            </div>

            <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[#f8fafc]">
              <Image
                src={evidencePreview.src}
                alt={evidencePreview.fileName}
                width={1400}
                height={1000}
                unoptimized
                className="h-auto max-h-[76vh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
