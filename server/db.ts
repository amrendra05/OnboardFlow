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

// Add sslmode=disable for local development if not already specified
let finalUrl = databaseUrl;
if ((databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) && !databaseUrl.includes('sslmode')) {
  finalUrl = databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'sslmode=disable';
}

const client = postgres(finalUrl, {
  // Configure connection pool
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle({ client, schema });

// If you need Neon-specific features in production, you can add conditional logic here
// But for most cases, postgres-js works with both local and remote databases