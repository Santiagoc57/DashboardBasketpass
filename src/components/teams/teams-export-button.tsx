"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getCanonicalTeamName,
  getTeamDirectoryCanonicalKey,
  type TeamDirectoryItem,
} from "@/lib/team-directory";
import {
  CUSTOM_TEAMS_CHANGED_EVENT,
  readCustomTeams,
  readHiddenTeamKeys,
} from "@/lib/teams-local-storage";
import { cn } from "@/lib/utils";

type TeamsExportFormat = "excel" | "pdf";

function getCanonicalKey(team: TeamDirectoryItem) {
  return getTeamDirectoryCanonicalKey({
    officialName: team.official_name,
    displayName: team.display_name,
    competition: team.competition,
  });
}

function filterCustomTeams(
  teams: TeamDirectoryItem[],
  params: { query?: string; league?: string },
) {
  const query = params.query?.trim().toLowerCase() ?? "";
  const league = params.league?.trim() ?? "";

  return teams.filter((team) => {
    if (league && !team.competition.split("/").map((part) => part.trim()).includes(league)) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      team.official_name,
      team.display_name,
      team.competition,
      team.stadium ?? "",
      team.manager ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

function buildExportRows(teams: TeamDirectoryItem[]) {
  return teams.map((team) => ({
    equipo: team.display_name,
    nombre_oficial: team.official_name,
    liga: team.competition,
    estadio: team.stadium ?? "",
    responsable: team.manager ?? "",
    web: team.website ?? "",
    instagram: team.instagram ?? "",
    enlace_oficial: team.official_url ?? "",
    incidencias: team.incident_count,
  }));
}

function downloadBlob(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

function buildCsvContent(rows: ReturnType<typeof buildExportRows>) {
  const table = [
    ["Equipo", "Nombre oficial", "Liga", "Estadio", "Responsable", "Web", "Instagram", "Enlace oficial", "Incidencias"],
    ...rows.map((row) => [
      row.equipo,
      row.nombre_oficial,
      row.liga,
      row.estadio,
      row.responsable,
      row.web,
      row.instagram,
      row.enlace_oficial,
      row.incidencias,
    ]),
  ];

  return table
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export function TeamsExportButton({
  initialTeams,
  query,
  activeLeague,
}: {
  initialTeams: TeamDirectoryItem[];
  query: string;
  activeLeague: string;
}) {
  const [customTeams, setCustomTeams] = useState<TeamDirectoryItem[]>([]);
  const [hiddenTeamKeys, setHiddenTeamKeys] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<TeamsExportFormat>("excel");

  useEffect(() => {
    const syncTeams = () => {
      setCustomTeams(readCustomTeams());
      setHiddenTeamKeys(readHiddenTeamKeys());
    };

    syncTeams();
    window.addEventListener("storage", syncTeams);
    window.addEventListener(CUSTOM_TEAMS_CHANGED_EVENT, syncTeams);

    return () => {
      window.removeEventListener("storage", syncTeams);
      window.removeEventListener(CUSTOM_TEAMS_CHANGED_EVENT, syncTeams);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isExporting) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isExporting, isOpen]);

  const hiddenTeamKeySet = useMemo(() => new Set(hiddenTeamKeys), [hiddenTeamKeys]);
  const visibleCustomTeams = useMemo(
    () =>
      filterCustomTeams(customTeams, { query, league: activeLeague }).filter(
        (team) => !hiddenTeamKeySet.has(getCanonicalKey(team)),
      ),
    [activeLeague, customTeams, hiddenTeamKeySet, query],
  );

  const mergedTeams = useMemo(() => {
    const mergedByCanonicalKey = new Map<string, TeamDirectoryItem>();

    initialTeams.forEach((team) => {
      const canonicalKey = getCanonicalKey(team);

      if (hiddenTeamKeySet.has(canonicalKey) || mergedByCanonicalKey.has(canonicalKey)) {
        return;
      }

      mergedByCanonicalKey.set(canonicalKey, team);
    });

    visibleCustomTeams.forEach((team) => {
      const canonicalKey = getCanonicalKey(team);
      const current = mergedByCanonicalKey.get(canonicalKey);

      if (!current) {
        mergedByCanonicalKey.set(canonicalKey, {
          ...team,
          official_name: getCanonicalTeamName(team.official_name),
          display_name: getCanonicalTeamName(team.display_name),
        });
        return;
      }

      mergedByCanonicalKey.set(canonicalKey, {
        ...current,
        ...team,
        id: current.id,
        slug: current.slug,
        official_name: getCanonicalTeamName(current.official_name),
        display_name: getCanonicalTeamName(team.display_name || current.display_name),
        competition: current.competition,
        incident_count: Math.max(current.incident_count, team.incident_count),
        stadium: team.stadium ?? current.stadium,
        manager: team.manager ?? current.manager,
        website: team.website ?? current.website,
        instagram: team.instagram ?? current.instagram,
        official_url: team.official_url ?? current.official_url,
        logo_data_url: team.logo_data_url ?? current.logo_data_url,
      });
    });

    return Array.from(mergedByCanonicalKey.values()).sort((left, right) =>
      left.display_name.localeCompare(right.display_name, "es"),
    );
  }, [hiddenTeamKeySet, initialTeams, visibleCustomTeams]);

  const rows = useMemo(() => buildExportRows(mergedTeams), [mergedTeams]);

  async function handleExport() {
    if (!rows.length) {
      return;
    }

    setIsExporting(true);

    try {
      if (exportFormat === "excel") {
        downloadBlob(
          new Blob([buildCsvContent(rows)], { type: "text/csv;charset=utf-8" }),
          "basket-production-equipos.csv",
        );
      } else {
        const [{ jsPDF }, autoTableModule] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);
        const autoTable = autoTableModule.default;
        const pdfDocument = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: "a4",
        });

        pdfDocument.setFont("helvetica", "bold");
        pdfDocument.setFontSize(16);
        pdfDocument.text("Directorio de equipos", 40, 42);
        pdfDocument.setFont("helvetica", "normal");
        pdfDocument.setFontSize(10);
        pdfDocument.setTextColor(100, 116, 139);
        pdfDocument.text(`Total exportado: ${rows.length} equipos`, 40, 60);

        autoTable(pdfDocument, {
          startY: 78,
          head: [[
            "Equipo",
            "Liga",
            "Estadio",
            "Responsable",
            "Web",
            "Instagram",
            "Incidencias",
          ]],
          body: rows.map((row) => [
            row.equipo,
            row.liga,
            row.estadio,
            row.responsable,
            row.web,
            row.instagram,
            row.incidencias,
          ]),
          styles: {
            fontSize: 9,
            cellPadding: 6,
            textColor: [31, 41, 55],
            lineColor: [226, 232, 240],
            lineWidth: 0.5,
          },
          headStyles: {
            fillColor: [124, 58, 237],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          margin: {
            left: 40,
            right: 40,
            top: 78,
            bottom: 32,
          },
        });

        pdfDocument.save("basket-production-equipos.pdf");
      }

      setIsOpen(false);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={!rows.length || isExporting}
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
              onClick={() => !isExporting && setIsOpen(false)}
            >
              <div
                className="panel-surface relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(15,23,42,0.22)]"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Configurar exportacion de equipos"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#f3e8ff] text-[#7c3aed]">
                      <Download className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                        Exportar equipos
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Elige como quieres descargar el directorio visible.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--background-soft)] text-[#94a3b8] transition hover:bg-[#eef2f6] hover:text-[#52627a]"
                    aria-label="Cerrar modal"
                    disabled={isExporting}
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-6 px-6 py-6">
                  <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-5">
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#70819b]">
                      <FileText className="size-4 text-[#7c3aed]" />
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
                        <p className="text-sm font-black text-[var(--foreground)]">Excel</p>
                        <p className="mt-1 text-sm text-[#617187]">
                          Descarga una planilla editable de los equipos visibles.
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
                        <p className="text-sm font-black text-[var(--foreground)]">PDF</p>
                        <p className="mt-1 text-sm text-[#617187]">
                          Genera un reporte listo para compartir o imprimir.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-[var(--panel-radius)] border border-[var(--border)] bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        {rows.length} equipos listos para exportar
                      </p>
                      <p className="text-sm text-[#617187]">
                        Se descargara solo el directorio visible con tus filtros actuales.
                      </p>
                    </div>
                    <Button type="button" onClick={handleExport} disabled={isExporting || !rows.length}>
                      {isExporting
                        ? "Preparando..."
                        : exportFormat === "pdf"
                          ? "Descargar PDF"
                          : "Descargar Excel"}
                    </Button>
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
