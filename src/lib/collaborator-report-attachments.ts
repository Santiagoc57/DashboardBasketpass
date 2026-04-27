export const REPORT_EVIDENCE_BUCKET = "collaborator-report-evidence";

export const TECHNICAL_CAPTURE_KINDS = [
  "speedtest",
  "ping",
  "gpu",
] as const;

export type TechnicalCaptureKind = (typeof TECHNICAL_CAPTURE_KINDS)[number];

export type CollaboratorReportAttachment = {
  kind: TechnicalCaptureKind;
  path: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
};

function sanitizePathSegment(value: string) {
  return value.replaceAll(/[^a-zA-Z0-9._-]+/g, "-").replaceAll(/-+/g, "-");
}

function getMimeExtension(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return "jpg";
  }
}

export function buildCollaboratorReportAttachmentPath(params: {
  matchId: string;
  assignmentId: string;
  kind: TechnicalCaptureKind;
  mimeType: string;
}) {
  const extension = getMimeExtension(params.mimeType);

  return [
    "matches",
    sanitizePathSegment(params.matchId),
    "assignments",
    sanitizePathSegment(params.assignmentId),
    `${params.kind}.${extension}`,
  ].join("/");
}

export function getAttachmentFileName(
  attachment: CollaboratorReportAttachment | null | undefined,
) {
  return attachment?.fileName ?? "";
}
