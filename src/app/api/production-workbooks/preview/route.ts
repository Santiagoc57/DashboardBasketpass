import { NextResponse } from "next/server";

import { requireEditor } from "@/lib/auth";
import {
  getProductionWorkbookApplyPreview,
  getWorkbookPreview,
  snapshotToRows,
} from "@/lib/production-workbooks";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureErrorMessage } from "@/lib/utils";

type VisibleMatch = {
  id: string;
  label: string;
};

export async function POST(request: Request) {
  try {
    await requireEditor();
    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const snapshot = body.snapshot;
    const mapping = body.mapping;
    const defaultDate = typeof body.defaultDate === "string" ? body.defaultDate : "";
    const baseRowVersions =
      (body.baseRowVersions as Record<string, string> | undefined) ?? {};
    const visibleMatches = Array.isArray(body.visibleMatches)
      ? (body.visibleMatches as VisibleMatch[]).filter((match) => match.id && match.label)
      : [];

    if (!snapshot || !mapping) {
      return NextResponse.json(
        { error: "Falta snapshot o mapping para revisar la planilla." },
        { status: 400 },
      );
    }

    const applyPreview = getProductionWorkbookApplyPreview({
      snapshot,
      mapping,
      defaultDate,
    });
    const rows = snapshotToRows(snapshot, mapping);
    const sheetMatchIds = Array.from(
      new Set(
        rows
          .map((row) => row.matchId?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const existingMatches = sheetMatchIds.length
      ? await supabase
          .from("matches")
          .select("id, updated_at, home_team, away_team")
          .in("id", sheetMatchIds)
      : { data: [], error: null };

    if (existingMatches.error) {
      throw existingMatches.error;
    }

    const existingById = new Map(
      (existingMatches.data ?? []).map((match) => [match.id, match]),
    );
    const notFoundRows = rows
      .filter((row) => row.matchId?.trim() && !existingById.has(row.matchId.trim()))
      .map((row) => ({
        rowIndex: row.rowIndex + 1,
        matchId: row.matchId!.trim(),
        reason: "El partido ya no existe en Supabase.",
      }));
    const conflictRows = rows
      .filter((row) => {
        const matchId = row.matchId?.trim();
        if (!matchId) {
          return false;
        }

        const existing = existingById.get(matchId);
        const baseUpdatedAt = baseRowVersions[matchId] || row.updatedAt || "";

        return Boolean(existing && baseUpdatedAt && existing.updated_at !== baseUpdatedAt);
      })
      .map((row) => {
        const matchId = row.matchId!.trim();
        const existing = existingById.get(matchId)!;

        return {
          rowIndex: row.rowIndex + 1,
          matchId,
          label: `${existing.home_team} vs ${existing.away_team}`,
          reason: "Fue modificado en el dashboard después de cargar la hoja.",
        };
      });
    const sheetMatchIdSet = new Set(sheetMatchIds);
    const missingInSheet = visibleMatches
      .filter((match) => !sheetMatchIdSet.has(match.id))
      .map((match) => ({
        matchId: match.id,
        label: match.label,
        reason: "Existe en Supabase, pero no viene en la hoja sincronizada.",
      }));

    return NextResponse.json({
      ok: true,
      snapshot,
      preview: getWorkbookPreview(snapshot, mapping),
      applyPreview: {
        ...applyPreview,
        conflictRows,
        notFoundRows,
        missingInSheet,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: ensureErrorMessage(error) },
      { status: 500 },
    );
  }
}
