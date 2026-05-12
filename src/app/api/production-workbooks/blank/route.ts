import { NextResponse } from "next/server";

import { requireEditor } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createBlankProductionWorkbookSnapshot,
  getWorkbookPreview,
} from "@/lib/production-workbooks";
import { ensureErrorMessage } from "@/lib/utils";

function localWorkbookId() {
  return `local-${crypto.randomUUID()}`;
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
    const filename = String(body.filename ?? "planilla-en-blanco.xlsx");
    const { snapshot, mapping } = createBlankProductionWorkbookSnapshot(filename);

    const insertResult = await db
      .from("production_workbooks")
      .insert({
        period_label: periodLabel,
        original_filename: filename,
        status: "draft",
        snapshot,
        column_mapping: mapping,
        base_row_versions: {},
      })
      .select("id")
      .single();

    if (insertResult.error) {
      return NextResponse.json({
        workbookId: localWorkbookId(),
        snapshot,
        mapping,
        preview: getWorkbookPreview(snapshot, mapping),
        baseRowVersions: {},
        persistence: "local",
        warning:
          "La tabla production_workbooks no está disponible; la planilla se abrió en modo local.",
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
      snapshot,
      mapping,
      preview: getWorkbookPreview(snapshot, mapping),
      baseRowVersions: {},
    });
  } catch (error) {
    return NextResponse.json(
      { error: ensureErrorMessage(error) },
      { status: 500 },
    );
  }
}
