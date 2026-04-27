#!/usr/bin/env node

import { promises as fsPromises } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  DEFAULT_MANIFEST_DIR,
  ROOT_DIR,
  parseArgs,
  printJson,
  relativeToRoot,
} from "./common.mjs";

async function readBackupSummaries() {
  let entries = [];

  try {
    entries = await fsPromises.readdir(DEFAULT_MANIFEST_DIR, { withFileTypes: true });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }

  const manifests = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const manifestPath = path.join(DEFAULT_MANIFEST_DIR, entry.name);
        const raw = await fsPromises.readFile(manifestPath, "utf8");
        const parsed = JSON.parse(raw);
        const outputPath = path.resolve(ROOT_DIR, parsed.outputFile ?? "");
        let outputExists = false;

        try {
          await fsPromises.access(outputPath);
          outputExists = true;
        } catch {
          outputExists = false;
        }

        return {
          manifestFile: relativeToRoot(manifestPath),
          outputFile: parsed.outputFile ?? null,
          generatedAt: parsed.generatedAt ?? null,
          format: parsed.format ?? null,
          bytes: parsed.bytes ?? null,
          sha256: parsed.sha256 ?? null,
          outputExists,
          database: parsed.database ?? null,
        };
      }),
  );

  return manifests.sort((left, right) =>
    String(right.generatedAt ?? "").localeCompare(String(left.generatedAt ?? "")),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const backups = await readBackupSummaries();

  if (args.latest) {
    printJson({
      ok: backups.length > 0,
      backup: backups[0] ?? null,
    });
    return;
  }

  printJson({
    ok: true,
    count: backups.length,
    backups,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
