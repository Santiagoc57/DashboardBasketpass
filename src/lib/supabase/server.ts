import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import { appEnv, assertSupabaseEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
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
  });
}
