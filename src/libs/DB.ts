import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '@/models/Schema';
import { Env } from './Env';

if (!Env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = new Client({
  connectionString: Env.DATABASE_URL,
});

await client.connect();

export const db = drizzle(client, { schema });
