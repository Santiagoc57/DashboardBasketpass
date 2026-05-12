import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  getDefaultDashboardHrefForRole,
  resolveDashboardAccessRole,
} from "@/lib/constants";
import type { Database } from "@/lib/database.types";
import { appEnv, isSupabaseConfigured } from "@/lib/env";

const SUPABASE_MIDDLEWARE_TIMEOUT_MS = 5_000;

function createFetchWithTimeout(timeoutMs: number) {
  return (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const timeoutController = new AbortController();
    const timeoutId = globalThis.setTimeout(() => {
      timeoutController.abort();
    }, timeoutMs);

    return fetch(input, {
      ...init,
      signal: timeoutController.signal,
    }).finally(() => {
      globalThis.clearTimeout(timeoutId);
    });
  };
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient<Database>(
    appEnv.supabaseUrl,
    appEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
      global: {
        fetch: createFetchWithTimeout(SUPABASE_MIDDLEWARE_TIMEOUT_MS),
      },
    },
  );

  const authResult = await supabase.auth.getUser().catch((error) => {
    console.error("[middleware] failed to validate Supabase session", error);
    return { data: { user: null } };
  });
  const user = authResult.data.user;
  let role: Database["public"]["Enums"]["app_role"] | null = null;

  if (user) {
    let profileRole: Database["public"]["Enums"]["app_role"] | null = null;

    try {
      const profileQuery = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      profileRole = profileQuery.data?.role ?? null;
    } catch (error) {
      console.error("[middleware] failed to load profile role", error);
    }

    role = resolveDashboardAccessRole({
      profileRole,
      appMetadata: user.app_metadata,
    });
  }

  const allowsGuestMiJornada =
    appEnv.allowGuestMiJornadaAccess &&
    (pathname === "/mi-jornada" ||
      pathname === "/api/ai/metric-capture" ||
      pathname === "/api/ai/section");
  const isLoginRoute = pathname === "/login";
  const isPublicAuthRoute =
    isLoginRoute ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth/");

  if (!user && !isPublicAuthRoute && !allowsGuestMiJornada) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Tu sesión no está activa para usar este endpoint." },
        { status: 401 },
      );
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isLoginRoute) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = getDefaultDashboardHrefForRole(role);
    return NextResponse.redirect(appUrl);
  }

  return response;
}
