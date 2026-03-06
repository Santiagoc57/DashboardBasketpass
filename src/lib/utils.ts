import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizePhone(phone: string | null | undefined) {
  if (!phone) {
    return "";
  }

  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsAppUrl(phone: string | null | undefined) {
  const sanitized = sanitizePhone(phone);

  return sanitized ? `https://wa.me/${sanitized}` : "";
}

export function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export function pickFirstString(
  values: Array<FormDataEntryValue | null | undefined>,
) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

export function ensureErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error inesperado.";
}

export function maybeNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((token) => token[0]?.toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}
