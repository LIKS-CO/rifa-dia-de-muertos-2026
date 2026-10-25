import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Database factory using Neon serverless driver.
 *
 * Requires DATABASE_URL to be set (Neon or any Postgres).
 * No local fallback — PGlite has WASM path resolution issues in this environment.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. For local development, use a Neon dev branch or a local Postgres instance.",
  );
}

export const db = neonDrizzle(connectionString, { schema }) as NeonHttpDatabase<
  typeof schema
>;

export type Db = typeof db;
export const isLocalPglite = false;

export { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
export * as schemaExport from "./schema";