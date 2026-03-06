import type { Database } from "@/lib/database.types";

export const APP_NAME = "Basket Production";
export const DEFAULT_TIMEZONE =
  process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "America/Bogota";
export const DEFAULT_MATCH_DURATION_MINUTES = 150;

export const MATCH_STATUS_OPTIONS: Database["public"]["Enums"]["match_status"][] =
  ["Pendiente", "Confirmado", "Realizado"];

export const PRODUCTION_MODE_OPTIONS = [
  "Encoder",
  "Offtube Remoto",
  "Cancha",
] as const;

export const DASHBOARD_NAV = [
  { href: "/grid", label: "Grilla" },
  { href: "/people", label: "Personal" },
  { href: "/roles", label: "Roles" },
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
