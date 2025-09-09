import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure postgres client with SSL handling
const databaseUrl = process.env.DATABASE_URL;

// Configure connection based on environment
let finalUrl = databaseUrl;
let connectionConfig: any = {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30, // Increased for Cloud SQL
};

// Local development
if ((databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) && !databaseUrl.includes('sslmode')) {
  finalUrl = databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'sslmode=disable';
}
// Cloud SQL (GCP App Engine) - Enhanced configuration
else if (process.env.NODE_ENV === 'production') {
  connectionConfig = {
    ...connectionConfig,
    ssl: { rejectUnauthorized: false },
    connect_timeout: 60, // Longer timeout for Cloud SQL
    command_timeout: 60,
    max: 5, // Fewer connections for App Engine
    prepare: false, // Disable prepared statements for Cloud SQL
  };
}

const client = postgres(finalUrl, connectionConfig);

export const db = drizzle({ client, schema });

// If you need Neon-specific features in production, you can add conditional logic here
// But for most cases, postgres-js works with both local and remote databases