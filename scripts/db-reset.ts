/**
 * Drop every table in the public schema (plus the Drizzle migration log)
 * and re-run migrations + seed (100 tickets, admin user). Use this while
 * the raffle has no real data.
 *
 * Usage:
 *   bun run db:reset            # asks for confirmation
 *   bun run db:reset -- --yes   # skips the confirmation
 */
import { createInterface } from "node:readline/promises";

import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { runSetup } from "./db-setup";

async function dropAllTables() {
  const res = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );
  for (const { tablename } of res.rows) {
    await db.execute(sql`drop table if exists public.${sql.identifier(tablename)} cascade`);
  }
  // The neon-http migrator keeps its log in a dedicated schema; clear it too,
  // otherwise migrate() would skip earlier migrations after this reset.
  await db.execute(sql`drop schema if exists drizzle cascade`);
  console.log(`🗑️  Dropped ${res.rows.length} tables + migration log.`);
}

async function confirm(): Promise<boolean> {
  if (process.argv.includes("--yes") || process.argv.includes("-y")) return true;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('⚠️  This will DELETE ALL data in the database. Type "reset" to continue: ');
  rl.close();
  return answer.trim().toLowerCase() === "reset";
}

async function main() {
  if (!(await confirm())) {
    console.log("❌ Cancelled — nothing was changed.");
    return;
  }
  await dropAllTables();
  await runSetup();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
