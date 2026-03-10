import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  GEMINI_API_KEY_COOKIE,
  GEMINI_MODEL_COOKIE,
  GEMINI_MODEL_OPTIONS,
} from "@/lib/settings";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const extractedSchema = z.object({
  ping: z.string().trim().min(1).max(40).nullable(),
  upload: z.string().trim().min(1).max(40).nullable(),
  download: z.string().trim().min(1).max(40).nullable(),
  provider: z.string().trim().min(1).max(120).nullable(),
  locationServer: z.string().trim().min(1).max(160).nullable(),
  dateTime: z.string().trim().min(1).max(120).nullable(),
  note: z.string().trim().min(1).max(240).nullable(),
});

function isGeminiModel(value: string): value is (typeof GEMINI_MODEL_OPTIONS)[number] {
  return GEMINI_MODEL_OPTIONS.includes(value as (typeof GEMINI_MODEL_OPTIONS)[number]);
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "Adjunta una captura válida del speedtest." },
      { status: 400 },
    );
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "La prueba adjunta debe ser una imagen." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await image.arrayBuffer()).toString("base64");
  const store = await cookies();
  const apiKey = store.get(GEMINI_API_KEY_COOKIE)?.value ?? "";
  const configuredModel = store.get(GEMINI_MODEL_COOKIE)?.value ?? "gemini-2.5-flash";
  const model = isGeminiModel(configuredModel)
    ? configuredModel
    : "gemini-2.5-flash";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Configura la API key de Gemini en Configuración antes de leer capturas." },
      { status: 400 },
    );
  }

  const prompt = [
    "Extrae datos visibles de una captura de speedtest para Basket Production.",
    "Responde SOLO JSON válido.",
    "No inventes nada.",
    "Si un dato no está visible, usa null.",
    "Normaliza así:",
    '- ping: ejemplo "18 ms"',
    '- upload: ejemplo "97.43 Mbps"',
    '- download: ejemplo "103.58 Mbps"',
    '- provider: proveedor o ISP visible',
    '- locationServer: ciudad + servidor si aparece',
    '- dateTime: fecha y hora visibles',
    '- note: comentario corto si la captura es parcial, borrosa o ambigua',
    "",
    "Devuelve exactamente este objeto:",
    '{"ping":null,"upload":null,"download":null,"provider":null,"locationServer":null,"dateTime":null,"note":null}',
  ].join("\n");

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
              { text: prompt },
              {
                inline_data: {
                  mime_type: image.type,
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

    return NextResponse.json(
      {
        error:
          "No pudimos leer la captura con Gemini. Revisa la configuración o intenta con otra imagen.",
        detail,
      },
      { status: 502 },
    );
  }

  const data = (await response.json()) as GeminiResponse;
  const answer = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!answer) {
    return NextResponse.json(
      { error: "Gemini no devolvió contenido para esta captura." },
      { status: 502 },
    );
  }

  const jsonText = extractJson(answer);

  if (!jsonText) {
    return NextResponse.json(
      { error: "No pudimos convertir la lectura del speedtest a datos estructurados." },
      { status: 502 },
    );
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    return NextResponse.json(
      { error: "La respuesta de Gemini no vino en JSON válido." },
      { status: 502 },
    );
  }

  const extracted = extractedSchema.safeParse(parsedJson);

  if (!extracted.success) {
    return NextResponse.json(
      { error: "La lectura del speedtest no devolvió el formato esperado." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    extracted: extracted.data,
  });
}
