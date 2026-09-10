import "server-only";
import { Pool, type PoolClient } from "pg";
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

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
