export function databaseConfig() {
  for (const name of ["PGHOST", "POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD"]) {
    if (!process.env[name]) throw new Error(`Missing database environment variable: ${name}`);
  }

  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    connectionTimeoutMillis: 3000,
    statement_timeout: 5000,
  };
}
