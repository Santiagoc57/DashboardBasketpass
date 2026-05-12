"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, MessageCircleMore, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PersonListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type PeopleBulkWhatsAppModalProps = {
  people: PersonListItem[];
  disabled?: boolean;
};

function sanitizePhone(phone: string | null | undefined) {
  return phone?.replaceAll(/\D+/g, "") ?? "";
}

export function PeopleBulkWhatsAppModal({
  people,
  disabled = false,
}: PeopleBulkWhatsAppModalProps) {
  const recipients = useMemo(
    () =>
      people
        .filter((person) => person.active && sanitizePhone(person.phone))
        .map((person) => ({
          id: person.id,
          name: person.full_name,
          phone: sanitizePhone(person.phone),
          role: person.primary_role ?? "Sin rol",
        }))
        .sort((left, right) => left.name.localeCompare(right.name, "es")),
    [people],
  );
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    intent: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const selectedRecipients = recipients.filter((recipient) =>
    selectedIds.includes(recipient.id),
  );
  const allSelected = selectedIds.length === recipients.length && recipients.length > 0;

  function openModal() {
    setSelectedIds(recipients.map((recipient) => recipient.id));
    setMessage("");
    setFeedback(null);
    setOpen(true);
  }

  function toggleRecipient(personId: string) {
    setSelectedIds((current) =>
      current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId],
    );
  }

  async function sendBulkMessage() {
    const text = message.trim();

    if (!text) {
      setFeedback({ intent: "error", message: "Escribe un mensaje antes de enviar." });
      return;
    }

    if (!selectedRecipients.length) {
      setFeedback({ intent: "error", message: "Selecciona al menos una persona con WhatsApp." });
      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "todos",
          phones: selectedRecipients.map((recipient) => recipient.phone),
          message: text,
          matchLabel: "Mensaje masivo de Personal",
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        setFeedback({
          intent: "error",
          message: result.error ?? "No fue posible enviar el mensaje masivo.",
        });
        return;
      }

      setFeedback({
        intent: "success",
        message: `Mensaje enviado a ${result.queuedCount ?? selectedRecipients.length} personas.`,
      });
    } catch {
      setFeedback({
        intent: "error",
        message: "No fue posible conectar con Evolution API.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={disabled || !recipients.length}
        className="inline-flex h-10 items-center gap-2 rounded-[var(--panel-radius)] border border-[#d8dee8] bg-white px-3 text-sm font-bold text-[#506075] shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Enviar mensaje masivo por WhatsApp"
        title="Enviar mensaje masivo por WhatsApp"
      >
        <MessageCircleMore className="size-4" />
        Mensaje masivo
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.48)] p-4 backdrop-blur-sm">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-[var(--panel-radius)] border border-[#e6e8ec] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.26)]">
            <div className="flex items-center justify-between border-b border-[#eef1f5] px-6 py-5">
              <div>
                <h3 className="text-xl font-black tracking-[-0.03em] text-[var(--foreground)]">
                  Mensaje masivo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-[#e6e9ef] text-[#6b778b] transition hover:bg-[#fafbfc] hover:text-[var(--foreground)]"
                aria-label="Cerrar mensaje masivo"
                title="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                Mensaje
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-[var(--panel-radius)] border border-[#d8dee8] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[#94a3b8]"
                placeholder="Escribe el mensaje que recibirá el personal seleccionado..."
              />

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                    Destinatarios
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#64748b]">
                    {selectedRecipients.length} de {recipients.length} seleccionados
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIds(
                      allSelected ? [] : recipients.map((recipient) => recipient.id),
                    )
                  }
                  className="inline-flex h-9 items-center rounded-[var(--panel-radius)] border border-[#d8dee8] bg-[#f8fafc] px-3 text-xs font-bold text-[#506075] transition hover:bg-[#f1f5f9]"
                >
                  {allSelected ? "Quitar todos" : "Seleccionar todos"}
                </button>
              </div>

              <div className="mt-3 grid max-h-[20rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {recipients.map((recipient) => {
                  const selected = selectedIds.includes(recipient.id);

                  return (
                    <button
                      key={recipient.id}
                      type="button"
                      onClick={() => toggleRecipient(recipient.id)}
                      className={cn(
                        "flex min-w-0 items-center gap-3 rounded-[var(--panel-radius)] border px-3 py-2.5 text-left transition",
                        selected
                          ? "border-[#b7e4c7] bg-[#f0fdf4]"
                          : "border-[#eef1f5] bg-white hover:bg-[#fafbfc]",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                          selected
                            ? "border-[#86d7a4] bg-[#1faa52] text-white"
                            : "border-[#cbd5e1] bg-white text-transparent",
                        )}
                      >
                        <Check className="size-3" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-[var(--foreground)]">
                          {recipient.name}
                        </span>
                        <span className="block truncate text-xs font-semibold text-[#64748b]">
                          {recipient.role} · {recipient.phone}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {feedback ? (
                <div
                  className={cn(
                    "mt-4 rounded-[var(--panel-radius)] border px-4 py-3 text-sm font-semibold",
                    feedback.intent === "success" &&
                      "border-[#b7e4c7] bg-[#f0fdf4] text-[#15803d]",
                    feedback.intent === "error" &&
                      "border-[#f3cfd8] bg-[#fff3f6] text-[var(--accent)]",
                    feedback.intent === "info" &&
                      "border-[#d8dee8] bg-[#f8fafc] text-[#506075]",
                  )}
                >
                  {feedback.message}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#eef1f5] px-6 py-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void sendBulkMessage()}
                disabled={busy || !message.trim() || !selectedRecipients.length}
                className="gap-2"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {busy ? "Enviando..." : "Enviar mensaje"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
