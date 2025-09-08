import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

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
  connect_timeout: 10,
};

// Local development
if ((databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) && !databaseUrl.includes('sslmode')) {
  finalUrl = databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'sslmode=disable';
}
// Cloud SQL (GCP App Engine)
else if (process.env.NODE_ENV === 'production') {
  connectionConfig.ssl = { rejectUnauthorized: false };
}

const client = postgres(finalUrl, connectionConfig);

export const db = drizzle({ client, schema });

// If you need Neon-specific features in production, you can add conditional logic here
// But for most cases, postgres-js works with both local and remote databases