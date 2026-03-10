"use client";

import { type DragEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Bot,
  CalendarDays,
  CircleCheckBig,
  CircleX,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  GripVertical,
  MapPin,
  Pencil,
  PlusCircle,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import { SectionAiAssistant } from "@/components/ai/section-ai-assistant";
import { LeagueLogoMarkClient } from "@/components/league-logo-mark-client";
import { ClientTeamLogoMark } from "@/components/team-logo-mark-client";
import { SectionPageHeader } from "@/components/layout/section-page-header";
import { MatchSummaryCell } from "@/components/shared/match-summary-cell";
import { EmptyState } from "@/components/ui/empty-state";
import { HoverAvatarBadge } from "@/components/ui/hover-avatar-badge";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { SectionTableCard } from "@/components/ui/section-table-card";
import type {
  ReportActivity,
  ReportRecord,
  ReportSeverity,
} from "@/lib/reports";
import { getTeamLeagueColorSet } from "@/lib/team-directory";
import { cn } from "@/lib/utils";

type ReportSortKey =
  | "league"
  | "id"
  | "date"
  | "match"
  | "responsible"
  | "paid"
  | "feed"
  | "severity";
type SortDirection = "asc" | "desc";
type ReportPeriodMode = "day" | "week" | "month";
type ReportView = "summary" | "control";
type IncidentChartMetric = "count" | "rate";
type ReportControlColumn =
  | "league"
  | "id"
  | "date"
  | "match"
  | "responsible"
  | "paid"
  | "feed"
  | "severity"
  | "action";
type ReportRankingColumn =
  | "responsible"
  | "effectiveness"
  | "reports"
  | "alerts";

const REPORT_CONTROL_COLUMNS_STORAGE_KEY =
  "basket-production.reports.control-columns";
const REPORT_RANKING_COLUMNS_STORAGE_KEY =
  "basket-production.reports.ranking-columns";
const DEFAULT_REPORT_CONTROL_COLUMNS: ReportControlColumn[] = [
  "league",
  "id",
  "date",
  "match",
  "responsible",
  "paid",
  "feed",
  "severity",
  "action",
];
const DEFAULT_REPORT_RANKING_COLUMNS: ReportRankingColumn[] = [
  "responsible",
  "effectiveness",
  "reports",
  "alerts",
];
const REPORT_CONTROL_COLUMN_SORT_KEY: Partial<
  Record<ReportControlColumn, ReportSortKey>
> = {
  league: "league",
  id: "id",
  date: "date",
  match: "match",
  responsible: "responsible",
  paid: "paid",
  feed: "feed",
  severity: "severity",
};

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

function formatCompactReportDate(value: string) {
  const date = parseSpanishShortDate(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS_ABBR_ES[date.getMonth()] ?? "";

  return `${day} ${month}`;
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

function SortHeader({
  label,
  active,
  direction,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 uppercase transition hover:text-[#617187]",
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

function getActivityToneClass(tone: ReportActivity["tone"]) {
  switch (tone) {
    case "success":
      return "bg-[#10b981]";
    case "accent":
      return "bg-[var(--accent)]";
    default:
      return "bg-[#f59e0b]";
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
        "panel-surface min-w-0 overflow-hidden border p-5 xl:p-6",
        highlight
          ? "border-[#f2c7d0] bg-[#fff5f7] ring-1 ring-[#f2c7d0]"
          : "border-[var(--border)] bg-[var(--surface)]",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-black uppercase tracking-[0.18em]",
          highlight ? "text-[var(--accent)]" : "text-[#70819b]",
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "mt-3 text-[2.35rem] font-black tracking-[-0.04em] xl:text-4xl",
          highlight ? "text-[var(--accent)]" : "text-[var(--foreground)]",
        )}
      >
        {value}
      </p>
      <div className="mt-5 flex min-w-0 items-center justify-between gap-4">
        <span
          className={cn(
            "inline-flex min-w-0 items-center rounded-xl px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
            chipClassName,
          )}
        >
          {chip}
        </span>
        <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-[#e7edf5] xl:w-24">
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

function getReportEffectiveness(report: ReportRecord) {
  let score = 100;

  switch (report.severity) {
    case "Crítica":
      score -= 36;
      break;
    case "Alta":
      score -= 24;
      break;
    case "Media":
      score -= 14;
      break;
    case "Baja":
      score -= 6;
      break;
    default:
      break;
  }

  if (!report.feed_detected) {
    score -= 8;
  }

  if (!report.paid) {
    score -= 10;
  }

  return Math.max(42, score);
}

export function ReportsWorkspace({
  reports,
  activities,
  hasGeminiKey,
}: {
  reports: ReportRecord[];
  activities: ReportActivity[];
  hasGeminiKey: boolean;
}) {
  const [activeView, setActiveView] = useState<ReportView>("summary");
  const [query, setQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("Todas las ligas");
  const latestReportDate = useMemo(() => {
    return reports.reduce((latest, report) => {
      const reportDate = parseSpanishShortDate(report.event_date);
      return reportDate > latest ? reportDate : latest;
    }, parseSpanishShortDate(reports[0]?.event_date ?? "1 enero 2026"));
  }, [reports]);
  const [periodMode, setPeriodMode] = useState<ReportPeriodMode>("day");
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
  const [incidentChartLimit, setIncidentChartLimit] = useState<5 | 10>(5);
  const [sortBy, setSortBy] = useState<ReportSortKey>("severity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
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

  function handleSort(nextSortBy: ReportSortKey) {
    if (sortBy === nextSortBy) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection(nextSortBy === "severity" ? "desc" : "asc");
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
    window.localStorage.setItem(
      REPORT_CONTROL_COLUMNS_STORAGE_KEY,
      JSON.stringify(columnOrder),
    );
  }, [columnOrder]);

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
    const criticalCount = baseFilteredReports.filter(
      (report) => report.severity === "Crítica",
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
      criticalCount,
      unpaidCount,
      feedDetectedCount,
      paidCount,
      incidentPercent: totalReports
        ? Math.round((withIncident / totalReports) * 1000) / 10
        : 0,
      noIncidentPercent: totalReports
        ? Math.round((noIncidentCount / totalReports) * 1000) / 10
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

  const aiContext = useMemo(
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

    const getBucketInfo = (report: ReportRecord) => {
      const date = parseSpanishShortDate(report.event_date);

      if (periodMode === "day") {
        const hour = Number(report.event_time.split(":")[0] ?? "0");

        return {
          key: `h-${String(hour).padStart(2, "0")}`,
          label: `${String(hour).padStart(2, "0")}:00`,
          sort: hour,
        };
      }

      if (periodMode === "week") {
        return {
          key: getDateKey(date),
          label: `${String(date.getDate()).padStart(2, "0")} ${MONTHS_ABBR_ES[date.getMonth()]}`,
          sort: date.getTime(),
        };
      }

      const weekIndex = getWeekIndexInMonth(date);

      return {
        key: `${getMonthKey(date)}-w${weekIndex}`,
        label: `SEM ${weekIndex}`,
        sort: weekIndex,
      };
    };

    baseFilteredReports.forEach((report) => {
      const bucketInfo = getBucketInfo(report);
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

  const leagueDistribution = useMemo(() => {
    const leagueMap = new Map<string, number>();

    baseFilteredReports.forEach((report) => {
      leagueMap.set(report.league, (leagueMap.get(report.league) ?? 0) + 1);
    });

    return Array.from(leagueMap.entries())
      .map(([league, count]) => ({ league, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
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
      })
      .slice(0, 6);
  }, [baseFilteredReports]);

  const responsibleRanking = useMemo(() => {
    const aggregate = new Map<
      string,
      { responsible: string; reports: number; incidents: number; scoreTotal: number }
    >();

    baseFilteredReports.forEach((report) => {
      const current = aggregate.get(report.responsible_name) ?? {
        responsible: report.responsible_name,
        reports: 0,
        incidents: 0,
        scoreTotal: 0,
      };

      current.reports += 1;
      current.incidents += report.severity === "Sin incidencia" ? 0 : 1;
      current.scoreTotal += getReportEffectiveness(report);
      aggregate.set(report.responsible_name, current);
    });

    return Array.from(aggregate.values())
      .map((item) => ({
        ...item,
        effectiveness: Math.round((item.scoreTotal / item.reports) * 10) / 10,
      }))
      .sort((left, right) => right.effectiveness - left.effectiveness)
      .slice(0, 5);
  }, [baseFilteredReports]);

  const summaryInsights = useMemo(() => {
    const leadingLeague = leagueDistribution[0];
    const criticalLeague = baseFilteredReports
      .filter((report) => report.severity === "Crítica")
      .map((report) => report.league);
    const criticalLeagueName = criticalLeague[0] ?? leagueFilter;
    const busiestResponsible = responsibleRanking[0]?.responsible;

    return [
      leadingLeague
        ? `${leadingLeague.league} concentra ${leadingLeague.count} cierres en el periodo activo.`
        : "No hay suficientes cierres para detectar concentración por liga.",
      summaryMetrics.unpaidCount
        ? `${summaryMetrics.unpaidCount} reportes siguen sin pago confirmado y requieren seguimiento administrativo.`
        : "No hay pagos pendientes en el periodo visible.",
      busiestResponsible
        ? `${busiestResponsible} lidera el volumen de cierres con la mejor efectividad visible del periodo.`
        : "Sin datos suficientes para calcular el ranking de responsables.",
      criticalLeagueName && summaryMetrics.criticalCount
        ? `${criticalLeagueName} concentra la mayor urgencia con ${summaryMetrics.criticalCount} cierres críticos.`
        : "No hay cierres críticos abiertos en este corte.",
    ];
  }, [
    baseFilteredReports,
    leagueDistribution,
    leagueFilter,
    responsibleRanking,
    summaryMetrics.criticalCount,
    summaryMetrics.unpaidCount,
  ]);

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

  const selectedReportOperations = selectedReport
    ? [
        {
          label: "Gravedad",
          value: selectedReport.severity,
          icon: ShieldAlert,
          tone:
            selectedReport.severity === "Sin incidencia"
              ? "text-[#11915a] bg-[#eaf9f0]"
              : selectedReport.severity === "Crítica"
                ? "text-[var(--accent)] bg-[#fff1f5]"
                : selectedReport.severity === "Alta"
                  ? "text-[#dc2626] bg-[#fff4f2]"
                  : selectedReport.severity === "Media"
                    ? "text-[#b78611] bg-[#fff8e8]"
                    : "text-[#70819b] bg-[#f4f7fb]",
        },
        {
          label: "Feed detectó",
          value: selectedReport.feed_detected ? "Sí" : "No",
          icon: selectedReport.feed_detected ? CircleCheckBig : CircleX,
          tone: selectedReport.feed_detected
            ? "text-[#11915a] bg-[#eaf9f0]"
            : "text-[#e44b68] bg-[#fff3f6]",
        },
        {
          label: "Estado financiero",
          value: selectedReport.paid ? "Pagado" : "No pagado",
          icon: selectedReport.paid ? CircleCheckBig : CircleX,
          tone: selectedReport.paid
            ? "text-[#11915a] bg-[#eaf9f0]"
            : "text-[#e44b68] bg-[#fff3f6]",
        },
      ]
    : [];

  const renderReportControlHeader = (column: ReportControlColumn) => {
    const sortableKey = REPORT_CONTROL_COLUMN_SORT_KEY[column];
    const isDropTarget =
      !!draggedColumn && draggedColumn !== column && dragOverColumn === column;
    const headerPadding =
      column === "match" || column === "action" ? "px-8 py-4" : "px-6 py-4";

    return (
      <th
        key={column}
        onDragOver={(event) => handleColumnDragOver(event, column)}
        onDrop={() => handleColumnDrop(column)}
        onDragLeave={() => {
          if (dragOverColumn === column) {
            setDragOverColumn(null);
          }
        }}
        className={cn(
          headerPadding,
          isDropTarget && "bg-[#fff6f8]",
          column === "action" && "text-right",
        )}
      >
        <div
          className={cn(
            "flex w-full items-center gap-2",
            column === "action" && "justify-end",
          )}
        >
          <button
            type="button"
            draggable
            aria-label={`Reordenar columna ${column}`}
            onDragStart={() => handleColumnDragStart(column)}
            onDragEnd={handleColumnDragEnd}
            className={cn(
              "inline-flex size-6 shrink-0 cursor-grab items-center justify-center rounded-md text-[#c1cada] transition hover:bg-white hover:text-[#617187] active:cursor-grabbing",
              draggedColumn === column && "bg-white text-[#617187] shadow-sm",
            )}
          >
            <GripVertical className="size-3.5" />
          </button>

          {sortableKey ? (
            <SortHeader
              label={
                column === "league"
                  ? "LIGA"
                  : column === "id"
                    ? "ID"
                    : column === "date"
                      ? "FECHA"
                      : column === "match"
                        ? "PARTIDO"
                        : column === "responsible"
                          ? "RESPONSABLE"
                          : column === "paid"
                            ? "PAGO"
                            : column === "feed"
                              ? "FEED"
                              : "GRAVEDAD"
              }
              active={sortBy === sortableKey}
              direction={sortDirection}
              onClick={() => handleSort(sortableKey)}
              align={column === "action" ? "right" : "left"}
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

  const renderReportControlCell = (report: ReportRecord, column: ReportControlColumn) => {
    const editable = report.severity !== "Sin incidencia";

    switch (column) {
      case "league":
        return (
          <td key={column} className="px-6 py-5">
            <LeagueLogoMarkClient
              league={report.league}
              className="h-[3.3rem] w-[4.8rem]"
            />
          </td>
        );
      case "id":
        return (
          <td key={column} className="px-6 py-5">
            <span className="inline-flex rounded-full border border-[#f3cfd8] bg-[#fff3f6] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
              {report.id_feed}
            </span>
          </td>
        );
      case "date":
        return (
          <td key={column} className="px-6 py-5">
            <span className="inline-flex text-sm font-black uppercase tracking-[0.12em] text-[#617187]">
              {formatCompactReportDate(report.event_date)}
            </span>
          </td>
        );
      case "match":
        return (
          <td key={column} className="px-8 py-5">
            <MatchSummaryCell
              matchLabel={report.match_label}
              competition={report.competition}
              metaTime={report.event_time}
            />
          </td>
        );
      case "responsible":
        return (
          <td key={column} className="px-6 py-5">
            <div className="flex items-center gap-3">
              <HoverAvatarBadge
                initials={getInitials(report.responsible_name)}
                roleLabel="Responsable"
                tone="accent"
                size="sm"
              />
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {report.responsible_name}
              </span>
            </div>
          </td>
        );
      case "paid":
        return (
          <td key={column} className="px-6 py-5">
            <div className="flex min-h-10 items-center justify-center">
              {report.paid ? (
                <CircleCheckBig className="size-6 text-[#10b981]" />
              ) : (
                <CircleX className="size-6 text-[#e44b68]" />
              )}
            </div>
          </td>
        );
      case "feed":
        return (
          <td key={column} className="px-6 py-5">
            <div className="flex min-h-10 items-center justify-center">
              {report.feed_detected ? (
                <CircleCheckBig className="size-6 text-[#10b981]" />
              ) : (
                <CircleX className="size-6 text-[#e44b68]" />
              )}
            </div>
          </td>
        );
      case "severity":
        return (
          <td key={column} className="px-6 py-5">
            <SeverityBadge severity={report.severity} />
          </td>
        );
      case "action":
        return (
          <td key={column} className="px-8 py-5 text-right">
            <button
              type="button"
              title={editable ? "Editar reporte" : "Ver reporte"}
              className="inline-flex size-10 items-center justify-center rounded-xl text-[#94a3b8] transition hover:bg-[var(--accent)] hover:text-white"
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
    const isRightAligned = column === "alerts";

    const label =
      column === "responsible"
        ? "Responsable"
        : column === "effectiveness"
          ? "Efectividad"
          : column === "reports"
            ? "Reportes"
            : "Alertas";

    return (
      <th
        key={column}
        className={cn(
          "px-2 pb-4 transition-colors",
          isRightAligned && "text-right",
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
        <div
          className={cn(
            "flex items-center gap-2",
            isRightAligned ? "justify-end" : "justify-between",
          )}
        >
          <span>{label}</span>
          <button
            type="button"
            draggable
            aria-label={`Reordenar columna ${label}`}
            onDragStart={() => handleRankingColumnDragStart(column)}
            onDragEnd={handleRankingColumnDragEnd}
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-md text-[#b0bccd] transition hover:bg-[#eef2f7] hover:text-[#617187]",
              draggedRankingColumn === column &&
                "bg-white text-[#617187] shadow-sm",
            )}
          >
            <GripVertical className="size-3.5" />
          </button>
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
            <div className="flex items-center gap-3">
              <HoverAvatarBadge
                initials={getInitials(item.responsible)}
                roleLabel="Responsable"
                tone="accent"
                size="sm"
              />
              <span className="text-sm font-bold text-[var(--foreground)]">
                {item.responsible}
              </span>
            </div>
          </td>
        );
      case "effectiveness":
        return (
          <td key={column} className="px-2 py-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-[var(--foreground)]">
                {item.effectiveness}%
              </span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#edf1f6]">
                <div
                  className={cn(
                    "h-full rounded-full",
                    item.effectiveness >= 98
                      ? "bg-[#10b981]"
                      : item.effectiveness >= 95
                        ? "bg-[var(--accent)]"
                        : "bg-[#f59e0b]",
                  )}
                  style={{ width: `${item.effectiveness}%` }}
                />
              </div>
            </div>
          </td>
        );
      case "reports":
        return (
          <td key={column} className="px-2 py-4 text-sm font-medium text-[#617187]">
            {item.reports}
          </td>
        );
      case "alerts":
        return (
          <td key={column} className="px-2 py-4 text-right text-sm font-bold text-[#617187]">
            {item.incidents}
          </td>
        );
      default:
        return null;
    }
  };

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

  const reportsBlockTitle =
    leagueFilter !== "Todas las ligas" ? leagueFilter : "Control de reportes";
  const canvasTone =
    activeView === "control" && leagueFilter !== "Todas las ligas"
      ? getReportLeagueCanvasTone(leagueFilter)
      : null;

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
      <div className="flex items-center gap-1 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm">
        {([
          ["day", "Día"],
          ["week", "Semana"],
          ["month", "Mes"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriodMode(value)}
            className={cn(
              "rounded-[calc(var(--panel-radius)-2px)] px-4 py-2 text-sm font-bold transition",
              periodMode === value
                ? "bg-[var(--accent)] text-white shadow-[0_10px_20px_rgba(230,18,56,0.18)]"
                : "text-[#617187] hover:bg-[#fafbfd]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

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
    <>
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
      <button
        type="button"
        className="inline-flex h-12 items-center gap-2 rounded-[var(--panel-radius)] bg-[var(--accent)] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)]"
      >
        <Download className="size-4" />
        Exportar
      </button>
      <SectionAiAssistant
        section="Reportes"
        title="Consulta el resumen actual"
        description="Haz preguntas ejecutivas sobre volumen, calidad, pagos, feed y responsables usando el corte visible."
        placeholder="Ej. ¿Qué liga concentra más reportes con incidencia en este periodo?"
        contextLabel="Resumen filtrado de reportes"
        context={aiContext}
        guidance="Responde con foco ejecutivo: volumen, incidencia, pagos, feed detectado, responsables y ligas más relevantes."
        examples={[
          "¿Qué liga tiene más cierres con incidencia?",
          "¿Cuántos reportes críticos están sin pago?",
          "¿Quién lidera el ranking de responsables visibles?",
        ]}
        hasGeminiKey={hasGeminiKey}
        buttonVariant="icon"
      />
    </>
  );

  const controlActions = (
    <>
      <label className="flex h-[52px] min-w-[280px] items-center gap-3 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] px-4 shadow-sm">
        <Search className="size-4 text-[var(--accent)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar ID feed, liga o responsable..."
          className="w-full bg-transparent text-sm font-medium text-[var(--foreground)] outline-none placeholder:text-[#94a3b8]"
        />
      </label>
      <SectionAiAssistant
        section="Reportes"
        title="Consulta los reportes visibles"
        description="Pregunta por gravedad, responsables, pagos, detección de feed o cierres pendientes usando solo los reportes visibles."
        placeholder="Ej. ¿Qué reportes tienen gravedad alta o crítica y quién es el responsable?"
        contextLabel="Reportes visibles en la tabla actual"
        context={aiContext}
        guidance="Prioriza gravedad, responsable, pago, detección de feed, partido, liga y problema. Si preguntan por pendientes, usa los reportes visibles con incidencia."
        examples={[
          "¿Qué reportes tienen Sin incidencia?",
          "¿Qué responsable lleva más cierres críticos?",
          "¿Qué partidos siguen con problemas de pago?",
        ]}
        hasGeminiKey={hasGeminiKey}
        buttonVariant="icon"
      />
      <button
        type="button"
        title="La carga persistida llegará con el módulo de reportes conectado a base de datos."
        className="inline-flex h-[52px] items-center gap-2 rounded-[var(--panel-radius)] bg-[var(--accent)] px-6 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)]"
      >
        <PlusCircle className="size-4" />
        Nuevo reporte
      </button>
    </>
  );

  const summaryTitle =
    activeView === "summary" ? "Resumen de reportes" : "Control operativo";

  const summaryDescription =
    activeView === "summary"
      ? "Panel ejecutivo de control, calidad y seguimiento financiero de cierres audiovisuales."
      : undefined;

  return (
    <div className="flex min-h-[42rem] flex-col gap-8 transition-colors">
      <SectionPageHeader
        title={summaryTitle}
        description={summaryDescription}
        actions={activeView === "summary" ? summaryActions : controlActions}
      />

      <div className="flex items-center gap-8 border-b border-[#edf1f6]">
        <button
          type="button"
          onClick={() => setActiveView("summary")}
          className={cn(
            "flex items-center gap-2 border-b-2 pb-3 text-sm font-extrabold transition",
            activeView === "summary"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[#94a3b8] hover:text-[#617187]",
          )}
        >
          <BarChart3 className="size-4" />
          Resumen
        </button>
        <button
          type="button"
          onClick={() => setActiveView("control")}
          className={cn(
            "flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition",
            activeView === "control"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[#94a3b8] hover:text-[#617187]",
          )}
        >
          <Filter className="size-4" />
          Control operativo
        </button>
      </div>

      {activeView === "summary" ? (
        <div className="space-y-8">
          <section className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            <div className="space-y-8">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 [&>*]:h-full">
                <MetricCard
                  title="Total partidos"
                  value={summaryMetrics.totalReports}
                  chip={`${summaryMetrics.activeLeagues} ligas activas`}
                  chipTone="success"
                  barClassName="bg-[var(--accent)]"
                  barWidth={100}
                />
                <MetricCard
                  title="Total incidencias"
                  value={summaryMetrics.withIncident}
                  chip={`${summaryMetrics.incidentPercent}% del total`}
                  chipTone="warning"
                  barClassName="bg-[#f59e0b]"
                  barWidth={summaryMetrics.incidentPercent}
                />
                <MetricCard
                  title="Detección de feed"
                  value={summaryMetrics.feedDetectedCount}
                  chip={`${summaryMetrics.feedPercent}% del total`}
                  chipTone="success"
                  barClassName="bg-[#10b981]"
                  barWidth={summaryMetrics.feedPercent}
                />
                <MetricCard
                  title="Pago"
                  value={summaryMetrics.paidCount}
                  chip={`${summaryMetrics.paidPercent}% del total`}
                  chipTone="success"
                  barClassName="bg-[#10b981]"
                  barWidth={summaryMetrics.paidPercent}
                />
              </section>

              <article className="panel-surface border border-[var(--border)] bg-[var(--surface)] p-8">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-[var(--foreground)]">
                      Evolución de reportes por liga{" "}
                      {periodMode === "day"
                        ? "por hora"
                        : periodMode === "week"
                          ? "por día"
                          : "por semana"}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-[#617187]">
                      Comparativo temporal de ligas y su volumen de reportes dentro del corte visible.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm">
                      {([
                        ["count", "Cantidad"],
                        ["rate", "Tasa %"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setIncidentChartMetric(value)}
                          className={cn(
                            "rounded-[calc(var(--panel-radius)-2px)] px-3 py-1.5 text-xs font-bold transition",
                            incidentChartMetric === value
                              ? "bg-[var(--accent)] text-white shadow-[0_10px_20px_rgba(230,18,56,0.18)]"
                              : "text-[#617187] hover:bg-[#fafbfd]",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm">
                      {([5, 10] as const).map((limit) => (
                        <button
                          key={limit}
                          type="button"
                          onClick={() => setIncidentChartLimit(limit)}
                          className={cn(
                            "rounded-[calc(var(--panel-radius)-2px)] px-3 py-1.5 text-xs font-bold transition",
                            incidentChartLimit === limit
                              ? "bg-[var(--accent)] text-white shadow-[0_10px_20px_rgba(230,18,56,0.18)]"
                              : "text-[#617187] hover:bg-[#fafbfd]",
                          )}
                        >
                          Top {limit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[var(--panel-radius)] bg-[#fcfdff] p-6">
                  {incidentLeagueChart.series.length ? (
                    <div className="space-y-6">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {incidentLeagueChart.series.map((item) => (
                          <div
                            key={item.league}
                            className="rounded-[var(--panel-radius)] border border-[#edf1f6] bg-white/80 p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                                <span
                                  className="size-2.5 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                {item.league}
                              </span>
                              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#617187]">
                                {incidentChartMetric === "count"
                                  ? `${item.totalIncidents} inc.`
                                  : `${Math.max(...item.points.map((point) => point.value)).toFixed(1)}% máx`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="h-[320px] rounded-[var(--panel-radius)] bg-white px-4 py-4">
                        <svg viewBox="0 0 720 260" className="h-full w-full overflow-visible">
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                            const y = 20 + 180 * ratio;

                            return (
                              <line
                                key={ratio}
                                x1="18"
                                x2="702"
                                y1={y}
                                y2={y}
                                stroke="#edf1f6"
                                strokeWidth="1"
                              />
                            );
                          })}

                          {incidentLeagueChart.series.map((item) => {
                            const values = item.points.map((point) => point.value);
                            const path = buildChartLinePath(
                              values,
                              684,
                              180,
                              incidentLeagueChart.maxValue,
                            );

                            return (
                              <g key={item.league} transform="translate(18 20)">
                                <path
                                  d={path}
                                  fill="none"
                                  stroke={item.color}
                                  strokeWidth={item.strokeWidth}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  opacity={item.strokeWidth > 3 ? 1 : 0.9}
                                />
                                {values.map((value, index) => {
                                  const x =
                                    values.length === 1
                                      ? 684 / 2
                                      : (684 / Math.max(values.length - 1, 1)) * index;
                                  const y =
                                    180 -
                                    (value / Math.max(incidentLeagueChart.maxValue, 1)) * 180;

                                  return (
                                    <circle
                                      key={`${item.league}-${incidentLeagueChart.labels[index]}`}
                                      cx={x}
                                      cy={y}
                                      r={item.strokeWidth > 3 ? 4.5 : 3.5}
                                      fill={item.color}
                                      stroke="#ffffff"
                                      strokeWidth="2"
                                    />
                                  );
                                })}
                              </g>
                            );
                          })}

                          {incidentLeagueChart.labels.map((label, index, labels) => {
                            const x =
                              labels.length === 1
                                ? 360
                                : 18 + (684 / Math.max(labels.length - 1, 1)) * index;

                            return (
                              <text
                                key={label}
                                x={x}
                                y="235"
                                textAnchor="middle"
                                className="fill-[#94a3b8] text-[11px] font-black tracking-[0.12em]"
                              >
                                {label}
                              </text>
                            );
                          })}

                          {[0, 0.5, 1].map((ratio, index) => {
                            const value = Math.round(
                              incidentLeagueChart.maxValue * (1 - ratio) * 10,
                            ) / 10;
                            const y = 24 + 180 * ratio;

                            return (
                              <text
                                key={`${ratio}-${index}`}
                                x="0"
                                y={y}
                                textAnchor="start"
                                className="fill-[#94a3b8] text-[11px] font-black"
                              >
                                {incidentChartMetric === "rate" ? `${value}%` : value}
                              </text>
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="Sin datos para este corte"
                      description="Cambia el periodo o la liga para reconstruir la evolución de incidencias por liga."
                    />
                  )}
                </div>
              </article>
            </div>

            <article className="panel-surface border border-[var(--border)] bg-[var(--surface)] p-8">
              <h3 className="text-2xl font-black text-[var(--foreground)]">
                Distribución general
              </h3>
              <div className="mt-8 space-y-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Por liga
                  </p>
                  {leagueDistribution.map((item) => {
                    const maxCount = Math.max(
                      ...leagueDistribution.map((entry) => entry.count),
                      1,
                    );

                    return (
                      <div key={item.league} className="space-y-2">
                        <div className="flex items-center justify-between gap-4 text-sm font-bold">
                          <span className="text-[#617187]">{item.league}</span>
                          <span className="text-[var(--foreground)]">
                            {item.count} reportes
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#edf1f6]">
                          <div
                            className="h-full rounded-full bg-[#1f2937]"
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-[#edf1f6] pt-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Gravedad
                  </p>
                  <div className="mt-4 space-y-4">
                    {severityDistribution.map((item) => {
                      const barClassName =
                        item.severity === "Crítica"
                          ? "bg-[#a12ad6]"
                          : item.severity === "Alta"
                            ? "bg-[#e44b68]"
                            : item.severity === "Media"
                              ? "bg-[#e7c247]"
                              : item.severity === "Baja"
                                ? "bg-[#d8e2ef]"
                                : "bg-[#10b981]";

                      return (
                        <div key={item.severity} className="space-y-2">
                          <div className="flex items-center justify-between text-sm font-bold">
                            <span className="text-[#617187]">{item.severity}</span>
                            <span className="text-[var(--foreground)]">
                              {item.percentage}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#edf1f6]">
                            <div
                              className={cn("h-full rounded-full", barClassName)}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-[#edf1f6] pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                      Reincidencia por sede
                    </p>
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">
                      Top {venueRecurrence.length}
                    </span>
                  </div>
                  <div className="mt-4 space-y-4">
                    {venueRecurrence.length ? (
                      venueRecurrence.map((item) => (
                        <div key={item.venue} className="flex items-center gap-3">
                          <div title={item.venue}>
                            <ClientTeamLogoMark
                              teamName={item.teamName}
                              competition={item.competition}
                              className="size-11 rounded-[12px] border-transparent bg-transparent shadow-none"
                              imageClassName="object-contain p-0.5"
                              initialsClassName="text-[10px] tracking-[0.12em] text-[#70819b]"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <span className="truncate text-xs font-bold text-[#617187]">
                                {item.teamName}
                              </span>
                              <span className="shrink-0 text-xs font-black text-[var(--foreground)]">
                                {item.total}
                              </span>
                            </div>
                            <div className="flex h-2.5 overflow-hidden rounded-full bg-[#edf1f6]">
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
                        </div>
                      ))
                    ) : (
                      <p className="text-sm font-medium text-[#94a3b8]">
                        No hay reincidencias por sede en el periodo visible.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)]">
            <article className="panel-surface border border-[var(--border)] bg-[var(--surface)] p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-black text-[var(--foreground)]">
                  Ranking de responsables
                </h3>
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#11915a]">
                  Top performance
                </span>
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
                      <tr key={item.responsible} className="transition hover:bg-[#fafbfd]">
                        {rankingColumnOrder.map((column) =>
                          renderRankingCell(item, column),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <div>
              <article className="rounded-[var(--panel-radius)] bg-[var(--accent)] p-6 text-white shadow-[0_18px_40px_rgba(230,18,56,0.18)]">
                <div className="flex items-center gap-2">
                  <Bot className="size-5" />
                  <h3 className="text-xl font-black">Insights de IA</h3>
                </div>
                <div className="mt-6 space-y-3">
                  {summaryInsights.slice(0, 2).map((insight, index) => (
                    <div
                      key={insight}
                      className="rounded-[var(--panel-radius)] border border-white/15 bg-white/10 p-4"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
                        {index === 0 ? "Anomalía detectada" : "Lectura de periodo"}
                      </p>
                      <p className="mt-2 text-sm font-medium leading-6">{insight}</p>
                    </div>
                  ))}
                </div>
                <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[var(--panel-radius)] bg-white px-4 py-3 text-sm font-extrabold text-[var(--accent)] transition hover:bg-white/95">
                  <Sparkles className="size-4" />
                  Generar reporte detallado
                </button>
              </article>
            </div>
          </section>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-8 transition-colors",
            selectedReport
              ? "xl:grid-cols-[minmax(0,1fr)_420px]"
              : "grid-cols-1",
          )}
        >
          <div className="flex min-w-0 flex-col gap-10">
            <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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

                    <div className="flex items-center gap-1 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] p-1">
                      {([
                        ["day", "Día"],
                        ["week", "Semana"],
                        ["month", "Mes"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPeriodMode(value)}
                          className={cn(
                            "rounded-[calc(var(--panel-radius)-2px)] px-3 py-2 text-sm font-bold transition",
                            periodMode === value
                              ? "bg-[var(--accent)] text-white shadow-[0_8px_20px_rgba(230,18,56,0.14)]"
                              : "text-[#617187] hover:bg-[#fafbfd]",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

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
                    <div className="flex gap-1">
                      <button className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[#94a3b8]">
                        1
                      </button>
                      <button className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[#fafbfd] text-[#94a3b8]">
                        2
                      </button>
                      <button className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[#fafbfd] text-[#94a3b8]">
                        3
                      </button>
                    </div>
                  </>
                }
              >
                {queryFilteredReports.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
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
                              onClick={() => setSelectedReportId(report.id_feed)}
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
                      title="No encontramos reportes con esa búsqueda"
                      description="Prueba con otro ID, responsable o liga para volver al tablero completo de cierres."
                    />
                  </div>
                )}
              </SectionTableCard>
            </section>
          </div>

          {selectedReport ? (
            <aside className="panel-surface fixed inset-x-4 bottom-4 top-24 z-40 flex flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)] xl:sticky xl:top-0 xl:self-start xl:h-[calc(100vh-8rem)] xl:w-full">
              <div className="border-b border-[var(--border)] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                    Detalle de reporte
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedReportId(null)}
                    aria-label="Cerrar detalle de reporte"
                    className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--background-soft)] text-[#94a3b8]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-[#f3cfd8] bg-[#fff3f6] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                    {selectedReport.id_bp}
                  </span>
                  <span
                    style={{
                      backgroundColor: getTeamLeagueColorSet(selectedReport.league).soft,
                      color: getTeamLeagueColorSet(selectedReport.league).accent,
                    }}
                    className="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                  >
                    {selectedReport.league}
                  </span>
                </div>

                <h3 className="text-[2rem] font-black leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
                  {selectedReport.match_label}
                </h3>

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

              <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-6 xl:max-h-[calc(100vh-14rem)]">
                <section className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Resumen operativo
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    {selectedReportOperations.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="panel-radius border border-[var(--border)] bg-[var(--background-soft)] p-4"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex size-8 items-center justify-center rounded-full",
                                item.tone,
                              )}
                            >
                              <Icon className="size-4" />
                            </span>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                              {item.label}
                            </p>
                          </div>
                          <p className="mt-3 text-sm font-bold text-[var(--foreground)]">
                            {item.value}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Problema principal
                  </h4>
                  <div className="panel-radius border border-[var(--border)] bg-[var(--background-soft)] p-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#fff3f6] text-[var(--accent)]">
                        <AlertTriangle className="size-4" />
                      </span>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-[var(--foreground)]">
                          {selectedReport.problem}
                        </p>
                        <p className="text-xs leading-6 text-[#70819b]">
                          {selectedReport.technical_notes}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    IDs operativos
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="panel-radius border border-[var(--border)] bg-white p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                        ID feed
                      </p>
                      <p className="mt-2 font-mono text-sm font-bold text-[var(--foreground)]">
                        {selectedReport.id_feed}
                      </p>
                    </div>
                    <div className="panel-radius border border-[var(--border)] bg-white p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                        Competencia
                      </p>
                      <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                        {selectedReport.competition}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Actividad reciente
                  </h4>
                  <div className="space-y-4">
                    {activities.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4">
                        <span
                          className={cn(
                            "mt-1.5 size-2 rounded-full",
                            getActivityToneClass(activity.tone),
                          )}
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-[var(--foreground)]">
                            {activity.title}
                          </p>
                          <p className="text-xs text-[#70819b]">{activity.detail}</p>
                          <p className="inline-flex items-center gap-1 text-xs font-medium text-[#94a3b8]">
                            <CircleDot className="size-3" />
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </div>
  );
}
