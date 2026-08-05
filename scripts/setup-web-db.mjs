#!/usr/bin/env node

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { connect } from "node:net";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const webEnvPath = path.join(rootDir, "apps", "web", ".env");
const localDatabaseUrl =
  "postgres://openrice:openrice_dev@127.0.0.1:54329/openrice";

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const values = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function run(command, args, options = {}) {
  const executable =
    process.platform === "win32" && command === "pnpm" ? "pnpm.cmd" : command;
  const result = spawnSync(executable, args, {
    cwd: rootDir,
    stdio: "inherit",
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function dockerIsAvailable() {
  const result = spawnSync("docker", ["compose", "version"], {
    cwd: rootDir,
    stdio: "ignore",
  });
  return !result.error && result.status === 0;
}

function waitForPort(host, port, timeoutMs = 60_000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = connect({ host, port });
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - startedAt >= timeoutMs) {
          reject(
            new Error(`PostgreSQL did not become ready on ${host}:${port}`),
          );
          return;
        }
        setTimeout(attempt, 500);
      });
    };
    attempt();
  });
}

const fileEnv = readEnvFile(webEnvPath);
let databaseUrl =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  fileEnv.POSTGRES_URL ||
  fileEnv.DATABASE_URL;

if (!databaseUrl) {
  if (!dockerIsAvailable()) {
    console.error(
      [
        "\nWeb mode requires PostgreSQL.",
        "Install Docker Desktop and run pnpm dev again, or set POSTGRES_URL in apps/web/.env.",
        "Desktop/SQLite mode is available with pnpm tauri:dev.\n",
      ].join("\n"),
    );
    process.exit(1);
  }

  console.log("Starting the isolated OpenRice development database...");
  run("docker", ["compose", "-f", "compose.dev.yml", "up", "-d", "postgres"]);
  await waitForPort("127.0.0.1", 54329);

  appendFileSync(
    webEnvPath,
    `\n# Local Web development database (managed by pnpm db:setup)\nPOSTGRES_URL=${localDatabaseUrl}\n`,
  );
  databaseUrl = localDatabaseUrl;
  console.log("Added the local POSTGRES_URL to apps/web/.env.");
}

const childEnv = {
  ...process.env,
  POSTGRES_URL: databaseUrl,
};

run("pnpm", ["--filter", "web", "db:migrate"], { env: childEnv });
run("pnpm", ["--filter", "web", "db:verify"], { env: childEnv });
console.log("Web database is ready.");
