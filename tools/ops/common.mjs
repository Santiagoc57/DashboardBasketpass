#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { promises as fsPromises } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(__dirname, "../..");
export const DEFAULT_BACKUP_DIR = path.join(ROOT_DIR, "backups", "db");
export const DEFAULT_MANIFEST_DIR = path.join(ROOT_DIR, "backups", "manifests");

export function loadEnv() {
  dotenv.config({ path: path.join(ROOT_DIR, ".env.local"), quiet: true });
  dotenv.config({ path: path.join(ROOT_DIR, ".env"), quiet: true });
}

function readRawEnvValue(name) {
  const envPaths = [path.join(ROOT_DIR, ".env.local"), path.join(ROOT_DIR, ".env")];

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) {
      continue;
    }

    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line.startsWith(`${name}=`)) {
        continue;
      }

      let value = line.slice(name.length + 1).trim();
      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      return value;
    }
  }

  return null;
}

export function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function parseArgs(argv) {
  const parsed = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current.startsWith("--")) {
      parsed._.push(current);
      continue;
    }

    const flag = current.slice(2);
    const equalsIndex = flag.indexOf("=");

    if (equalsIndex >= 0) {
      const key = flag.slice(0, equalsIndex);
      parsed[key] = flag.slice(equalsIndex + 1);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      parsed[flag] = next;
      index += 1;
      continue;
    }

    parsed[flag] = true;
  }

  return parsed;
}

function safeDecodeURIComponent(value) {
  if (!value.includes("%")) {
    return value;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function sanitizeTag(value) {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function timestampLabel(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ];

  return `${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}${parts[5]}`;
}

export function ensureCommand(command) {
  const result = spawnSync("which", [command], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Required command is not available: ${command}`);
  }

  return result.stdout.trim();
}

export function runCommand(command, args) {
  let extraEnv = {};
  let commandArgs = args;

  if (
    args.length &&
    typeof args.at(-1) === "object" &&
    args.at(-1) !== null &&
    !Array.isArray(args.at(-1))
  ) {
    extraEnv = args.at(-1);
    commandArgs = args.slice(0, -1);
  }

  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status ?? 1}`);
  }
}

export async function ensureDir(directoryPath) {
  await fsPromises.mkdir(directoryPath, { recursive: true });
}

export async function ensureFileExists(filePath) {
  await fsPromises.access(filePath, fs.constants.F_OK);
}

export async function sha256File(filePath) {
  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export function relativeToRoot(filePath) {
  return path.relative(ROOT_DIR, filePath) || ".";
}

export function summarizeDatabaseUrl(connectionString) {
  const url = new URL(connectionString);

  return {
    host: url.hostname,
    port: url.port || "5432",
    database: url.pathname.replace(/^\//, "") || "postgres",
    sslmode: url.searchParams.get("sslmode") ?? null,
  };
}

export function renderCommand(command, args) {
  return [command, ...args].join(" ");
}

export function redactArgs(args, valuesToRedact) {
  return args.map((value) =>
    valuesToRedact.includes(value) ? "<SUPABASE_DB_URL>" : value,
  );
}

export function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

export async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fsPromises.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function resolveDbConnection(rawOverride = null) {
  const rawValue = rawOverride?.trim() || readRawEnvValue("SUPABASE_DB_URL") || process.env.SUPABASE_DB_URL?.trim();
  if (!rawValue) {
    throw new Error("Missing required environment variable: SUPABASE_DB_URL");
  }

  const parsed = new URL(rawValue);
  const hostPort = `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;
  const authorityMarker = `@${hostPort}`;
  const authorityStart = rawValue.indexOf("://") >= 0 ? rawValue.indexOf("://") + 3 : 0;
  const markerIndex = rawValue.lastIndexOf(authorityMarker);
  const credentials = markerIndex >= 0 ? rawValue.slice(authorityStart, markerIndex) : "";
  const separatorIndex = credentials.indexOf(":");
  const rawPassword =
    separatorIndex >= 0
      ? credentials.slice(separatorIndex + 1)
      : parsed.password;

  return {
    rawConnectionString: rawValue,
    host: parsed.hostname,
    port: parsed.port || "5432",
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    user: safeDecodeURIComponent(parsed.username || "postgres"),
    password: safeDecodeURIComponent(rawPassword),
    sslmode:
      parsed.searchParams.get("sslmode") ||
      (parsed.hostname.endsWith(".supabase.co") ? "require" : null),
  };
}
