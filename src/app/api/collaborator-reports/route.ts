import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserContext } from "@/lib/auth";
import { technicalCaptureKindSchema } from "@/lib/ai/metric-capture";
import {
  getCollaboratorMatchData,
  isUuidLike,
} from "@/lib/data/collaborators";
import { emitOperationalAlert } from "@/lib/monitoring";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureErrorMessage } from "@/lib/utils";

const attachmentSchema = z.object({
  kind: technicalCaptureKindSchema,
  path: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  sizeBytes: z.number().int().nonnegative(),
  mimeType: z.string().trim().min(1),
  uploadedAt: z.string().trim().min(1),
});

const reportDraftSchema = z.object({
  incidentLevel: z.enum(["sin", "baja", "alta", "critica"]),
  paid: z.enum(["si", "no"]),
  feedDetected: z.enum(["si", "no"]),
  problems: z.object({
    internet: z.boolean(),
    img: z.boolean(),
    ocr: z.boolean(),
    overlays: z.boolean(),
    grafica: z.boolean(),
  }),
  signalLabel: z.enum(["BP", "BP / IMG"]),
  aptoLineal: z.enum(["si", "no"]),
  testTime: z.string(),
  testCheck: z.enum(["si", "no"]),
  startCheck: z.enum(["si", "no"]),
  graphicsCheck: z.enum(["si", "no"]),
  speedtestValue: z.string(),
  pingValue: z.string(),
  gpuValue: z.string(),
  technicalObservations: z.string(),
  buildingObservations: z.string(),
  generalObservations: z.string(),
  otherObservation: z.string(),
  stObservation: z.string(),
  clubObservation: z.string(),
  speedtestAttachment: attachmentSchema.nullable(),
  pingAttachment: attachmentSchema.nullable(),
  gpuAttachment: attachmentSchema.nullable(),
  updatedAt: z.string().optional(),
});

const requestSchema = z.object({
  assignmentId: z.string().trim().min(1),
  matchId: z.string().trim().min(1),
  draft: reportDraftSchema,
});

function hasEnabledProblems(
  value: z.infer<typeof reportDraftSchema>["problems"],
) {
  return Object.values(value).some(Boolean);
}

async function reportCollaboratorReportsFailure(
  error: unknown,
  action: string,
  severity: "warning" | "critical" = "critical",
  details: Record<string, unknown> = {},
) {
  await emitOperationalAlert({
    area: "collaborator-reports",
    severity,
    message: "Falló una operación de reportes de colaborador.",
    error: ensureErrorMessage(error),
    details: { action, ...details },
  });
}

export async function POST(request: Request) {
  let payload: unknown;
  let userId: string | null = null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "No pudimos leer el reporte enviado." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "El formato del reporte no es válido." },
      { status: 400 },
    );
  }

  const { assignmentId, matchId, draft } = parsed.data;

  if (!isUuidLike(assignmentId) || !isUuidLike(matchId)) {
    return NextResponse.json(
      { error: "El envío real requiere una asignación y un partido válidos." },
      { status: 400 },
    );
  }

  try {
    const user = await getUserContext();
    userId = user.userId;

    if (!user.userId) {
      return NextResponse.json(
        { error: "Inicia sesión para enviar el reporte." },
        { status: 401 },
      );
    }
    const reporterProfileId = user.userId;

    const access = await getCollaboratorMatchData({
      email: user.email,
      profileName: user.profile?.full_name ?? null,
      matchId,
    });

    if (
      access.trialAccess ||
      !access.assignmentsForMatch.some(
        (assignment) => assignment.assignmentId === assignmentId,
      )
    ) {
      return NextResponse.json(
        { error: "No tienes acceso a este partido para enviar el reporte." },
        { status: 403 },
      );
    }

    const supabase = await createSupabaseServerClient();

    const reportResult = await supabase
      .from("collaborator_reports")
      .upsert(
        {
          assignment_id: assignmentId,
          match_id: matchId,
          reporter_profile_id: reporterProfileId,
          incident_level: draft.incidentLevel,
          paid: draft.paid === "si",
          feed_detected: draft.feedDetected === "si",
          signal_label: draft.signalLabel,
          apto_lineal: draft.aptoLineal === "si",
          test_time: draft.testTime.trim() || null,
          test_check: draft.testCheck === "si",
          start_check: draft.startCheck === "si",
          graphics_check: draft.graphicsCheck === "si",
          speedtest_value: draft.speedtestValue.trim() || null,
          ping_value: draft.pingValue.trim() || null,
          gpu_value: draft.gpuValue.trim() || null,
          technical_observations: draft.technicalObservations.trim() || null,
          building_observations: draft.buildingObservations.trim() || null,
          general_observations: draft.generalObservations.trim() || null,
          other_flag: Boolean(draft.otherObservation.trim()),
          st_flag: Boolean(draft.stObservation.trim()),
          club_flag: Boolean(draft.clubObservation.trim()),
          other_observation: draft.otherObservation.trim() || null,
          st_observation: draft.stObservation.trim() || null,
          club_observation: draft.clubObservation.trim() || null,
          problems: {
            ...draft.problems,
            hasAny: hasEnabledProblems(draft.problems),
          },
          attachments: {
            speedtest: draft.speedtestAttachment,
            ping: draft.pingAttachment,
            gpu: draft.gpuAttachment,
          },
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "assignment_id" },
      )
      .select("id")
      .single();

    if (reportResult.error) {
      if (reportResult.error.code === "42P01") {
        await reportCollaboratorReportsFailure(
          reportResult.error,
          "save-report",
          "warning",
          { reason: "missing-collaborator-reports-table" },
        );
        return NextResponse.json(
          {
            error:
              "Falta aplicar la migración de reportes de colaborador antes de enviar.",
          },
          { status: 503 },
        );
      }

      throw reportResult.error;
    }

    const assignmentResult = await supabase.rpc(
      "confirm_collaborator_assignment",
      {
        target_assignment_id: assignmentId,
      },
    );

    if (assignmentResult.error) {
      throw assignmentResult.error;
    }

    revalidatePath("/mi-jornada");
    revalidatePath(`/mi-jornada/${matchId}/reportar`);
    revalidatePath("/grid");
    revalidatePath(`/match/${matchId}`);
    revalidatePath("/reports");
    revalidatePath("/incidents");

    return NextResponse.json({
      ok: true,
      reportId: reportResult.data.id,
      message: "Reporte enviado. Marcamos este partido como reportado.",
    });
  } catch (error) {
    await reportCollaboratorReportsFailure(error, "save-report", "critical", {
      assignmentId,
      matchId,
      userId,
    });
    return NextResponse.json(
      { error: ensureErrorMessage(error) },
      { status: 500 },
    );
  }
}

const reportPatchSchema = z.object({
  reportId: z.string().trim().min(1),
  paid: z.boolean().optional(),
  feedDetected: z.boolean().optional(),
  severity: z.enum(["Sin incidencia", "Baja", "Media", "Alta", "Crítica"]).optional(),
  technicalObservations: z.string().optional(),
  buildingObservations: z.string().optional(),
  generalObservations: z.string().optional(),
  responsibleName: z.string().optional(),
  operatorControlName: z.string().optional(),
  streamerName: z.string().optional(),
  transmissionType: z.string().optional(),
  other: z.boolean().optional(),
  st: z.boolean().optional(),
  club: z.boolean().optional(),
  speedtestValue: z.string().optional(),
  pingValue: z.string().optional(),
  gpuValue: z.string().optional(),
  internetProblem: z.boolean().optional(),
  feedProblem: z.boolean().optional(),
  graphicsProblem: z.boolean().optional(),
  ocr: z.boolean().optional(),
  overlays: z.boolean().optional(),
  signalDelivery: z.string().optional(),
  aptoLineal: z.boolean().optional(),
  testTime: z.string().optional(),
  testCheck: z.boolean().optional(),
  startCheck: z.boolean().optional(),
  graphicsCheck: z.boolean().optional(),
});

function mapSeverityToIncidentLevel(
  severity: z.infer<typeof reportPatchSchema>["severity"],
) {
  switch (severity) {
    case "Crítica":
      return "critica";
    case "Alta":
      return "alta";
    case "Media":
    case "Baja":
      return "baja";
    case "Sin incidencia":
      return "sin";
    default:
      return undefined;
  }
}

export async function PATCH(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "No pudimos leer el cambio enviado." },
      { status: 400 },
    );
  }

  const parsed = reportPatchSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "El formato del cambio no es válido." },
      { status: 400 },
    );
  }

  try {
    const user = await getUserContext();

    if (!user.canEdit) {
      return NextResponse.json(
        { error: "No tienes permisos para editar reportes." },
        { status: 403 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const updatePayload: Record<string, unknown> = {};
    const severity = mapSeverityToIncidentLevel(parsed.data.severity);

    if (typeof parsed.data.paid === "boolean") {
      updatePayload.paid = parsed.data.paid;
    }

    if (typeof parsed.data.feedDetected === "boolean") {
      updatePayload.feed_detected = parsed.data.feedDetected;
    }

    if (severity) {
      updatePayload.incident_level = severity;
    }

    if (typeof parsed.data.technicalObservations === "string") {
      updatePayload.technical_observations =
        parsed.data.technicalObservations.trim() || null;
    }

    if (typeof parsed.data.buildingObservations === "string") {
      updatePayload.building_observations =
        parsed.data.buildingObservations.trim() || null;
    }

    if (typeof parsed.data.generalObservations === "string") {
      updatePayload.general_observations =
        parsed.data.generalObservations.trim() || null;
    }

    if (typeof parsed.data.other === "boolean") {
      updatePayload.other_flag = parsed.data.other;
    }

    if (typeof parsed.data.st === "boolean") {
      updatePayload.st_flag = parsed.data.st;
    }

    if (typeof parsed.data.club === "boolean") {
      updatePayload.club_flag = parsed.data.club;
    }

    if (typeof parsed.data.speedtestValue === "string") {
      updatePayload.speedtest_value = parsed.data.speedtestValue.trim() || null;
    }

    if (typeof parsed.data.pingValue === "string") {
      updatePayload.ping_value = parsed.data.pingValue.trim() || null;
    }

    if (typeof parsed.data.gpuValue === "string") {
      updatePayload.gpu_value = parsed.data.gpuValue.trim() || null;
    }

    if (typeof parsed.data.signalDelivery === "string") {
      updatePayload.signal_label = parsed.data.signalDelivery.trim() || "BP";
    }

    let reportContext: { match_id: string; assignment_id: string } | null = null;
    const needsMatchContext =
      typeof parsed.data.responsibleName === "string" ||
      typeof parsed.data.transmissionType === "string" ||
      typeof parsed.data.operatorControlName === "string" ||
      typeof parsed.data.streamerName === "string";

    if (needsMatchContext) {
      const reportContextResult = await supabase
        .from("collaborator_reports")
        .select("match_id, assignment_id")
        .eq("id", parsed.data.reportId)
        .single();

      if (reportContextResult.error) {
        throw reportContextResult.error;
      }

      reportContext = reportContextResult.data;
    }

    if (typeof parsed.data.responsibleName === "string" && reportContext) {
      const normalizedResponsibleName = parsed.data.responsibleName.trim();
      const personResult = normalizedResponsibleName
        ? await supabase
            .from("people")
            .select("id")
            .eq("full_name", normalizedResponsibleName)
            .maybeSingle()
        : { data: null, error: null };

      if (personResult.error) {
        throw personResult.error;
      }

      const responsibleResult = await supabase
        .from("assignments")
        .update({
          person_id: personResult.data?.id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportContext.assignment_id)
        .select("id")
        .single();

      if (responsibleResult.error) {
        throw responsibleResult.error;
      }
    }

    if (typeof parsed.data.transmissionType === "string" && reportContext) {
      const matchResult = await supabase
        .from("matches")
        .update({
          production_mode: parsed.data.transmissionType.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportContext.match_id)
        .select("id")
        .single();

      if (matchResult.error) {
        throw matchResult.error;
      }
    }

    const assignmentUpdates = [
      {
        roleName: "Operador de Control",
        personName: parsed.data.operatorControlName,
      },
      {
        roleName: "Encoder",
        personName: parsed.data.streamerName,
      },
    ].filter(
      (item): item is { roleName: string; personName: string } =>
        typeof item.personName === "string",
    );

    for (const assignmentUpdate of assignmentUpdates) {
      if (!reportContext) {
        continue;
      }

      const normalizedPersonName = assignmentUpdate.personName.trim();
      const roleResult = await supabase
        .from("roles")
        .select("id")
        .eq("name", assignmentUpdate.roleName)
        .single();

      if (roleResult.error) {
        throw roleResult.error;
      }

      const personResult = normalizedPersonName
        ? await supabase
            .from("people")
            .select("id")
            .eq("full_name", normalizedPersonName)
            .maybeSingle()
        : { data: null, error: null };

      if (personResult.error) {
        throw personResult.error;
      }

      const assignmentResult = await supabase.from("assignments").upsert(
        {
          match_id: reportContext.match_id,
          role_id: roleResult.data.id,
          person_id: personResult.data?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_id,role_id" },
      );

      if (assignmentResult.error) {
        throw assignmentResult.error;
      }
    }

    const problemUpdates = {
      internet: parsed.data.internetProblem,
      img: parsed.data.feedProblem,
      grafica: parsed.data.graphicsProblem,
      ocr: parsed.data.ocr,
      overlays: parsed.data.overlays,
    };
    const hasProblemUpdates = Object.values(problemUpdates).some(
      (value) => typeof value === "boolean",
    );

    if (hasProblemUpdates) {
      const reportResult = await supabase
        .from("collaborator_reports")
        .select("problems")
        .eq("id", parsed.data.reportId)
        .maybeSingle();

      if (reportResult.error) {
        throw reportResult.error;
      }

      const currentProblems =
        reportResult.data?.problems &&
        typeof reportResult.data.problems === "object" &&
        !Array.isArray(reportResult.data.problems)
          ? reportResult.data.problems
          : {};

      updatePayload.problems = {
        ...currentProblems,
        ...Object.fromEntries(
          Object.entries(problemUpdates).filter(
            (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
          ),
        ),
      };
      updatePayload.problems = {
        ...(updatePayload.problems as Record<string, unknown>),
        hasAny: Object.entries(updatePayload.problems as Record<string, unknown>).some(
          ([key, value]) => key !== "hasAny" && value === true,
        ),
      };
    }

    if (typeof parsed.data.aptoLineal === "boolean") {
      updatePayload.apto_lineal = parsed.data.aptoLineal;
    }

    if (typeof parsed.data.testTime === "string") {
      updatePayload.test_time = parsed.data.testTime.trim() || null;
    }

    if (typeof parsed.data.testCheck === "boolean") {
      updatePayload.test_check = parsed.data.testCheck;
    }

    if (typeof parsed.data.startCheck === "boolean") {
      updatePayload.start_check = parsed.data.startCheck;
    }

    if (typeof parsed.data.graphicsCheck === "boolean") {
      updatePayload.graphics_check = parsed.data.graphicsCheck;
    }

    if (!Object.keys(updatePayload).length) {
      return NextResponse.json({ ok: true });
    }

    const result = await supabase
      .from("collaborator_reports")
      .update(updatePayload)
      .eq("id", parsed.data.reportId)
      .select("id")
      .single();

    if (result.error) {
      throw result.error;
    }

    revalidatePath("/reports");
    revalidatePath("/incidents");
    revalidatePath("/grid");

    return NextResponse.json({ ok: true, reportId: result.data.id });
  } catch (error) {
    await reportCollaboratorReportsFailure(error, "patch-report");
    return NextResponse.json(
      { error: ensureErrorMessage(error) },
      { status: 500 },
    );
  }
}
