import { NextResponse } from "next/server";

import { requireEditor } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  enrichSnapshotWithExistingMatches,
  getWorkbookPreview,
  parseXlsxToSnapshot,
  PRODUCTION_WORKBOOK_BUCKET,
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
    const formData = await request.formData();
    const file = formData.get("file");
    const periodLabel = String(formData.get("periodLabel") ?? "Periodo visible");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Sube un archivo .xlsx." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const { snapshot, mapping } = await parseXlsxToSnapshot(buffer, file.name);
    const baseRowVersions = await enrichSnapshotWithExistingMatches(
      supabase,
      snapshot,
      mapping,
    );
    const storagePath = `${crypto.randomUUID()}/${file.name}`;
    const uploadResult = await supabase.storage
      .from(PRODUCTION_WORKBOOK_BUCKET)
      .upload(storagePath, file, { upsert: false });

    if (uploadResult.error) {
      return NextResponse.json({
        workbookId: localWorkbookId(),
        snapshot,
        mapping,
        preview: getWorkbookPreview(snapshot, mapping),
        baseRowVersions,
        persistence: "local",
        warning:
          "La tabla o el bucket de libros no están disponibles; el libro se abrió en modo local.",
      });
    }

    const insertResult = await db
      .from("production_workbooks")
      .insert({
        period_label: periodLabel,
        original_filename: file.name,
        original_storage_path: storagePath,
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
        snapshot,
        mapping,
        preview: getWorkbookPreview(snapshot, mapping),
        baseRowVersions,
        persistence: "local",
        warning:
          "La tabla production_workbooks no está disponible; el libro se abrió en modo local.",
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
      baseRowVersions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: ensureErrorMessage(error) },
      { status: 500 },
    );
  }
}
