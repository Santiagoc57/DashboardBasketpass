"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  FileText,
  Filter,
  GripVertical,
  Gauge,
  History,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Palette,
  Paperclip,
  Plus,
  Radio,
  ScanText,
  Search,
  ShieldAlert,
  Sparkles,
  Upload,
  UserRound,
  Wifi,
  X,
} from "lucide-react";

import { SectionAiAssistant } from "@/components/ai/section-ai-assistant";
import { LeagueLogoMarkClient } from "@/components/league-logo-mark-client";
import { SectionPageHeader } from "@/components/layout/section-page-header";
import { MatchSummaryCell } from "@/components/shared/match-summary-cell";
import { badgeBaseClassName } from "@/components/ui/badge";
import { HoverAvatarBadge } from "@/components/ui/hover-avatar-badge";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { SectionTableCard } from "@/components/ui/section-table-card";
import type {
  IncidentProblem,
  IncidentRecord,
} from "@/lib/incidents";
import { getTeamLeagueColorSet } from "@/lib/team-directory";
import { cn } from "@/lib/utils";

type SpeedtestProofExtraction = {
  ping: string | null;
  upload: string | null;
  download: string | null;
  provider: string | null;
  locationServer: string | null;
  dateTime: string | null;
  note: string | null;
};

type SpeedtestProofState = {
  fileName: string;
  fileSizeLabel: string;
  extracted: SpeedtestProofExtraction | null;
  error: string | null;
  parsing: boolean;
};

type IncidentAttachment = {
  fileName: string;
  fileSizeLabel: string;
};

type IncidentEvidenceState = {
  pingAttachment?: IncidentAttachment | null;
  gpuAttachment?: IncidentAttachment | null;
  venueImages?: IncidentAttachment[];
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

const INCIDENT_CONTROL_COLUMNS_STORAGE_KEY =
  "basket-production.incidents.control-columns";
const DEFAULT_INCIDENT_CONTROL_COLUMNS: IncidentControlColumn[] = [
  "league",
  "id",
  "date",
  "match",
  "severity",
  "operator",
  "streamer",
  "issue",
  "updated",
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
  const monthIndex = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
  }[monthLabel];

  return new Date(Number(year), monthIndex ?? 0, Number(day));
}

function formatCompactIncidentDate(value: string) {
  const date = parseIncidentEventDate(value);
  const day = String(date.getDate()).padStart(2, "0");
  const months = [
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

  return `${day} ${months[date.getMonth()] ?? ""}`;
}

function splitIncidentMatchLabel(matchLabel: string) {
  const [homeTeam, awayTeam] = matchLabel.split(/\s+vs\s+/i);

  return {
    homeTeam: homeTeam?.trim() || matchLabel,
    awayTeam: awayTeam?.trim() || "",
  };
}

function splitMetricValue(value: string) {
  const match = value.trim().match(/^([\d.,]+)\s*(.*)$/);

  if (!match) {
    return { amount: value, unit: "" };
  }

  return {
    amount: match[1] ?? value,
    unit: match[2]?.trim() ?? "",
  };
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
  return (
    <div
      className={cn(
        "panel-radius flex min-h-[76px] items-center gap-3 border px-3 py-3",
        problem.active
          ? "border-[#ffd8df] bg-[#fff3f6]"
          : "border-[#e7eaef] bg-white",
      )}
    >
      <span
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full",
          problem.active ? "bg-[#ffe7ed] text-[var(--accent)]" : "bg-[#f5f7fb] text-[#b0b8c5]",
        )}
      >
        {problem.label.includes("Internet") ? (
          <Wifi className="size-4" />
        ) : problem.label.includes("OCR") ? (
          <ScanText className="size-4" />
        ) : problem.label.includes("Overlays") ? (
          <Sparkles className="size-4" />
        ) : problem.label.includes("IMG") ? (
          <ImageIcon className="size-4" />
        ) : problem.label.includes("Gráfica") ? (
          <Palette className="size-4" />
        ) : (
          <AlertTriangle className="size-4" />
        )}
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
  if (label.includes("Internet")) {
    return { label: "INTERNET", Icon: Wifi };
  }

  if (label.includes("OCR")) {
    return { label: "OCR", Icon: ScanText };
  }

  if (label.includes("Overlays")) {
    return { label: "GES", Icon: Sparkles };
  }

  if (label.includes("IMG")) {
    return { label: "IMG", Icon: ImageIcon };
  }

  if (label.includes("Gráfica")) {
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

function ActiveProblemSummary({ problems }: { problems: IncidentProblem[] }) {
  const activeProblems = problems.filter((problem) => problem.active);

  if (activeProblems.length === 0) {
    return (
      <span
        title="SIN MARCAS"
        className="inline-flex size-8 items-center justify-center rounded-full border border-[#d7eadf] bg-[#f3fcf6] text-[#178a56]"
      >
        <CheckCircle2 className="size-4" />
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
}: {
  incidents: IncidentRecord[];
  hasGeminiKey: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<
    "details" | "activity" | "notes" | "images"
  >("details");
  const [query, setQuery] = useState("");
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
  const [proofsByIncident, setProofsByIncident] = useState<
    Record<string, SpeedtestProofState>
  >({});
  const [evidenceByIncident, setEvidenceByIncident] = useState<
    Record<string, IncidentEvidenceState>
  >({});

  function handleSort(nextSortBy: IncidentSortKey) {
    if (sortBy === nextSortBy) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection(nextSortBy === "severity" || nextSortBy === "updated" ? "desc" : "asc");
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

  const filteredIncidents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return incidents;
    }

    return incidents.filter((incident) =>
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
  }, [incidents, query]);

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
  const selectedProof = selectedIncident ? proofsByIncident[selectedIncident.id] ?? null : null;
  const selectedEvidence = selectedIncident ? evidenceByIncident[selectedIncident.id] ?? {} : {};
  const resolvedSpeedtest =
    selectedProof?.extracted?.upload ?? selectedIncident?.speedtest ?? "";
  const resolvedPing = selectedProof?.extracted?.ping ?? selectedIncident?.ping ?? "";
  const resolvedSpeedtestParts = splitMetricValue(resolvedSpeedtest);
  const resolvedPingParts = splitMetricValue(resolvedPing);
  const resolvedGpuParts = splitMetricValue(selectedIncident?.gpuLoad ?? "");
  const selectedPingAttachment =
    selectedEvidence.pingAttachment ?? selectedIncident?.pingAttachment ?? null;
  const selectedGpuAttachment =
    selectedEvidence.gpuAttachment ?? selectedIncident?.gpuAttachment ?? null;
  const selectedVenueImages =
    selectedEvidence.venueImages ?? selectedIncident?.venueImages ?? [];
  const selectedSeverityTone = selectedIncident
    ? getIncidentSeverityPanelTone(selectedIncident.severity)
    : null;
  const selectedIncidentTeams = selectedIncident
    ? splitIncidentMatchLabel(selectedIncident.matchLabel)
    : null;

  async function handleSpeedtestProofChange(
    incident: IncidentRecord,
    file: File | null,
  ) {
    if (!file) {
      return;
    }

    setProofsByIncident((current) => ({
      ...current,
      [incident.id]: {
        fileName: file.name,
        fileSizeLabel: formatBytes(file.size),
        extracted: current[incident.id]?.extracted ?? null,
        error: null,
        parsing: hasGeminiKey,
      },
    }));

    if (!hasGeminiKey) {
      return;
    }

    const formData = new FormData();
    formData.set("image", file);

    try {
      const response = await fetch("/api/ai/speedtest", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        error?: string;
        extracted?: SpeedtestProofExtraction;
      };

      if (!response.ok || !payload.extracted) {
        throw new Error(payload.error || "No pudimos leer la captura adjunta.");
      }

      setProofsByIncident((current) => ({
        ...current,
        [incident.id]: {
          fileName: file.name,
          fileSizeLabel: formatBytes(file.size),
          extracted: payload.extracted ?? null,
          error: null,
          parsing: false,
        },
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos leer la captura del speedtest.";

      setProofsByIncident((current) => ({
        ...current,
        [incident.id]: {
          fileName: file.name,
          fileSizeLabel: formatBytes(file.size),
          extracted: current[incident.id]?.extracted ?? null,
          error: message,
          parsing: false,
        },
      }));
    }
  }

  function handleEvidenceFileChange(
    incident: IncidentRecord,
    kind: "pingAttachment" | "gpuAttachment",
    file: File | null,
  ) {
    if (!file) {
      return;
    }

    setEvidenceByIncident((current) => ({
      ...current,
      [incident.id]: {
        ...current[incident.id],
        [kind]: {
          fileName: file.name,
          fileSizeLabel: formatBytes(file.size),
        },
      },
    }));
  }

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
        })),
      },
    }));
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
        speedtest: proofsByIncident[incident.id]?.extracted?.upload ?? incident.speedtest,
        ping: proofsByIncident[incident.id]?.extracted?.ping ?? incident.ping,
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
    [filteredIncidents, proofsByIncident],
  );

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
            ? "FECHA"
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
                    : "ACTUALIZADO";

    return (
      <th
        key={column}
        className={cn(
          "px-6 py-4 transition-colors",
          column === "match" && "px-8",
          isRightAligned && "px-8 text-right",
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
            isRightAligned ? "justify-end" : "justify-between",
          )}
        >
          {sortKey ? (
            <SortHeader
              label={label}
              active={sortBy === sortKey}
              direction={sortDirection}
              onClick={() => handleSort(sortKey)}
              align={isRightAligned ? "right" : "left"}
            />
          ) : (
            <span>{label}</span>
          )}
          <button
            type="button"
            draggable
            aria-label={`Reordenar columna ${label}`}
            onDragStart={() => handleColumnDragStart(column)}
            onDragEnd={handleColumnDragEnd}
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-md text-[#b0bccd] transition hover:bg-[#eef2f7] hover:text-[#617187]",
              draggedColumn === column && "bg-white text-[#617187] shadow-sm",
            )}
          >
            <GripVertical className="size-3.5" />
          </button>
        </div>
      </th>
    );
  };

  const renderIncidentControlCell = (
    incident: IncidentRecord,
    column: IncidentControlColumn,
  ) => {
    const cellClassName = cn(
      "px-6 py-5",
      column === "match" && "px-8",
      column === "updated" && "px-8 text-right",
    );

    switch (column) {
      case "league":
        return (
          <td key={column} className={cellClassName}>
            <LeagueLogoMarkClient
              league={getIncidentLeagueLabel(incident.competition)}
              className="h-[3.3rem] w-[4.8rem]"
            />
          </td>
        );
      case "id":
        return (
          <td key={column} className={cellClassName}>
            <span className="inline-flex rounded-full border border-[#f3cfd8] bg-[#fff3f6] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
              {incident.id}
            </span>
          </td>
        );
      case "date":
        return (
          <td key={column} className={cellClassName}>
            <span className="inline-flex text-sm font-black uppercase tracking-[0.12em] text-[#617187]">
              {formatCompactIncidentDate(incident.eventDate)}
            </span>
          </td>
        );
      case "match":
        return (
          <td key={column} className={cellClassName}>
            <MatchSummaryCell
              matchLabel={incident.matchLabel}
              competition={incident.competition}
              metaTime={getIncidentTimeLabel(incident.updatedAt)}
            />
          </td>
        );
      case "severity":
        return (
          <td key={column} className={cellClassName}>
            <SeverityBadge
              severity={incident.severity}
              className="rounded-full text-xs"
            />
          </td>
        );
      case "operator":
        return (
          <td key={column} className={cellClassName}>
            <div className="flex items-center gap-3 text-sm font-medium text-[#4b5c74]">
              <HoverAvatarBadge
                initials={getInitials(incident.operatorControl)}
                roleLabel="Operador"
                tone="accent"
                size="sm"
              />
              <span>{incident.operatorControl}</span>
            </div>
          </td>
        );
      case "streamer":
        return (
          <td key={column} className={cellClassName}>
            <div className="flex items-center gap-3 text-sm font-medium text-[#4b5c74]">
              <HoverAvatarBadge
                initials={getInitials(incident.streamer)}
                roleLabel="Streamer"
                tone="neutral"
                size="sm"
              />
              <span>{incident.streamer}</span>
            </div>
          </td>
        );
      case "issue":
        return (
          <td
            key={column}
            className={cn(cellClassName, "max-w-[320px] text-sm font-medium text-[#4b5c74]")}
          >
            <ActiveProblemSummary problems={incident.problems} />
          </td>
        );
      case "updated":
        return (
          <td key={column} className={cn(cellClassName, "text-sm text-[#70819b]")}>
            {incident.updatedRelative}
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "grid min-h-[42rem] gap-8",
        selectedIncident ? "xl:grid-cols-[minmax(0,1fr)_420px]" : "grid-cols-1",
      )}
    >
      <div className="flex min-w-0 flex-col gap-10">
        <SectionPageHeader
          title="Incidencias"
          actions={
            <>
            <label className="flex h-[52px] min-w-[280px] items-center gap-3 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] px-4 shadow-sm">
              <Search className="size-4 text-[var(--accent)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar incidencia, partido u operador..."
                className="w-full bg-transparent text-sm font-medium text-[var(--foreground)] outline-none placeholder:text-[#94a3b8]"
              />
            </label>

            <button
              type="button"
              className="inline-flex h-[52px] items-center gap-2 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-bold text-[var(--foreground)] shadow-sm"
            >
              <Filter className="size-4 text-[var(--accent)]" />
              Filtrar
            </button>

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

            <button
              type="button"
              title="La carga persistida llegará con el módulo conectado a base de datos."
              className="inline-flex h-[52px] items-center gap-2 rounded-[var(--panel-radius)] bg-[var(--accent)] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(230,18,56,0.18)]"
            >
              <Plus className="size-4" />
              Nueva incidencia
            </button>
            </>
          }
        />

        <section
          className={cn(
            "grid gap-4 sm:grid-cols-2",
            selectedIncident ? "2xl:grid-cols-4" : "xl:grid-cols-4",
          )}
        >
          <article className="panel-surface border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#70819b]">
              Total incidencias
            </p>
            <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-[var(--foreground)]">
              {metrics.total}
            </p>
            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="inline-flex items-center rounded-xl bg-[#f4f7fb] px-2.5 py-1 text-[11px] font-bold text-[#617187]">
                {metrics.competitionCount} competencias
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#e7edf5]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.max(10, Math.min(metrics.total * 18, 100))}%` }}
                />
              </div>
            </div>
          </article>

          <article className="panel-surface border border-[#ffd7df] bg-[#fff5f7] p-5 ring-1 ring-[#ffd7df]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              Críticas
            </p>
            <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-[var(--accent)]">
              {metrics.critical}
            </p>
            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="inline-flex items-center rounded-xl bg-[#ffe4ea] px-2.5 py-1 text-[11px] font-bold text-[var(--accent)]">
                Atención inmediata
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#f3c8d4]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${metrics.criticalPercent}%` }}
                />
              </div>
            </div>
          </article>

          <article className="panel-surface border border-[#ffe6c7] bg-white p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6a27]">
              Altas y medias
            </p>
            <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-[var(--foreground)]">
              {metrics.mediumHigh}
            </p>
            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="inline-flex items-center rounded-xl bg-[#fff4e8] px-2.5 py-1 text-[11px] font-bold text-[#d97706]">
                {metrics.mediumHighPercent}% del total
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#fae5c5]">
                <div
                  className="h-full rounded-full bg-[#f59e0b]"
                  style={{ width: `${metrics.mediumHighPercent}%` }}
                />
              </div>
            </div>
          </article>

          <article className="panel-surface border border-[#d8f0e3] bg-[var(--surface)] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#4b7a61]">
              Partidos afectados
            </p>
            <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-[var(--foreground)]">
              {metrics.affectedMatches}
            </p>
            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="inline-flex items-center rounded-xl bg-[#ebfaf1] px-2.5 py-1 text-[11px] font-bold text-[#0f9f61]">
                {metrics.affectedMatchesPercent}% del total
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#dcefe5]">
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
            <span className={`${badgeBaseClassName} bg-[var(--background-soft)] text-[#617187]`}>
              {filteredIncidents.length} visibles
            </span>
          }
          footer={
            <>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#617187]">
                Mostrando {filteredIncidents.length} de {incidents.length} incidencias
              </p>
              <div className="flex gap-1">
                <button className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[#94a3b8]">
                  1
                </button>
              </div>
            </>
          }
          className="flex h-full min-h-0 flex-col"
        >
          <div className="flex-1 overflow-auto">
            <table className="min-w-full text-left">
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
                      onClick={() => {
                        setSelectedId(incident.id);
                        setDrawerTab("details");
                      }}
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
        </SectionTableCard>
        </div>
      </div>

      {selectedIncident ? (
        <aside className="panel-surface fixed inset-x-4 bottom-4 top-24 z-40 flex flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)] xl:sticky xl:inset-auto xl:top-24 xl:bottom-auto xl:z-auto xl:h-[calc(100vh-7rem)] xl:w-full xl:self-start">
            <div className="border-b border-[var(--border)] p-6">
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
                      color: getTeamLeagueColorSet(
                        getIncidentLeagueLabel(selectedIncident.competition),
                      ).accent,
                    }}
                    className="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
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
                  <p className="text-[1.6rem] font-black leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
                    {selectedIncidentTeams?.homeTeam ?? selectedIncident.matchLabel}
                  </p>
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

            <div className="border-b border-[var(--border)] px-6">
              <div className="grid grid-cols-4 gap-2 border-b border-[var(--border)]/60">
                <button
                  type="button"
                  onClick={() => setDrawerTab("details")}
                  className={cn(
                    "inline-flex min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 pb-4 pt-3 text-[10px] font-black uppercase tracking-[0.12em] transition",
                    drawerTab === "details"
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-transparent text-[#94a3b8] hover:text-[#617187]",
                  )}
                >
                  <Eye className="size-3.5 shrink-0" />
                  <span className="truncate">Detalle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("activity")}
                  className={cn(
                    "inline-flex min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 pb-4 pt-3 text-[10px] font-black uppercase tracking-[0.12em] transition",
                    drawerTab === "activity"
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-transparent text-[#94a3b8] hover:text-[#617187]",
                  )}
                >
                  <History className="size-3.5 shrink-0" />
                  <span className="truncate">Log</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("notes")}
                  className={cn(
                    "inline-flex min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 pb-4 pt-3 text-[10px] font-black uppercase tracking-[0.12em] transition",
                    drawerTab === "notes"
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-transparent text-[#94a3b8] hover:text-[#617187]",
                  )}
                >
                  <FileText className="size-3.5 shrink-0" />
                  <span className="truncate">Notas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("images")}
                  className={cn(
                    "inline-flex min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 pb-4 pt-3 text-[10px] font-black uppercase tracking-[0.12em] transition",
                    drawerTab === "images"
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-transparent text-[#94a3b8] hover:text-[#617187]",
                  )}
                >
                  <ImageIcon className="size-3.5 shrink-0" />
                  <span className="truncate">Imgs</span>
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {drawerTab === "details" ? (
                <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-[var(--accent)]" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Severidad
                  </h4>
                </div>
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
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 text-[var(--accent)]" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Responsables
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="panel-radius border border-[var(--border)] bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                      Operador
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <HoverAvatarBadge
                        initials={getInitials(selectedIncident.operatorControl)}
                        roleLabel="Operador"
                        tone="accent"
                        size="md"
                      />
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        {selectedIncident.operatorControl}
                      </p>
                    </div>
                  </div>
                  <div className="panel-radius border border-[var(--border)] bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                      Streamer
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <HoverAvatarBadge
                        initials={getInitials(selectedIncident.streamer)}
                        roleLabel="Streamer"
                        tone="neutral"
                        size="md"
                      />
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        {selectedIncident.streamer}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-[var(--accent)]" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Contexto del partido
                  </h4>
                </div>
                <div className="grid gap-3">
                  <div className="panel-radius border border-[var(--border)] bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                      Competencia
                    </p>
                    <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                      {selectedIncident.competition}
                    </p>
                  </div>
                  <div className="panel-radius border border-[var(--border)] bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                      Sede
                    </p>
                    <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                      {selectedIncident.venue}
                    </p>
                  </div>
                  <div className="panel-radius border border-[var(--border)] bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                      Tipo de transmisión
                    </p>
                    <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                      {selectedIncident.transmissionType}
                    </p>
                  </div>
                  <div className="panel-radius border border-[var(--border)] bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                      Envíos de señal
                    </p>
                    <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                      {selectedIncident.signalDelivery}
                    </p>
                  </div>
                  <div className="panel-radius border border-[var(--border)] bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                      Apto lineal
                    </p>
                    <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                      {selectedIncident.aptoLineal ? "Sí" : "No"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-[var(--accent)]" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Pruebas de salida
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="panel-radius flex min-h-[92px] items-center gap-3 border border-[var(--border)] bg-white p-4">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#f8f9fb] text-[#94a3b8]">
                      <Clock3 className="size-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                        Hora de prueba
                      </p>
                      <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                        {selectedIncident.testTime}
                      </p>
                    </div>
                  </div>
                  <div className="panel-radius flex min-h-[92px] items-center gap-3 border border-[var(--border)] bg-white p-4">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#f8f9fb] text-[#94a3b8]">
                      <FileText className="size-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                        Prueba
                      </p>
                      <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                        {selectedIncident.testCheck}
                      </p>
                    </div>
                  </div>
                  <div className="panel-radius flex min-h-[92px] items-center gap-3 border border-[var(--border)] bg-white p-4">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#f8f9fb] text-[#94a3b8]">
                      <Clock3 className="size-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                        Inicio
                      </p>
                      <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                        {selectedIncident.startCheck}
                      </p>
                    </div>
                  </div>
                  <div className="panel-radius flex min-h-[92px] items-center gap-3 border border-[var(--border)] bg-white p-4">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#f8f9fb] text-[#94a3b8]">
                      <Palette className="size-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                        Gráfica
                      </p>
                      <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                        {selectedIncident.graphicsCheck}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Gauge className="size-4 text-[var(--accent)]" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Bloque técnico
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="panel-radius grid min-h-[92px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-[var(--border)] bg-white p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        Speedtest
                      </p>
                      <p className="text-xs text-[#94a3b8]">Subida</p>
                    </div>
                    <div className="min-w-[5.5rem] pl-2 text-right">
                      <p className="text-sm font-mono font-bold text-[var(--accent)]">
                        {resolvedSpeedtestParts.amount}
                      </p>
                      {resolvedSpeedtestParts.unit ? (
                        <p className="text-sm font-mono font-bold text-[var(--accent)]">
                          {resolvedSpeedtestParts.unit}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="panel-radius grid min-h-[92px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-[var(--border)] bg-white p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        Ping
                      </p>
                      <p className="text-xs text-[#94a3b8]">Nodo principal</p>
                    </div>
                    <div className="min-w-[5.5rem] pl-2 text-right">
                      <p className="text-sm font-mono font-bold text-[var(--foreground)]">
                        {resolvedPingParts.amount}
                      </p>
                      {resolvedPingParts.unit ? (
                        <p className="text-sm font-mono font-bold text-[var(--foreground)]">
                          {resolvedPingParts.unit}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="panel-radius grid min-h-[92px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-[var(--border)] bg-white p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        GPU
                      </p>
                      <p className="text-xs text-[#94a3b8]">Encoder local</p>
                    </div>
                    <div className="min-w-[5.5rem] pl-2 text-right">
                      <p className="text-sm font-mono font-bold text-[var(--foreground)]">
                        {resolvedGpuParts.amount}
                      </p>
                      {resolvedGpuParts.unit ? (
                        <p className="text-sm font-mono font-bold text-[var(--foreground)]">
                          {resolvedGpuParts.unit}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-[#d7dee8] bg-[#fafbfd] px-4 py-3 transition hover:border-[var(--accent)] hover:bg-[#fff7f9]">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-[#94a3b8] shadow-sm">
                      <Upload className="size-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-[var(--foreground)]">
                        Subir captura de speedtest
                      </span>
                      <span className="block text-xs text-[#94a3b8]">
                        PNG, JPG o WEBP. Si Gemini está configurado, la lectura es automática.
                      </span>
                    </span>
                    {selectedProof?.extracted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfaf1] px-2.5 py-1 text-[11px] font-bold text-[#15945b]">
                        <Sparkles className="size-3.5" />
                        Leído con IA
                      </span>
                    ) : (
                      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-[#94a3b8] shadow-sm">
                        <Paperclip className="size-4" />
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      className="hidden"
                      onChange={(event) =>
                        handleSpeedtestProofChange(
                          selectedIncident,
                          event.target.files?.[0] ?? null,
                        )
                      }
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-[#d7dee8] bg-[#fafbfd] px-4 py-3 transition hover:border-[var(--accent)] hover:bg-[#fff7f9]">
                      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-[#94a3b8] shadow-sm">
                        <Upload className="size-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-[var(--foreground)]">
                          Subir captura de ping
                        </span>
                        <span className="block text-xs text-[#94a3b8]">
                          Adjunta la evidencia del ping tomada por el técnico.
                        </span>
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        className="hidden"
                        onChange={(event) =>
                          handleEvidenceFileChange(
                            selectedIncident,
                            "pingAttachment",
                            event.target.files?.[0] ?? null,
                          )
                        }
                      />
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-[#d7dee8] bg-[#fafbfd] px-4 py-3 transition hover:border-[var(--accent)] hover:bg-[#fff7f9]">
                      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-[#94a3b8] shadow-sm">
                        <Upload className="size-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-[var(--foreground)]">
                          Subir captura de GPU
                        </span>
                        <span className="block text-xs text-[#94a3b8]">
                          Adjunta la captura del uso de GPU del encoder.
                        </span>
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        className="hidden"
                        onChange={(event) =>
                          handleEvidenceFileChange(
                            selectedIncident,
                            "gpuAttachment",
                            event.target.files?.[0] ?? null,
                          )
                        }
                      />
                    </label>
                  </div>

                  {selectedProof ? (
                    <div className="rounded-[10px] border border-[var(--border)] bg-[#fcfcfd] p-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[#eef2f6] text-[#7c8aa0]">
                          {selectedProof.parsing ? (
                            <LoaderCircle className="size-5 animate-spin" />
                          ) : (
                            <FileText className="size-5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[var(--foreground)]">
                            {selectedProof.fileName}
                          </p>
                          <p className="text-xs text-[#94a3b8]">
                            {selectedProof.fileSizeLabel}
                          </p>
                        </div>
                      </div>

                      {selectedProof.parsing ? (
                        <p className="mt-3 text-xs font-medium text-[#617187]">
                          Leyendo captura con IA...
                        </p>
                      ) : null}

                      {selectedProof.extracted ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {selectedProof.extracted.upload ? (
                            <div className="rounded-lg bg-[#f6f8fb] px-3 py-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">
                                Upload
                              </p>
                              <p className="mt-1 text-xs font-bold text-[var(--foreground)]">
                                {selectedProof.extracted.upload}
                              </p>
                            </div>
                          ) : null}
                          {selectedProof.extracted.ping ? (
                            <div className="rounded-lg bg-[#f6f8fb] px-3 py-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">
                                Ping
                              </p>
                              <p className="mt-1 text-xs font-bold text-[var(--foreground)]">
                                {selectedProof.extracted.ping}
                              </p>
                            </div>
                          ) : null}
                          {selectedProof.extracted.download ? (
                            <div className="rounded-lg bg-[#f6f8fb] px-3 py-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">
                                Download
                              </p>
                              <p className="mt-1 text-xs font-bold text-[var(--foreground)]">
                                {selectedProof.extracted.download}
                              </p>
                            </div>
                          ) : null}
                          {selectedProof.extracted.provider ? (
                            <div className="rounded-lg bg-[#f6f8fb] px-3 py-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">
                                Proveedor
                              </p>
                              <p className="mt-1 text-xs font-bold text-[var(--foreground)]">
                                {selectedProof.extracted.provider}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {selectedProof.error ? (
                        <p className="mt-3 text-xs font-medium text-[#ad1d39]">
                          {selectedProof.error}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {selectedPingAttachment ? (
                    <div className="rounded-[10px] border border-[var(--border)] bg-[#fcfcfd] p-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[#eef2f6] text-[#7c8aa0]">
                          <FileText className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[var(--foreground)]">
                            {selectedPingAttachment.fileName}
                          </p>
                          <p className="text-xs text-[#94a3b8]">
                            {selectedPingAttachment.fileSizeLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {selectedGpuAttachment ? (
                    <div className="rounded-[10px] border border-[var(--border)] bg-[#fcfcfd] p-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[#eef2f6] text-[#7c8aa0]">
                          <FileText className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[var(--foreground)]">
                            {selectedGpuAttachment.fileName}
                          </p>
                          <p className="text-xs text-[#94a3b8]">
                            {selectedGpuAttachment.fileSizeLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-[var(--accent)]" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                    Problemas detectados
                  </h4>
                </div>
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

                  <div className="rounded-[10px] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-xs leading-6 text-[#617187]">
                    Registro de quién marcó cada cambio, qué acción realizó y a qué hora quedó asentada.
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
                                  <p className="mt-2 text-xs leading-6 text-[#70819b]">
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
                <section className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-[var(--accent)]" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                        Notas
                      </h4>
                    </div>
                    <span className="rounded-full bg-[var(--background-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#7d8ca1]">
                      Observación técnica
                    </span>
                  </div>

                  <div className="rounded-[10px] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-xs leading-6 text-[#617187]">
                    Registro operativo con las observaciones cargadas por el técnico a cargo de la incidencia.
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-soft)] p-4">
                    <p className="text-sm leading-7 text-[#4b5c74]">
                      {selectedIncident.observations}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
                      <span className="text-[11px] font-bold text-[#94a3b8]">
                        Operador: {selectedIncident.reporter}
                      </span>
                      <span className="text-[11px] font-bold text-[#94a3b8]">
                        {selectedIncident.updatedAt}
                      </span>
                    </div>
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

            <div className="border-t border-[var(--border)] bg-[var(--surface)] p-6">
              <button className="w-full rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)]">
                Editar incidencia
              </button>
            </div>
        </aside>
      ) : null}
    </div>
  );
}
