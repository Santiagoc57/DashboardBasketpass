import { NextResponse } from "next/server";
import { CellValueType, type IWorkbookData } from "@univerjs/core";

import { requireEditor } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkbookPreview, snapshotToRows } from "@/lib/production-workbooks";
import { ensureErrorMessage } from "@/lib/utils";

function setCell(snapshot: IWorkbookData, sheetId: string, row: number, column: number, value: string) {
  snapshot.sheets[sheetId].cellData ??= {};
  snapshot.sheets[sheetId].cellData[row] ??= {};
  snapshot.sheets[sheetId].cellData[row][column] = { v: value, t: CellValueType.STRING };
}

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
        snapshot,
        baseRowVersions: body.baseRowVersions ?? {},
        preview: getWorkbookPreview(snapshot, mapping),
        persistence: "local",
      });
    }

    const rows = snapshotToRows(snapshot, mapping);
    const matchIds = rows
      .map((row) => row.matchId)
      .filter((matchId): matchId is string => Boolean(matchId));

    if (!matchIds.length) {
      return NextResponse.json({ ok: true, snapshot, preview: getWorkbookPreview(snapshot, mapping) });
    }

    const matchesResult = await supabase
      .from("matches")
      .select("id, competition, production_mode, status, home_team, away_team, commentary_plan, transport, notes, updated_at")
      .in("id", matchIds);

    if (matchesResult.error) {
      throw matchesResult.error;
    }

    const matchesById = new Map((matchesResult.data ?? []).map((match) => [match.id, match]));
    const baseRowVersions: Record<string, string> = {};

    for (const row of rows) {
      const match = row.matchId ? matchesById.get(row.matchId) : null;
      if (!match) {
        continue;
      }

      const values: Record<string, string> = {
        competition: match.competition ?? "",
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        productionMode: match.production_mode ?? "",
        status: match.status,
        commentaryPlan: match.commentary_plan ?? "",
        transport: match.transport ?? "",
        notes: match.notes ?? "",
        updatedAt: match.updated_at,
      };

      for (const [field, value] of Object.entries(values)) {
        const column = mapping[field];
        if (column != null) {
          setCell(snapshot, mapping.sheetId, row.rowIndex, column, value);
        }
      }

      baseRowVersions[match.id] = match.updated_at;
    }

    await db
      .from("production_workbooks")
      .update({ snapshot, column_mapping: mapping, base_row_versions: baseRowVersions })
      .eq("id", workbookId);

    await db.from("production_workbook_revisions").insert({
      workbook_id: workbookId,
      snapshot,
      column_mapping: mapping,
      action: "refresh",
    });

    return NextResponse.json({
      ok: true,
      snapshot,
      baseRowVersions,
      preview: getWorkbookPreview(snapshot, mapping),
    });
  } catch (error) {
    return NextResponse.json(
      { error: ensureErrorMessage(error) },
      { status: 500 },
    );
  }
}
