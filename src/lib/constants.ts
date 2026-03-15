import type { Database } from "@/lib/database.types";

export const APP_NAME = "Basket Production";
export const APP_RELEASE_LABEL = "Consola operativa v0.1.0";
export const DEFAULT_TIMEZONE =
  process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "America/Bogota";
export const DEFAULT_MATCH_DURATION_MINUTES = 150;

export const MATCH_STATUS_OPTIONS: Database["public"]["Enums"]["match_status"][] =
  ["Pendiente", "Confirmado", "Realizado"];

export const PRODUCTION_MODE_OPTIONS = [
  "Encoder",
  "Offtube Remoto",
  "En Cancha",
  "Envio FDC/TYC",
  "Envio FDC/DTV",
] as const;

export const COMMENTARY_PLAN_OPTIONS = [
  "Relatos en Cancha",
  "Offtube Remoto",
] as const;

export type ProductionModeOption = (typeof PRODUCTION_MODE_OPTIONS)[number];

const PRODUCTION_MODE_ALIASES = new Map<string, ProductionModeOption>([
  ["cancha", "En Cancha"],
]);

export function normalizeProductionMode(
  value: string | null | undefined,
): ProductionModeOption | null {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const exactOption = PRODUCTION_MODE_OPTIONS.find(
    (option) => option.toLowerCase() === normalized.toLowerCase(),
  );

  if (exactOption) {
    return exactOption;
  }

  return PRODUCTION_MODE_ALIASES.get(normalized.toLowerCase()) ?? null;
}

export function getProductionModeLabel(value: string | null | undefined) {
  const normalized = normalizeProductionMode(value);

  if (normalized) {
    return normalized;
  }

  return value?.trim() ?? "";
}

export function normalizeCommentaryPlan(
  value: string | null | undefined,
): (typeof COMMENTARY_PLAN_OPTIONS)[number] | "" {
  const normalized = value?.trim();

  if (!normalized) {
    return "";
  }

  return (
    COMMENTARY_PLAN_OPTIONS.find(
      (option) => option.toLowerCase() === normalized.toLowerCase(),
    ) ?? ""
  );
}

export const DASHBOARD_NAV = [
  { href: "/grid", label: "Producción" },
  { href: "/mi-jornada", label: "Mi jornada" },
  { href: "/incidents", label: "Incidencias" },
  { href: "/reports", label: "Reportes" },
  { href: "/teams", label: "Equipos" },
  { href: "/people", label: "Personal" },
  { href: "/roles", label: "Roles" },
  { href: "/settings", label: "Configuración" },
] as const;

export const RESERVED_IMPORT_HEADERS = new Set([
  "fecha",
  "dia",
  "día",
  "hora",
  "partido",
  "liga",
  "torneo",
  "competencia",
  "modo",
  "produccion",
  "producción",
  "estado",
  "responsable",
  "owner",
  "local",
  "visitante",
  "observaciones",
  "notas",
  "duracion",
  "duración",
  "timezone",
]);

export const ROLE_SEED = [
  { name: "Responsable", category: "Coordinacion", sortOrder: 10 },
  { name: "Realizador", category: "Produccion", sortOrder: 20 },
  { name: "Operador de Control", category: "Produccion", sortOrder: 30 },
  { name: "Operador de Grafica", category: "Produccion", sortOrder: 35 },
  { name: "Soporte tecnico", category: "Produccion", sortOrder: 40 },
  { name: "Productor", category: "Produccion", sortOrder: 50 },
  { name: "Relator", category: "Talento", sortOrder: 60 },
  { name: "Comentario 1", category: "Talento", sortOrder: 70 },
  { name: "Comentario 2", category: "Talento", sortOrder: 80 },
  { name: "Campo", category: "Talento", sortOrder: 90 },
  { name: "Encoder", category: "Transmision", sortOrder: 100 },
  { name: "Ingenieria", category: "Transmision", sortOrder: 110 },
  { name: "Camara 1", category: "Camaras", sortOrder: 120 },
  { name: "Camara 2", category: "Camaras", sortOrder: 130 },
  { name: "Camara 3", category: "Camaras", sortOrder: 140 },
  { name: "Camara 4", category: "Camaras", sortOrder: 150 },
  { name: "Camara 5", category: "Camaras", sortOrder: 160 },
] as const;

export const ROLE_CATEGORY_ORDER = [
  "Coordinacion",
  "Produccion",
  "Talento",
  "Transmision",
  "Camaras",
] as const;
