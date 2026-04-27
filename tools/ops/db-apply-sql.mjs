#!/usr/bin/env node

import path from "node:path";
import process from "node:process";

import {
  ensureCommand,
  loadEnv,
  parseArgs,
  printJson,
  redactArgs,
  relativeToRoot,
  renderCommand,
  resolveDbConnection,
  ROOT_DIR,
  runCommand,
} from "./common.mjs";

function printHelp() {
  console.log(`Usage:
  npm run ops:db-apply -- --file supabase/migrations/0014_harden_collaborator_rls.sql
  npm run ops:db-apply -- --file supabase/migrations/0003_add_operator_roles.sql --no-single-transaction
  npm run ops:db-apply -- --file scripts/manual-fix.sql --dry-run
`);
}

function resolveSqlFile(input) {
  if (!input?.trim()) {
    throw new Error("Missing required flag: --file <path-to-sql-file>");
  }

  return path.resolve(ROOT_DIR, input);
}

async function main() {
  loadEnv();

  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const sqlFile = resolveSqlFile(args.file);
  const connection = resolveDbConnection(args["db-url"]);
  const psqlPath = ensureCommand("psql");

  const psqlArgs = [
    "--host",
    connection.host,
    "--port",
    connection.port,
    "--username",
    connection.user,
    "--dbname",
    connection.database,
    "--file",
    sqlFile,
    "--set",
    "ON_ERROR_STOP=1",
  ];

  const singleTransactionEnabled =
    !args["no-single-transaction"] &&
    args["single-transaction"] !== "false" &&
    args["single-transaction"] !== false;

  if (singleTransactionEnabled) {
    psqlArgs.push("--single-transaction");
  }

  const plan = {
    ok: true,
    dryRun: Boolean(args["dry-run"]),
    file: relativeToRoot(sqlFile),
    database: {
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.user,
      sslmode: connection.sslmode,
    },
    command: renderCommand(psqlPath, redactArgs(psqlArgs, [connection.password])),
  };

  if (args["dry-run"]) {
    printJson(plan);
    return;
  }

  runCommand(psqlPath, [
    ...psqlArgs,
    {
      PGPASSWORD: connection.password,
      ...(connection.sslmode ? { PGSSLMODE: connection.sslmode } : {}),
    },
  ]);

  printJson({
    ok: true,
    file: relativeToRoot(sqlFile),
    database: {
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.user,
      sslmode: connection.sslmode,
    },
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
