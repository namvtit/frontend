import "server-only";
import { Pool } from "pg";
import { databaseConfig } from "./config.mjs";

const globalForDb = globalThis as typeof globalThis & { databasePool?: Pool };

export function getDatabase(): Pool {
  if (!globalForDb.databasePool) {
    const pool = new Pool({ ...databaseConfig(), max: 10, idleTimeoutMillis: 30000 });
    // Idle connections can fail during a database restart; keep the process alive.
    pool.on("error", () => console.error("An idle PostgreSQL connection failed."));
    globalForDb.databasePool = pool;
  }
  return globalForDb.databasePool;
}
