import { config as loadEnv } from "dotenv";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import postgres from "postgres";
import * as schema from "./schema.pg";

loadEnv({ path: ".env" });

const connectionString =
  process.env.POSTGRES_URL || process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error(
    "POSTGRES_URL or DATABASE_URL is required to verify the Web database.",
  );
  process.exit(1);
}

const connection = postgres(connectionString, { max: 1 });

try {
  const missing: string[] = [];
  const checkedTables = new Set<string>();

  for (const value of Object.values(schema)) {
    let tableConfig: ReturnType<typeof getTableConfig>;
    try {
      tableConfig = getTableConfig(value as PgTable);
    } catch {
      continue;
    }

    if (!tableConfig.name || checkedTables.has(tableConfig.name)) continue;
    checkedTables.add(tableConfig.name);

    const rows = await connection<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ${tableConfig.schema ?? "public"}
        AND table_name = ${tableConfig.name}
    `;
    const actualColumns = new Set(rows.map((row) => row.column_name));

    if (rows.length === 0) {
      missing.push(`${tableConfig.name}: table is missing`);
      continue;
    }

    const missingColumns = tableConfig.columns
      .map((column) => column.name)
      .filter((columnName) => !actualColumns.has(columnName));
    if (missingColumns.length > 0) {
      missing.push(`${tableConfig.name}: ${missingColumns.join(", ")}`);
    }
  }

  const extension = await connection<{ installed: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) AS installed
  `;
  if (!extension[0]?.installed) {
    missing.push("extension: vector is not installed");
  }

  if (missing.length > 0) {
    console.error("Web database schema is incomplete:\n");
    for (const item of missing) console.error(`- ${item}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Verified ${checkedTables.size} PostgreSQL tables and pgvector.`,
    );
  }
} finally {
  await connection.end();
}
