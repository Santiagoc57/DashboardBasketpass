import { promises as fs } from "node:fs";
import path from "node:path";

import { appEnv } from "@/lib/env";

const ROOT_DIR = process.cwd();
const BACKUP_MANIFEST_DIR = path.join(ROOT_DIR, "backups", "manifests");
const SIMULATION_DIR = path.join(
  ROOT_DIR,
  "docs",
  "entrega-profesional",
  "simulacros",
);

type BackupManifest = {
  manifestFile: string;
  outputFile: string | null;
  generatedAt: string | null;
  format: string | null;
  bytes: number | null;
  sha256: string | null;
  outputExists: boolean;
  database: {
    host: string | null;
    port: string | null;
    database: string | null;
    sslmode: string | null;
  } | null;
};

export type OperationsSnapshot = {
  directDbConfigured: boolean;
  serviceRoleConfigured: boolean;
  telegramConfigured: boolean;
  latestBackup: BackupManifest | null;
  latestSimulationPath: string | null;
};

async function readJsonIfExists(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }
}

async function getLatestBackup() {
  let entries: string[] = [];

  try {
    entries = await fs.readdir(BACKUP_MANIFEST_DIR);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }

  const manifests = await Promise.all(
    entries
      .filter((name) => name.endsWith(".json"))
      .map(async (name) => {
        const manifestPath = path.join(BACKUP_MANIFEST_DIR, name);
        const parsed = await readJsonIfExists(manifestPath);

        if (!parsed) {
          return null;
        }

        const parsedDatabase =
          parsed.database &&
          typeof parsed.database === "object" &&
          !Array.isArray(parsed.database)
            ? (parsed.database as Record<string, unknown>)
            : null;

        const outputFile =
          typeof parsed.outputFile === "string" ? parsed.outputFile : null;
        const outputPath = outputFile ? path.join(ROOT_DIR, outputFile) : null;
        let outputExists = false;

        if (outputPath) {
          try {
            await fs.access(outputPath);
            outputExists = true;
          } catch {
            outputExists = false;
          }
        }

        return {
          manifestFile: path.relative(ROOT_DIR, manifestPath),
          outputFile,
          generatedAt:
            typeof parsed.generatedAt === "string" ? parsed.generatedAt : null,
          format: typeof parsed.format === "string" ? parsed.format : null,
          bytes: typeof parsed.bytes === "number" ? parsed.bytes : null,
          sha256: typeof parsed.sha256 === "string" ? parsed.sha256 : null,
          outputExists,
          database: parsedDatabase
            ? {
                host:
                  typeof parsedDatabase.host === "string"
                    ? parsedDatabase.host
                    : null,
                port:
                  typeof parsedDatabase.port === "string"
                    ? parsedDatabase.port
                    : null,
                database:
                  typeof parsedDatabase.database === "string"
                    ? parsedDatabase.database
                    : null,
                sslmode:
                  typeof parsedDatabase.sslmode === "string"
                    ? parsedDatabase.sslmode
                    : null,
              }
            : null,
        } satisfies BackupManifest;
      }),
  );

  return manifests
    .filter((value): value is BackupManifest => Boolean(value))
    .sort((left, right) =>
      String(right.generatedAt ?? "").localeCompare(String(left.generatedAt ?? "")),
    )[0] ?? null;
}

async function getLatestSimulationPath() {
  let entries: string[] = [];

  try {
    entries = await fs.readdir(SIMULATION_DIR);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }

  const latest = entries
    .filter((name) => name.endsWith(".md"))
    .sort((left, right) => right.localeCompare(left))[0];

  if (!latest) {
    return null;
  }

  return path.relative(ROOT_DIR, path.join(SIMULATION_DIR, latest));
}

export async function getOperationsSnapshot(): Promise<OperationsSnapshot> {
  const [latestBackup, latestSimulationPath] = await Promise.all([
    getLatestBackup(),
    getLatestSimulationPath(),
  ]);

  return {
    directDbConfigured: Boolean(process.env.SUPABASE_DB_URL?.trim()),
    serviceRoleConfigured: Boolean(appEnv.supabaseServiceRoleKey.trim()),
    telegramConfigured: Boolean(
      appEnv.telegramBotToken.trim() && appEnv.telegramChatId.trim(),
    ),
    latestBackup,
    latestSimulationPath,
  };
}
