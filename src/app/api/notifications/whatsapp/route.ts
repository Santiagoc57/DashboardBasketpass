import { NextResponse } from "next/server";

import { getUserContext } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import { emitOperationalAlert } from "@/lib/monitoring";
import {
  buildRobomotionWebhookHeaders,
  normalizeRobomotionWhatsAppRequest,
} from "@/lib/robomotion";
import { ensureErrorMessage } from "@/lib/utils";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, configured: true, error: "No pudimos leer la solicitud de WhatsApp." },
      { status: 400 },
    );
  }

  const normalized = normalizeRobomotionWhatsAppRequest(payload);

  if (!normalized.ok) {
    return NextResponse.json(
      { ok: false, configured: true, error: normalized.error },
      { status: 400 },
    );
  }

  const user = await getUserContext();

  if (!user.userId) {
    return NextResponse.json(
      { ok: false, configured: true, error: "Inicia sesión para notificar por WhatsApp." },
      { status: 401 },
    );
  }

  if (!appEnv.robomotionWhatsAppWebhookUrl.trim()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error:
          "Robomotion todavía no está configurado. Agrega ROBOMOTION_WHATSAPP_WEBHOOK_URL en .env.local.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(appEnv.robomotionWhatsAppWebhookUrl, {
      method: "POST",
      headers: buildRobomotionWebhookHeaders(appEnv.robomotionWhatsAppWebhookToken),
      body: JSON.stringify({
        action: normalized.data.action,
        phone: normalized.data.phone,
        phones: normalized.data.phones,
        message: normalized.data.message,
        meta: {
          source: "dashboard-basketpass",
          requestedAt: new Date().toISOString(),
          requestedBy: {
            userId: user.userId,
            email: user.email,
            fullName: user.profile?.full_name ?? null,
          },
          recipientName: normalized.data.recipientName,
          matchLabel: normalized.data.matchLabel,
        },
      }),
      cache: "no-store",
    });

    const responseText = await response.text().catch(() => "");

    if (!response.ok) {
      await emitOperationalAlert({
        area: "matches",
        severity: "warning",
        message: "Robomotion rechazó una solicitud de WhatsApp.",
        details: {
          action: normalized.data.action,
          phones: normalized.data.phones.join(", "),
          requestedBy: user.email ?? user.userId,
          matchLabel: normalized.data.matchLabel,
          responseStatus: response.status,
          responseText: responseText.slice(0, 300),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          configured: true,
          error: `Robomotion respondió ${response.status} ${response.statusText}.`,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      queuedCount: normalized.data.phones.length,
      detail:
        normalized.data.action === "individual"
          ? "Robomotion recibió el chat individual."
          : "Robomotion recibió la cola de chats.",
      responseText: responseText.slice(0, 200),
    });
  } catch (error) {
    await emitOperationalAlert({
      area: "matches",
      severity: "critical",
      message: "Falló el envío del webhook de WhatsApp hacia Robomotion.",
      error: ensureErrorMessage(error),
      details: {
        action: normalized.data.action,
        phones: normalized.data.phones.join(", "),
        requestedBy: user.email ?? user.userId,
        matchLabel: normalized.data.matchLabel,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        configured: true,
        error: ensureErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
