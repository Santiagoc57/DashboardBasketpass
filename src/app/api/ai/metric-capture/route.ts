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

const requestSchema = z.enum(["speedtest", "ping", "gpu"]);
const extractedSchema = z.object({
  value: z.string().trim().min(1).max(40).nullable(),
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

function buildPrompt(kind: z.infer<typeof requestSchema>) {
  if (kind === "speedtest") {
    return [
      "Extrae el valor principal de subida visible en una captura de speedtest para Basket Production.",
      'Devuelve SOLO JSON válido con el formato {"value":null,"note":null}.',
      'Si encuentras el valor, responde por ejemplo {"value":"22.1 Mbps","note":null}.',
      "No inventes nada.",
      "Si la imagen no permite leer claramente el dato, usa value: null y una note corta.",
    ].join("\n");
  }

  if (kind === "ping") {
    return [
      "Extrae el valor de ping o latencia visible en una captura para Basket Production.",
      'Devuelve SOLO JSON válido con el formato {"value":null,"note":null}.',
      'Si encuentras el valor, responde por ejemplo {"value":"60 ms","note":null}.',
      "No inventes nada.",
      "Si la imagen no permite leer claramente el dato, usa value: null y una note corta.",
    ].join("\n");
  }

  return [
    "Extrae el valor de GPU o carga porcentual visible en una captura para Basket Production.",
    'Devuelve SOLO JSON válido con el formato {"value":null,"note":null}.',
    'Si encuentras el valor, responde por ejemplo {"value":"40%","note":null}.',
    "No inventes nada.",
    "Si la imagen no permite leer claramente el dato, usa value: null y una note corta.",
  ].join("\n");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");
  const kindResult = requestSchema.safeParse(formData.get("kind"));

  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "Adjunta una captura válida." },
      { status: 400 },
    );
  }

  if (!kindResult.success) {
    return NextResponse.json(
      { error: "El tipo de lectura no es válido." },
      { status: 400 },
    );
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "La captura adjunta debe ser una imagen." },
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
              { text: buildPrompt(kindResult.data) },
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
        error: "No pudimos leer la captura con Gemini. Revisa la configuración o intenta con otra imagen.",
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
      { error: "No pudimos convertir la lectura a datos estructurados." },
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
      { error: "La lectura no devolvió el formato esperado." },
      { status: 502 },
    );
  }

  return NextResponse.json(extracted.data);
}
