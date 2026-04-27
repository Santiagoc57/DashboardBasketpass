"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Flag, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  submitTeamIssueReport,
  TEAM_ISSUE_REASON_OPTIONS,
} from "@/lib/team-issue-reports-local-storage";
import type { TeamDirectoryItem } from "@/lib/team-directory";
import { cn } from "@/lib/utils";

export function TeamIssueReportModal({
  team,
  triggerClassName,
}: {
  team: TeamDirectoryItem;
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<(typeof TEAM_ISSUE_REASON_OPTIONS)[number]>(
    "Escudo incorrecto",
  );
  const [detail, setDetail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function closeModal() {
    setIsOpen(false);
    setReason("Escudo incorrecto");
    setDetail("");
    setErrorMessage("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!detail.trim()) {
      setErrorMessage("Describe brevemente qué hay que corregir.");
      return;
    }

    const result = await submitTeamIssueReport({
      team,
      reason,
      detail,
    });

    if (!result.ok) {
      setErrorMessage(result.error ?? "No pudimos enviar el reporte.");
      return;
    }

    closeModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Reportar un error en ${team.display_name}`}
        title="Reportar error en este club"
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-[#f4f7fb] text-[#70819b] transition hover:bg-[#eef2f6] hover:text-[var(--accent)]",
          triggerClassName,
        )}
      >
        <Flag className="size-4" />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[310] flex items-center justify-center bg-[#101828]/60 p-4 backdrop-blur-sm"
              onClick={closeModal}
            >
              <div
                className="panel-surface relative flex w-full max-w-xl flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(15,23,42,0.22)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#fff4f6] text-[var(--accent)]">
                      <Flag className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                        Reportar error del club
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {team.display_name} · {team.competition}
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

                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-[#334155]">Qué pasa con este club</span>
                    <Select
                      value={reason}
                      onChange={(event) =>
                        setReason(event.target.value as (typeof TEAM_ISSUE_REASON_OPTIONS)[number])
                      }
                      className="h-11 rounded-xl bg-[var(--background-soft)]"
                    >
                      {TEAM_ISSUE_REASON_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-[#334155]">Detalle</span>
                    <textarea
                      value={detail}
                      onChange={(event) => setDetail(event.target.value)}
                      placeholder="Ej. el club ya no juega esta liga, el escudo es anterior o el estadio está mal escrito."
                      className="min-h-32 w-full rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[rgba(230,18,56,0.08)]"
                    />
                  </label>

                  {errorMessage ? (
                    <div className="rounded-xl border border-[#f0c8d1] bg-[#fff4f6] px-4 py-3 text-sm font-semibold text-[#ad1d39]">
                      {errorMessage}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-5">
                    <Button type="button" variant="secondary" onClick={closeModal}>
                      Cancelar
                    </Button>
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)]"
                    >
                      <Send className="size-4" />
                      Enviar reporte
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
