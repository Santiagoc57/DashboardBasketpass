"use client";

import {
  Check,
  Copy,
  Mail,
  MessageCircleMore,
  PencilLine,
  Send,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { buildWhatsAppUrl, cn } from "@/lib/utils";

type MatchNotificationRecipient = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  emailHref: string;
  whatsappHref: string;
  personalMessage: string;
};

type WhatsAppDispatchFeedback = {
  tone: "success" | "warning" | "error";
  message: string;
};

function getUniqueContactKey(recipient: MatchNotificationRecipient) {
  return (
    recipient.email?.trim().toLowerCase() ||
    recipient.phone?.trim() ||
    recipient.fullName.trim().toLowerCase()
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getCompactPersonName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return name;
  }

  const surnameCandidate = parts.at(-1) ?? parts[0];
  return `${parts[0]?.[0]?.toUpperCase() ?? ""}. ${surnameCandidate}`;
}

async function writeClipboard(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function MatchNotificationWorkspace({
  batchMessage,
  recipients,
  unassignedRoles,
  compact = false,
}: {
  bulkMailtoHref?: string;
  batchMessage: string;
  recipients: MatchNotificationRecipient[];
  unassignedRoles: string[];
  compact?: boolean;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editableBatchMessage, setEditableBatchMessage] = useState(batchMessage);
  const [isEditingBatchMessage, setIsEditingBatchMessage] = useState(false);
  const [isBatchMessageDialogOpen, setIsBatchMessageDialogOpen] = useState(false);
  const [isWhatsAppDispatching, setIsWhatsAppDispatching] = useState(false);
  const [whatsAppDispatchFeedback, setWhatsAppDispatchFeedback] =
    useState<WhatsAppDispatchFeedback | null>(null);
  const activeBatchMessage = editableBatchMessage;
  const uniqueRecipients = useMemo(() => {
    const uniqueMap = new Map<string, MatchNotificationRecipient>();

    recipients.forEach((recipient) => {
      const uniqueKey = getUniqueContactKey(recipient);

      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, recipient);
      }
    });

    return [...uniqueMap.values()];
  }, [recipients]);
  const whatsappRecipients = useMemo(
    () => uniqueRecipients.filter((recipient) => recipient.whatsappHref),
    [uniqueRecipients],
  );
  const emailRecipients = useMemo(
    () => uniqueRecipients.filter((recipient) => recipient.emailHref),
    [uniqueRecipients],
  );
  const shouldSplitRecipients = compact && recipients.length >= 5;
  async function handleCopy(value: string, key: string) {
    try {
      await writeClipboard(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1800);
    } catch {
      setCopiedKey(null);
    }
  }

  function handleBulkEmail() {
    if (!emailRecipients.length) {
      return;
    }

    emailRecipients.forEach((recipient, index) => {
      window.setTimeout(() => {
        if (recipient.emailHref) {
          window.open(recipient.emailHref, "_blank", "noopener,noreferrer");
        }
      }, index * 180);
    });
  }

  function openBulkWhatsAppInBrowser() {
    whatsappRecipients.forEach((recipient, index) => {
      window.setTimeout(() => {
        const baseUrl = buildWhatsAppUrl(recipient.phone);

        if (!baseUrl) {
          return;
        }

        const url = new URL(baseUrl);
        url.searchParams.set("text", recipient.personalMessage || activeBatchMessage);
        window.open(url.toString(), "_blank", "noopener,noreferrer");
      }, index * 180);
    });
  }

  function openIndividualWhatsAppInBrowser(recipient: MatchNotificationRecipient) {
    if (!recipient.whatsappHref) {
      return;
    }

    window.open(recipient.whatsappHref, "_blank", "noopener,noreferrer");
  }

  async function dispatchWhatsAppViaEvolution(input: {
    action: "individual" | "todos";
    message: string;
    phone?: string | null;
    phones?: string[];
    recipientName?: string;
  }) {
    setIsWhatsAppDispatching(true);
    setWhatsAppDispatchFeedback(null);

    try {
      const response = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      const result = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            configured?: boolean;
            error?: string;
            detail?: string;
            queuedCount?: number;
          }
        | null;

      if (response.ok && result?.ok) {
        setWhatsAppDispatchFeedback({
          tone: "success",
          message:
            result.detail ??
            (input.action === "individual"
              ? "Evolution API envió el mensaje individual."
              : `Evolution API envió ${result.queuedCount ?? 0} mensajes por WhatsApp.`),
        });
        return true;
      }

      if (response.status === 503 || result?.configured === false) {
        setWhatsAppDispatchFeedback({
          tone: "warning",
          message:
            "Evolution API no está configurado todavía. Abrimos WhatsApp Web directamente en el navegador.",
        });
        return false;
      }

      setWhatsAppDispatchFeedback({
        tone: "error",
        message: result?.error ?? "No fue posible enviar la solicitud a Evolution API.",
      });
      return null;
    } catch {
      setWhatsAppDispatchFeedback({
        tone: "error",
        message: "No fue posible conectar el dashboard con Evolution API.",
      });
      return null;
    } finally {
      setIsWhatsAppDispatching(false);
    }
  }

  async function handleBulkWhatsApp() {
    let shouldOpenBrowserFallback = false;

    for (const recipient of whatsappRecipients) {
      if (!recipient.phone) {
        continue;
      }

      const usedEvolution = await dispatchWhatsAppViaEvolution({
        action: "individual",
        phone: recipient.phone,
        message: recipient.personalMessage || activeBatchMessage,
        recipientName: recipient.fullName,
      });

      if (usedEvolution !== true) {
        shouldOpenBrowserFallback = true;
      }
    }

    if (shouldOpenBrowserFallback) {
      openBulkWhatsAppInBrowser();
    }
  }

  async function handleIndividualWhatsApp(recipient: MatchNotificationRecipient) {
    if (!recipient.phone) {
      return;
    }

    const usedEvolution = await dispatchWhatsAppViaEvolution({
      action: "individual",
      phone: recipient.phone,
      message: recipient.personalMessage || activeBatchMessage,
      recipientName: recipient.fullName,
    });

    if (usedEvolution === false) {
      openIndividualWhatsAppInBrowser(recipient);
    }
  }

  function openBatchMessageDialog() {
    setIsEditingBatchMessage(true);
    setIsBatchMessageDialogOpen(true);
  }

  function closeBatchMessageDialog() {
    setIsBatchMessageDialogOpen(false);
  }


  const compactMessageCard = (
    <Card className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
          Convocatoria del partido
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(activeBatchMessage, "batch")}
            aria-label="Copiar texto"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background-soft)] text-[#617187] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {copiedKey === "batch" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setIsEditingBatchMessage((v) => !v)}
            aria-label={isEditingBatchMessage ? "Listo" : "Editar mensaje"}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg transition",
              isEditingBatchMessage
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--border)] bg-[var(--background-soft)] text-[#617187] hover:border-[var(--accent)] hover:text-[var(--accent)]",
            )}
          >
            <PencilLine className="size-3.5" />
          </button>
        </div>
      </div>

      {isEditingBatchMessage ? (
        <textarea
          value={editableBatchMessage}
          onChange={(e) => setEditableBatchMessage(e.target.value)}
          rows={14}
          className="w-full resize-none rounded-[var(--panel-radius)] border border-[var(--accent)] bg-[var(--background-soft)] p-4 font-body text-sm leading-6 text-[var(--foreground)] focus:outline-none"
        />
      ) : (
        <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-4">
          <pre className="max-h-[26rem] overflow-auto whitespace-pre-wrap font-body text-sm leading-6 text-[var(--foreground)]">
            {activeBatchMessage}
          </pre>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#95a3ba]">
        <Badge>{emailRecipients.length} con correo</Badge>
        <Badge>{whatsappRecipients.length} con WhatsApp</Badge>
        <Badge>{uniqueRecipients.length} convocados</Badge>
        {unassignedRoles.length ? <Badge>{unassignedRoles.length} sin cubrir</Badge> : null}
      </div>
    </Card>
  );

  const notificationCard = (
    <Card className="space-y-5">
      <div
        className={cn(
          "items-start gap-4",
          compact ? "space-y-4" : "flex flex-wrap justify-between",
        )}
      >
        <div className={cn("space-y-1", compact && "max-w-none")}>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#95a3ba]">
            Notificar
          </p>
          <h2
            className={cn(
              "font-black tracking-tight text-[var(--foreground)]",
              compact ? "text-xl" : "text-2xl",
            )}
          >
            Convocatoria del partido
          </h2>
          <p
            className={cn(
              "max-w-2xl text-sm leading-5 text-[#617187]",
              compact && "max-w-none",
            )}
          >
            El correo se abre con Gmail. WhatsApp usa Evolution API si la
            instancia está conectada; si falta configuración, abre WhatsApp Web.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={handleBulkEmail}
            disabled={!emailRecipients.length}
            className="gap-2"
          >
            <Mail className="size-4" />
            Correo a todos
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleBulkWhatsApp()}
            disabled={!whatsappRecipients.length || isWhatsAppDispatching}
            className="gap-2 text-[#1b8b56] hover:text-[#17784b]"
          >
            <MessageCircleMore className="size-4" />
            {isWhatsAppDispatching ? "Enviando..." : "WhatsApp a todos"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleCopy(activeBatchMessage, "batch")}
            className="gap-2"
          >
            <Copy className="size-4" />
            {copiedKey === "batch" ? "Copiado" : "Copiar texto"}
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-4">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
            Mensaje base
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-2 py-1 text-[11px] font-bold text-[#617187] transition hover:border-[#cfd8e6] hover:text-[var(--foreground)]"
            onClick={() => setIsEditingBatchMessage((current) => !current)}
          >
            {isEditingBatchMessage ? <Check className="size-3" /> : <PencilLine className="size-3" />}
            {isEditingBatchMessage ? "Listo" : "Editar"}
          </button>
        </div>
        {isEditingBatchMessage ? (
          <Textarea
            value={editableBatchMessage}
            onChange={(event) => setEditableBatchMessage(event.target.value)}
            className="mt-3 min-h-[14rem] bg-white text-sm leading-6"
          />
        ) : (
          <pre className="mt-3 whitespace-pre-wrap font-body text-sm leading-6 text-[var(--foreground)]">
            {editableBatchMessage}
          </pre>
        )}
      </div>

      {compact ? null : (
        <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#95a3ba]">
          <Badge>{emailRecipients.length} con correo</Badge>
          <Badge>{whatsappRecipients.length} con WhatsApp</Badge>
          <Badge>{uniqueRecipients.length} convocados</Badge>
        </div>
      )}
    </Card>
  );

  const recipientsCard = (
    <Card className="space-y-5">
      <div className="space-y-3">
        <h3 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
          Contactos por persona
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={handleBulkEmail}
            disabled={!emailRecipients.length}
            className="gap-2"
          >
            <Mail className="size-4" />
            Correo a todos
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleBulkWhatsApp()}
            disabled={!whatsappRecipients.length || isWhatsAppDispatching}
            className="gap-2 border-[#14b66f] bg-[#14b66f] text-white hover:border-[#109c5f] hover:bg-[#109c5f] hover:text-white"
          >
            <MessageCircleMore className="size-4" />
            {isWhatsAppDispatching ? "Enviando..." : "WhatsApp a todos"}
          </Button>
        </div>
      </div>

      {recipients.length ? (
        <div className="space-y-1">
          {recipients.map((recipient, index) => (
            <div
              key={recipient.id}
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-[var(--panel-radius)] px-2 py-2",
                index % 2 === 0 ? "bg-[var(--background-soft)]" : "",
              )}
            >
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[#c9ead8] bg-[#eefbf3] text-[11px] font-black text-[#1b8b56]">
                {getInitials(recipient.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-[#7587a1]">
                  {recipient.roles.join(" · ")}
                </p>
                <p className="truncate text-sm font-bold text-[var(--foreground)]" title={recipient.fullName}>
                  {getCompactPersonName(recipient.fullName)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { if (recipient.emailHref) window.open(recipient.emailHref, "_blank"); }}
                  disabled={!recipient.emailHref}
                  aria-label={`Enviar correo a ${recipient.fullName}`}
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-md transition",
                    recipient.emailHref
                      ? "text-[#2b6be7] hover:bg-[#edf4ff]"
                      : "cursor-not-allowed text-[#c5ccd8]",
                  )}
                >
                  <Mail className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openIndividualWhatsAppInBrowser(recipient)}
                  disabled={!recipient.whatsappHref || isWhatsAppDispatching}
                  aria-label={`Abrir WhatsApp de ${recipient.fullName}`}
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-md transition",
                    recipient.whatsappHref
                      ? "text-[#1b8b56] hover:bg-[#eefbf3]"
                      : "cursor-not-allowed text-[#c5ccd8]",
                  )}
                >
                  <MessageCircleMore className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-5 text-sm font-semibold text-[#7d8ca4]">
          Aún no hay personas asignadas a este partido. Primero carga el staff y luego
          vuelve a esta pantalla para notificar.
        </div>
      )}
    </Card>
  );

  const standardSidebar = (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Send className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#95a3ba]">
              Resumen
            </p>
            <h3 className="text-lg font-black tracking-tight text-[var(--foreground)]">
              Estado de contactos
            </h3>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-1">
          <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Con correo
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-[var(--foreground)]">
              {emailRecipients.length}
            </p>
          </div>
          <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Con WhatsApp
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-[var(--foreground)]">
              {whatsappRecipients.length}
            </p>
          </div>
          <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
              Sin cubrir
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-[var(--foreground)]">
              {unassignedRoles.length}
            </p>
          </div>
        </div>
      </Card>

    </div>
  );

  const batchMessageDialog = isBatchMessageDialogOpen ? (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-[#101828]/60 p-4 backdrop-blur-sm"
      onClick={closeBatchMessageDialog}
    >
      <div className="w-full max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <Card className="space-y-5 border border-[#f2d8ae] bg-[#fffaf0] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9a5a0f]">
                Editar texto
              </p>
              <h3 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
                Mensaje de convocatoria
              </h3>
              <p className="text-sm leading-5 text-[#6f5b44]">
                El texto editado se usa para correo y WhatsApp de todos los convocados.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start">
              <Button
                variant="secondary"
                onClick={() => handleCopy(activeBatchMessage, "batch")}
                className="gap-2 border-[#f2d8ae] bg-[#fff7e9] text-[#8a6a3b] hover:bg-[#fff1d5] hover:text-[var(--foreground)]"
              >
                {copiedKey === "batch" ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copiedKey === "batch" ? "Copiado" : "Copiar texto"}
              </Button>
              <button
                type="button"
                onClick={closeBatchMessageDialog}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#f2d8ae] bg-[#fff7e9] text-[#8a6a3b] transition hover:bg-[#fff1d5] hover:text-[var(--foreground)]"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <Textarea
            autoFocus
            value={editableBatchMessage}
            onChange={(event) => {
              setIsEditingBatchMessage(true);
              setEditableBatchMessage(event.target.value);
            }}
            className="min-h-[18rem] border-[#ead5b8] bg-[#fffaf0] text-sm leading-6 shadow-[inset_0_1px_2px_rgba(43,30,17,0.04)] focus:border-[#d6b17d] focus:bg-[#fffaf0] focus:ring-[rgba(242,216,174,0.35)]"
          />

          <div className="flex justify-end">
            <Button onClick={closeBatchMessageDialog} className="gap-2">
              Listo
            </Button>
          </div>
        </Card>
      </div>
    </div>
  ) : null;

  return compact ? (
    <>
      <div className="grid items-start gap-5 md:grid-cols-2">
        <div className="min-w-0 md:col-start-1 md:row-start-1">{compactMessageCard}</div>
        <div className="min-w-0 md:col-start-2 md:row-start-1">{recipientsCard}</div>
      </div>
      {batchMessageDialog}
    </>
  ) : (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_320px]">
      <div className="space-y-6">
        {notificationCard}
        {recipientsCard}
      </div>
      {standardSidebar}
    </div>
  );
}
