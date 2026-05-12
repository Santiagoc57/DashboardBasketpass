import { NextResponse } from "next/server";

import { requireEditor } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkbookPreview } from "@/lib/production-workbooks";
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

    if (!workbookId || !snapshot || !mapping) {
      return NextResponse.json(
        { error: "Falta workbookId, snapshot o mapping." },
        { status: 400 },
      );
    }

    if (workbookId.startsWith("local-")) {
      return NextResponse.json({
        ok: true,
        preview: getWorkbookPreview(snapshot, mapping),
        persistence: "local",
      });
    }

    const updateResult = await db
      .from("production_workbooks")
      .update({ snapshot, column_mapping: mapping, status: "draft" })
      .eq("id", workbookId);

    if (updateResult.error) {
      throw updateResult.error;
    }

    await db.from("production_workbook_revisions").insert({
      workbook_id: workbookId,
      snapshot,
      column_mapping: mapping,
      action: "draft",
    });

    return NextResponse.json({
      ok: true,
      preview: getWorkbookPreview(snapshot, mapping),
    });
  } catch (error) {
    return NextResponse.json(
      { error: ensureErrorMessage(error) },
      { status: 500 },
    );
  }
}
