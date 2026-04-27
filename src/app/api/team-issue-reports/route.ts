import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserContext } from "@/lib/auth";
import { isMissingTeamIssueReportsTableError } from "@/lib/data/team-issue-reports";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emitOperationalAlert } from "@/lib/monitoring";
import { ensureErrorMessage } from "@/lib/utils";

const requestSchema = z.object({
  team: z.object({
    id: z.string().trim().min(1),
    official_name: z.string().trim().min(1),
    display_name: z.string().trim().min(1),
    competition: z.string().trim().min(1),
  }),
  reason: z.string().trim().min(1),
  detail: z.string().trim().min(1),
});

function getTeamIssueSeverity(reason: string) {
  if (
    reason === "Club ya no existe" ||
    reason === "Club cambió de liga" ||
    reason === "Club duplicado"
  ) {
    return "critical" as const;
  }

  return "warning" as const;
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "No pudimos leer el reporte de equipo." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "El reporte de equipo no es válido." },
      { status: 400 },
    );
  }

  try {
    const user = await getUserContext();

    if (!user.userId) {
      return NextResponse.json(
        { ok: false, error: "Inicia sesión para enviar el reporte." },
        { status: 401 },
      );
    }

    const severity = getTeamIssueSeverity(parsed.data.reason);
    const reporterName =
      user.profile?.full_name?.trim() ||
      user.email ||
      "usuario no identificado";
    const supabase = await createSupabaseServerClient();
    const insertResult = await supabase
      .from("team_issue_reports")
      .insert({
        team_id: parsed.data.team.id,
        team_official_name: parsed.data.team.official_name,
        team_display_name: parsed.data.team.display_name,
        competition: parsed.data.team.competition,
        reason: parsed.data.reason,
        detail: parsed.data.detail,
        status: "new",
        reporter_profile_id: user.userId,
        reporter_name: reporterName,
        reporter_email: user.email,
      })
      .select("id")
      .single();

    if (insertResult.error) {
      if (isMissingTeamIssueReportsTableError(insertResult.error)) {
        await emitOperationalAlert({
          area: "teams",
          severity: "warning",
          message: "Falta aplicar la migración de reportes de equipos.",
          details: {
            teamId: parsed.data.team.id,
            reason: parsed.data.reason,
            detail: parsed.data.detail,
            reporterName,
            reporterEmail: user.email,
          },
          error: insertResult.error.message,
        });

        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta aplicar la migración 0013_add_team_issue_reports.sql para guardar los reportes de equipos en el panel del admin.",
          },
          { status: 503 },
        );
      }

      throw insertResult.error;
    }

    await emitOperationalAlert({
      area: "teams",
      severity,
      message: "Nuevo reporte de equipo desde la pantalla de Teams.",
      details: {
        reportId: insertResult.data.id,
        teamId: parsed.data.team.id,
        teamOfficialName: parsed.data.team.official_name,
        teamDisplayName: parsed.data.team.display_name,
        competition: parsed.data.team.competition,
        reason: parsed.data.reason,
        detail: parsed.data.detail,
        reporterName,
        reporterEmail: user.email,
      },
    });

    return NextResponse.json({ ok: true, reportId: insertResult.data.id });
  } catch (error) {
    if (isMissingTeamIssueReportsTableError(error)) {
      await emitOperationalAlert({
        area: "teams",
        severity: "warning",
        message: "Falta aplicar la migración de reportes de equipos.",
        error: ensureErrorMessage(error),
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta aplicar la migración 0013_add_team_issue_reports.sql para guardar los reportes de equipos en el panel del admin.",
        },
        { status: 503 },
      );
    }

    await emitOperationalAlert({
      area: "teams",
      severity: "critical",
      message: "Falló el guardado de un reporte de equipo.",
      error: ensureErrorMessage(error),
    });
    return NextResponse.json(
      {
        ok: false,
        error: ensureErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
