import "server-only";

import { z } from "zod";

import { AI_COPY } from "@/lib/copy";
import { TECHNICAL_CAPTURE_KINDS, type TechnicalCaptureKind } from "@/lib/collaborator-report-attachments";
import { getGeminiRuntimeConfig } from "@/lib/settings";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export const technicalCaptureKindSchema = z.enum(TECHNICAL_CAPTURE_KINDS);

export const extractedMetricSchema = z.object({
  value: z.string().trim().min(1).max(40).nullable(),
  note: z.string().trim().min(1).max(240).nullable(),
});

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}

function buildPrompt(kind: TechnicalCaptureKind) {
  if (kind === "speedtest") {
    return [
      `Lee una captura de speedtest ${AI_COPY.portalCaptureContext}`,
      "Tu tarea es extraer SOLO la velocidad de subida principal.",
      "Busca etiquetas como subida, upload o up.",
      "Ignora descarga, download, jitter, score, proveedor y cualquier otro número.",
      'Devuelve SOLO JSON válido con el formato {"value":null,"note":null}.',
      'Si encuentras el valor, responde por ejemplo {"value":"22.1 Mbps","note":null}.',
      "Si aparecen varios números, elige exclusivamente el que corresponda a subida/upload.",
      "No inventes nada.",
      "Si la imagen no permite leer claramente el dato, usa value: null y una note corta.",
    ].join("\n");
  }

  if (kind === "ping") {
    return [
      `Lee una captura de red ${AI_COPY.portalCaptureContext}`,
      "Tu tarea es extraer SOLO el ping promedio o average visible.",
      "Busca etiquetas como ping, average, avg o latencia promedio.",
      "Si no existe un promedio claro pero sí un único ping principal muy visible, usa ese.",
      "Ignora subida, descarga, jitter y cualquier otro número que no sea el ping promedio.",
      'Devuelve SOLO JSON válido con el formato {"value":null,"note":null}.',
      'Si encuentras el valor, responde por ejemplo {"value":"60 ms","note":null}.',
      "No inventes nada.",
      "Si la imagen no permite leer claramente el dato, usa value: null y una note corta.",
    ].join("\n");
  }

  return [
    `Lee una captura de monitoreo ${AI_COPY.portalCaptureContext}`,
    "Tu tarea es extraer SOLO el valor de GPU Mem, GPU Memory o memoria GPU visible.",
    "Si no aparece GPU Mem pero sí un único porcentaje principal de GPU claramente visible, úsalo como fallback.",
    "Ignora CPU, RAM, FPS, encoder, bitrate, temperatura y cualquier otro dato que no sea GPU Mem o el porcentaje GPU principal.",
    'Devuelve SOLO JSON válido con el formato {"value":null,"note":null}.',
    'Si encuentras el valor, responde por ejemplo {"value":"40%","note":null}.',
    "No inventes nada.",
    "Si la imagen no permite leer claramente el dato, usa value: null y una note corta.",
  ].join("\n");
}

export async function extractMetricFromCapture(params: {
  kind: TechnicalCaptureKind;
  image: File;
  requestId?: string;
}) {
  const requestId = params.requestId ?? crypto.randomUUID();
  const bytes = Buffer.from(await params.image.arrayBuffer()).toString("base64");
  const { apiKey, model, source } = await getGeminiRuntimeConfig();

  if (!apiKey) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: AI_COPY.globalGeminiCaptureHint,
      },
    };
  }

  console.info("[ai][metric-capture] start", {
    requestId,
    kind: params.kind,
    mimeType: params.image.type,
    size: params.image.size,
    model,
    source,
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: buildPrompt(params.kind) },
              {
                inline_data: {
                  mime_type: params.image.type,
                  data: bytes,
                },
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("[ai][metric-capture] gemini request failed", {
      requestId,
      kind: params.kind,
      status: response.status,
      model,
      source,
      detail,
    });

    return {
      ok: false as const,
      status: 502,
      body: {
        error: "No pudimos leer la captura con Gemini. Revisa la configuración o intenta con otra imagen.",
        detail,
      },
    };
  }

  const data = (await response.json()) as GeminiResponse;
  const answer = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!answer) {
    console.warn("[ai][metric-capture] empty answer", {
      requestId,
      kind: params.kind,
      model,
      source,
    });

    return {
      ok: false as const,
      status: 502,
      body: { error: "Gemini no devolvió contenido para esta captura." },
    };
  }

  const jsonText = extractJson(answer);

  if (!jsonText) {
    console.warn("[ai][metric-capture] missing json block", {
      requestId,
      kind: params.kind,
      model,
      source,
      answer,
    });

    return {
      ok: false as const,
      status: 502,
      body: { error: "No pudimos convertir la lectura a datos estructurados." },
    };
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(jsonText);
  } catch (error) {
    console.warn("[ai][metric-capture] invalid json", {
      requestId,
      kind: params.kind,
      model,
      source,
      jsonText,
      error,
    });

    return {
      ok: false as const,
      status: 502,
      body: { error: "La respuesta de Gemini no vino en JSON válido." },
    };
  }

  const extracted = extractedMetricSchema.safeParse(parsedJson);

  if (!extracted.success) {
    console.warn("[ai][metric-capture] schema mismatch", {
      requestId,
      kind: params.kind,
      model,
      source,
      parsedJson,
    });

    return {
      ok: false as const,
      status: 502,
      body: { error: "La lectura no devolvió el formato esperado." },
    };
  }

  console.info("[ai][metric-capture] success", {
    requestId,
    kind: params.kind,
    model,
    source,
    hasValue: Boolean(extracted.data.value),
    note: extracted.data.note,
  });

  return {
    ok: true as const,
    status: 200,
    body: extracted.data,
  };
}
