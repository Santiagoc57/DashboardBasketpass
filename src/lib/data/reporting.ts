import "server-only";

import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

import {
  REPORT_EVIDENCE_BUCKET,
} from "@/lib/collaborator-report-attachments";
import type { ReportActivity, ReportRecord, ReportSeverity } from "@/lib/reports";
import type {
  IncidentActivityEvent,
  IncidentProblem,
  IncidentRecord,
  IncidentSeverity,
} from "@/lib/incidents";
import type {
  AuditRow,
  CollaboratorReportRow,
  Json,
  MatchRow,
  ProfileRow,
} from "@/lib/database.types";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import { getTeamDisplayName } from "@/lib/team-directory";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AssignmentContextRow = {
  id: string;
  match_id: string;
  role: {
    id: string;
    name: string;
    category: string;
    sort_order: number;
    active: boolean;
  } | null;
  person: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
};

type AuditEntryRow = AuditRow;

type ReportingWorkspaceData = {
  reports: ReportRecord[];
  incidents: IncidentRecord[];
  activities: ReportActivity[];
};

type AttachmentSummary = {
  fileName: string;
  fileSizeLabel: string;
  previewUrl?: string;
};

const EMPTY_REPORTING_WORKSPACE: ReportingWorkspaceData = {
  reports: [],
  incidents: [],
  activities: [],
};

const PROBLEM_LABELS = [
  { key: "internet", label: "Problema Internet" },
  { key: "img", label: "Problema IMG" },
  { key: "ocr", label: "OCR" },
  { key: "overlays", label: "Overlays (GES)" },
  { key: "grafica", label: "Gráfica" },
] as const;

const AUDIT_FIELD_LABELS: Record<string, string> = {
  incident_level: "gravedad",
  paid: "pago",
  feed_detected: "detección de feed",
  signal_label: "señal",
  apto_lineal: "apto lineal",
  test_time: "hora de prueba",
  test_check: "prueba",
  start_check: "inicio",
  graphics_check: "gráfica",
  speedtest_value: "speedtest",
  ping_value: "ping",
  gpu_value: "gpu",
  technical_observations: "observaciones técnicas",
  building_observations: "observaciones edilicias",
  general_observations: "observaciones generales",
  problems: "problemas marcados",
  attachments: "adjuntos",
};

function isObjectRecord(
  value: Json | null | undefined,
): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatRelativeTime(value: string) {
  const formatted = formatDistanceToNowStrict(parseISO(value), {
    addSuffix: true,
    locale: es,
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatEventDate(value: string, timezone = DEFAULT_TIMEZONE) {
  return formatInTimeZone(value, timezone, "d MMMM yyyy", { locale: es });
}

function formatEventTime(value: string, timezone = DEFAULT_TIMEZONE) {
  return formatInTimeZone(value, timezone, "HH:mm", { locale: es });
}

function formatReportUpdatedAt(value: string, timezone = DEFAULT_TIMEZONE) {
  return formatInTimeZone(value, timezone, "d MMM yyyy, h:mm a", { locale: es });
}

function formatIncidentUpdatedAt(value: string, timezone = DEFAULT_TIMEZONE) {
  return formatInTimeZone(value, timezone, "HH:mm:ss 'GMT'XXX", { locale: es });
}

function formatAuditTime(value: string, timezone = DEFAULT_TIMEZONE) {
  return formatInTimeZone(value, timezone, "HH:mm", { locale: es });
}

function shortId(value: string, size = 6) {
  return value.replaceAll("-", "").slice(0, size).toUpperCase();
}

function buildFeedId(match: MatchRow | null | undefined, reportId: string) {
  const externalMatchId = match?.external_match_id?.trim();

  if (externalMatchId) {
    return externalMatchId.startsWith("#") ? externalMatchId : `#${externalMatchId}`;
  }

  return `#CR-${shortId(reportId)}`;
}

function buildProductionCode(match: MatchRow | null | undefined, reportId: string) {
  return match?.production_code?.trim() || `BP-${shortId(reportId, 8)}`;
}

function buildMatchLabel(match: MatchRow | null | undefined) {
  if (!match) {
    return "Partido sin contexto";
  }

  return `${getTeamDisplayName(match.home_team, match.competition)} vs ${getTeamDisplayName(match.away_team, match.competition)}`;
}

function buildMatchCode(match: MatchRow | null | undefined) {
  const productionCode = match?.production_code?.trim();

  if (productionCode) {
    return productionCode;
  }

  const homeCode = match?.home_team
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? "")
    .join("");
  const awayCode = match?.away_team
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? "")
    .join("");

  if (!homeCode && !awayCode) {
    return `RP-${shortId(match?.id ?? "report", 4)}`;
  }

  return [homeCode, awayCode].filter(Boolean).join(" - ");
}

function mapReportSeverity(level: string): ReportSeverity {
  switch (level) {
    case "critica":
      return "Crítica";
    case "alta":
      return "Alta";
    case "baja":
      return "Baja";
    case "sin":
      return "Sin incidencia";
    default:
      return "Media";
  }
}

function mapIncidentSeverity(level: string): IncidentSeverity {
  switch (level) {
    case "critica":
      return "Crítica";
    case "alta":
      return "Alta";
    case "baja":
      return "Baja";
    default:
      return "Media";
  }
}

function parseProblems(value: Json): IncidentProblem[] {
  const source = isObjectRecord(value) ? value : {};

  const baseProblems = PROBLEM_LABELS.map(({ key, label }) => ({
    label,
    active: source[key] === true,
  }));

  return [
    ...baseProblems,
    {
      label: "OTRO",
      active: source.other === true,
    },
    {
      label: "ST",
      active: source.st === true,
    },
    {
      label: "CLUB",
      active: source.club === true,
    },
  ];
}

function buildProblemSummary(report: CollaboratorReportRow, problems: IncidentProblem[]) {
  const activeLabels = problems
    .filter((problem) => problem.active)
    .map((problem) => problem.label);

  if (activeLabels.length) {
    return activeLabels.join(" · ");
  }

  const observationFallbacks = [
    report.general_observations,
    report.technical_observations,
    report.building_observations,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  if (observationFallbacks.length) {
    return observationFallbacks[0] ?? "";
  }

  return report.incident_level === "sin"
    ? "Sin desvíos relevantes reportados"
    : "Incidencia reportada sin detalle adicional";
}

function buildDetailedNotes(report: CollaboratorReportRow) {
  const segments = [
    report.technical_observations?.trim(),
    report.building_observations?.trim()
      ? `Edilicia: ${report.building_observations.trim()}`
      : null,
    report.general_observations?.trim()
      ? `General: ${report.general_observations.trim()}`
      : null,
  ].filter(Boolean);

  return segments.join(" · ") || "Sin observaciones adicionales.";
}

function normalizeName(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function pickRoleAssignee(
  rows: AssignmentContextRow[],
  matcher: (row: AssignmentContextRow) => boolean,
) {
  return rows
    .filter((row) => row.person?.full_name && matcher(row))
    .sort((left, right) => (left.role?.sort_order ?? 999) - (right.role?.sort_order ?? 999))[0]
    ?.person?.full_name ?? null;
}

function getAttachmentPath(value: Json | undefined) {
  if (!value || typeof value === "string" || !isObjectRecord(value)) {
    return "";
  }

  return typeof value.path === "string" ? value.path.trim() : "";
}

async function buildSignedAttachmentUrlMap(reportRows: CollaboratorReportRow[]) {
  const paths = [
    ...new Set(
      reportRows.flatMap((report) => {
        const attachments = getAttachmentRecord(report.attachments);

        return [
          getAttachmentPath(attachments.speedtest),
          getAttachmentPath(attachments.ping),
          getAttachmentPath(attachments.gpu),
        ].filter(Boolean);
      }),
    ),
  ];

  if (!paths.length) {
    return new Map<string, string>();
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const signedUrlMap = new Map<string, string>();

    await Promise.all(
      paths.map(async (path) => {
        const signedUrlResult = await supabaseAdmin.storage
          .from(REPORT_EVIDENCE_BUCKET)
          .createSignedUrl(path, 60 * 60);

        if (!signedUrlResult.error && signedUrlResult.data.signedUrl) {
          signedUrlMap.set(path, signedUrlResult.data.signedUrl);
        }
      }),
    );

    return signedUrlMap;
  } catch (error) {
    console.error("[reporting] failed to build signed attachment URLs", error);
    return new Map<string, string>();
  }
}

function buildAttachmentSummary(
  value: Json | undefined,
  signedUrlMap: Map<string, string>,
): AttachmentSummary | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && value.trim()) {
    return {
      fileName: value.trim(),
      fileSizeLabel: "Adjunto",
    };
  }

  if (!isObjectRecord(value)) {
    return null;
  }

  const fileName =
    (typeof value.fileName === "string" && value.fileName.trim()) ||
    (typeof value.name === "string" && value.name.trim()) ||
    (typeof value.path === "string" && value.path.trim().split("/").at(-1)) ||
    "";

  if (!fileName) {
    return null;
  }

  const rawSize =
    typeof value.sizeBytes === "number"
      ? value.sizeBytes
      : typeof value.size === "number"
        ? value.size
        : null;
  const fileSizeLabel =
    typeof value.fileSizeLabel === "string" && value.fileSizeLabel.trim()
      ? value.fileSizeLabel
      : rawSize && rawSize > 0
        ? rawSize < 1024
          ? `${rawSize} B`
          : rawSize < 1024 * 1024
            ? `${(rawSize / 1024).toFixed(1)} KB`
            : `${(rawSize / (1024 * 1024)).toFixed(1)} MB`
        : "Adjunto";
  const path = typeof value.path === "string" ? value.path.trim() : "";
  const previewUrl =
    typeof value.previewUrl === "string" && value.previewUrl.trim()
      ? value.previewUrl
      : typeof value.signedUrl === "string" && value.signedUrl.trim()
        ? value.signedUrl
        : typeof value.url === "string" && value.url.trim()
          ? value.url
          : path && signedUrlMap.has(path)
            ? signedUrlMap.get(path)
          : undefined;

  return {
    fileName,
    fileSizeLabel,
    previewUrl,
  };
}

function getAttachmentRecord(value: Json): Record<string, Json | undefined> {
  return isObjectRecord(value) ? value : {};
}

function formatAuditValue(value: Json | undefined) {
  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (typeof value === "string") {
    return value.trim() || "Vacío";
  }

  if (value === null || value === undefined) {
    return "Vacío";
  }

  return JSON.stringify(value);
}

function getPrimaryChangedField(entry: AuditEntryRow) {
  const beforeValue = isObjectRecord(entry.before) ? entry.before : {};
  const afterValue = isObjectRecord(entry.after) ? entry.after : {};
  const keys = new Set([...Object.keys(beforeValue), ...Object.keys(afterValue)]);
  const priority = [
    "incident_level",
    "problems",
    "paid",
    "feed_detected",
    "signal_label",
    "attachments",
    "test_check",
    "start_check",
    "graphics_check",
    "technical_observations",
    "general_observations",
    "building_observations",
  ];

  for (const key of priority) {
    if (JSON.stringify(beforeValue[key]) !== JSON.stringify(afterValue[key])) {
      return {
        key,
        label: AUDIT_FIELD_LABELS[key] ?? key,
        before: formatAuditValue(beforeValue[key]),
        after: formatAuditValue(afterValue[key]),
      };
    }
  }

  const fallbackKey = [...keys].find(
    (key) =>
      !["id", "updated_at", "updated_by", "created_at", "created_by"].includes(key) &&
      JSON.stringify(beforeValue[key]) !== JSON.stringify(afterValue[key]),
  );

  if (!fallbackKey) {
    return null;
  }

  return {
    key: fallbackKey,
    label: AUDIT_FIELD_LABELS[fallbackKey] ?? fallbackKey,
    before: formatAuditValue(beforeValue[fallbackKey]),
    after: formatAuditValue(afterValue[fallbackKey]),
  };
}

function mapAuditTone(entry: AuditEntryRow): ReportActivity["tone"] {
  const changedField = getPrimaryChangedField(entry);

  if (entry.action === "INSERT") {
    return "accent";
  }

  if (changedField?.key === "incident_level") {
    return "warning";
  }

  if (changedField?.key === "attachments") {
    return "success";
  }

  return "accent";
}

function mapReportActivity(params: {
  entry: AuditEntryRow;
  profileMap: Map<string, ProfileRow>;
  matchMap: Map<string, MatchRow>;
}) {
  const actorName =
    (params.entry.changed_by
      ? params.profileMap.get(params.entry.changed_by)?.full_name
      : null) ?? "Sistema";
  const match = params.entry.match_id
    ? params.matchMap.get(params.entry.match_id) ?? null
    : null;
  const changedField = getPrimaryChangedField(params.entry);

  if (params.entry.action === "INSERT") {
    return {
      id: `report-activity-${params.entry.id}`,
      title: `Nuevo reporte para ${buildMatchLabel(match)}`,
      detail: `${actorName} envió el reporte técnico del partido.`,
      timestamp: formatRelativeTime(params.entry.created_at),
      tone: "accent" as const,
    };
  }

  if (params.entry.action === "DELETE") {
    return {
      id: `report-activity-${params.entry.id}`,
      title: `Reporte eliminado para ${buildMatchLabel(match)}`,
      detail: `${actorName} eliminó el reporte técnico asociado.`,
      timestamp: formatRelativeTime(params.entry.created_at),
      tone: "warning" as const,
    };
  }

  return {
    id: `report-activity-${params.entry.id}`,
    title: `${buildMatchLabel(match)} · ${
      changedField ? `Actualizó ${changedField.label}` : "Reporte actualizado"
    }`,
    detail: changedField
      ? `${actorName} cambió ${changedField.label}: ${changedField.before} → ${changedField.after}.`
      : `${actorName} actualizó el reporte técnico.`,
    timestamp: formatRelativeTime(params.entry.created_at),
    tone: mapAuditTone(params.entry),
  };
}

function mapIncidentActivity(params: {
  entry: AuditEntryRow;
  profileMap: Map<string, ProfileRow>;
  timezone: string;
}): IncidentActivityEvent {
  const actor =
    (params.entry.changed_by
      ? params.profileMap.get(params.entry.changed_by)?.full_name
      : null) ?? "Sistema";
  const changedField = getPrimaryChangedField(params.entry);

  if (params.entry.action === "INSERT") {
    return {
      time: formatAuditTime(params.entry.created_at, params.timezone),
      actor,
      action: "Envió el reporte",
      detail: "Se registró la primera versión del reporte técnico.",
      tone: "accent",
    };
  }

  if (params.entry.action === "DELETE") {
    return {
      time: formatAuditTime(params.entry.created_at, params.timezone),
      actor,
      action: "Eliminó el reporte",
      detail: "La incidencia dejó de tener un reporte asociado.",
      tone: "warning",
    };
  }

  return {
    time: formatAuditTime(params.entry.created_at, params.timezone),
    actor,
    action: changedField
      ? `Actualizó ${changedField.label}`
      : "Actualizó el reporte",
    detail: changedField
      ? `${changedField.before} → ${changedField.after}`
      : "Se guardaron cambios sobre el reporte técnico.",
    tone:
      changedField?.key === "attachments"
        ? "success"
        : changedField?.key === "incident_level"
          ? "accent"
          : "neutral",
  };
}

function buildReportRecord(params: {
  report: CollaboratorReportRow;
  match: MatchRow | null;
  matchAssignments: AssignmentContextRow[];
  assignmentMap: Map<string, AssignmentContextRow>;
  profileMap: Map<string, ProfileRow>;
  auditRows: AuditEntryRow[];
  signedUrlMap: Map<string, string>;
}) {
  const timezone = params.match?.timezone ?? DEFAULT_TIMEZONE;
  const problems = parseProblems(params.report.problems);
  const assignment = params.assignmentMap.get(params.report.assignment_id) ?? null;
  const attachments = getAttachmentRecord(params.report.attachments);
  const responsibleName =
    pickRoleAssignee(
      params.matchAssignments,
      (row) => normalizeName(row.role?.name) === "responsable",
    ) ??
    assignment?.person?.full_name ??
    (params.report.reporter_profile_id
      ? params.profileMap.get(params.report.reporter_profile_id)?.full_name
      : null) ??
    "Sin responsable";

  return {
    id_feed: buildFeedId(params.match, params.report.id),
    id_bp: buildProductionCode(params.match, params.report.id),
    sourceReportId: params.report.id,
    assignmentId: params.report.assignment_id,
    matchId: params.report.match_id,
    match_label: buildMatchLabel(params.match),
    competition: params.match?.competition?.trim() || "Sin liga",
    league: params.match?.competition?.trim() || "Sin liga",
    event_date: params.match
      ? formatEventDate(params.match.kickoff_at, timezone)
      : formatEventDate(params.report.submitted_at, timezone),
    event_time: params.match
      ? formatEventTime(params.match.kickoff_at, timezone)
      : formatEventTime(params.report.submitted_at, timezone),
    venue: params.match?.venue?.trim() || "Sede sin confirmar",
    responsible_name: responsibleName,
    paid: params.report.paid,
    feed_detected: params.report.feed_detected,
    severity: mapReportSeverity(params.report.incident_level),
    problem: buildProblemSummary(params.report, problems),
    speedtest: params.report.speedtest_value?.trim() || "-",
    ping: params.report.ping_value?.trim() || "-",
    gpuLoad: params.report.gpu_value?.trim() || "-",
    speedtestAttachment: buildAttachmentSummary(attachments.speedtest, params.signedUrlMap),
    pingAttachment: buildAttachmentSummary(attachments.ping, params.signedUrlMap),
    gpuAttachment: buildAttachmentSummary(attachments.gpu, params.signedUrlMap),
    technicalObservation: params.report.technical_observations?.trim() || "",
    technical_notes: buildDetailedNotes(params.report),
    updated_relative: formatRelativeTime(params.report.updated_at),
    updated_at: formatReportUpdatedAt(params.report.updated_at, timezone),
    activity: params.auditRows.map((entry) =>
      mapReportActivity({
        entry,
        profileMap: params.profileMap,
        matchMap: new Map(params.match ? [[params.match.id, params.match]] : []),
      }),
    ),
  } satisfies ReportRecord;
}

function buildIncidentRecord(params: {
  report: CollaboratorReportRow;
  match: MatchRow | null;
  matchAssignments: AssignmentContextRow[];
  assignmentMap: Map<string, AssignmentContextRow>;
  profileMap: Map<string, ProfileRow>;
  auditRows: AuditEntryRow[];
  signedUrlMap: Map<string, string>;
}) {
  const timezone = params.match?.timezone ?? DEFAULT_TIMEZONE;
  const assignment = params.assignmentMap.get(params.report.assignment_id) ?? null;
  const reporterName =
    assignment?.person?.full_name ??
    (params.report.reporter_profile_id
      ? params.profileMap.get(params.report.reporter_profile_id)?.full_name
      : null) ??
    "Sistema";
  const operatorControl =
    pickRoleAssignee(
      params.matchAssignments,
      (row) => normalizeName(row.role?.name) === "operador de control",
    ) ?? reporterName;
  const streamer =
    pickRoleAssignee(
      params.matchAssignments,
      (row) =>
        normalizeName(row.role?.name) === "encoder" ||
        normalizeName(row.role?.category) === "transmision",
    ) ?? reporterName;
  const problems = parseProblems({
    ...(isObjectRecord(params.report.problems) ? params.report.problems : {}),
    other: params.report.other_flag,
    st: params.report.st_flag,
    club: params.report.club_flag,
  });
  const attachments = getAttachmentRecord(params.report.attachments);

  return {
    id: `#CR-${shortId(params.report.id)}`,
    sourceReportId: params.report.id,
    assignmentId: params.report.assignment_id,
    matchId: params.report.match_id,
    matchCode: buildMatchCode(params.match),
    matchLabel: buildMatchLabel(params.match),
    competition: params.match?.competition?.trim() || "Sin liga",
    eventDate: params.match
      ? formatEventDate(params.match.kickoff_at, timezone)
      : formatEventDate(params.report.submitted_at, timezone),
    eventTime: params.match
      ? formatEventTime(params.match.kickoff_at, timezone)
      : formatEventTime(params.report.submitted_at, timezone),
    severity: mapIncidentSeverity(params.report.incident_level),
    operatorControl,
    streamer,
    mainIssue: buildProblemSummary(params.report, problems),
    updatedRelative: formatRelativeTime(params.report.updated_at),
    updatedAt: formatIncidentUpdatedAt(params.report.updated_at, timezone),
    venue: params.match?.venue?.trim() || "Sede sin confirmar",
    roundLabel: params.match?.competition?.trim() || "Sin liga",
    testTime: params.report.test_time?.trim() || "--:--",
    transmissionType:
      params.match?.production_mode?.trim() || params.report.signal_label.trim() || "Sin definir",
    signalDelivery: params.report.signal_label.trim() || "Sin definir",
    aptoLineal: params.report.apto_lineal,
    testCheck: params.report.test_check ? "Prueba completa" : "Prueba incompleta",
    startCheck: params.report.start_check ? "Inicio ok" : "Inicio con incidencia",
    graphicsCheck: params.report.graphics_check
      ? "Gráfica estable"
      : "Gráfica con observación",
    speedtest: params.report.speedtest_value?.trim() || "-",
    ping: params.report.ping_value?.trim() || "-",
    gpuLoad: params.report.gpu_value?.trim() || "-",
    speedtestAttachment: buildAttachmentSummary(attachments.speedtest, params.signedUrlMap),
    pingAttachment: buildAttachmentSummary(attachments.ping, params.signedUrlMap),
    gpuAttachment: buildAttachmentSummary(attachments.gpu, params.signedUrlMap),
    venueImages: [],
    observations: buildDetailedNotes(params.report),
    technicalObservation: params.report.technical_observations?.trim() || "",
    buildingObservation: params.report.building_observations?.trim() || "",
    generalObservation: params.report.general_observations?.trim() || "",
    reporter: reporterName,
    problems,
    activity: params.auditRows.map((entry) =>
      mapIncidentActivity({
        entry,
        profileMap: params.profileMap,
        timezone,
      }),
    ),
  } satisfies IncidentRecord;
}

export async function getReportingWorkspaceData(): Promise<ReportingWorkspaceData> {
  const supabase = await createSupabaseServerClient();
  const reportsResult = await supabase
    .from("collaborator_reports")
    .select("*")
    .order("updated_at", { ascending: false });

  if (reportsResult.error) {
    if (reportsResult.error.code === "42P01") {
      return EMPTY_REPORTING_WORKSPACE;
    }

    throw reportsResult.error;
  }

  const reportRows = (reportsResult.data ?? []) as CollaboratorReportRow[];

  if (!reportRows.length) {
    return EMPTY_REPORTING_WORKSPACE;
  }

  const matchIds = [...new Set(reportRows.map((report) => report.match_id))];
  const reportIds = [...new Set(reportRows.map((report) => report.id))];
  const signedUrlMap = await buildSignedAttachmentUrlMap(reportRows);

  const [matchesResult, assignmentsResult, auditResult] = await Promise.all([
    supabase.from("matches").select("*").in("id", matchIds),
    supabase
      .from("assignments")
      .select(
        "id, match_id, role:roles!assignments_role_id_fkey(id, name, category, sort_order, active), person:people!assignments_person_id_fkey(id, full_name, email, phone)",
      )
      .in("match_id", matchIds),
    supabase
      .from("audit_log")
      .select("*")
      .eq("table_name", "collaborator_reports")
      .in("record_id", reportIds)
      .order("created_at", { ascending: false }),
  ]);

  if (matchesResult.error) {
    throw matchesResult.error;
  }

  if (assignmentsResult.error) {
    throw assignmentsResult.error;
  }

  if (auditResult.error) {
    throw auditResult.error;
  }

  const matchRows = (matchesResult.data ?? []) as MatchRow[];
  const assignmentRows = (assignmentsResult.data ?? []) as unknown as AssignmentContextRow[];
  const auditRows = (auditResult.data ?? []) as AuditEntryRow[];
  const profileIds = [
    ...new Set(
      [
        ...reportRows.map((report) => report.reporter_profile_id),
        ...auditRows.map((entry) => entry.changed_by),
      ].filter((value): value is string => Boolean(value)),
    ),
  ];

  let profileMap = new Map<string, ProfileRow>();

  if (profileIds.length) {
    const profilesResult = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at, updated_at")
      .in("id", profileIds);

    if (profilesResult.error) {
      throw profilesResult.error;
    }

    profileMap = new Map(
      ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
    );
  }

  const matchMap = new Map(matchRows.map((match) => [match.id, match]));
  const assignmentMap = new Map(assignmentRows.map((assignment) => [assignment.id, assignment]));
  const assignmentsByMatch = assignmentRows.reduce<Map<string, AssignmentContextRow[]>>(
    (accumulator, row) => {
      const current = accumulator.get(row.match_id) ?? [];
      current.push(row);
      accumulator.set(row.match_id, current);
      return accumulator;
    },
    new Map(),
  );
  const auditByReportId = auditRows.reduce<Map<string, AuditEntryRow[]>>(
    (accumulator, row) => {
      const current = accumulator.get(row.record_id) ?? [];
      current.push(row);
      accumulator.set(row.record_id, current);
      return accumulator;
    },
    new Map(),
  );

  const reports = reportRows.map((report) =>
    buildReportRecord({
      report,
      match: matchMap.get(report.match_id) ?? null,
      matchAssignments: assignmentsByMatch.get(report.match_id) ?? [],
      assignmentMap,
      profileMap,
      auditRows: auditByReportId.get(report.id) ?? [],
      signedUrlMap,
    }),
  );

  const incidents = reportRows
    .filter((report) => report.incident_level !== "sin")
    .map((report) =>
      buildIncidentRecord({
        report,
        match: matchMap.get(report.match_id) ?? null,
        matchAssignments: assignmentsByMatch.get(report.match_id) ?? [],
        assignmentMap,
        profileMap,
        auditRows: auditByReportId.get(report.id) ?? [],
        signedUrlMap,
      }),
    );

  const activities = auditRows
    .slice(0, 12)
    .map((entry) =>
      mapReportActivity({
        entry,
        profileMap,
        matchMap,
      }),
    );

  return {
    reports,
    incidents,
    activities,
  };
}
