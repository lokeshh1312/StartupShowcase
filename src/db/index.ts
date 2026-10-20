import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var _showcaseDbClient: postgres.Sql | undefined;
}

const connectionString = process.env.DATABASE_URL;

function createClient(): postgres.Sql {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured. Please set DATABASE_URL in .env.local"
    );
  }

  // Supabase transaction pooler (port 6543) requires prepared statements disabled: prepare: false
  return postgres(connectionString, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

const client: postgres.Sql =
  globalThis._showcaseDbClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis._showcaseDbClient = client;
}

export const db = drizzle(client, { schema });
export type Database = typeof db;
export * from "./schema";
