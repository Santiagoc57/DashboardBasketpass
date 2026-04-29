import { z } from "zod";

import { sanitizePhone } from "./utils";

const evolutionWhatsAppRequestSchema = z.object({
  action: z.enum(["individual", "todos"]),
  message: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  phones: z.array(z.string().trim()).optional(),
  recipientName: z.string().trim().optional(),
  matchLabel: z.string().trim().optional(),
});

export type NormalizedEvolutionWhatsAppRequest = {
  action: "individual" | "todos";
  message: string;
  phone: string;
  phones: string[];
  recipientName: string | null;
  matchLabel: string | null;
};

export function normalizeEvolutionWhatsAppRequest(
  input: unknown,
):
  | { ok: true; data: NormalizedEvolutionWhatsAppRequest }
  | { ok: false; error: string } {
  const parsed = evolutionWhatsAppRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "La solicitud de WhatsApp no es válida.",
    };
  }

  const candidatePhones =
    parsed.data.action === "individual"
      ? [parsed.data.phone ?? parsed.data.phones?.[0] ?? ""]
      : parsed.data.phones ?? [];
  const phones = [...new Set(candidatePhones.map(sanitizePhone).filter(Boolean))];

  if (!phones.length) {
    return {
      ok: false,
      error:
        parsed.data.action === "individual"
          ? "Debes indicar un teléfono válido para WhatsApp."
          : "Debes indicar al menos un teléfono válido para WhatsApp.",
    };
  }

  return {
    ok: true,
    data: {
      action: parsed.data.action,
      message: parsed.data.message,
      phone: phones[0],
      phones,
      recipientName: parsed.data.recipientName?.trim() || null,
      matchLabel: parsed.data.matchLabel?.trim() || null,
    },
  };
}

export function buildEvolutionApiUrl(params: {
  baseUrl: string;
  instance: string;
  endpoint: "sendText";
}) {
  const baseUrl = params.baseUrl.trim().replace(/\/+$/, "");
  const instance = encodeURIComponent(params.instance.trim());

  return `${baseUrl}/message/${params.endpoint}/${instance}`;
}

export function buildEvolutionHeaders(apiKey: string) {
  return {
    "content-type": "application/json",
    apikey: apiKey.trim(),
  };
}

export function buildEvolutionSendTextBody(input: {
  phone: string;
  message: string;
}) {
  return {
    number: sanitizePhone(input.phone),
    text: input.message,
  };
}
