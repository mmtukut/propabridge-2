const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

// Prefer a single connection string if provided
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PG_CONNECTION_STRING;

let pool;

// Decide SSL based on environment and connection host
const shouldUseSslForHost = (host) => {
  if (!host) return isProduction;
  const normalized = host.toLowerCase();
  if (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1'
  ) {
    return false;
  }
  return true; // non-local hosts should use SSL by default in hosted envs
};

if (connectionString) {
  let ssl = false;
  try {
    const url = new URL(connectionString);
    const hasSslModeRequire = url.searchParams.get('sslmode') === 'require';
    ssl = hasSslModeRequire || (isProduction && shouldUseSslForHost(url.hostname))
      ? { rejectUnauthorized: false }
      : false;
  } catch {
    ssl = isProduction ? { rejectUnauthorized: false } : false;
  }

  pool = new Pool({
    connectionString,
    ssl,
  });
} else if (
  process.env.PGHOST ||
  process.env.PGUSER ||
  process.env.PGPASSWORD ||
  process.env.PGDATABASE
){
  // Fallback to individual PG* environment variables
  const host = process.env.PGHOST;
  const ssl = (process.env.PGSSLMODE === 'require' || (isProduction && shouldUseSslForHost(host)))
    ? { rejectUnauthorized: false }
    : false;

  pool = new Pool({
    host,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl,
  });
} else {
  // In production, fail fast if no configuration was provided to avoid implicit localhost attempts
  if (isProduction) {
    // eslint-disable-next-line no-console
    console.error(
      'Database configuration missing. Set DATABASE_URL (recommended) or PGHOST/PGUSER/PGPASSWORD/PGDATABASE in environment.'
    );
    process.exit(1);
  }
  // In development, allow pg defaults (localhost) for convenience
  pool = new Pool({
    ssl: false,
  });
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
