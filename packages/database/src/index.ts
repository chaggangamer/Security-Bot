import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export * from './schema.js';

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 10, prepare: false });
  return { db: drizzle(client), close: () => client.end() };
}
