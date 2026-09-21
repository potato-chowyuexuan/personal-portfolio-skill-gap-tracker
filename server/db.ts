import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is required. Set it to your Postgres connection string (e.g. from Neon)."
  );
}

// Neon (and most managed Postgres providers) require SSL. rejectUnauthorized
// is disabled because the sandboxed CA bundle in some hosting environments
// doesn't include the provider's chain; the connection is still encrypted.
export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});
