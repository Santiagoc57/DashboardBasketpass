import { NextResponse } from "next/server";

import { requireEditor } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  PRODUCTION_WORKBOOK_BUCKET,
  snapshotToXlsxBuffer,
} from "@/lib/production-workbooks";
import { ensureErrorMessage } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    await requireEditor();
    const supabase = await createSupabaseServerClient();
    const db = supabase as unknown as {
      from: (table: string) => ReturnType<typeof supabase.from>;
    };
    const body = await request.json();
    const workbookId = String(body.workbookId ?? "");
    const snapshot = body.snapshot;
    const mapping = body.mapping;
    const filename = String(body.filename ?? "libro-produccion.xlsx").replace(
      /[^\w.-]+/g,
      "-",
    );

    if (!workbookId || !snapshot || !mapping) {
      return NextResponse.json(
        { error: "Falta workbookId, snapshot o mapping." },
        { status: 400 },
      );
    }

    const buffer = await snapshotToXlsxBuffer(snapshot, mapping);

    if (workbookId.startsWith("local-")) {
      return new Response(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const exportPath = `${workbookId}/exports/${Date.now()}-${filename}`;
    const uploadResult = await supabase.storage
      .from(PRODUCTION_WORKBOOK_BUCKET)
      .upload(exportPath, buffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: true,
      });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    await db
      .from("production_workbooks")
      .update({ export_storage_path: exportPath, snapshot, column_mapping: mapping })
      .eq("id", workbookId);

    await db.from("production_workbook_revisions").insert({
      workbook_id: workbookId,
      snapshot,
      column_mapping: mapping,
      action: "export",
    });

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: ensureErrorMessage(error) },
      { status: 500 },
    );
  }
}
