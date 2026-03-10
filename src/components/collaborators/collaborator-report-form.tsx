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

type SpeedtestExtraction = {
  ping: string | null;
  upload: string | null;
  download: string | null;
  provider: string | null;
  locationServer: string | null;
  dateTime: string | null;
  note: string | null;
};

type DraftState = {
  connection: ConnectionValue;
  paid: ToggleValue;
  feedDetected: ToggleValue;
  notes: string;
  problems: Record<IssueKey, boolean>;
  attachmentName: string | null;
  extraction: SpeedtestExtraction | null;
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
    notes: "",
    problems: DEFAULT_PROBLEMS,
    attachmentName: null,
    extraction: null,
    updatedAt: new Date().toISOString(),
  };
}

function parseSavedDraft(raw: string | null): DraftState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DraftState;
    return {
      ...buildDefaultDraft(),
      ...parsed,
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<DraftState>(() => {
    if (typeof window === "undefined") {
      return buildDefaultDraft();
    }

    return (
      parseSavedDraft(window.localStorage.getItem(getDraftKey(assignment.assignmentId))) ??
      buildDefaultDraft()
    );
  });
  const [readingState, setReadingState] = useState<"idle" | "loading" | "error" | "done">(
    "idle",
  );
  const [readingMessage, setReadingMessage] = useState<string>("");
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

  const handleUploadCapture = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    setReadingState("loading");
    setReadingMessage("Leyendo captura con IA...");

    try {
      const response = await fetch("/api/ai/speedtest", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | { extracted: SpeedtestExtraction }
        | { error?: string };

      if (!response.ok || !("extracted" in payload)) {
        setReadingState("error");
        setReadingMessage(
          "error" in payload ? (payload.error ?? "No pudimos leer la captura.") : "No pudimos leer la captura.",
        );
        updateDraft((previous) => ({
          ...previous,
          attachmentName: file.name,
        }));
        return;
      }

      updateDraft((previous) => ({
        ...previous,
        attachmentName: file.name,
        extraction: payload.extracted,
      }));
      setReadingState("done");
      setReadingMessage("Captura procesada. Puedes revisar y completar lo faltante.");
    } catch {
      setReadingState("error");
      setReadingMessage("No pudimos procesar la captura en este momento.");
      updateDraft((previous) => ({
        ...previous,
        attachmentName: file.name,
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
            Captura de speedtest
          </h4>
          <p className="text-sm text-[#617187]">
            Sube la prueba y la IA intentará leer subida, ping y descarga automáticamente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-between gap-4 rounded-[var(--panel-radius)] border border-dashed border-[var(--border)] bg-[var(--background-soft)] px-4 py-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--surface)]"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-[var(--panel-radius)] bg-[var(--surface)] text-[var(--accent)] shadow-sm">
              <Upload className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">
                Subir captura de speedtest
              </p>
              <p className="text-sm text-[#617187]">
                PNG, JPG o WEBP. {draft.attachmentName ? draft.attachmentName : "Lectura automática."}
              </p>
            </div>
          </div>
          {readingState === "loading" ? (
            <Loader2 className="size-5 animate-spin text-[var(--accent)]" />
          ) : (
            <ImageIcon className="size-5 text-[var(--muted)]" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            void handleUploadCapture(file);
            event.currentTarget.value = "";
          }}
        />

        {readingMessage ? (
          <div
            className={cn(
              "rounded-[var(--panel-radius)] px-4 py-3 text-sm",
              readingState === "error"
                ? "border border-[#f3d4d8] bg-[#fff5f7] text-[#aa2945]"
                : "border border-[#d7eadf] bg-[#f6fcf7] text-[#2d7555]",
            )}
          >
            {readingMessage}
          </div>
        ) : null}

        {draft.extraction ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
                Subida
              </p>
              <p className="mt-2 text-sm font-bold">{draft.extraction.upload ?? "Sin leer"}</p>
            </div>
            <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
                Ping
              </p>
              <p className="mt-2 text-sm font-bold">{draft.extraction.ping ?? "Sin leer"}</p>
            </div>
            <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
                Descarga
              </p>
              <p className="mt-2 text-sm font-bold">{draft.extraction.download ?? "Sin leer"}</p>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4 p-5">
        <div className="space-y-1">
          <h4 className="text-sm font-black uppercase tracking-[0.22em] text-[#95a3ba]">
            Notas rápidas
          </h4>
          <p className="text-sm text-[#617187]">
            Resume si hubo problemas, si el partido salió limpio o si falta algo por validar.
          </p>
        </div>
        <Textarea
          placeholder="Ej. El speedtest salió correcto, pero el feed tardó en estabilizar. Pago pendiente de confirmar."
          value={draft.notes}
          onChange={(event) =>
            updateDraft((previous) => ({ ...previous, notes: event.target.value }))
          }
        />
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
