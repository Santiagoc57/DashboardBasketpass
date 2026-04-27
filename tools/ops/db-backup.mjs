#!/usr/bin/env node

import { promises as fsPromises } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  DEFAULT_BACKUP_DIR,
  DEFAULT_MANIFEST_DIR,
  ROOT_DIR,
  ensureCommand,
  ensureDir,
  loadEnv,
  parseArgs,
  printJson,
  redactArgs,
  relativeToRoot,
  renderCommand,
  requireEnv,
  runCommand,
  sanitizeTag,
  sha256File,
  summarizeDatabaseUrl,
  timestampLabel,
  writeJson,
} from "./common.mjs";

function printHelp() {
  console.log(`Usage:
  npm run ops:db-backup
  npm run ops:db-backup -- --format plain --tag pre-release
  npm run ops:db-backup -- --output backups/db/custom.dump --dry-run
`);
}

function resolveFormat(value) {
  if (!value || value === "custom") {
    return "custom";
  }

  if (value === "plain") {
    return "plain";
  }

  throw new Error(`Unsupported backup format: ${value}`);
}

async function main() {
  loadEnv();

  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const format = resolveFormat(args.format);
  const extension = format === "plain" ? "sql" : "dump";
  const databaseUrl = args["db-url"]?.trim() || requireEnv("SUPABASE_DB_URL");
  const tag = sanitizeTag(args.tag);
  const timestamp = timestampLabel();
  const fileName = `basket-production-${timestamp}${tag ? `-${tag}` : ""}.${extension}`;
  const outputPath = path.resolve(
    ROOT_DIR,
    args.output ?? path.join(DEFAULT_BACKUP_DIR, fileName),
  );
  const manifestPath = path.resolve(
    ROOT_DIR,
    args.manifest ?? path.join(DEFAULT_MANIFEST_DIR, `${path.basename(outputPath)}.json`),
  );
  const pgDumpPath = ensureCommand("pg_dump");

  const dumpArgs =
    format === "plain"
      ? ["--format=plain", "--no-owner", "--no-acl", "--file", outputPath, databaseUrl]
      : ["--format=custom", "--no-owner", "--no-acl", "--file", outputPath, databaseUrl];

  const plan = {
    ok: true,
    dryRun: Boolean(args["dry-run"]),
    format,
    outputFile: relativeToRoot(outputPath),
    manifestFile: relativeToRoot(manifestPath),
    database: summarizeDatabaseUrl(databaseUrl),
    command: renderCommand(pgDumpPath, redactArgs(dumpArgs, [databaseUrl])),
  };

  if (args["dry-run"]) {
    printJson(plan);
    return;
  }

  await ensureDir(path.dirname(outputPath));
  await ensureDir(path.dirname(manifestPath));
  runCommand(pgDumpPath, dumpArgs);

  const fileStats = await fsPromises.stat(outputPath);
  if (!fileStats.size) {
    throw new Error("Backup file was created but is empty.");
  }

  const sha256 = await sha256File(outputPath);
  await writeJson(manifestPath, {
    generatedAt: new Date().toISOString(),
    format,
    outputFile: relativeToRoot(outputPath),
    sha256,
    bytes: fileStats.size,
    database: summarizeDatabaseUrl(databaseUrl),
    command: renderCommand(pgDumpPath, redactArgs(dumpArgs, [databaseUrl])),
  });

  printJson({
    ok: true,
    format,
    outputFile: relativeToRoot(outputPath),
    manifestFile: relativeToRoot(manifestPath),
    bytes: fileStats.size,
    sha256,
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Missing required environment variable: SUPABASE_DB_URL")) {
    console.error(
      "Missing required environment variable: SUPABASE_DB_URL. Add the direct Postgres connection string to .env.local before running backups.",
    );
  } else {
    console.error(message);
  }
  process.exit(1);
});
