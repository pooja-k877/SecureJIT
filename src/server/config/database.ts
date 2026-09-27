import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

// Auto-restore .env if deleted in local development
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  try {
    let exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    // Replace placeholder with default local credentials for local development
    exampleContent = exampleContent.replace('YOUR_PASSWORD', 'postgres');
    fs.writeFileSync(envPath, exampleContent, 'utf8');
    console.log('[Environment] Restored missing .env with default local PostgreSQL configuration.');
  } catch {}
}

const DEFAULT_LOCAL_PG = 'postgresql://postgres:postgres@localhost:5432/securejit';

export function getDatabaseUrl(): string | null {
  const envUrl = process.env.DATABASE_URL?.trim();
  if (envUrl && !envUrl.includes('YOUR_PASSWORD')) {
    return envUrl;
  }
  // In production, missing or unconfigured DATABASE_URL must not silently default to localhost
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  return DEFAULT_LOCAL_PG;
}

// Parse connection details safely for logging and diagnostics (NEVER log credentials)
export function getSafePostgresTargetInfo(): { host: string; port: string; database: string } {
  const connString = getDatabaseUrl() || '';
  try {
    if (connString.startsWith('postgres://') || connString.startsWith('postgresql://')) {
      const parsed = new URL(connString);
      return {
        host: parsed.hostname || 'localhost',
        port: parsed.port || '5432',
        database: parsed.pathname.replace(/^\//, '') || 'securejit',
      };
    }
  } catch {
    // Ignore URL parse error and fall through to environment variables
  }
  return {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || '5432',
    database: process.env.PGDATABASE || 'securejit',
  };
}

/**
 * PostgreSQL Connection Pool
 * Configured from DATABASE_URL with Azure SSL support if required
 */
const initialDbUrl = getDatabaseUrl() || DEFAULT_LOCAL_PG;
const isAzureHost = initialDbUrl.includes('azure.com') || initialDbUrl.includes('sslmode=require') || initialDbUrl.includes('ssl=true');

export const pool = new pg.Pool({
  connectionString: initialDbUrl,
  connectionTimeoutMillis: 8000,
  max: 20,
  idleTimeoutMillis: 30000,
  ...(isAzureHost ? { ssl: { rejectUnauthorized: false } } : {})
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error] Unexpected client error:', err.message);
});

export let isDatabaseConnected = false;

/**
 * Execute a parameterized PostgreSQL query against the PostgreSQL database
 * PostgreSQL is the ONLY database used by SecureJIT.
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  try {
    const res = await pool.query(sql, params);
    isDatabaseConnected = true;
    return {
      rows: res.rows as T[],
      rowCount: res.rowCount ?? res.rows.length,
    };
  } catch (err: any) {
    if (err.code === 'ECONNREFUSED' || err.code === '57P01' || err.message?.includes('Connection terminated')) {
      isDatabaseConnected = false;
    }
    throw err;
  }
}

/**
 * Health check helper to verify active PostgreSQL connectivity
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT 1 as ping;');
    const ok = (res.rowCount ?? 0) > 0 || res.rows.length > 0;
    if (ok) isDatabaseConnected = true;
    return ok;
  } catch {
    isDatabaseConnected = false;
    return false;
  }
}

/**
 * Initialize and verify PostgreSQL connection on startup.
 * If connection fails:
 * - Logs clear database connection error
 * - Displays "PostgreSQL connection failed. SecureJIT server was not started."
 * - NEVER falls back to in-memory/fake/PGlite databases
 */
export async function initDatabaseConnection(): Promise<boolean> {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    isDatabaseConnected = false;
    console.error('================================================================================');
    console.error('PostgreSQL connection failed. SecureJIT server was not started.');
    console.error('Configuration Error: DATABASE_URL environment variable is missing.');
    console.error('Please configure DATABASE_URL in your Azure App Service Application Settings.');
    console.error('Example: postgresql://username:password@your-pg-server.postgres.database.azure.com:5432/securejit?sslmode=require');
    console.error('================================================================================');
    return false;
  }

  const target = getSafePostgresTargetInfo();

  // If targeting local host, ensure local service is started if installed
  if ((target.host === 'localhost' || target.host === '127.0.0.1') && fs.existsSync('/usr/bin/pg_ctlcluster')) {
    try {
      const { execSync } = await import('child_process');
      try {
        execSync('pg_isready -h localhost -p ' + target.port, { stdio: 'ignore', timeout: 1000 });
      } catch {
        console.log('[PostgreSQL] Local cluster appears idle, ensuring PostgreSQL service is running...');
        execSync('pg_ctlcluster 15 main start || service postgresql start', { stdio: 'ignore', timeout: 5000 });
      }
    } catch {}
  }

  console.log(`[PostgreSQL] Connecting to PostgreSQL database at ${target.host}:${target.port}/${target.database}...`);

  let client: pg.PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('SELECT 1;');
    isDatabaseConnected = true;
    console.log(`[PostgreSQL] Connected successfully to PostgreSQL at ${target.host}:${target.port}/${target.database}.`);
  } catch (err: any) {
    isDatabaseConnected = false;
    console.error('================================================================================');
    console.error('PostgreSQL connection failed. SecureJIT server was not started.');
    console.error(`Target Host     : ${target.host}`);
    console.error(`Target Port     : ${target.port}`);
    console.error(`Target Database : ${target.database}`);
    console.error(`Error Details   : ${err.message}`);
    console.error('Please ensure your PostgreSQL server is running and DATABASE_URL is correct.');
    console.error('================================================================================');
    if (client) {
      try { client.release(); } catch {}
    }
    return false;
  } finally {
    if (client) {
      try { client.release(); } catch {}
    }
  }

  // Verify and initialize schema and seed data non-destructively
  await initDatabaseSchemaAndSeed();
  return true;
}

/**
 * Automatically applies non-destructive schema and seeds initial data ONLY IF database is empty.
 * Never executes DROP TABLE or TRUNCATE automatically during normal server startup.
 */
async function initDatabaseSchemaAndSeed(): Promise<void> {
  try {
    // Check if required tables exist
    const checkTablesRes = await pool.query<{ count: string }>(`
      SELECT COUNT(*)::text as count FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'access_requests', 'active_access', 'audit_logs', 'notifications');
    `);

    const tableCount = parseInt(checkTablesRes.rows[0]?.count || '0', 10);

    // If any of the 5 required tables are missing, create missing tables non-destructively
    if (tableCount < 5) {
      console.log('[PostgreSQL Setup] Provisioning missing relational tables (non-destructive)...');
      
      const schemaPath = path.join(rootDir, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        let schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // Ensure no DROP TABLE statement is ever executed during normal startup
        schemaSql = schemaSql.replace(/DROP\s+TABLE\s+IF\s+EXISTS[^;]+;/gi, '-- DROP TABLE bypassed during safe startup');
        await pool.query(schemaSql);
        console.log('[PostgreSQL Setup] Relational tables and indexes confirmed.');
      }
    }

    // Check if users table has any records
    const checkUsersRes = await pool.query<{ count: string }>('SELECT COUNT(*)::text as count FROM users;');
    const userCount = parseInt(checkUsersRes.rows[0]?.count || '0', 10);

    // Seed ONLY when the database is completely empty (never overwrite existing production data)
    if (userCount === 0) {
      console.log('[PostgreSQL Setup] Database is empty. Seeding initial baseline demo accounts and records...');
      const seedPath = path.join(rootDir, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        let seedSql = fs.readFileSync(seedPath, 'utf8');
        // Ensure no TRUNCATE statement is ever executed during safe startup
        seedSql = seedSql.replace(/TRUNCATE\s+TABLE[^;]+;/gi, '-- TRUNCATE bypassed during safe startup');
        await pool.query(seedSql);
        console.log('[PostgreSQL Setup] Initial baseline records seeded successfully.');
      }
    } else {
      console.log(`[PostgreSQL Setup] Verified existing database with ${userCount} user record(s). Preserving all production data.`);
    }
  } catch (err: any) {
    console.error('[PostgreSQL Schema Setup Error] Failed while checking schema or seed status:', err.message);
    throw err;
  }
}
