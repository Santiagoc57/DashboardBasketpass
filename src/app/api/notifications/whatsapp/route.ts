import { NextResponse } from "next/server";

import { getUserContext } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import {
  buildEvolutionApiUrl,
  buildEvolutionHeaders,
  buildEvolutionSendTextBody,
  normalizeEvolutionWhatsAppRequest,
} from "@/lib/evolution-whatsapp";
import { emitOperationalAlert } from "@/lib/monitoring";
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

  const normalized = normalizeEvolutionWhatsAppRequest(payload);

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

  const baseUrl = appEnv.evolutionApiBaseUrl.trim();
  const apiKey = appEnv.evolutionApiKey.trim();
  const instance = appEnv.evolutionApiInstance.trim();

  if (!baseUrl || !apiKey || !instance) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error:
          "Evolution API todavía no está configurado. Agrega EVOLUTION_API_BASE_URL, EVOLUTION_API_KEY y EVOLUTION_API_INSTANCE en .env.local.",
      },
      { status: 503 },
    );
  }

  try {
    const sendUrl = buildEvolutionApiUrl({
      baseUrl,
      instance,
      endpoint: "sendText",
    });
    const results = [];

    for (const phone of normalized.data.phones) {
      const response = await fetch(sendUrl, {
        method: "POST",
        headers: buildEvolutionHeaders(apiKey),
        body: JSON.stringify(
          buildEvolutionSendTextBody({
            phone,
            message: normalized.data.message,
          }),
        ),
        cache: "no-store",
      });
      const responseText = await response.text().catch(() => "");
      results.push({
        phone,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.slice(0, 300),
      });
    }

    const failedResults = results.filter((result) => !result.ok);

    if (failedResults.length) {
      await emitOperationalAlert({
        area: "matches",
        severity: "warning",
        message: "Evolution API rechazó una solicitud de WhatsApp.",
        details: {
          action: normalized.data.action,
          phones: normalized.data.phones.join(", "),
          requestedBy: user.email ?? user.userId,
          matchLabel: normalized.data.matchLabel,
          failedCount: failedResults.length,
          firstFailure: JSON.stringify(failedResults[0]),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          configured: true,
          error: `Evolution API no pudo enviar ${failedResults.length} de ${results.length} mensajes.`,
          results,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      queuedCount: results.length,
      detail:
        normalized.data.action === "individual"
          ? "Evolution API envió el mensaje individual."
          : `Evolution API envió ${results.length} mensajes.`,
      results,
    });
  } catch (error) {
    await emitOperationalAlert({
      area: "matches",
      severity: "critical",
      message: "Falló el envío de WhatsApp hacia Evolution API.",
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
