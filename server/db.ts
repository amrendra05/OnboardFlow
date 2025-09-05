import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// For local development, use standard postgres-js
// This will work with both local PostgreSQL and most remote PostgreSQL databases
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle({ client, schema });

// If you need Neon-specific features in production, you can add conditional logic here
// But for most cases, postgres-js works with both local and remote databases