import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import { appEnv, assertSupabaseEnv } from "@/lib/env";

const SUPABASE_REQUEST_TIMEOUT_MS = 10_000;

function createFetchWithTimeout(timeoutMs: number) {
  return (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const timeoutController = new AbortController();
    const timeoutId = globalThis.setTimeout(() => {
      timeoutController.abort();
    }, timeoutMs);
    const originalSignal = init?.signal;

    if (originalSignal?.aborted) {
      globalThis.clearTimeout(timeoutId);
      return fetch(input, init);
    }

    if (originalSignal) {
      const onAbort = () => {
        timeoutController.abort();
      };

      originalSignal.addEventListener("abort", onAbort, { once: true });

      return fetch(input, {
        ...init,
        signal: timeoutController.signal,
      }).finally(() => {
        globalThis.clearTimeout(timeoutId);
        originalSignal.removeEventListener("abort", onAbort);
      });
    }

    return fetch(input, {
      ...init,
      signal: timeoutController.signal,
    }).finally(() => {
      globalThis.clearTimeout(timeoutId);
    });
  };
}

export async function createSupabaseServerClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    appEnv.supabaseUrl,
    appEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server components can render with read-only cookies.
          }
        },
      },
      global: {
        fetch: createFetchWithTimeout(SUPABASE_REQUEST_TIMEOUT_MS),
      },
    },
  );
}
