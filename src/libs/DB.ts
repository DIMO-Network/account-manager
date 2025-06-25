import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '@/models/Schema';
import { Env } from './Env';

let dbInstance: ReturnType<typeof drizzle> | null = null;
let client: Client | null = null;

export async function getDB() {
  if (dbInstance) {
    return dbInstance;
  }

  // Runtime check for DATABASE_URL
  if (!Env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required at runtime');
  }

  // Create new connection
  client = new Client({
    connectionString: Env.DATABASE_URL,
  });

  await client.connect();
  dbInstance = drizzle(client, { schema });

  return dbInstance;
}

// For backwards compatibility
export const db = getDB();
