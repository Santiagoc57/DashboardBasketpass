import { appEnv } from "./env";

export type OperationalAlertSeverity = "warning" | "critical";

export type OperationalAlertArea =
  | "healthcheck"
  | "matches"
  | "people"
  | "roles"
  | "settings"
  | "auth"
  | "teams"
  | "collaborator-reports"
  | "attachments";

export type OperationalAlertInput = {
  area: OperationalAlertArea;
  severity: OperationalAlertSeverity;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
};

export type HealthStatus = {
  ok: boolean;
  configured: boolean;
  serviceRoleConfigured: boolean;
  database: {
    ok: boolean;
    message: string;
  };
  storage: {
    ok: boolean;
    message: string;
  };
  timestamp: string;
};

function humanizeAlertKey(key: string) {
  return key
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (value) => value.toUpperCase());
}

function formatAlertValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(formatAlertValue).join(", ");
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function formatOperationalAlertText(payload: {
  severity: OperationalAlertSeverity;
  area: OperationalAlertArea;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}) {
  const lines = [`[${payload.severity}] ${payload.area}`, payload.message];

  if (payload.error) {
    lines.push(`Error: ${payload.error}`);
  }

  if (payload.details && Object.keys(payload.details).length > 0) {
    lines.push("");
    for (const [key, value] of Object.entries(payload.details)) {
      lines.push(`${humanizeAlertKey(key)}: ${formatAlertValue(value)}`);
    }
  }

  lines.push(`Timestamp: ${payload.timestamp}`);

  return lines.join("\n");
}

export function buildHealthStatus(params: {
  configured: boolean;
  serviceRoleConfigured: boolean;
  databaseOk: boolean;
  databaseMessage: string;
  storageOk: boolean;
  storageMessage: string;
}) {
  return {
    ok:
      params.configured &&
      params.serviceRoleConfigured &&
      params.databaseOk &&
      params.storageOk,
    configured: params.configured,
    serviceRoleConfigured: params.serviceRoleConfigured,
    database: {
      ok: params.databaseOk,
      message: params.databaseMessage,
    },
    storage: {
      ok: params.storageOk,
      message: params.storageMessage,
    },
    timestamp: new Date().toISOString(),
  } satisfies HealthStatus;
}

export async function emitOperationalAlert(input: OperationalAlertInput) {
  const payload = {
    ...input,
    timestamp: new Date().toISOString(),
  };

  try {
    if (appEnv.telegramBotToken && appEnv.telegramChatId) {
      const text = formatOperationalAlertText(payload);

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${appEnv.telegramBotToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            chat_id: appEnv.telegramChatId,
            text,
            disable_web_page_preview: true,
          }),
        },
      );

      if (!telegramResponse.ok) {
        const errorBody = await telegramResponse.text().catch(() => "");
        throw new Error(
          `Telegram alert failed (${telegramResponse.status} ${telegramResponse.statusText})${errorBody ? `: ${errorBody}` : ""}`,
        );
      }
      return;
    }

    if (appEnv.operationalAlertWebhookUrl) {
      const webhookResponse = await fetch(appEnv.operationalAlertWebhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!webhookResponse.ok) {
        const errorBody = await webhookResponse.text().catch(() => "");
        throw new Error(
          `Operational alert webhook failed (${webhookResponse.status} ${webhookResponse.statusText})${errorBody ? `: ${errorBody}` : ""}`,
        );
      }
      return;
    }

    console.error("[ops-alert]", JSON.stringify(payload));
  } catch (error) {
    console.error(
      "[ops-alert]",
      JSON.stringify({
        ...payload,
        transportError: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
