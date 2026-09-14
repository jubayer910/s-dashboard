import { neon } from "@neondatabase/serverless";
import type { SQL } from "drizzle-orm";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = NeonHttpDatabase<typeof schema>;

let instance: Promise<Database> | null = null;

// Route handlers and server components load as separate module graphs in dev;
// share one in-process PGlite so they read and write the same data.
const globalForPglite = globalThis as unknown as { stridePglite?: unknown };

async function connect(): Promise<Database> {
  // Local development without a cloud database: PGLITE_DIR=.pglite runs Postgres in-process.
  const pgliteDir = process.env.PGLITE_DIR;
  if (pgliteDir && process.env.VERCEL !== "1") {
    const [{ PGlite }, { drizzle: drizzlePglite }] = await Promise.all([
      import("@electric-sql/pglite"),
      import("drizzle-orm/pglite"),
    ]);
    globalForPglite.stridePglite ??= new PGlite(pgliteDir);
    return drizzlePglite(globalForPglite.stridePglite as InstanceType<typeof PGlite>, { schema }) as unknown as Database;
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Connect the Neon database to this project.");
  return drizzle(neon(url), { schema });
}

export function getDb() {
  instance ??= connect().catch((error) => {
    instance = null;
    throw error;
  });
  return instance;
}

/** Runs a raw SQL query and returns typed rows. */
export async function query<T>(statement: SQL): Promise<T[]> {
  const result = await (await getDb()).execute(statement);
  return result.rows as T[];
}

export { schema };
