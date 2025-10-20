const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Prefer a single connection string if provided
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PG_CONNECTION_STRING;

let pool;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : true,
  });
} else if (
  process.env.PGHOST ||
  process.env.PGUSER ||
  process.env.PGPASSWORD ||
  process.env.PGDATABASE
){
  // Fallback to individual PG* environment variables
  pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: isProduction ? { rejectUnauthorized: false } : true,
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
