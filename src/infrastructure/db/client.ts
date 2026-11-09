import { sql } from "drizzle-orm";
import { type DrizzleD1Database, drizzle as drizzleD1 } from "drizzle-orm/d1";
import { schema } from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

export type D1Binding = Parameters<typeof drizzleD1>[0];

// SQL-first migration, inlined at build time so request handlers never read
// it from disk (no filesystem under workerd).
import MIGRATION_SQL from "../../../drizzle/0001_init.sql?raw";

function migrationStatements(): string[] {
  return MIGRATION_SQL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Single local database: Cloudflare D1. In `dev` the worker runtime provides
 * the `DB` binding backed by `.wrangler/state` (miniflare); `seed` writes to
 * that same database. There is no sqlite fallback — one database, no drift.
 */
export async function getDb(binding: D1Binding): Promise<Db> {
  const db = drizzleD1(binding, { schema });
  await db.run(sql`PRAGMA foreign_keys = ON`);
  for (const stmt of migrationStatements()) {
    await db.run(sql.raw(stmt));
  }
  return db;
}

/**
 * D1 via drizzle rejects with DrizzleQueryError (generic message); the real
 * UNIQUE text lives in `cause` (D1_ERROR → root sqlite error). Walk the
 * chain so repositories map conflicts to ConflictError on every backend.
 */
export function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current !== null && current !== undefined && !seen.has(current)) {
    seen.add(current);
    const message =
      current instanceof Error ? current.message : String(current);
    if (/UNIQUE constraint failed|unique/i.test(message)) {
      return true;
    }
    current =
      current instanceof Error
        ? (current as Error & { cause?: unknown }).cause
        : undefined;
  }
  return false;
}
