import nextEnv from "@next/env";
import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
import { databaseConfig } from "../lib/db/config.mjs";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function migrate() {
  const client = new pg.Client({ ...databaseConfig(), statement_timeout: 0 });
  try {
    await client.connect();
    // Serialize runners, including multiple web instances starting together.
    await client.query("SELECT pg_advisory_lock(73012419)");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const directory = new URL("../migrations/", import.meta.url);
    const files = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
    const { rows } = await client.query("SELECT name FROM schema_migrations");
    const applied = new Set(rows.map((row) => row.name));

    for (const name of files) {
      if (applied.has(name)) continue;
      const sql = await readFile(new URL(name, directory), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
        console.log(`Applied ${name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    console.log("Database migrations are up to date.");
  } finally {
    // Closing the session also releases the advisory lock after any failure.
    await client.end();
  }
}

migrate().catch(() => {
  console.error("Database migration failed. Check database configuration and pending SQL migrations.");
  process.exitCode = 1;
});
