import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { appEnv, isSupabaseConfigured } from "@/lib/env";
import { buildHealthStatus, emitOperationalAlert } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  const notifyOnFailure =
    request.nextUrl.searchParams.get("notify") === "1" ||
    request.nextUrl.searchParams.get("notify") === "true";
  const serviceRoleConfigured = Boolean(appEnv.supabaseServiceRoleKey);

  if (!isSupabaseConfigured) {
    const status = buildHealthStatus({
      configured: false,
      serviceRoleConfigured,
      databaseOk: false,
      databaseMessage: "Supabase no está configurado.",
      storageOk: false,
      storageMessage: "Supabase no está configurado.",
    });

    if (notifyOnFailure) {
      await emitOperationalAlert({
        area: "healthcheck",
        severity: "critical",
        message: "Healthcheck fallido: Supabase no está configurado.",
        details: status,
      });
    }

    return NextResponse.json(status, { status: 503 });
  }

  if (!serviceRoleConfigured) {
    const status = buildHealthStatus({
      configured: true,
      serviceRoleConfigured: false,
      databaseOk: false,
      databaseMessage: "Falta SUPABASE_SERVICE_ROLE_KEY.",
      storageOk: false,
      storageMessage: "Falta SUPABASE_SERVICE_ROLE_KEY.",
    });

    if (notifyOnFailure) {
      await emitOperationalAlert({
        area: "healthcheck",
        severity: "critical",
        message: "Healthcheck fallido: falta SUPABASE_SERVICE_ROLE_KEY.",
        details: status,
      });
    }

    return NextResponse.json(status, { status: 503 });
  }

  try {
    const supabase = createSupabaseAdminClient();

    const [databaseResult, bucketResult] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.storage.listBuckets(),
    ]);

    const databaseOk = !databaseResult.error;
    const storageOk =
      !bucketResult.error &&
      Boolean(
        bucketResult.data?.find(
          (bucket) => bucket.name === "collaborator-report-evidence",
        ),
      );

    const status = buildHealthStatus({
      configured: true,
      serviceRoleConfigured: true,
      databaseOk,
      databaseMessage: databaseOk
        ? "Conectado."
        : databaseResult.error?.message ?? "No pudimos consultar la base de datos.",
      storageOk,
      storageMessage: storageOk
        ? "Bucket de evidencia disponible."
        : bucketResult.error?.message ??
          "No encontramos el bucket collaborator-report-evidence.",
    });

    if (!status.ok && notifyOnFailure) {
      await emitOperationalAlert({
        area: "healthcheck",
        severity: "critical",
        message: "Healthcheck fallido en producción.",
        details: status,
        error: [
          status.database.ok ? null : status.database.message,
          status.storage.ok ? null : status.storage.message,
        ]
          .filter(Boolean)
          .join(" | "),
      });
    }

    return NextResponse.json(status, { status: status.ok ? 200 : 503 });
  } catch (error) {
    const status = buildHealthStatus({
      configured: true,
      serviceRoleConfigured: true,
      databaseOk: false,
      databaseMessage:
        error instanceof Error ? error.message : "No pudimos consultar Supabase.",
      storageOk: false,
      storageMessage:
        error instanceof Error ? error.message : "No pudimos consultar Supabase.",
    });

    if (notifyOnFailure) {
      await emitOperationalAlert({
        area: "healthcheck",
        severity: "critical",
        message: "Healthcheck fallido al consultar Supabase.",
        details: status,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json(status, { status: 503 });
  }
}
