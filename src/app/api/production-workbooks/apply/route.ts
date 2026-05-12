import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireEditor } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applySnapshotToGrid, getWorkbookPreview } from "@/lib/production-workbooks";
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
    const defaultDate = typeof body.defaultDate === "string" ? body.defaultDate : "";
    let baseRowVersions =
      (body.baseRowVersions as Record<string, string> | undefined) ?? {};

    if (!workbookId || !snapshot || !mapping) {
      return NextResponse.json(
        { error: "Falta workbookId, snapshot o mapping." },
        { status: 400 },
      );
    }

    if (!workbookId.startsWith("local-")) {
      const workbookResult = await db
        .from("production_workbooks")
        .select("base_row_versions")
        .eq("id", workbookId)
        .single();

      if (!workbookResult.error) {
        baseRowVersions =
          (workbookResult.data.base_row_versions as Record<string, string>) ?? {};
      }
    }

    const result = await applySnapshotToGrid({
      supabase,
      snapshot,
      mapping,
      baseRowVersions,
      defaultDate,
    });

    if (result.conflicts.length) {
      return NextResponse.json(
        {
          error: "Hay conflictos con partidos modificados fuera del libro.",
          conflicts: result.conflicts,
        },
        { status: 409 },
      );
    }

    if (!workbookId.startsWith("local-")) {
      const updateResult = await db
        .from("production_workbooks")
        .update({
          snapshot,
          column_mapping: mapping,
          base_row_versions: baseRowVersions,
          status: "applied",
        })
        .eq("id", workbookId);

      if (updateResult.error) {
        throw updateResult.error;
      }

      await db.from("production_workbook_revisions").insert({
        workbook_id: workbookId,
        snapshot,
        column_mapping: mapping,
        action: "apply",
      });
    }

    revalidatePath("/grid");

    return NextResponse.json({
      ok: true,
      result,
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
