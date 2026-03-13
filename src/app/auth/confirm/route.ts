import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import type { Database } from "@/lib/database.types";
import { appEnv, assertSupabaseEnv } from "@/lib/env";
import { getRedirectWithMessage, sanitizeRedirectTo } from "@/lib/search-params";

function buildNoticeRedirect(origin: string, params: { intent: "success" | "error"; notice: string }) {
  return NextResponse.redirect(
    new URL(getRedirectWithMessage("/forgot-password", params), origin),
  );
}

export async function GET(request: NextRequest) {
  try {
    assertSupabaseEnv();

    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const tokenHash = requestUrl.searchParams.get("token_hash");
    const type = requestUrl.searchParams.get("type");
    const next = sanitizeRedirectTo(
      requestUrl.searchParams.get("next"),
      "/reset-password",
    );
    const cookieStore = await cookies();
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));

    const supabase = createServerClient<Database>(
      appEnv.supabaseUrl,
      appEnv.supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        throw error;
      }

      return response;
    }

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type: type as EmailOtpType,
        token_hash: tokenHash,
      });

      if (error) {
        throw error;
      }

      return response;
    }

    return buildNoticeRedirect(requestUrl.origin, {
      intent: "error",
      notice: "El enlace de recuperación es inválido o expiró.",
    });
  } catch (error) {
    const requestUrl = new URL(request.url);
    const message =
      error instanceof Error
        ? error.message
        : "No pudimos validar el enlace de recuperación.";

    return buildNoticeRedirect(requestUrl.origin, {
      intent: "error",
      notice: message,
    });
  }
}
