#!/usr/bin/env node

import { promises as fsPromises } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  DEFAULT_MANIFEST_DIR,
  ROOT_DIR,
  ensureCommand,
  ensureFileExists,
  loadEnv,
  parseArgs,
  printJson,
  redactArgs,
  relativeToRoot,
  renderCommand,
  requireEnv,
  runCommand,
  summarizeDatabaseUrl,
} from "./common.mjs";

function printHelp() {
  console.log(`Usage:
  npm run ops:db-restore:dry-run -- --file backups/db/basket-production-YYYYMMDD-HHMMSS.dump
  npm run ops:db-restore -- --file backups/db/basket-production-YYYYMMDD-HHMMSS.dump --confirm-restore postgres
`);
}

function resolveRestoreFormat(filePath, requestedFormat) {
  if (requestedFormat === "custom" || requestedFormat === "plain") {
    return requestedFormat;
  }

  if (filePath.endsWith(".dump")) {
    return "custom";
  }

  if (filePath.endsWith(".sql")) {
    return "plain";
  }

  throw new Error(
    "Could not infer restore format. Use --format custom or --format plain.",
  );
}

async function readManifestSummary(filePath) {
  const manifestPath = path.join(
    DEFAULT_MANIFEST_DIR,
    `${path.basename(filePath)}.json`,
  );

  try {
    const raw = await fsPromises.readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw);

    return {
      manifestFile: relativeToRoot(manifestPath),
      generatedAt: parsed.generatedAt ?? null,
      bytes: parsed.bytes ?? null,
      sha256: parsed.sha256 ?? null,
    };
  } catch {
    return null;
  }
}

async function main() {
  loadEnv();

  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const inputValue = args.file || args._[0];
  if (!inputValue) {
    throw new Error("Missing required argument: --file");
  }

  const inputPath = path.resolve(ROOT_DIR, inputValue);
  await ensureFileExists(inputPath);

  const format = resolveRestoreFormat(inputPath, args.format);
  const databaseUrl = args["target-url"]?.trim() || requireEnv("SUPABASE_DB_URL");
  const targetDatabase = summarizeDatabaseUrl(databaseUrl);
  const command = format === "plain" ? ensureCommand("psql") : ensureCommand("pg_restore");
  const commandArgs =
    format === "plain"
      ? ["--set", "ON_ERROR_STOP=1", "--dbname", databaseUrl, "--file", inputPath]
      : [
          "--clean",
          "--if-exists",
          "--no-owner",
          "--no-acl",
          "--dbname",
          databaseUrl,
          inputPath,
        ];
  const manifest = await readManifestSummary(inputPath);

  const plan = {
    ok: true,
    dryRun: Boolean(args["dry-run"]),
    format,
    inputFile: relativeToRoot(inputPath),
    target: targetDatabase,
    manifest,
    command: renderCommand(command, redactArgs(commandArgs, [databaseUrl])),
    confirmRestore: args["confirm-restore"] || null,
    expectedConfirmRestore: targetDatabase.database,
  };

  if (args["dry-run"]) {
    printJson(plan);
    return;
  }

  if (typeof args["confirm-restore"] !== "string") {
    throw new Error(
      `Restore requires --confirm-restore ${targetDatabase.database}`,
    );
  }

  if (args["confirm-restore"] !== targetDatabase.database) {
    throw new Error(
      `Confirmation token mismatch. Expected: ${targetDatabase.database}`,
    );
  }

  runCommand(command, commandArgs);
  printJson({
    ...plan,
    ok: true,
    dryRun: false,
    restoredAt: new Date().toISOString(),
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Missing required environment variable: SUPABASE_DB_URL")) {
    console.error(
      "Missing required environment variable: SUPABASE_DB_URL. Add the direct Postgres connection string to .env.local before preparing or running restores.",
    );
  } else {
    console.error(message);
  }
  process.exit(1);
});
