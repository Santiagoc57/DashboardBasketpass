import { NextResponse } from "next/server";

import { requireEditor } from "@/lib/auth";
import {
  appendTravelSheetToSnapshot,
  enrichSnapshotWithExistingMatches,
  getWorkbookPreview,
  parseCsvToSnapshot,
} from "@/lib/production-workbooks";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureErrorMessage } from "@/lib/utils";

const DEFAULT_SHEET_ID =
  process.env.GOOGLE_PRODUCTION_SHEET_ID ?? "1brPnW66u2vnFRpeHHyMhYyh-8Me74C1afcIle8EPiV4";
const DEFAULT_SHEET_NAME = process.env.GOOGLE_PRODUCTION_SHEET_NAME ?? "PRODUCCION";
const DEFAULT_TRAVEL_SHEET_ID =
  process.env.GOOGLE_TRAVEL_SHEET_ID ?? "1GI4B3GhszrS33lDANAR5pNRnU3eag6kBr1qjF2-vRxE";
const DEFAULT_TRAVEL_SHEET_NAME = process.env.GOOGLE_TRAVEL_SHEET_NAME ?? "";
const DEFAULT_TRAVEL_WORKBOOK_TAB_NAME = process.env.GOOGLE_TRAVEL_WORKBOOK_TAB_NAME ?? "VIAJES";

function localWorkbookId() {
  return `local-${crypto.randomUUID()}`;
}

function buildCsvUrl(sheetId: string, sheetName?: string) {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
  url.searchParams.set("tqx", "out:csv");

  if (sheetName) {
    url.searchParams.set("sheet", sheetName);
  }

  return url.toString();
}

function assertGoogleSheetId(sheetId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(sheetId)) {
    throw new Error("El ID de Google Sheets no es válido.");
  }
}

export async function POST(request: Request) {
  try {
    await requireEditor();
    const supabase = await createSupabaseServerClient();
    const db = supabase as unknown as {
      from: (table: string) => ReturnType<typeof supabase.from>;
    };
    const body = await request.json().catch(() => ({}));
    const periodLabel = String(body.periodLabel ?? "Periodo visible");
    const sheetId = String(body.sheetId ?? DEFAULT_SHEET_ID).trim();
    const sheetName = String(body.sheetName ?? DEFAULT_SHEET_NAME).trim();
    const travelSheetId = String(body.travelSheetId ?? DEFAULT_TRAVEL_SHEET_ID).trim();
    const travelSheetName = String(body.travelSheetName ?? DEFAULT_TRAVEL_SHEET_NAME).trim();
    const travelWorkbookTabName = String(
      body.travelWorkbookTabName ?? DEFAULT_TRAVEL_WORKBOOK_TAB_NAME,
    ).trim() || "VIAJES";

    assertGoogleSheetId(sheetId);
    if (travelSheetId) {
      assertGoogleSheetId(travelSheetId);
    }

    if (!sheetName) {
      return NextResponse.json(
        { error: "Indica la pestaña de Google Sheets que quieres importar." },
        { status: 400 },
      );
    }

    const response = await fetch(buildCsvUrl(sheetId, sheetName), {
      cache: "no-store",
    });
    const contentType = response.headers.get("content-type") ?? "";
    const csvText = await response.text();

    if (!response.ok || contentType.includes("text/html") || /^\s*</.test(csvText)) {
      return NextResponse.json(
        {
          error:
            "No pude leer esa hoja de Google Sheets. Comparte el archivo como 'cualquiera con el enlace puede ver' o configuramos una integración privada con Google.",
        },
        { status: 400 },
      );
    }

    const filename = `${sheetName}.csv`;
    const { snapshot, mapping } = parseCsvToSnapshot(csvText, filename, sheetName);
    let travelWarning = "";

    if (travelSheetId) {
      const travelResponse = await fetch(buildCsvUrl(travelSheetId, travelSheetName || undefined), {
        cache: "no-store",
      });
      const travelContentType = travelResponse.headers.get("content-type") ?? "";
      const travelCsvText = await travelResponse.text();

      if (
        travelResponse.ok &&
        !travelContentType.includes("text/html") &&
        !/^\s*</.test(travelCsvText)
      ) {
        appendTravelSheetToSnapshot(snapshot, travelCsvText, travelWorkbookTabName);
      } else {
        appendTravelSheetToSnapshot(snapshot, "", travelWorkbookTabName);
        travelWarning =
          " No pude leer la hoja de viajes; agregué la pestaña VIAJES en blanco.";
      }
    }

    const baseRowVersions = await enrichSnapshotWithExistingMatches(
      supabase,
      snapshot,
      mapping,
    );

    const insertResult = await db
      .from("production_workbooks")
      .insert({
        period_label: periodLabel,
        original_filename: filename,
        status: "draft",
        snapshot,
        column_mapping: mapping,
        base_row_versions: baseRowVersions,
      })
      .select("id")
      .single();

    if (insertResult.error) {
      return NextResponse.json({
        workbookId: localWorkbookId(),
        filename,
        snapshot,
        mapping,
        preview: getWorkbookPreview(snapshot, mapping),
        baseRowVersions,
        persistence: "local",
        warning:
          `La hoja de Google se abrió correctamente. El borrador no quedará guardado automáticamente; usa Aplicar a grilla cuando esté listo.${travelWarning}`,
      });
    }

    await db.from("production_workbook_revisions").insert({
      workbook_id: insertResult.data.id,
      snapshot,
      column_mapping: mapping,
      action: "upload",
    });

    return NextResponse.json({
      workbookId: insertResult.data.id,
      filename,
      snapshot,
      mapping,
      preview: getWorkbookPreview(snapshot, mapping),
      baseRowVersions,
      warning: travelWarning || undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: ensureErrorMessage(error) },
      { status: 500 },
    );
  }
}
