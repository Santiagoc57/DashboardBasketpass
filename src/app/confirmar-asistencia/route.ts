import { NextResponse } from "next/server";

import { getAssignmentConfirmationUpdate } from "@/lib/assignment-confirmation";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureErrorMessage } from "@/lib/utils";

function renderConfirmationPage(params: {
  title: string;
  message: string;
  tone: "success" | "error";
}) {
  const accent = params.tone === "success" ? "#24a267" : "#e3052c";
  const title = escapeHtml(params.title);
  const message = escapeHtml(params.message);

  return new NextResponse(
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f6f7fb;
        color: #14151a;
        font-family: Arial, sans-serif;
      }
      main {
        width: min(92vw, 460px);
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #fff;
        padding: 28px;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
      }
      .mark {
        width: 42px;
        height: 42px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, ${accent} 13%, white);
        color: ${accent};
        font-weight: 900;
      }
      h1 {
        margin: 18px 0 8px;
        font-size: 24px;
        line-height: 1.1;
      }
      p {
        margin: 0;
        color: #617187;
        line-height: 1.55;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="mark">${params.tone === "success" ? "✓" : "!"}</div>
      <h1>${title}</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured) {
    return renderConfirmationPage({
      title: "Confirmación no disponible",
      message: "El dashboard todavía no tiene Supabase configurado.",
      tone: "error",
    });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const response = url.searchParams.get("response")?.trim();
  const update = getAssignmentConfirmationUpdate(response);

  if (!token || !update) {
    return renderConfirmationPage({
      title: "Link inválido",
      message: "El enlace de confirmación no es válido o está incompleto.",
      tone: "error",
    });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const result = await supabase
      .from("assignments")
      .update({
        confirmed: update.confirmed,
        confirmation_status: update.status,
        confirmation_responded_at: new Date().toISOString(),
      })
      .eq("confirmation_token", token)
      .select("id")
      .single();

    if (result.error) {
      throw result.error;
    }

    return renderConfirmationPage({
      title: update.confirmed ? "Asistencia confirmada" : "Respuesta registrada",
      message: update.confirmed
        ? "Gracias. Tu asistencia quedó confirmada en Basketpass."
        : "Gracias. Registramos que no puedes asistir a esta convocatoria.",
      tone: "success",
    });
  } catch (error) {
    return renderConfirmationPage({
      title: "No pudimos registrar la respuesta",
      message: ensureErrorMessage(error),
      tone: "error",
    });
  }
}
