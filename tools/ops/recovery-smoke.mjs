#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(ROOT_DIR, ".env.local") });
dotenv.config({ path: path.join(ROOT_DIR, ".env") });

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const tables = [
    "profiles",
    "people",
    "roles",
    "matches",
    "assignments",
    "audit_log",
    "announcements",
    "collaborator_reports",
    "app_settings",
  ];

  const tableChecks = [];
  for (const table of tables) {
    const result = await supabase.from(table).select("*", {
      count: "exact",
      head: true,
    });

    if (result.error) {
      throw new Error(`Table check failed for ${table}: ${result.error.message}`);
    }

    tableChecks.push({
      table,
      count: result.count ?? 0,
    });
  }

  const bucketsResult = await supabase.storage.listBuckets();
  if (bucketsResult.error) {
    throw new Error(`Bucket check failed: ${bucketsResult.error.message}`);
  }

  const evidenceBucket = bucketsResult.data?.find(
    (bucket) => bucket.name === "collaborator-report-evidence",
  );

  if (!evidenceBucket) {
    throw new Error("Missing storage bucket: collaborator-report-evidence");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        tables: tableChecks,
        storage: {
          bucket: evidenceBucket.name,
          public: evidenceBucket.public,
          fileSizeLimit: evidenceBucket.file_size_limit,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

