import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserContext } from "@/lib/auth";
import { hasFullDashboardAccessRole } from "@/lib/constants";
import { extractMetricFromCapture, technicalCaptureKindSchema } from "@/lib/ai/metric-capture";
import {
  buildCollaboratorReportAttachmentPath,
  REPORT_EVIDENCE_BUCKET,
  type CollaboratorReportAttachment,
} from "@/lib/collaborator-report-attachments";
import { getCollaboratorMatchData, isUuidLike } from "@/lib/data/collaborators";
import { emitOperationalAlert } from "@/lib/monitoring";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureErrorMessage } from "@/lib/utils";

const reportIdSchema = z.string().trim().min(1).optional();

function isStorageBucketMissing(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeMessage =
    "message" in error && typeof error.message === "string" ? error.message : "";

  return maybeMessage.includes("Bucket not found");
}

async function reportAttachmentFailure(
  error: unknown,
  action: string,
  severity: "warning" | "critical" = "critical",
  details: Record<string, unknown> = {},
) {
  await emitOperationalAlert({
    area: "attachments",
    severity,
    message: "Falló una operación de evidencias adjuntas.",
    error: ensureErrorMessage(error),
    details: { action, ...details },
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");
  const kindResult = technicalCaptureKindSchema.safeParse(formData.get("kind"));
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const matchId = String(formData.get("matchId") ?? "").trim();
  const reportIdResult = reportIdSchema.safeParse(formData.get("reportId") ?? undefined);

  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "Adjunta una captura válida." },
      { status: 400 },
    );
  }

  if (!kindResult.success) {
    return NextResponse.json(
      { error: "El tipo de lectura no es válido." },
      { status: 400 },
    );
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "La captura adjunta debe ser una imagen." },
      { status: 400 },
    );
  }

  if (!isUuidLike(assignmentId) || !isUuidLike(matchId)) {
    return NextResponse.json(
      { error: "El envío real requiere una asignación y un partido válidos." },
      { status: 400 },
    );
  }

  if (!reportIdResult.success) {
    return NextResponse.json(
      { error: "El reporte indicado no es válido." },
      { status: 400 },
    );
  }

  try {
    const user = await getUserContext();

    if (!user.userId) {
      return NextResponse.json(
        { error: "Inicia sesión para subir evidencias." },
        { status: 401 },
      );
    }

    if (!hasFullDashboardAccessRole(user.role)) {
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
          { error: "No tienes acceso a este partido para subir evidencias." },
          { status: 403 },
        );
      }
    }

    const supabase = await createSupabaseServerClient();
    const mimeType = image.type || "image/jpeg";
    const path = buildCollaboratorReportAttachmentPath({
      matchId,
      assignmentId,
      kind: kindResult.data,
      mimeType,
    });
    const uploadedAt = new Date().toISOString();
    const attachment: CollaboratorReportAttachment = {
      kind: kindResult.data,
      path,
      fileName: image.name,
      sizeBytes: image.size,
      mimeType,
      uploadedAt,
    };

    const uploadResult = await supabase.storage
      .from(REPORT_EVIDENCE_BUCKET)
      .upload(path, image, {
        contentType: mimeType,
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadResult.error) {
      if (isStorageBucketMissing(uploadResult.error)) {
        await reportAttachmentFailure(
          uploadResult.error,
          "upload",
          "warning",
          { reason: "missing-evidence-bucket", bucket: REPORT_EVIDENCE_BUCKET },
        );
        return NextResponse.json(
          {
            error:
              "Falta aplicar la migración 0012_add_collaborator_report_evidence_storage.sql para habilitar la evidencia técnica.",
          },
          { status: 503 },
        );
      }

      throw uploadResult.error;
    }

    const metricResult = await extractMetricFromCapture({
      kind: kindResult.data,
      image,
    });

    if (reportIdResult.data) {
      const currentReportResult = await supabase
        .from("collaborator_reports")
        .select("attachments")
        .eq("id", reportIdResult.data)
        .single();

      if (currentReportResult.error) {
        throw currentReportResult.error;
      }

      const currentAttachments =
        currentReportResult.data?.attachments &&
        typeof currentReportResult.data.attachments === "object" &&
        !Array.isArray(currentReportResult.data.attachments)
          ? currentReportResult.data.attachments
          : {};

      const updateResult = await supabase
        .from("collaborator_reports")
        .update(
          {
            attachments: {
              ...currentAttachments,
              [kindResult.data]: attachment,
            },
            ...(metricResult.ok && metricResult.body.value
              ? kindResult.data === "speedtest"
                ? { speedtest_value: metricResult.body.value }
                : kindResult.data === "ping"
                  ? { ping_value: metricResult.body.value }
                  : { gpu_value: metricResult.body.value }
              : {}),
          },
        )
        .eq("id", reportIdResult.data);

      if (updateResult.error) {
        throw updateResult.error;
      }
    }

    const signedUrlResult = await supabase.storage
      .from(REPORT_EVIDENCE_BUCKET)
      .createSignedUrl(path, 60 * 60);

    return NextResponse.json({
      attachment: {
        ...attachment,
        signedUrl: signedUrlResult.error ? undefined : signedUrlResult.data.signedUrl,
      },
      value: metricResult.ok ? metricResult.body.value : null,
      note: metricResult.ok
        ? metricResult.body.note
        : "error" in metricResult.body
          ? metricResult.body.error
          : "No pudimos leer la captura. Completa el valor manualmente.",
      readOk: metricResult.ok,
    });
  } catch (error) {
    await reportAttachmentFailure(error, "upload", "critical", {
      assignmentId,
      matchId,
      reportId: reportIdResult.data ?? null,
      kind: kindResult.data,
    });
    return NextResponse.json(
      { error: ensureErrorMessage(error) },
      { status: 500 },
    );
  }
}
