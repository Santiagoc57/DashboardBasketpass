import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { appEnv, assertSupabaseEnv } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  assertSupabaseEnv();

  if (!client) {
    client = createBrowserClient<Database>(
      appEnv.supabaseUrl,
      appEnv.supabaseAnonKey,
    );
  }

  return client;
}
