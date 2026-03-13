"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  ImageIcon,
  Layers3,
  Loader2,
  MapPin,
  Palette,
  ReceiptText,
  Save,
  Type,
  Upload,
  Wifi,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { CollaboratorAssignmentItem } from "@/lib/data/collaborators";
import { cn } from "@/lib/utils";

type IssueKey = "internet" | "img" | "ocr" | "overlays" | "grafica";
type ToggleValue = "si" | "no";
type ConnectionValue = "buena" | "inestable" | "mala";
type TechnicalCaptureKind = "speedtest" | "ping" | "gpu";
type ReadingState = "idle" | "loading" | "error" | "done";

type DraftState = {
  connection: ConnectionValue;
  paid: ToggleValue;
  feedDetected: ToggleValue;
  problems: Record<IssueKey, boolean>;
  transmissionType: string;
  signalLabel: string;
  aptoLineal: ToggleValue;
  testTime: string;
  testCheck: ToggleValue;
  startCheck: ToggleValue;
  graphicsCheck: ToggleValue;
  speedtestValue: string;
  pingValue: string;
  gpuValue: string;
  technicalObservations: string;
  buildingObservations: string;
  generalObservations: string;
  otherObservation: string;
  stObservation: string;
  clubObservation: string;
  speedtestAttachmentName: string | null;
  pingAttachmentName: string | null;
  gpuAttachmentName: string | null;
  updatedAt: string;
};

const ISSUE_OPTIONS: Array<{
  key: IssueKey;
  label: string;
  icon: typeof Wifi;
}> = [
  { key: "internet", label: "Internet", icon: Wifi },
  { key: "img", label: "IMG", icon: ImageIcon },
  { key: "ocr", label: "OCR", icon: Type },
  { key: "overlays", label: "GES", icon: Layers3 },
  { key: "grafica", label: "Gráfica", icon: Palette },
];

const DEFAULT_PROBLEMS: Record<IssueKey, boolean> = {
  internet: false,
  img: false,
  ocr: false,
  overlays: false,
  grafica: false,
};

function getDraftKey(assignmentId: string) {
  return `basket-production.collaborator-report.${assignmentId}`;
}

function buildDefaultDraft(): DraftState {
  return {
    connection: "buena",
    paid: "si",
    feedDetected: "si",
    problems: DEFAULT_PROBLEMS,
    transmissionType: "",
    signalLabel: "",
    aptoLineal: "si",
    testTime: "",
    testCheck: "si",
    startCheck: "si",
    graphicsCheck: "si",
    speedtestValue: "",
    pingValue: "",
    gpuValue: "",
    technicalObservations: "",
    buildingObservations: "",
    generalObservations: "",
    otherObservation: "",
    stObservation: "",
    clubObservation: "",
    speedtestAttachmentName: null,
    pingAttachmentName: null,
    gpuAttachmentName: null,
    updatedAt: new Date().toISOString(),
  };
}

function parseSavedDraft(raw: string | null): DraftState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DraftState> & { notes?: string };
    return {
      ...buildDefaultDraft(),
      ...parsed,
      generalObservations:
        parsed.generalObservations ?? parsed.notes ?? "",
      problems: {
        ...DEFAULT_PROBLEMS,
        ...(parsed.problems ?? {}),
      },
    };
  } catch {
    return null;
  }
}

function SegmentedToggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
        {label}
      </p>
      <div
        className={cn(
          "grid gap-2 rounded-[var(--panel-radius)] bg-[var(--background-soft)] p-1",
          options.length >= 3 ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[calc(var(--panel-radius)-4px)] px-3 py-2 text-sm font-bold transition",
              value === option.value
                ? "bg-[var(--surface)] text-[var(--accent)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CollaboratorReportForm({
  assignment,
}: {
  assignment: CollaboratorAssignmentItem;
}) {
  const speedtestInputRef = useRef<HTMLInputElement | null>(null);
  const pingInputRef = useRef<HTMLInputElement | null>(null);
  const gpuInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<DraftState>(() => {
    if (typeof window === "undefined") {
      return buildDefaultDraft();
    }

    return (
      parseSavedDraft(window.localStorage.getItem(getDraftKey(assignment.assignmentId))) ??
      buildDefaultDraft()
    );
  });
  const [captureState, setCaptureState] = useState<
    Record<TechnicalCaptureKind, { state: ReadingState; message: string }>
  >({
    speedtest: { state: "idle", message: "" },
    ping: { state: "idle", message: "" },
    gpu: { state: "idle", message: "" },
  });
  const [saveMessage, setSaveMessage] = useState<string>("");

  const updateDraft = (updater: (previous: DraftState) => DraftState) => {
    setDraft((previous) => updater(previous));
  };

  const saveDraft = () => {
    const nextDraft = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(getDraftKey(assignment.assignmentId), JSON.stringify(nextDraft));
    setDraft(nextDraft);
    setSaveMessage("Borrador guardado en este dispositivo.");
  };

  const handleUploadCapture = async (
    kind: TechnicalCaptureKind,
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("kind", kind);

    setCaptureState((previous) => ({
      ...previous,
      [kind]: {
        state: "loading",
        message: "Leyendo captura con IA...",
      },
    }));
    updateDraft((previous) => ({
      ...previous,
      speedtestAttachmentName:
        kind === "speedtest" ? file.name : previous.speedtestAttachmentName,
      pingAttachmentName: kind === "ping" ? file.name : previous.pingAttachmentName,
      gpuAttachmentName: kind === "gpu" ? file.name : previous.gpuAttachmentName,
    }));

    try {
      const response = await fetch("/api/ai/metric-capture", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | { value: string | null; note?: string | null }
        | { error?: string };

      if (!response.ok || !("value" in payload)) {
        setCaptureState((previous) => ({
          ...previous,
          [kind]: {
            state: "error",
            message:
              "error" in payload
                ? (payload.error ?? "No pudimos leer la captura.")
                : "No pudimos leer la captura.",
          },
        }));
        return;
      }

      updateDraft((previous) => ({
        ...previous,
        speedtestValue:
          kind === "speedtest" ? (payload.value ?? "") : previous.speedtestValue,
        pingValue: kind === "ping" ? (payload.value ?? "") : previous.pingValue,
        gpuValue: kind === "gpu" ? (payload.value ?? "") : previous.gpuValue,
      }));
      setCaptureState((previous) => ({
        ...previous,
        [kind]: {
          state: "done",
          message: payload.value
            ? "Lectura lista. Puedes ajustarla manualmente si hace falta."
            : "No se pudo leer. Completa el valor manualmente.",
        },
      }));
    } catch {
      setCaptureState((previous) => ({
        ...previous,
        [kind]: {
          state: "error",
          message: "No pudimos procesar la captura en este momento.",
        },
      }));
    }
  };

  return (
    <div className="space-y-5">
      <Card className="space-y-5 p-5">
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#95a3ba]">
            Parte móvil
          </p>
          <h3 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
            Reportar novedades
          </h3>
          <p className="text-sm text-[#617187]">
            Carga rápida para {assignment.homeTeam} vs {assignment.awayTeam}. Este
            primer flujo guarda borrador local mientras conectamos la persistencia final.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              <CalendarDays className="size-4 text-[var(--accent)]" />
              Fecha
            </div>
            <p className="mt-2 text-sm font-semibold">{assignment.dateLabel}</p>
          </div>
          <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              <Clock3 className="size-4 text-[var(--accent)]" />
              Hora
            </div>
            <p className="mt-2 text-sm font-semibold">{assignment.timeLabel}</p>
          </div>
          <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              <MapPin className="size-4 text-[var(--accent)]" />
              Sede
            </div>
            <p className="mt-2 text-sm font-semibold">
              {assignment.venue ?? "Por definir"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-5 p-5">
        <h4 className="text-sm font-black uppercase tracking-[0.22em] text-[#95a3ba]">
          Estado general
        </h4>

        <SegmentedToggle
          label="Conexión"
          value={draft.connection}
          onChange={(value) =>
            updateDraft((previous) => ({ ...previous, connection: value }))
          }
          options={[
            { label: "Buena", value: "buena" },
            { label: "Inestable", value: "inestable" },
            { label: "Mala", value: "mala" },
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SegmentedToggle
            label="Pago"
            value={draft.paid}
            onChange={(value) =>
              updateDraft((previous) => ({ ...previous, paid: value }))
            }
            options={[
              { label: "Sí", value: "si" },
              { label: "No", value: "no" },
            ]}
          />
          <SegmentedToggle
            label="Feed detectó"
            value={draft.feedDetected}
            onChange={(value) =>
              updateDraft((previous) => ({ ...previous, feedDetected: value }))
            }
            options={[
              { label: "Sí", value: "si" },
              { label: "No", value: "no" },
            ]}
          />
        </div>
      </Card>

      <Card className="space-y-5 p-5">
        <h4 className="text-sm font-black uppercase tracking-[0.22em] text-[#95a3ba]">
          Contexto del partido
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Tipo de transmisión
            </span>
            <input
              type="text"
              value={draft.transmissionType}
              onChange={(event) =>
                updateDraft((previous) => ({
                  ...previous,
                  transmissionType: event.target.value,
                }))
              }
              placeholder="Ej. Encoder / Offtube"
              className="h-12 w-full rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Señal
            </span>
            <input
              type="text"
              value={draft.signalLabel}
              onChange={(event) =>
                updateDraft((previous) => ({
                  ...previous,
                  signalLabel: event.target.value,
                }))
              }
              placeholder="Ej. BP / IMG / SPT"
              className="h-12 w-full rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)]"
            />
          </label>
        </div>
        <SegmentedToggle
          label="Apto lineal"
          value={draft.aptoLineal}
          onChange={(value) =>
            updateDraft((previous) => ({ ...previous, aptoLineal: value }))
          }
          options={[
            { label: "Sí", value: "si" },
            { label: "No", value: "no" },
          ]}
        />
      </Card>

      <Card className="space-y-5 p-5">
        <h4 className="text-sm font-black uppercase tracking-[0.22em] text-[#95a3ba]">
          Pruebas de salida
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Hora
            </span>
            <input
              type="time"
              value={draft.testTime}
              onChange={(event) =>
                updateDraft((previous) => ({ ...previous, testTime: event.target.value }))
              }
              className="h-12 w-full rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)]"
            />
          </label>
          <SegmentedToggle
            label="Prueba"
            value={draft.testCheck}
            onChange={(value) =>
              updateDraft((previous) => ({ ...previous, testCheck: value }))
            }
            options={[
              { label: "Sí", value: "si" },
              { label: "No", value: "no" },
            ]}
          />
          <SegmentedToggle
            label="Inicio"
            value={draft.startCheck}
            onChange={(value) =>
              updateDraft((previous) => ({ ...previous, startCheck: value }))
            }
            options={[
              { label: "Sí", value: "si" },
              { label: "No", value: "no" },
            ]}
          />
          <SegmentedToggle
            label="Gráfica"
            value={draft.graphicsCheck}
            onChange={(value) =>
              updateDraft((previous) => ({ ...previous, graphicsCheck: value }))
            }
            options={[
              { label: "Sí", value: "si" },
              { label: "No", value: "no" },
            ]}
          />
        </div>
      </Card>

      <Card className="space-y-5 p-5">
        <h4 className="text-sm font-black uppercase tracking-[0.22em] text-[#95a3ba]">
          Problemas detectados
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {ISSUE_OPTIONS.map((issue) => {
            const Icon = issue.icon;
            const active = draft.problems[issue.key];

            return (
              <button
                key={issue.key}
                type="button"
                onClick={() =>
                  updateDraft((previous) => ({
                    ...previous,
                    problems: {
                      ...previous.problems,
                      [issue.key]: !previous.problems[issue.key],
                    },
                  }))
                }
                className={cn(
                  "flex items-center gap-3 rounded-[var(--panel-radius)] border px-4 py-3 text-left transition",
                  active
                    ? "border-[#f3c8d2] bg-[#fff5f7] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[#ead2d8]",
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[var(--background-soft)]">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-bold uppercase tracking-[0.12em]">
                  {issue.label}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-5 p-5">
        <div className="space-y-1">
          <h4 className="text-sm font-black uppercase tracking-[0.22em] text-[#95a3ba]">
            Bloque técnico
          </h4>
          <p className="text-sm text-[#617187]">
            Primero sube speedtest, ping y GPU. La IA intentará leerlos y, si no puede, dejará una incógnita para que completes el dato manualmente.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => speedtestInputRef.current?.click()}
            className="flex items-center justify-between gap-4 rounded-[var(--panel-radius)] border border-dashed border-[var(--border)] bg-[var(--background-soft)] px-4 py-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--surface)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-[var(--panel-radius)] bg-[var(--surface)] text-[var(--accent)] shadow-sm">
                <Upload className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  Speedtest
                </p>
                <p className="text-sm text-[#617187]">
                  {draft.speedtestAttachmentName ?? "Subir captura"}
                </p>
              </div>
            </div>
            {captureState.speedtest.state === "loading" ? (
              <Loader2 className="size-5 animate-spin text-[var(--accent)]" />
            ) : (
              <ImageIcon className="size-5 text-[var(--muted)]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => pingInputRef.current?.click()}
            className="flex items-center justify-between gap-4 rounded-[var(--panel-radius)] border border-dashed border-[var(--border)] bg-[var(--background-soft)] px-4 py-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--surface)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-[var(--panel-radius)] bg-[var(--surface)] text-[var(--accent)] shadow-sm">
                <Upload className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  Ping
                </p>
                <p className="text-sm text-[#617187]">
                  {draft.pingAttachmentName ?? "Subir captura"}
                </p>
              </div>
            </div>
            {captureState.ping.state === "loading" ? (
              <Loader2 className="size-5 animate-spin text-[var(--accent)]" />
            ) : (
              <ImageIcon className="size-5 text-[var(--muted)]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => gpuInputRef.current?.click()}
            className="flex items-center justify-between gap-4 rounded-[var(--panel-radius)] border border-dashed border-[var(--border)] bg-[var(--background-soft)] px-4 py-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--surface)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-[var(--panel-radius)] bg-[var(--surface)] text-[var(--accent)] shadow-sm">
                <Upload className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  GPU
                </p>
                <p className="text-sm text-[#617187]">
                  {draft.gpuAttachmentName ?? "Subir captura"}
                </p>
              </div>
            </div>
            {captureState.gpu.state === "loading" ? (
              <Loader2 className="size-5 animate-spin text-[var(--accent)]" />
            ) : (
              <ImageIcon className="size-5 text-[var(--muted)]" />
            )}
          </button>
        </div>

        <input
          ref={speedtestInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            void handleUploadCapture("speedtest", file);
            event.currentTarget.value = "";
          }}
        />
        <input
          ref={pingInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            void handleUploadCapture("ping", file);
            event.currentTarget.value = "";
          }}
        />
        <input
          ref={gpuInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            void handleUploadCapture("gpu", file);
            event.currentTarget.value = "";
          }}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Speedtest
            </p>
            <p className="mt-2 text-sm font-bold">{draft.speedtestValue || "?"}</p>
            {captureState.speedtest.message ? (
              <p
                className={cn(
                  "mt-2 text-xs",
                  captureState.speedtest.state === "error"
                    ? "text-[#aa2945]"
                    : "text-[#617187]",
                )}
              >
                {captureState.speedtest.message}
              </p>
            ) : null}
          </div>
          <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Ping
            </p>
            <p className="mt-2 text-sm font-bold">{draft.pingValue || "?"}</p>
            {captureState.ping.message ? (
              <p
                className={cn(
                  "mt-2 text-xs",
                  captureState.ping.state === "error"
                    ? "text-[#aa2945]"
                    : "text-[#617187]",
                )}
              >
                {captureState.ping.message}
              </p>
            ) : null}
          </div>
          <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              GPU
            </p>
            <p className="mt-2 text-sm font-bold">{draft.gpuValue || "?"}</p>
            {captureState.gpu.message ? (
              <p
                className={cn(
                  "mt-2 text-xs",
                  captureState.gpu.state === "error"
                    ? "text-[#aa2945]"
                    : "text-[#617187]",
                )}
              >
                {captureState.gpu.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Completar speedtest
            </span>
            <input
              type="text"
              value={draft.speedtestValue}
              onChange={(event) =>
                updateDraft((previous) => ({
                  ...previous,
                  speedtestValue: event.target.value,
                }))
              }
              placeholder="Ej. 22.1 Mbps"
              className="h-12 w-full rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Completar ping
            </span>
            <input
              type="text"
              value={draft.pingValue}
              onChange={(event) =>
                updateDraft((previous) => ({
                  ...previous,
                  pingValue: event.target.value,
                }))
              }
              placeholder="Ej. 60 ms"
              className="h-12 w-full rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Completar GPU
            </span>
            <input
              type="text"
              value={draft.gpuValue}
              onChange={(event) =>
                updateDraft((previous) => ({
                  ...previous,
                  gpuValue: event.target.value,
                }))
              }
              placeholder="Ej. 40%"
              className="h-12 w-full rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)]"
            />
          </label>
        </div>
      </Card>

      <Card className="space-y-5 p-5">
        <div className="space-y-1">
          <h4 className="text-sm font-black uppercase tracking-[0.22em] text-[#95a3ba]">
            Observaciones
          </h4>
          <p className="text-sm text-[#617187]">
            Separa las observaciones para que luego puedan reflejarse en reportes e incidencias.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Observaciones técnicas
            </p>
            <Textarea
              placeholder="Ej. Se cayó la cámara 1 en dos momentos y la VM tardó en responder."
              value={draft.technicalObservations}
              onChange={(event) =>
                updateDraft((previous) => ({
                  ...previous,
                  technicalObservations: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Observaciones edilicias
            </p>
            <Textarea
              placeholder="Ej. El responsable no tenía PC ni router 4G disponible."
              value={draft.buildingObservations}
              onChange={(event) =>
                updateDraft((previous) => ({
                  ...previous,
                  buildingObservations: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Observaciones generales
            </p>
            <Textarea
              placeholder="Ej. El realizador dio señal faltando una hora para el inicio."
              value={draft.generalObservations}
              onChange={(event) =>
                updateDraft((previous) => ({
                  ...previous,
                  generalObservations: event.target.value,
                }))
              }
            />
          </div>
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              OTRO
            </span>
            <input
              type="text"
              value={draft.otherObservation}
              onChange={(event) =>
                updateDraft((previous) => ({
                  ...previous,
                  otherObservation: event.target.value,
                }))
              }
              placeholder="Dato adicional"
              className="h-12 w-full rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              ST
            </span>
            <input
              type="text"
              value={draft.stObservation}
              onChange={(event) =>
                updateDraft((previous) => ({
                  ...previous,
                  stObservation: event.target.value,
                }))
              }
              placeholder="Dato ST"
              className="h-12 w-full rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)]"
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              CLUB
            </span>
            <input
              type="text"
              value={draft.clubObservation}
              onChange={(event) =>
                updateDraft((previous) => ({
                  ...previous,
                  clubObservation: event.target.value,
                }))
              }
              placeholder="Dato de club"
              className="h-12 w-full rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)]"
            />
          </label>
        </div>
      </Card>

      <div className="sticky bottom-4 z-10 grid gap-3 rounded-[var(--panel-radius)] border border-[var(--border)] bg-[rgba(253,252,251,0.92)] p-3 shadow-[0_18px_42px_rgba(15,23,42,0.12)] backdrop-blur sm:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-2 text-sm text-[#617187]">
          {saveMessage ? <Save className="size-4 text-[#238b57]" /> : <ReceiptText className="size-4 text-[var(--accent)]" />}
          <span>{saveMessage || "Guarda un borrador local mientras conectamos el envío definitivo."}</span>
        </div>
        <Link href={`/match/${assignment.matchId}`} className="sm:justify-self-end">
          <Button variant="secondary" className="h-12 w-full sm:w-auto">
            Abrir partido
          </Button>
        </Link>
        <Button className="h-12" onClick={saveDraft}>
          <Save className="mr-2 size-4" />
          Guardar borrador
        </Button>
      </div>
    </div>
  );
}
