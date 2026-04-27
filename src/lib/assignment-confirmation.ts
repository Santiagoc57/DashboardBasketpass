export type AssignmentConfirmationStatus = "pending" | "accepted" | "declined";

export type AssignmentConfirmationResponse = "yes" | "no";

export type AssignmentConfirmationLinks = {
  yes: string;
  no: string;
};

export function normalizeAssignmentConfirmationStatus(
  value: string | null | undefined,
  confirmed = false,
): AssignmentConfirmationStatus {
  if (value === "accepted" || value === "declined" || value === "pending") {
    return value;
  }

  return confirmed ? "accepted" : "pending";
}

export function getAssignmentConfirmationUpdate(
  response: string | null | undefined,
): {
  status: AssignmentConfirmationStatus;
  confirmed: boolean;
} | null {
  if (response === "yes") {
    return {
      status: "accepted",
      confirmed: true,
    };
  }

  if (response === "no") {
    return {
      status: "declined",
      confirmed: false,
    };
  }

  return null;
}

export function getAssignmentConfirmationPresentation(
  value: string | null | undefined,
  confirmed = false,
) {
  const status = normalizeAssignmentConfirmationStatus(value, confirmed);

  if (status === "accepted") {
    return {
      status,
      label: "Confirmado",
      shortLabel: "SI",
      tone: "success" as const,
    };
  }

  if (status === "declined") {
    return {
      status,
      label: "No asiste",
      shortLabel: "NO",
      tone: "danger" as const,
    };
  }

  return {
    status,
    label: "Pendiente",
    shortLabel: "?",
    tone: "neutral" as const,
  };
}

export function buildAssignmentConfirmationLinks(params: {
  appUrl: string;
  token: string | null | undefined;
}): AssignmentConfirmationLinks | null {
  const token = params.token?.trim();

  if (!token) {
    return null;
  }

  const baseUrl = normalizeConfirmationBaseUrl(params.appUrl);

  return {
    yes: `${baseUrl}/confirmar-asistencia?token=${encodeURIComponent(token)}&response=yes`,
    no: `${baseUrl}/confirmar-asistencia?token=${encodeURIComponent(token)}&response=no`,
  };
}

export function normalizeConfirmationBaseUrl(value: string) {
  const trimmed = value.trim() || "http://localhost:3000";
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (url.hostname === "localhost") {
      url.hostname = "127.0.0.1";
      url.protocol = "http:";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return "http://127.0.0.1:3000";
  }
}
