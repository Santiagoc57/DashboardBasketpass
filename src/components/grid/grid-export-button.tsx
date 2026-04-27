"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Download, FileText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getProductionModeLabel,
  normalizeCommentaryPlan,
  RESPONSIBLE_DISPLAY_LABEL,
} from "@/lib/constants";
import { buildKickoffAt, formatMatchDate } from "@/lib/date";
import { getTeamDisplayName } from "@/lib/team-directory";
import type { MatchListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type GridExportButtonProps = {
  matches: MatchListItem[];
  periodLabel: string;
  queryParams: Record<string, string>;
  initialStartDate: string;
  initialEndDate: string;
  timezone: string;
};

type GridExportFormat = "excel" | "pdf";

type GridExportColumnGroup =
  | "match"
  | "operation"
  | "staff"
  | "commentary"
  | "logistics";

type GridExportColumnDefinition = {
  key: string;
  label: string;
  group: GridExportColumnGroup;
  value: (match: MatchListItem) => string;
};

const GRID_EXPORT_COLUMNS = [
  {
    key: "date",
    label: "Fecha",
    group: "match",
    value: (match) => formatMatchDate(match.kickoff_at, match.timezone, "dd/MM/yyyy"),
  },
  {
    key: "time",
    label: "Hora",
    group: "match",
    value: (match) => formatMatchDate(match.kickoff_at, match.timezone, "HH:mm"),
  },
  {
    key: "league",
    label: "Liga",
    group: "match",
    value: (match) => match.competition ?? "",
  },
  {
    key: "match",
    label: "Partido",
    group: "match",
    value: (match) =>
      `${getTeamDisplayName(match.home_team, match.competition)} vs ${getTeamDisplayName(match.away_team, match.competition)}`,
  },
  {
    key: "venue",
    label: "Sede",
    group: "match",
    value: (match) => match.venue?.trim() || "Sin definir",
  },
  {
    key: "status",
    label: "Estado",
    group: "match",
    value: (match) => match.status ?? "Sin definir",
  },
  {
    key: "productionMode",
    label: "Produccion",
    group: "operation",
    value: (match) => getProductionModeLabel(match.production_mode) || "Sin definir",
  },
  {
    key: "productionCode",
    label: "ID",
    group: "operation",
    value: (match) => match.production_code ?? "",
  },
  {
    key: "responsible",
    label: RESPONSIBLE_DISPLAY_LABEL,
    group: "operation",
    value: (match) =>
      getAssignmentName(
        match,
        "Responsable",
        match.owner?.full_name ?? "Sin asignar",
      ),
  },
  {
    key: "director",
    label: "Realizador",
    group: "staff",
    value: (match) => getAssignmentName(match, "Realizador"),
  },
  {
    key: "graphics",
    label: "Operador de Grafica",
    group: "staff",
    value: (match) => getAssignmentName(match, "Operador de Grafica"),
  },
  {
    key: "camera1",
    label: "Camara 1",
    group: "staff",
    value: (match) => getAssignmentName(match, "Camara 1"),
  },
  {
    key: "camera2",
    label: "Camara 2",
    group: "staff",
    value: (match) => getAssignmentName(match, "Camara 2"),
  },
  {
    key: "camera3",
    label: "Camara 3",
    group: "staff",
    value: (match) => getAssignmentName(match, "Camara 3"),
  },
  {
    key: "camera4",
    label: "Camara 4",
    group: "staff",
    value: (match) => getAssignmentName(match, "Camara 4"),
  },
  {
    key: "camera5",
    label: "Camara 5",
    group: "staff",
    value: (match) => getAssignmentName(match, "Camara 5"),
  },
  {
    key: "commentaryPlan",
    label: "Relatos/Comentarios",
    group: "commentary",
    value: (match) =>
      normalizeCommentaryPlan(match.commentary_plan) || "Sin definir",
  },
  {
    key: "relator",
    label: "Relator",
    group: "commentary",
    value: (match) => getAssignmentName(match, "Relator"),
  },
  {
    key: "commentator1",
    label: "Comentarista 1",
    group: "commentary",
    value: (match) => getAssignmentName(match, "Comentario 1"),
  },
  {
    key: "commentator2",
    label: "Comentarista 2",
    group: "commentary",
    value: (match) => getAssignmentName(match, "Comentario 2"),
  },
  {
    key: "control",
    label: "Operador de Control",
    group: "logistics",
    value: (match) => getAssignmentName(match, "Operador de Control"),
  },
  {
    key: "support",
    label: "Soporte tecnico",
    group: "logistics",
    value: (match) => getAssignmentName(match, "Soporte tecnico"),
  },
  {
    key: "transport",
    label: "Transporte",
    group: "logistics",
    value: (match) => match.transport?.trim() || "Sin definir",
  },
  {
    key: "notes",
    label: "Observacion",
    group: "logistics",
    value: (match) => match.notes?.trim() || "",
  },
] as const satisfies readonly GridExportColumnDefinition[];

type GridExportColumnKey = (typeof GRID_EXPORT_COLUMNS)[number]["key"];
type GridExportRow = Record<GridExportColumnKey, string>;

const GRID_EXPORT_GROUP_ORDER = [
  "match",
  "operation",
  "staff",
  "commentary",
  "logistics",
] as const satisfies readonly GridExportColumnGroup[];

const GRID_EXPORT_GROUP_LABELS: Record<GridExportColumnGroup, string> = {
  match: "Partido",
  operation: "Operacion",
  staff: "Staff",
  commentary: "Relatos",
  logistics: "Logistica",
};

const GRID_EXPORT_PRESETS = {
  summary: [
    "date",
    "time",
    "league",
    "match",
    "status",
    "productionMode",
    "responsible",
    "notes",
  ],
  staff: [
    "date",
    "time",
    "league",
    "match",
    "responsible",
    "director",
    "graphics",
    "camera1",
    "camera2",
    "camera3",
    "camera4",
    "camera5",
    "relator",
    "commentator1",
    "commentator2",
    "control",
    "support",
  ],
  complete: GRID_EXPORT_COLUMNS.map((column) => column.key),
} as const satisfies Record<string, readonly GridExportColumnKey[]>;

const GRID_EXPORT_COLUMNS_BY_GROUP = GRID_EXPORT_GROUP_ORDER.map((group) => ({
  group,
  columns: GRID_EXPORT_COLUMNS.filter((column) => column.group === group),
}));

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function sanitizeFileSegment(value: string) {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-zA-Z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .toLowerCase();
}

function getAssignmentName(
  match: MatchListItem,
  roleName: string,
  fallback = "Sin asignar",
) {
  const assignment = match.assignments.find((item) => item.role.name === roleName);
  return assignment?.person?.full_name ?? fallback;
}

function orderSelectedColumnKeys(keys: readonly GridExportColumnKey[]) {
  const selectedKeys = new Set(keys);

  return GRID_EXPORT_COLUMNS.filter((column) => selectedKeys.has(column.key)).map(
    (column) => column.key,
  );
}

function toExportRows(matches: MatchListItem[]): GridExportRow[] {
  return matches.map((match) =>
    Object.fromEntries(
      GRID_EXPORT_COLUMNS.map((column) => [column.key, column.value(match)]),
    ) as GridExportRow,
  );
}

function buildGridExcelDocument(
  rows: GridExportRow[],
  columns: readonly (typeof GRID_EXPORT_COLUMNS)[number][],
  periodLabel: string,
) {
  const headerRow = columns
    .map(
      (column) =>
        `<th style="border:1px solid #dbe4f0;background:#0f172a;color:#ffffff;padding:10px 12px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">${escapeHtml(
          column.label,
        )}</th>`,
    )
    .join("");

  const bodyRows = rows
    .map((row, rowIndex) => {
      const background = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
      const cells = columns
        .map((column) => {
          const value = escapeHtml(row[column.key]);
          const forceText =
            column.key === "productionCode" ? "mso-number-format:'\\@';" : "";

          return `<td style="border:1px solid #dbe4f0;background:${background};padding:9px 12px;font-size:11px;color:#1f2937;vertical-align:top;${forceText}">${value || "&nbsp;"}</td>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body style="font-family:Arial,sans-serif;background:#ffffff;padding:24px;">
        <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:6px;">Control de produccion</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:16px;">Periodo exportado: ${escapeHtml(periodLabel)}</div>
        <table style="border-collapse:collapse;width:100%;">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
      </body>
    </html>
  `.trim();
}

function buildExportDateLabel(dateInput: string, timezone: string) {
  return formatMatchDate(
    buildKickoffAt({
      date: dateInput,
      time: "12:00",
      timezone,
    }),
    timezone,
    "dd/MM/yyyy",
  );
}

function buildExportPeriodLabel(params: {
  startDate: string;
  endDate: string;
  timezone: string;
}) {
  const startLabel = buildExportDateLabel(params.startDate, params.timezone);
  const endLabel = buildExportDateLabel(params.endDate, params.timezone);

  if (params.startDate === params.endDate) {
    return startLabel;
  }

  return `${startLabel} al ${endLabel}`;
}

function buildExportFileBaseName(startDate: string, endDate: string) {
  return [
    "produccion",
    sanitizeFileSegment(startDate),
    startDate === endDate ? null : "a",
    startDate === endDate ? null : sanitizeFileSegment(endDate),
  ]
    .filter(Boolean)
    .join("-");
}

function getPdfColumnWidth(columnKey: GridExportColumnKey) {
  switch (columnKey) {
    case "match":
      return 176;
    case "notes":
      return 160;
    case "venue":
    case "transport":
      return 118;
    case "league":
    case "responsible":
      return 104;
    default:
      return 84;
  }
}

function getActiveFilterBadges(queryParams: Record<string, string>) {
  return [
    queryParams.q ? `Busqueda: ${queryParams.q}` : null,
    queryParams.league ? `Liga: ${queryParams.league}` : null,
    queryParams.mode ? `Modo: ${queryParams.mode}` : null,
    queryParams.status ? `Estado: ${queryParams.status}` : null,
    queryParams.owner ? "Responsable filtrado" : null,
  ].filter((value): value is string => Boolean(value));
}

function selectionMatchesPreset(
  selection: readonly GridExportColumnKey[],
  preset: readonly GridExportColumnKey[],
) {
  const left = orderSelectedColumnKeys(selection).join("|");
  const right = orderSelectedColumnKeys(preset).join("|");
  return left === right;
}

export function GridExportButton({
  matches,
  periodLabel,
  queryParams,
  initialStartDate,
  initialEndDate,
  timezone,
}: GridExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<GridExportFormat>("excel");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<GridExportColumnKey[]>(
    [...GRID_EXPORT_PRESETS.complete],
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isExporting) {
        setIsOpen(false);
        setErrorMessage("");
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isExporting, isOpen]);

  const selectedColumns = GRID_EXPORT_COLUMNS.filter((column) =>
    selectedColumnKeys.includes(column.key),
  );
  const activeFilterBadges = getActiveFilterBadges(queryParams);

  function openModal() {
    setErrorMessage("");
    setIsOpen(true);
  }

  function closeModal() {
    if (isExporting) {
      return;
    }

    setErrorMessage("");
    setIsOpen(false);
  }

  function applyPreset(preset: keyof typeof GRID_EXPORT_PRESETS) {
    setSelectedColumnKeys(orderSelectedColumnKeys(GRID_EXPORT_PRESETS[preset]));
  }

  function toggleColumn(columnKey: GridExportColumnKey) {
    setSelectedColumnKeys((current) => {
      if (current.includes(columnKey)) {
        return current.filter((key) => key !== columnKey);
      }

      return orderSelectedColumnKeys([...current, columnKey]);
    });
  }

  async function fetchMatchesForExportRange() {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(queryParams)) {
      if (value) {
        search.set(key, value);
      }
    }

    search.set("startDate", startDate);
    search.set("endDate", endDate);

    const response = await fetch(`/api/grid/export?${search.toString()}`, {
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          matches?: MatchListItem[];
        }
      | null;

    if (!response.ok) {
      throw new Error(
        payload?.error ?? "No pudimos preparar la exportacion de la grilla.",
      );
    }

    return payload?.matches ?? [];
  }

  async function handleExport() {
    if (!selectedColumnKeys.length) {
      setErrorMessage("Selecciona al menos un bloque de datos para exportar.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      setErrorMessage("Completa un rango de fechas valido.");
      return;
    }

    if (startDate > endDate) {
      setErrorMessage("La fecha inicial no puede ser mayor que la final.");
      return;
    }

    setIsExporting(true);
    setErrorMessage("");

    try {
      const exportMatches = await fetchMatchesForExportRange();

      if (!exportMatches.length) {
        setErrorMessage("No hay partidos para ese rango y esos filtros.");
        return;
      }

      const rows = toExportRows(exportMatches);
      const period = buildExportPeriodLabel({
        startDate,
        endDate,
        timezone,
      });
      const fileBaseName = buildExportFileBaseName(startDate, endDate);

      if (exportFormat === "excel") {
        const excelDocument = buildGridExcelDocument(rows, selectedColumns, period);

        downloadBlob(
          new Blob([excelDocument], {
            type: "application/vnd.ms-excel;charset=utf-8",
          }),
          `${fileBaseName}.xls`,
        );
      } else {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);

        const pdfDocument = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: [595.28, Math.max(1100, selectedColumns.length * 110)],
        });

        const pageWidth = pdfDocument.internal.pageSize.getWidth();
        const marginX = 18;
        const contentWidth = pageWidth - marginX * 2;
        let currentY = 28;

        pdfDocument.setFont("helvetica", "bold");
        pdfDocument.setFontSize(16);
        pdfDocument.setTextColor(15, 23, 42);
        pdfDocument.text("Control de produccion", marginX, currentY);
        currentY += 18;

        pdfDocument.setFont("helvetica", "normal");
        pdfDocument.setFontSize(10);
        pdfDocument.setTextColor(100, 116, 139);
        pdfDocument.text(`Periodo exportado: ${period}`, marginX, currentY);
        currentY += 18;

        autoTable(pdfDocument, {
          startY: currentY,
          head: [selectedColumns.map((column) => column.label)],
          body: rows.map((row) =>
            selectedColumns.map((column) => row[column.key]),
          ),
          margin: { left: marginX, right: marginX },
          styles: {
            fontSize: selectedColumns.length > 10 ? 7 : 8,
            cellPadding: 5,
            lineColor: [219, 228, 240],
            lineWidth: 0.5,
            textColor: [31, 41, 55],
            overflow: "linebreak",
          },
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: selectedColumns.length > 10 ? 7 : 8,
            halign: "left",
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          bodyStyles: {
            valign: "top",
          },
          columnStyles: Object.fromEntries(
            selectedColumns.map((column, index) => [
              index,
              { cellWidth: getPdfColumnWidth(column.key) },
            ]),
          ),
          tableWidth: contentWidth,
          theme: "grid",
        });

        pdfDocument.save(`${fileBaseName}.pdf`);
      }

      setIsOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No pudimos exportar la grilla.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={!matches.length || isExporting}
        aria-label={isExporting ? "Preparando exportacion" : "Configurar exportacion"}
        title={isExporting ? "Preparando exportacion" : "Configurar exportacion"}
        className="inline-flex size-[52px] items-center justify-center rounded-[var(--panel-radius)] bg-[#7c3aed] text-white shadow-[0_14px_28px_rgba(124,58,237,0.22)] transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download className="size-4" />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[310] flex items-center justify-center bg-[#101828]/60 p-4 backdrop-blur-sm"
              onClick={closeModal}
            >
              <div
                className="panel-surface relative flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(15,23,42,0.22)]"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Configurar exportacion"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#f3e8ff] text-[#7c3aed]">
                      <Download className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                        Exportar produccion
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Elige formato, rango y datos antes de descargar. Base actual:{" "}
                        {periodLabel}.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--background-soft)] text-[#94a3b8] transition hover:bg-[#eef2f6] hover:text-[#52627a]"
                    aria-label="Cerrar modal"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <section className="space-y-6">
                      <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-5">
                        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#70819b]">
                          <FileText className="size-4 text-[var(--accent)]" />
                          Formato
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setExportFormat("excel")}
                            aria-pressed={exportFormat === "excel"}
                            className={cn(
                              "rounded-[var(--panel-radius)] border px-4 py-4 text-left transition",
                              exportFormat === "excel"
                                ? "border-[#c8b5ff] bg-[#f5f0ff] shadow-sm"
                                : "border-[var(--border)] bg-[var(--surface)] hover:bg-[#fafbfd]",
                            )}
                          >
                            <p className="text-sm font-black text-[var(--foreground)]">
                              Excel
                            </p>
                            <p className="mt-1 text-sm text-[#617187]">
                              Descarga una planilla editable con las columnas elegidas.
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setExportFormat("pdf")}
                            aria-pressed={exportFormat === "pdf"}
                            className={cn(
                              "rounded-[var(--panel-radius)] border px-4 py-4 text-left transition",
                              exportFormat === "pdf"
                                ? "border-[#c8b5ff] bg-[#f5f0ff] shadow-sm"
                                : "border-[var(--border)] bg-[var(--surface)] hover:bg-[#fafbfd]",
                            )}
                          >
                            <p className="text-sm font-black text-[var(--foreground)]">
                              PDF
                            </p>
                            <p className="mt-1 text-sm text-[#617187]">
                              Genera un documento listo para compartir o imprimir.
                            </p>
                          </button>
                        </div>
                      </div>

                      <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-5">
                        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#70819b]">
                          <CalendarDays className="size-4 text-[var(--accent)]" />
                          Rango de fechas
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-sm font-semibold text-[#334155]">
                              Desde
                            </span>
                            <Input
                              type="date"
                              value={startDate}
                              max={endDate}
                              onChange={(event) => setStartDate(event.target.value)}
                              disabled={isExporting}
                            />
                          </label>
                          <label className="space-y-2">
                            <span className="text-sm font-semibold text-[#334155]">
                              Hasta
                            </span>
                            <Input
                              type="date"
                              value={endDate}
                              min={startDate}
                              onChange={(event) => setEndDate(event.target.value)}
                              disabled={isExporting}
                            />
                          </label>
                        </div>
                        <p className="mt-3 text-sm text-[#617187]">
                          La exportacion respeta la busqueda y los filtros activos que
                          tengas en la grilla.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeFilterBadges.length ? (
                            activeFilterBadges.map((badge) => (
                              <span
                                key={badge}
                                className="inline-flex rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-1 text-xs font-bold text-[#6d28d9]"
                              >
                                {badge}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex rounded-full border border-[#dbe4f0] bg-white px-3 py-1 text-xs font-bold text-[#70819b]">
                              Sin filtros adicionales
                            </span>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#70819b]">
                              Datos a incluir
                            </p>
                            <p className="mt-1 text-sm text-[#617187]">
                              Selecciona exactamente que columnas quieres descargar.
                            </p>
                          </div>
                          <span className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#52627a]">
                            {selectedColumnKeys.length} columnas
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => applyPreset("summary")}
                            aria-pressed={selectionMatchesPreset(
                              selectedColumnKeys,
                              GRID_EXPORT_PRESETS.summary,
                            )}
                            className={cn(
                              "rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition",
                              selectionMatchesPreset(
                                selectedColumnKeys,
                                GRID_EXPORT_PRESETS.summary,
                              )
                                ? "border-[#c8b5ff] bg-[#f5f0ff] text-[#6d28d9]"
                                : "border-[var(--border)] bg-white text-[#617187]",
                            )}
                          >
                            Resumen
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset("staff")}
                            aria-pressed={selectionMatchesPreset(
                              selectedColumnKeys,
                              GRID_EXPORT_PRESETS.staff,
                            )}
                            className={cn(
                              "rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition",
                              selectionMatchesPreset(
                                selectedColumnKeys,
                                GRID_EXPORT_PRESETS.staff,
                              )
                                ? "border-[#c8b5ff] bg-[#f5f0ff] text-[#6d28d9]"
                                : "border-[var(--border)] bg-white text-[#617187]",
                            )}
                          >
                            Staff
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset("complete")}
                            aria-pressed={selectionMatchesPreset(
                              selectedColumnKeys,
                              GRID_EXPORT_PRESETS.complete,
                            )}
                            className={cn(
                              "rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition",
                              selectionMatchesPreset(
                                selectedColumnKeys,
                                GRID_EXPORT_PRESETS.complete,
                              )
                                ? "border-[#c8b5ff] bg-[#f5f0ff] text-[#6d28d9]"
                                : "border-[var(--border)] bg-white text-[#617187]",
                            )}
                          >
                            Completo
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedColumnKeys(orderSelectedColumnKeys([]))
                            }
                            className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#617187] transition hover:bg-[#fafbfd]"
                          >
                            Limpiar
                          </button>
                        </div>

                        <div className="mt-5 grid gap-4">
                          {GRID_EXPORT_COLUMNS_BY_GROUP.map(({ group, columns }) => (
                            <div
                              key={group}
                              className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-white p-4"
                            >
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-black uppercase tracking-[0.12em] text-[#334155]">
                                  {GRID_EXPORT_GROUP_LABELS[group]}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const groupKeys = columns.map((column) => column.key);
                                    const everySelected = groupKeys.every((key) =>
                                      selectedColumnKeys.includes(key),
                                    );

                                    setSelectedColumnKeys((current) =>
                                      everySelected
                                        ? current.filter((key) => !groupKeys.includes(key))
                                        : orderSelectedColumnKeys([...current, ...groupKeys]),
                                    );
                                  }}
                                  className="text-xs font-black uppercase tracking-[0.12em] text-[var(--accent)]"
                                >
                                  {columns.every((column) =>
                                    selectedColumnKeys.includes(column.key),
                                  )
                                    ? "Quitar grupo"
                                    : "Agregar grupo"}
                                </button>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                {columns.map((column) => {
                                  const isSelected = selectedColumnKeys.includes(column.key);

                                  return (
                                    <label
                                      key={column.key}
                                      className={cn(
                                        "flex cursor-pointer items-start gap-3 rounded-[var(--panel-radius)] border px-3 py-3 transition",
                                        isSelected
                                          ? "border-[#c8b5ff] bg-[#f5f0ff]"
                                          : "border-[var(--border)] bg-[var(--background-soft)] hover:bg-white",
                                      )}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleColumn(column.key)}
                                        className="mt-0.5 size-4 rounded border border-[#c8d2e1]"
                                        disabled={isExporting}
                                      />
                                      <span className="text-sm font-semibold text-[#334155]">
                                        {column.label}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>

                  {errorMessage ? (
                    <div className="mt-6 rounded-xl border border-[#f0c8d1] bg-[#fff4f6] px-4 py-3 text-sm font-semibold text-[#ad1d39]">
                      {errorMessage}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-5">
                  <p className="text-sm text-[#617187]">
                    {matches.length} partidos visibles en la vista actual.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="secondary" onClick={closeModal}>
                      Cancelar
                    </Button>
                    <button
                      type="button"
                      onClick={() => void handleExport()}
                      disabled={isExporting}
                      className="inline-flex h-11 items-center gap-2 rounded-[var(--panel-radius)] bg-[#7c3aed] px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(124,58,237,0.22)] transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Download className="size-4" />
                      {isExporting
                        ? "Preparando descarga..."
                        : exportFormat === "pdf"
                          ? "Descargar PDF"
                          : "Descargar Excel"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
