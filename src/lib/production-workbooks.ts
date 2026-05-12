import type { SupabaseClient } from "@supabase/supabase-js";
import { parse as parseCsvRows } from "csv-parse/sync";
import ExcelJS from "exceljs";
import type { IWorkbookData } from "@univerjs/core";
import { BooleanNumber, CellValueType, LocaleType } from "@univerjs/core";

import {
  MATCH_STATUS_OPTIONS,
  normalizeProductionMode,
} from "@/lib/constants";
import type { Database } from "@/lib/database.types";
import { buildKickoffAt } from "@/lib/date";
import { maybeNull } from "@/lib/utils";

export const PRODUCTION_WORKBOOK_BUCKET = "production-workbooks";
export const MATCH_ID_HEADER = "__basketpass_match_id";
export const UPDATED_AT_HEADER = "__basketpass_updated_at";

export type ProductionWorkbookField =
  | "matchId"
  | "updatedAt"
  | "production"
  | "productionCode"
  | "date"
  | "time"
  | "competition"
  | "match"
  | "homeTeam"
  | "awayTeam"
  | "owner"
  | "productionMode"
  | "status"
  | "commentaryPlan"
  | "transport"
  | "notes"
  | "realizador"
  | "graphicsOperator"
  | "camera1"
  | "camera2"
  | "camera3"
  | "camera4"
  | "camera5"
  | "relator"
  | "commentator1"
  | "commentator2"
  | "controlOperator"
  | "supportTech"
  | "departureTime"
  | "carsCount"
  | "transportFrom"
  | "passengers"
  | "transportTo"
  | "directions2";

export type ProductionWorkbookColumnMapping = Partial<
  Record<ProductionWorkbookField, number>
> & {
  headerRow: number;
  sheetId: string;
};

export type ProductionWorkbookRow = Partial<Record<ProductionWorkbookField, string>> & {
  rowIndex: number;
};

type ParsedMatchTeams = {
  homeTeam: string;
  awayTeam: string;
};

type SupabaseAny = SupabaseClient<Database> & {
  from(table: string): ReturnType<SupabaseClient["from"]>;
};

const FIELD_ALIASES: Record<Exclude<ProductionWorkbookField, "matchId" | "updatedAt">, string[]> = {
  date: ["fecha", "dia", "día", "date"],
  production: ["production"],
  productionCode: ["id", "codigo", "código", "production id", "production code"],
  time: ["hora", "time"],
  competition: ["liga", "torneo", "competencia", "competition"],
  match: ["partido", "match"],
  homeTeam: ["local", "equipo local", "home", "home team"],
  awayTeam: ["visita", "visitante", "equipo visitante", "away", "away team"],
  owner: ["responsable", "responsable en cancha", "owner"],
  productionMode: ["produccion", "producción", "modo", "modo produccion", "modo producción", "production mode"],
  status: ["estado", "status"],
  commentaryPlan: ["relatos/comentarios", "comentarios", "relatos", "commentary"],
  transport: ["transporte", "transport"],
  notes: ["observaciones", "observacion", "notas", "notes"],
  realizador: ["realizador"],
  graphicsOperator: ["operador de grafica", "operador de gráfica", "grafica", "gráfica"],
  camera1: ["camara 1", "cámara 1", "camera 1"],
  camera2: ["camara 2", "cámara 2", "camera 2"],
  camera3: ["camara 3", "cámara 3", "camera 3"],
  camera4: ["camara 4", "cámara 4", "camera 4"],
  camera5: ["camara 5", "cámara 5", "camera 5"],
  relator: ["relator", "relato"],
  commentator1: ["comentario 1", "comentarista 1", "commentator 1"],
  commentator2: ["comentario 2", "comentarista 2", "commentator 2"],
  controlOperator: ["operador de control", "control"],
  supportTech: ["soporte tecnico", "soporte técnico", "support"],
  departureTime: ["hora de salida", "salida"],
  carsCount: ["cantidad autos", "autos", "cantidad de autos"],
  transportFrom: ["desde", "origen"],
  passengers: ["pasajeros"],
  transportTo: ["hasta", "destino"],
  directions2: ["direcciones 2", "direccion 2", "dirección 2"],
};

const ROLE_FIELD_TO_ROLE_NAME: Partial<Record<ProductionWorkbookField, string>> = {
  owner: "Responsable",
  realizador: "Realizador",
  graphicsOperator: "Operador de Grafica",
  camera1: "Camara 1",
  camera2: "Camara 2",
  camera3: "Camara 3",
  camera4: "Camara 4",
  camera5: "Camara 5",
  relator: "Relator",
  commentator1: "Comentario 1",
  commentator2: "Comentario 2",
  controlOperator: "Operador de Control",
  supportTech: "Soporte tecnico",
};

const ROLE_FIELDS = Object.keys(ROLE_FIELD_TO_ROLE_NAME) as ProductionWorkbookField[];
const BLANK_HEADERS: Array<[ProductionWorkbookField, string]> = [
  ["date", "Dia"],
  ["productionMode", "Produccion"],
  ["productionCode", "ID"],
  ["competition", "Liga"],
  ["homeTeam", "Local"],
  ["awayTeam", "Visita"],
  ["time", "Hora"],
  ["owner", "Responsable en Cancha"],
  ["realizador", "Realizador"],
  ["graphicsOperator", "Operador de Grafica"],
  ["camera1", "Camara 1"],
  ["camera2", "Camara 2"],
  ["camera3", "Camara 3"],
  ["camera4", "Camara 4"],
  ["camera5", "Camara 5"],
  ["commentaryPlan", "Relatos/Comentarios"],
  ["relator", "Relator"],
  ["commentator1", "Comentarista 1"],
  ["commentator2", "Comentarista 2"],
  ["controlOperator", "Operador de Control"],
  ["supportTech", "Soporte tecnico"],
  ["transport", "Transporte"],
  ["departureTime", "Hora de Salida"],
  ["carsCount", "Cantidad Autos"],
  ["transportFrom", "Desde"],
  ["passengers", "Pasajeros"],
  ["transportTo", "Hasta"],
  ["directions2", "Direcciones 2"],
  ["notes", "Observacion"],
];
const TRANSPORT_FIELDS = new Set<ProductionWorkbookField>([
  "departureTime",
  "carsCount",
  "transportFrom",
  "passengers",
  "transportTo",
  "directions2",
  "transport",
]);
const BLANK_COLUMN_WIDTHS: Partial<Record<ProductionWorkbookField, number>> = {
  date: 120,
  productionMode: 150,
  productionCode: 90,
  competition: 160,
  homeTeam: 220,
  awayTeam: 220,
  time: 90,
  owner: 220,
  realizador: 190,
  graphicsOperator: 220,
  camera1: 150,
  camera2: 150,
  camera3: 150,
  camera4: 150,
  camera5: 150,
  commentaryPlan: 210,
  relator: 170,
  commentator1: 190,
  commentator2: 190,
  controlOperator: 210,
  supportTech: 180,
  departureTime: 145,
  carsCount: 140,
  transportFrom: 180,
  passengers: 230,
  transportTo: 180,
  directions2: 230,
  transport: 170,
  notes: 280,
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function toCellValue(value: unknown) {
  if (value == null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object" && "text" in value) {
    return String((value as { text?: unknown }).text ?? "");
  }

  if (typeof value === "object" && "result" in value) {
    return String((value as { result?: unknown }).result ?? "");
  }

  return String(value);
}

function getCellText(snapshot: IWorkbookData, sheetId: string, row: number, column: number) {
  const cell = snapshot.sheets[sheetId]?.cellData?.[row]?.[column];
  const value = cell?.v ?? "";

  return String(value ?? "").trim();
}

function setCell(snapshot: IWorkbookData, sheetId: string, row: number, column: number, value: string) {
  const sheet = snapshot.sheets[sheetId];

  if (!sheet) {
    return;
  }

  sheet.cellData ??= {};
  sheet.cellData[row] ??= {};
  sheet.cellData[row][column] = { v: value, t: CellValueType.STRING };
}

function parseMatchTeams(row: ProductionWorkbookRow): ParsedMatchTeams | null {
  const homeTeam = row.homeTeam?.trim();
  const awayTeam = row.awayTeam?.trim();

  if (homeTeam && awayTeam) {
    return { homeTeam, awayTeam };
  }

  const match = row.match?.trim();
  if (!match) {
    return null;
  }

  const parts = match
    .split(/\s+(?:vs\.?|v\.?)\s+|\s+-\s+|\s+–\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  return {
    homeTeam: parts[0],
    awayTeam: parts.slice(1).join(" vs "),
  };
}

function buildTransportSummary(row: ProductionWorkbookRow) {
  const parts = [
    ["Hora de salida", row.departureTime],
    ["Autos", row.carsCount],
    ["Desde", row.transportFrom],
    ["Pasajeros", row.passengers],
    ["Hasta", row.transportTo],
    ["Direcciones 2", row.directions2],
  ]
    .map(([label, value]) => {
      const text = value?.trim();
      return text ? `${label}: ${text}` : "";
    })
    .filter(Boolean);

  return parts.join(" | ");
}

function mergeNotesWithTransport(row: ProductionWorkbookRow) {
  const notes = row.notes?.trim() ?? "";
  const transportSummary = buildTransportSummary(row);

  return [notes, transportSummary].filter(Boolean).join("\n");
}

function detectMapping(snapshot: IWorkbookData): ProductionWorkbookColumnMapping {
  const sheetId = snapshot.sheetOrder[0];
  const sheet = snapshot.sheets[sheetId];
  const rows = sheet?.cellData ?? {};
  let bestRow = 0;
  let bestScore = -1;

  for (const rowKey of Object.keys(rows).slice(0, 25)) {
    const rowIndex = Number(rowKey);
    const row = rows[rowIndex] ?? {};
    let score = 0;

    for (const cell of Object.values(row)) {
      const normalized = normalizeHeader(cell?.v);
      if (
        normalized === MATCH_ID_HEADER ||
        normalized === UPDATED_AT_HEADER ||
        Object.values(FIELD_ALIASES).some((aliases) =>
          aliases.map(normalizeHeader).includes(normalized),
        )
      ) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRow = rowIndex;
    }
  }

  const mapping: ProductionWorkbookColumnMapping = { headerRow: bestRow, sheetId };
  const headerCells = rows[bestRow] ?? {};

  for (const [columnKey, cell] of Object.entries(headerCells)) {
    const column = Number(columnKey);
    const normalized = normalizeHeader(cell?.v);

    if (normalized === MATCH_ID_HEADER) {
      mapping.matchId = column;
      continue;
    }

    if (normalized === UPDATED_AT_HEADER) {
      mapping.updatedAt = column;
      continue;
    }

    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.map(normalizeHeader).includes(normalized)) {
        mapping[field as ProductionWorkbookField] = column;
      }
    }
  }

  return mapping;
}

function ensureInternalColumns(snapshot: IWorkbookData, mapping: ProductionWorkbookColumnMapping) {
  const sheet = snapshot.sheets[mapping.sheetId];
  const usedColumns = Object.entries(mapping)
    .filter(([key]) => key !== "headerRow" && key !== "sheetId")
    .map(([, value]) => Number(value));
  const nextColumn = Math.max(-1, ...usedColumns) + 1;

  if (mapping.matchId == null) {
    mapping.matchId = nextColumn;
    setCell(snapshot, mapping.sheetId, mapping.headerRow, nextColumn, MATCH_ID_HEADER);
  }

  if (mapping.updatedAt == null) {
    mapping.updatedAt = Math.max(mapping.matchId, nextColumn) + 1;
    setCell(snapshot, mapping.sheetId, mapping.headerRow, mapping.updatedAt, UPDATED_AT_HEADER);
  }

  if (sheet) {
    sheet.columnCount = Math.max(
      sheet.columnCount ?? 0,
      (mapping.updatedAt ?? 0) + 1,
      (mapping.matchId ?? 0) + 1,
    );
    sheet.columnData ??= {};
    sheet.columnData[mapping.matchId] = { ...(sheet.columnData[mapping.matchId] ?? {}), hd: BooleanNumber.TRUE };
    sheet.columnData[mapping.updatedAt] = { ...(sheet.columnData[mapping.updatedAt] ?? {}), hd: BooleanNumber.TRUE };
  }
}

function createWorkbookSnapshot(name: string): IWorkbookData {
  return {
    id: crypto.randomUUID(),
    name,
    appVersion: "3.0.0",
    locale: LocaleType.ES_ES,
    styles: {
      header: { bl: 1, fs: 12, bg: { rgb: "#f4f6f9" } },
      transportHeader: { bl: 1, fs: 12, bg: { rgb: "#dbeafe" }, cl: { rgb: "#1d4ed8" } },
    },
    sheetOrder: [],
    sheets: {},
  };
}

function addSheetToSnapshot(
  snapshot: IWorkbookData,
  sheetId: string,
  name: string,
  rowCount: number,
  columnCount: number,
) {
  snapshot.sheetOrder.push(sheetId);
  snapshot.sheets[sheetId] = {
    id: sheetId,
    name,
    tabColor: "",
    hidden: BooleanNumber.FALSE,
    freeze: { xSplit: 0, ySplit: 1, startRow: 1, startColumn: 0 },
    rowCount,
    columnCount,
    defaultColumnWidth: 128,
    defaultRowHeight: 28,
    mergeData: [],
    cellData: {},
    rowData: {},
    columnData: {},
    rowHeader: { width: 46 },
    columnHeader: { height: 24 },
    showGridlines: BooleanNumber.TRUE,
    rightToLeft: BooleanNumber.FALSE,
  };
}

export async function parseXlsxToSnapshot(buffer: ArrayBuffer, filename: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const snapshot = createWorkbookSnapshot(
    filename.replace(/\.xlsx?$/i, "") || "Libro de produccion",
  );

  workbook.worksheets.forEach((worksheet, index) => {
    const sheetId = `sheet-${index + 1}`;
    const rowCount = Math.max(worksheet.rowCount + 25, 80);
    const columnCount = Math.max(worksheet.columnCount + 8, 24);

    addSheetToSnapshot(snapshot, sheetId, worksheet.name, rowCount, columnCount);

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
        const rowIndex = rowNumber - 1;
        const columnIndex = columnNumber - 1;
        const formula = cell.formula ? `=${cell.formula}` : null;
        const value = formula ? toCellValue(cell.result) : toCellValue(cell.value);

        setCell(snapshot, sheetId, rowIndex, columnIndex, value);

        if (formula) {
          snapshot.sheets[sheetId]!.cellData![rowIndex]![columnIndex]!.f = formula;
        }

        if (rowIndex === 0) {
          snapshot.sheets[sheetId]!.cellData![rowIndex]![columnIndex]!.s = "header";
        }
      });
    });
  });

  if (!snapshot.sheetOrder.length) {
    const sheetId = "sheet-1";
    addSheetToSnapshot(snapshot, sheetId, "Produccion", 80, 24);
  }

  const mapping = detectMapping(snapshot);
  ensureInternalColumns(snapshot, mapping);

  return { snapshot, mapping };
}

export function parseCsvToSnapshot(csvText: string, filename: string, sheetName = "Produccion") {
  const rows = parseCsvRows(csvText, {
    bom: true,
    relax_column_count: true,
    skip_empty_lines: false,
  }) as string[][];
  const normalizedRows = rows.length ? rows : [[]];
  const maxColumns = Math.max(1, ...normalizedRows.map((row) => row.length));
  const snapshot = createWorkbookSnapshot(
    filename.replace(/\.(csv|xlsx?)$/i, "") || "Libro de produccion",
  );
  const sheetId = "sheet-1";

  addSheetToSnapshot(
    snapshot,
    sheetId,
    sheetName || "Produccion",
    Math.max(normalizedRows.length + 25, 80),
    Math.max(maxColumns + 8, 24),
  );

  normalizedRows.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      const text = toCellValue(value);

      if (!text && rowIndex > 0) {
        return;
      }

      setCell(snapshot, sheetId, rowIndex, columnIndex, text);

      if (rowIndex === 0) {
        const field = Object.entries(FIELD_ALIASES).find(([, aliases]) =>
          aliases.map(normalizeHeader).includes(normalizeHeader(text)),
        )?.[0] as ProductionWorkbookField | undefined;

        snapshot.sheets[sheetId]!.cellData![rowIndex]![columnIndex]!.s =
          field && TRANSPORT_FIELDS.has(field) ? "transportHeader" : "header";
      }
    });
  });

  const mapping = detectMapping(snapshot);
  ensureInternalColumns(snapshot, mapping);

  return { snapshot, mapping };
}

export function createBlankProductionWorkbookSnapshot(filename = "Libro de produccion") {
  const workbookId = crypto.randomUUID();
  const sheetId = "sheet-1";
  const snapshot: IWorkbookData = {
    id: workbookId,
    name: filename.replace(/\.xlsx?$/i, "") || "Libro de produccion",
    appVersion: "3.0.0",
    locale: LocaleType.ES_ES,
    styles: {
      header: { bl: 1, fs: 12, bg: { rgb: "#f4f6f9" } },
      transportHeader: { bl: 1, fs: 12, bg: { rgb: "#dbeafe" }, cl: { rgb: "#1d4ed8" } },
    },
    sheetOrder: [sheetId],
    sheets: {
      [sheetId]: {
        id: sheetId,
        name: "Produccion",
        tabColor: "",
        hidden: BooleanNumber.FALSE,
        freeze: { xSplit: 0, ySplit: 1, startRow: 1, startColumn: 0 },
        rowCount: 120,
        columnCount: BLANK_HEADERS.length + 4,
        defaultColumnWidth: 140,
        defaultRowHeight: 28,
        mergeData: [],
        cellData: {},
        rowData: {},
        columnData: {},
        rowHeader: { width: 46 },
        columnHeader: { height: 24 },
        showGridlines: BooleanNumber.TRUE,
        rightToLeft: BooleanNumber.FALSE,
      },
    },
  };
  const mapping: ProductionWorkbookColumnMapping = { headerRow: 0, sheetId };

  BLANK_HEADERS.forEach(([field, header], column) => {
    mapping[field] = column;
    setCell(snapshot, sheetId, 0, column, header);
    snapshot.sheets[sheetId]!.cellData![0]![column]!.s = TRANSPORT_FIELDS.has(field)
      ? "transportHeader"
      : "header";
    snapshot.sheets[sheetId]!.columnData![column] = {
      ...(snapshot.sheets[sheetId]!.columnData![column] ?? {}),
      w: BLANK_COLUMN_WIDTHS[field] ?? 140,
    };
  });
  ensureInternalColumns(snapshot, mapping);

  return { snapshot, mapping };
}

export function snapshotToRows(
  snapshot: IWorkbookData,
  mapping: ProductionWorkbookColumnMapping,
) {
  const sheet = snapshot.sheets[mapping.sheetId];
  const rows: ProductionWorkbookRow[] = [];

  if (!sheet?.cellData) {
    return rows;
  }

  const maxRow = Math.max(
    mapping.headerRow,
    ...Object.keys(sheet.cellData).map((row) => Number(row)),
  );

  for (let rowIndex = mapping.headerRow + 1; rowIndex <= maxRow; rowIndex += 1) {
    const row: ProductionWorkbookRow = { rowIndex };
    let hasContent = false;

    for (const [field, column] of Object.entries(mapping)) {
      if (field === "headerRow" || field === "sheetId") {
        continue;
      }

      const value = getCellText(snapshot, mapping.sheetId, rowIndex, Number(column));
      if (value) {
        hasContent = true;
      }
      row[field as ProductionWorkbookField] = value;
    }

    if (hasContent) {
      rows.push(row);
    }
  }

  return rows;
}

export function getWorkbookPreview(
  snapshot: IWorkbookData,
  mapping: ProductionWorkbookColumnMapping,
) {
  const rows = snapshotToRows(snapshot, mapping);

  return {
    rows: rows.length,
    mappedFields: Object.keys(mapping).filter(
      (key) => key !== "headerRow" && key !== "sheetId",
    ).length,
    missingRequiredFields: [
      ...(mapping.match == null && (mapping.homeTeam == null || mapping.awayTeam == null)
        ? ["partido"]
        : []),
      ...(mapping.time == null ? ["hora"] : []),
    ],
  };
}

function normalizeStatus(value: string) {
  return MATCH_STATUS_OPTIONS.includes(value as (typeof MATCH_STATUS_OPTIONS)[number])
    ? (value as (typeof MATCH_STATUS_OPTIONS)[number])
    : "Pendiente";
}

async function getOrCreatePerson(supabase: SupabaseAny, cache: Map<string, string>, fullName: string) {
  const name = fullName.trim();
  if (!name || name === "-") {
    return null;
  }

  const cacheKey = name.toLocaleLowerCase("es");
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) ?? null;
  }

  const existing = await supabase
    .from("people")
    .select("id, full_name")
    .ilike("full_name", name)
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data?.id) {
    cache.set(cacheKey, existing.data.id);
    return existing.data.id;
  }

  const created = await supabase
    .from("people")
    .insert({ full_name: name, active: true })
    .select("id")
    .single();

  if (created.error) {
    throw created.error;
  }

  cache.set(cacheKey, created.data.id);
  return created.data.id;
}

async function getRoleIds(supabase: SupabaseAny) {
  const roleNames = Array.from(new Set(Object.values(ROLE_FIELD_TO_ROLE_NAME)));
  const result = await supabase.from("roles").select("id, name").in("name", roleNames);

  if (result.error) {
    throw result.error;
  }

  const roleIdsByName = new Map((result.data ?? []).map((role) => [role.name, role.id]));

  for (const roleName of roleNames) {
    if (!roleName || roleIdsByName.has(roleName)) {
      continue;
    }

    const created = await supabase
      .from("roles")
      .insert({ name: roleName, category: "Produccion", active: true, sort_order: 999 })
      .select("id, name")
      .single();

    if (created.error) {
      throw created.error;
    }

    roleIdsByName.set(created.data.name, created.data.id);
  }

  return roleIdsByName;
}

export async function enrichSnapshotWithExistingMatches(
  supabase: SupabaseAny,
  snapshot: IWorkbookData,
  mapping: ProductionWorkbookColumnMapping,
) {
  const rows = snapshotToRows(snapshot, mapping);
  const baseRowVersions: Record<string, string> = {};

  for (const row of rows) {
    const teams = parseMatchTeams(row);

    if (!row.date || !row.time || !teams) {
      continue;
    }

    const timezone = "America/Bogota";
    const kickoffAt = buildKickoffAt({
      date: row.date.slice(0, 10),
      time: row.time.slice(0, 5),
      timezone,
    });
    const existing = await supabase
      .from("matches")
      .select("id, updated_at")
      .eq("home_team", teams.homeTeam)
      .eq("away_team", teams.awayTeam)
      .eq("kickoff_at", kickoffAt)
      .limit(1)
      .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (existing.data?.id) {
      setCell(snapshot, mapping.sheetId, row.rowIndex, mapping.matchId!, existing.data.id);
      setCell(snapshot, mapping.sheetId, row.rowIndex, mapping.updatedAt!, existing.data.updated_at);
      baseRowVersions[existing.data.id] = existing.data.updated_at;
    }
  }

  return baseRowVersions;
}

export async function applySnapshotToGrid(params: {
  supabase: SupabaseAny;
  snapshot: IWorkbookData;
  mapping: ProductionWorkbookColumnMapping;
  baseRowVersions: Record<string, string>;
  defaultDate?: string;
}) {
  const rows = snapshotToRows(params.snapshot, params.mapping);
  const roleIdsByName = await getRoleIds(params.supabase);
  const peopleCache = new Map<string, string>();
  const conflicts: Array<{ matchId: string; rowIndex: number; currentUpdatedAt: string; baseUpdatedAt: string }> = [];
  let created = 0;
  let updated = 0;
  let assignments = 0;

  for (const row of rows) {
    const teams = parseMatchTeams(row);
    const date = row.date?.slice(0, 10) || params.defaultDate?.slice(0, 10) || "";

    if (!date || !row.time || !teams) {
      continue;
    }

    let matchId = row.matchId?.trim() || "";
    const payload = {
      competition: maybeNull(row.competition ?? ""),
      production_code: maybeNull(row.productionCode ?? ""),
      production_mode: normalizeProductionMode(row.productionMode ?? ""),
      status: normalizeStatus(row.status ?? ""),
      home_team: teams.homeTeam,
      away_team: teams.awayTeam,
      commentary_plan: maybeNull(row.commentaryPlan ?? ""),
      transport: maybeNull(row.transport ?? ""),
      kickoff_at: buildKickoffAt({
        date,
        time: row.time.slice(0, 5),
        timezone: "America/Bogota",
      }),
      duration_minutes: 150,
      timezone: "America/Bogota",
      notes: maybeNull(mergeNotesWithTransport(row)),
      owner_id: await getOrCreatePerson(params.supabase, peopleCache, row.owner ?? ""),
    };

    if (matchId) {
      const current = await params.supabase
        .from("matches")
        .select("updated_at")
        .eq("id", matchId)
        .single();

      if (current.error) {
        throw current.error;
      }

      const baseUpdatedAt = params.baseRowVersions[matchId] || row.updatedAt || "";
      if (baseUpdatedAt && current.data.updated_at !== baseUpdatedAt) {
        conflicts.push({
          matchId,
          rowIndex: row.rowIndex,
          currentUpdatedAt: current.data.updated_at,
          baseUpdatedAt,
        });
        continue;
      }

      const result = await params.supabase.from("matches").update(payload).eq("id", matchId);
      if (result.error) {
        throw result.error;
      }
      updated += 1;
    } else {
      const result = await params.supabase
        .from("matches")
        .insert(payload)
        .select("id, updated_at")
        .single();

      if (result.error) {
        throw result.error;
      }

      matchId = result.data.id;
      setCell(params.snapshot, params.mapping.sheetId, row.rowIndex, params.mapping.matchId!, matchId);
      setCell(params.snapshot, params.mapping.sheetId, row.rowIndex, params.mapping.updatedAt!, result.data.updated_at);
      params.baseRowVersions[matchId] = result.data.updated_at;
      created += 1;
    }

    const roleAssignments = [];
    for (const field of ROLE_FIELDS) {
      const roleName = ROLE_FIELD_TO_ROLE_NAME[field];
      const roleId = roleName ? roleIdsByName.get(roleName) : null;
      const personId = await getOrCreatePerson(params.supabase, peopleCache, row[field] ?? "");

      if (roleId && personId) {
        roleAssignments.push({
          match_id: matchId,
          role_id: roleId,
          person_id: personId,
          confirmed: false,
          notes: null,
        });
      }
    }

    if (roleAssignments.length) {
      const deleteResult = await params.supabase
        .from("assignments")
        .delete()
        .eq("match_id", matchId)
        .in("role_id", roleAssignments.map((assignment) => assignment.role_id));

      if (deleteResult.error) {
        throw deleteResult.error;
      }

      const upsertResult = await params.supabase
        .from("assignments")
        .upsert(roleAssignments, { onConflict: "match_id,role_id" });

      if (upsertResult.error) {
        throw upsertResult.error;
      }

      assignments += roleAssignments.length;
    }
  }

  return { created, updated, assignments, conflicts };
}

export async function snapshotToXlsxBuffer(
  snapshot: IWorkbookData,
  mapping: ProductionWorkbookColumnMapping,
) {
  const workbook = new ExcelJS.Workbook();

  for (const sheetId of snapshot.sheetOrder) {
    const sourceSheet = snapshot.sheets[sheetId];
    const worksheet = workbook.addWorksheet(sourceSheet?.name || "Hoja");
    const maxRow = Math.max(
      sourceSheet?.rowCount ?? 0,
      ...Object.keys(sourceSheet?.cellData ?? {}).map((row) => Number(row) + 1),
    );
    const maxColumn = Math.max(
      sourceSheet?.columnCount ?? 0,
      ...Object.values(sourceSheet?.cellData ?? {}).flatMap((row) =>
        Object.keys(row ?? {}).map((column) => Number(column) + 1),
      ),
    );

    for (let row = 0; row < maxRow; row += 1) {
      const values: string[] = [];
      for (let column = 0; column < maxColumn; column += 1) {
        if (
          sheetId === mapping.sheetId &&
          (column === mapping.matchId || column === mapping.updatedAt)
        ) {
          values.push("");
          continue;
        }

        values.push(getCellText(snapshot, sheetId, row, column));
      }

      if (values.some(Boolean)) {
        worksheet.addRow(values);
      }
    }
  }

  const result = await workbook.xlsx.writeBuffer();
  return Buffer.from(result);
}
