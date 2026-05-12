import { headers } from "next/headers";

import { appEnv } from "@/lib/env";

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return "";
  }
}

function isLocalBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return true;
  }
}

async function getRequestBaseUrl() {
  const requestHeaders = await headers();
  const host = (
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    ""
  )
    .split(",")[0]
    .trim();

  if (!host) {
    return "";
  }

  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol =
    forwardedProto || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return normalizeBaseUrl(`${protocol}://${host}`);
}

export async function getAuthRedirectBaseUrl() {
  const configuredBaseUrl = normalizeBaseUrl(appEnv.appUrl);
  const requestBaseUrl = await getRequestBaseUrl();

  if (configuredBaseUrl && !isLocalBaseUrl(configuredBaseUrl)) {
    return configuredBaseUrl;
  }

  return requestBaseUrl || configuredBaseUrl || "http://localhost:3000";
}

export async function getPasswordResetRedirectUrl() {
  const baseUrl = await getAuthRedirectBaseUrl();
  return `${baseUrl}/auth/confirm?next=/reset-password`;
}
