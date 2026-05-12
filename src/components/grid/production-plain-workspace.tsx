"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { IWorkbookData } from "@univerjs/core";
import {
  Cloud,
  Download,
  FileSpreadsheet,
  Maximize2,
  RefreshCcw,
  Save,
  Upload,
  X,
} from "lucide-react";

import {
  ProductionWorkbookEditor,
  type ProductionWorkbookDropdowns,
} from "@/components/grid/production-workbook-editor";
import { useGridInsightsDock } from "@/components/grid/grid-insights-dock";
import {
  COMMENTARY_PLAN_OPTIONS,
  MATCH_STATUS_OPTIONS,
  PRODUCTION_MODE_OPTIONS,
} from "@/lib/constants";
import { getTeamDirectoryData } from "@/lib/team-directory";
import type { MatchListItem } from "@/lib/types";

type ProductionPlainWorkspaceProps = {
  matches: MatchListItem[];
  people: Array<{
    id: string;
    full_name: string;
  }>;
  canEdit: boolean;
  redirectTo: string;
  periodLabel: string;
  defaultDate: string;
  openBlankOnMount?: boolean;
};

type WorkbookPreview = {
  rows: number;
  mappedFields: number;
  missingRequiredFields: string[];
};

type WorkbookState = {
  workbookId: string;
  filename: string;
  snapshot: IWorkbookData;
  mapping: Record<string, unknown>;
  preview: WorkbookPreview;
  baseRowVersions: Record<string, string>;
};

type WorkbookApi = {
  save: () => IWorkbookData;
  dispose: () => void;
};

const GOOGLE_PRODUCTION_SHEET_ID = "1brPnW66u2vnFRpeHHyMhYyh-8Me74C1afcIle8EPiV4";
const GOOGLE_PRODUCTION_SHEET_NAME = "MAYO 26";

async function readJsonResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error ?? "La operación de libro falló.");
  }

  return payload;
}

export function ProductionPlainWorkspace({
  matches,
  people,
  canEdit,
  periodLabel,
  defaultDate,
  openBlankOnMount = false,
}: ProductionPlainWorkspaceProps) {
  const [open, setOpen] = useState(false);
  const [workbook, setWorkbook] = useState<WorkbookState | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorApiRef = useRef<WorkbookApi | null>(null);
  const router = useRouter();
  const { close: closeInsightsDock } = useGridInsightsDock();
  const blankCreatedRef = useRef(false);

  const previewLabel = useMemo(() => {
    if (!workbook) {
      return "Sin libro cargado";
    }

    return `${workbook.preview.rows} filas · ${workbook.preview.mappedFields} columnas mapeadas`;
  }, [workbook]);

  const dropdowns = useMemo<ProductionWorkbookDropdowns>(() => {
    const teamDirectory = getTeamDirectoryData();
    const teamNames = [
      ...teamDirectory.flatMap((team) => [team.display_name, team.official_name]),
      ...matches.flatMap((match) => [match.home_team, match.away_team]),
    ];
    const leagues = [
      ...getTeamDirectoryData().map((team) => team.competition ?? ""),
      ...matches.map((match) => match.competition ?? ""),
    ];

    return {
      teamNames: Array.from(new Set(teamNames.filter(Boolean))).sort((left, right) =>
        left.localeCompare(right, "es"),
      ),
      peopleNames: Array.from(new Set(people.map((person) => person.full_name).filter(Boolean))).sort(
        (left, right) => left.localeCompare(right, "es"),
      ),
      leagues: Array.from(new Set(leagues.filter(Boolean))).sort((left, right) =>
        left.localeCompare(right, "es"),
      ),
      productionModes: [...PRODUCTION_MODE_OPTIONS],
      statuses: [...MATCH_STATUS_OPTIONS],
      commentaryPlans: [...COMMENTARY_PLAN_OPTIONS],
    };
  }, [matches, people]);

  const editorReady = useCallback((api: WorkbookApi) => {
    editorApiRef.current = api;
  }, []);

  const closeWorkspace = useCallback(() => {
    editorApiRef.current?.dispose();
    editorApiRef.current = null;
    setOpen(false);
    setError("");
    setStatus("");
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeWorkspace();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeWorkspace, open]);

  async function uploadWorkbook(file: File) {
    setBusy(true);
    setError("");
    setStatus("Subiendo y leyendo el Excel...");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("periodLabel", periodLabel);
      const response = await fetch("/api/production-workbooks/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await readJsonResponse(response);

      setWorkbook({
        workbookId: payload.workbookId,
        filename: file.name,
        snapshot: payload.snapshot,
        mapping: payload.mapping,
        preview: payload.preview,
        baseRowVersions: payload.baseRowVersions ?? {},
      });
      setStatus("Libro cargado. Revisa el mapeo visual antes de aplicar a la grilla.");
      if (payload.warning) {
        setStatus(payload.warning);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir el libro.");
    } finally {
      setBusy(false);
    }
  }

  const createBlankWorkbook = useCallback(async () => {
    setBusy(true);
    setError("");
    setStatus("Creando planilla en blanco...");

    try {
      const response = await fetch("/api/production-workbooks/blank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodLabel,
          filename: "planilla-en-blanco.xlsx",
        }),
      });
      const payload = await readJsonResponse(response);

      setWorkbook({
        workbookId: payload.workbookId,
        filename: "planilla-en-blanco.xlsx",
        snapshot: payload.snapshot,
        mapping: payload.mapping,
        preview: payload.preview,
        baseRowVersions: payload.baseRowVersions ?? {},
      });
      setStatus("Planilla en blanco creada. Completa las filas y aplica a la grilla cuando esté lista.");
      if (payload.warning) {
        setStatus(payload.warning);
      }
    } catch (blankError) {
      setError(blankError instanceof Error ? blankError.message : "No se pudo crear la planilla.");
    } finally {
      setBusy(false);
    }
  }, [periodLabel]);

  const loadGoogleSheetWorkbook = useCallback(async () => {
    if (workbook) {
      const confirmed = window.confirm(
        "Vas a sincronizar manualmente desde Google Sheets. Esto reemplazará el libro abierto con la versión actual de la pestaña MAYO 26.",
      );

      if (!confirmed) {
        return;
      }
    }

    setBusy(true);
    setError("");
    setStatus(`Sincronizando manualmente desde Google Sheets: ${GOOGLE_PRODUCTION_SHEET_NAME}...`);

    try {
      const response = await fetch("/api/production-workbooks/google-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodLabel,
          sheetId: GOOGLE_PRODUCTION_SHEET_ID,
          sheetName: GOOGLE_PRODUCTION_SHEET_NAME,
        }),
      });
      const payload = await readJsonResponse(response);

      setWorkbook({
        workbookId: payload.workbookId,
        filename: payload.filename ?? `${GOOGLE_PRODUCTION_SHEET_NAME}.csv`,
        snapshot: payload.snapshot,
        mapping: payload.mapping,
        preview: payload.preview,
        baseRowVersions: payload.baseRowVersions ?? {},
      });
      setStatus("Sincronización manual lista. Revisa los datos y aplica a la grilla cuando esté lista.");
      if (payload.warning) {
        setStatus(payload.warning);
      }
    } catch (googleSheetError) {
      setError(
        googleSheetError instanceof Error
          ? googleSheetError.message
          : "No se pudo cargar la hoja de Google.",
      );
    } finally {
      setBusy(false);
    }
  }, [periodLabel, workbook]);

  useEffect(() => {
    if (!openBlankOnMount || blankCreatedRef.current) {
      return;
    }

    blankCreatedRef.current = true;
    closeInsightsDock();
    setOpen(true);
    void createBlankWorkbook();
  }, [closeInsightsDock, createBlankWorkbook, openBlankOnMount]);

  function getCurrentSnapshot() {
    if (!workbook) {
      throw new Error("No hay libro cargado.");
    }

    return editorApiRef.current?.save() ?? workbook.snapshot;
  }

  async function saveDraft() {
    if (!workbook) {
      return;
    }

    setBusy(true);
    setError("");
    setStatus("Guardando borrador...");

    try {
      const snapshot = getCurrentSnapshot();
      const response = await fetch("/api/production-workbooks/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workbookId: workbook.workbookId,
          snapshot,
          mapping: workbook.mapping,
          baseRowVersions: workbook.baseRowVersions,
        }),
      });
      const payload = await readJsonResponse(response);

      setWorkbook({ ...workbook, snapshot, preview: payload.preview });
      setStatus("Borrador guardado.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshFromGrid() {
    if (!workbook) {
      return;
    }

    setBusy(true);
    setError("");
    setStatus("Actualizando desde la grilla...");

    try {
      const snapshot = getCurrentSnapshot();
      const response = await fetch("/api/production-workbooks/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workbookId: workbook.workbookId,
          snapshot,
          mapping: workbook.mapping,
          baseRowVersions: workbook.baseRowVersions,
          defaultDate,
        }),
      });
      const payload = await readJsonResponse(response);

      setWorkbook({
        ...workbook,
        snapshot: payload.snapshot,
        preview: payload.preview,
        baseRowVersions: payload.baseRowVersions ?? workbook.baseRowVersions,
      });
      setStatus("Libro actualizado desde la grilla.");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "No se pudo actualizar.");
    } finally {
      setBusy(false);
    }
  }

  async function applyToGrid() {
    if (!workbook) {
      return;
    }

    const confirmed = window.confirm(
      "Vas a aplicar este libro sobre partidos y asignaciones operativas. Revisa el contenido antes de continuar.",
    );

    if (!confirmed) {
      return;
    }

    setBusy(true);
    setError("");
    setStatus("Aplicando cambios a la grilla...");

    try {
      const snapshot = getCurrentSnapshot();
      const response = await fetch("/api/production-workbooks/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workbookId: workbook.workbookId,
          snapshot,
          mapping: workbook.mapping,
          baseRowVersions: workbook.baseRowVersions,
          defaultDate,
        }),
      });
      const payload = await readJsonResponse(response);
      const result = payload.result;

      setWorkbook({ ...workbook, snapshot, preview: payload.preview });
      setStatus(
        result.created || result.updated || result.assignments
          ? `Aplicado: ${result.created} creados, ${result.updated} actualizados, ${result.assignments} asignaciones.`
          : "No se aplicó ninguna fila. Revisa que tenga hora, local y visita.",
      );
      router.refresh();
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "No se pudo aplicar.");
    } finally {
      setBusy(false);
    }
  }

  async function exportWorkbook() {
    if (!workbook) {
      return;
    }

    setBusy(true);
    setError("");
    setStatus("Preparando descarga...");

    try {
      const snapshot = getCurrentSnapshot();
      const response = await fetch("/api/production-workbooks/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workbookId: workbook.workbookId,
          snapshot,
          mapping: workbook.mapping,
          filename: workbook.filename || "libro-produccion.xlsx",
        }),
      });

      if (!response.ok) {
        await readJsonResponse(response);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = workbook.filename || "libro-produccion.xlsx";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Excel actualizado descargado.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "No se pudo exportar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          closeInsightsDock();
          setOpen(true);
        }}
        disabled={!matches.length}
        className="panel-surface inline-flex size-12 items-center justify-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] text-[#607089] transition hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Abrir libro de producción"
        title="Abrir libro de producción"
      >
        <Maximize2 className="size-5" />
      </button>

      {open && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[80] flex flex-col bg-[#f8fafc] text-[#1f2937]">
          <div className="flex min-h-[4.25rem] items-center justify-between border-b border-[#d8dee8] bg-white px-5">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                Grilla de producción
              </p>
              <h2 className="truncate text-xl font-black tracking-[-0.03em] text-[#14161b]">
                Libro de producción
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-full border border-[#d8e0eb] bg-[#f8fafc] px-3 py-1.5 text-xs font-bold text-[#64748b] lg:inline-flex">
                {periodLabel} · {previewLabel}
              </span>
              {canEdit ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadWorkbook(file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                    className="inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white px-3 text-xs font-black uppercase tracking-[0.14em] text-[#64748b] transition hover:border-[#f3b5c2] hover:text-[var(--accent)] disabled:opacity-50"
                  >
                    <Upload className="size-4" />
                    Subir
                  </button>
                  <button
                    type="button"
                    onClick={loadGoogleSheetWorkbook}
                    disabled={busy}
                    className="inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white px-3 text-xs font-black uppercase tracking-[0.14em] text-[#64748b] transition hover:border-[#f3b5c2] hover:text-[var(--accent)] disabled:opacity-50"
                    title={`Sincronizar manualmente Google Sheets: ${GOOGLE_PRODUCTION_SHEET_NAME}`}
                  >
                    <Cloud className="size-4" />
                    Sincronizar
                  </button>
                  <button
                    type="button"
                    onClick={createBlankWorkbook}
                    disabled={busy}
                    className="inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white px-3 text-xs font-black uppercase tracking-[0.14em] text-[#64748b] transition hover:border-[#f3b5c2] hover:text-[var(--accent)] disabled:opacity-50"
                  >
                    <FileSpreadsheet className="size-4" />
                    Blanco
                  </button>
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={busy || !workbook}
                    className="inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white px-3 text-xs font-black uppercase tracking-[0.14em] text-[#64748b] transition hover:border-[#94a3b8] disabled:opacity-50"
                  >
                    <Save className="size-4" />
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={refreshFromGrid}
                    disabled={busy || !workbook}
                    className="inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white px-3 text-xs font-black uppercase tracking-[0.14em] text-[#64748b] transition hover:border-[#94a3b8] disabled:opacity-50"
                  >
                    <RefreshCcw className="size-4" />
                    Refrescar
                  </button>
                  <button
                    type="button"
                    onClick={exportWorkbook}
                    disabled={busy || !workbook}
                    className="inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white px-3 text-xs font-black uppercase tracking-[0.14em] text-[#64748b] transition hover:border-[#94a3b8] disabled:opacity-50"
                  >
                    <Download className="size-4" />
                    Descargar
                  </button>
                  <button
                    type="button"
                    onClick={applyToGrid}
                    disabled={busy || !workbook}
                    className="inline-flex h-10 items-center rounded-[var(--panel-radius)] border border-[#b7e4c7] bg-[#f0fdf4] px-3 text-xs font-black uppercase tracking-[0.14em] text-[#15803d] transition hover:border-[#86d7a4] disabled:opacity-50"
                  >
                    Aplicar a grilla
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={closeWorkspace}
                className="inline-flex size-10 items-center justify-center rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white text-[#64748b] hover:border-[#f3b5c2] hover:text-[var(--accent)]"
                aria-label="Cerrar libro"
                title="Cerrar libro"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {status || error ? (
            <div className="border-b border-[#d8dee8] bg-white px-5 py-2 text-sm font-semibold">
              <span className={error ? "text-[var(--accent)]" : "text-[#15803d]"}>
                {error || status}
              </span>
              {workbook?.preview.missingRequiredFields.length ? (
                <span className="ml-3 text-[#b7791f]">
                  Faltan columnas requeridas: {workbook.preview.missingRequiredFields.join(", ")}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 p-3">
            {workbook ? (
              <div className="h-full min-h-0 overflow-hidden border border-[#d8dee8] bg-white">
                <ProductionWorkbookEditor
                  key={workbook.workbookId}
                  snapshot={workbook.snapshot}
                  mapping={workbook.mapping}
                  dropdowns={dropdowns}
                  onReady={editorReady}
                />
              </div>
            ) : (
              <div className="grid h-full place-items-center border border-dashed border-[#cbd5e1] bg-white">
                <div className="grid max-w-md justify-items-center gap-4 text-center">
                  <span className="grid size-16 place-items-center rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-[#f8fafc] text-[#64748b]">
                    <FileSpreadsheet className="size-8" />
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-[#14161b]">
                      Sube un Excel para empezar
                    </h3>
                    <p className="mt-2 text-sm font-medium text-[#64748b]">
                      La app creará una copia interna editable y luego podrás aplicar los cambios a la grilla operativa.
                    </p>
                  </div>
                  {canEdit ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={busy}
                        className="inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white px-4 text-xs font-black uppercase tracking-[0.14em] text-[#64748b] transition hover:border-[#f3b5c2] hover:text-[var(--accent)] disabled:opacity-50"
                      >
                        <Upload className="size-4" />
                        Subir .xlsx
                      </button>
                      <button
                        type="button"
                        onClick={loadGoogleSheetWorkbook}
                        disabled={busy}
                        className="inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white px-4 text-xs font-black uppercase tracking-[0.14em] text-[#64748b] transition hover:border-[#f3b5c2] hover:text-[var(--accent)] disabled:opacity-50"
                        title={`Sincronizar manualmente Google Sheets: ${GOOGLE_PRODUCTION_SHEET_NAME}`}
                      >
                        <Cloud className="size-4" />
                        Sincronizar Google
                      </button>
                      <button
                        type="button"
                        onClick={createBlankWorkbook}
                        disabled={busy}
                        className="inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white px-4 text-xs font-black uppercase tracking-[0.14em] text-[#64748b] transition hover:border-[#f3b5c2] hover:text-[var(--accent)] disabled:opacity-50"
                      >
                        <FileSpreadsheet className="size-4" />
                        Hoja en blanco
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
