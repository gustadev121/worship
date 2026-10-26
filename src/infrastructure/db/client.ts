import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { sql } from "drizzle-orm";
import { type DrizzleD1Database, drizzle as drizzleD1 } from "drizzle-orm/d1";
import {
  drizzle as drizzleSqlJs,
  type SQLJsDatabase,
} from "drizzle-orm/sql-js";
// @ts-expect-error sql.js ships without type declarations; loaded via WASM at runtime
import initSqlJs from "sql.js";
import { schema } from "./schema";

export type Db =
  | SQLJsDatabase<typeof schema>
  | DrizzleD1Database<typeof schema>;

export interface DbEnv {
  DB?: Parameters<typeof drizzleD1>[0];
  SQLITE_FILE?: string;
}

export interface DatabaseHandle {
  db: Db;
  save: () => void;
}

// SQL-first migration, inlined at build time so request handlers never read
// it from disk (no filesystem under workerd).
import MIGRATION_SQL from "../../../drizzle/0001_init.sql?raw";

function migrationStatements(): string[] {
  return MIGRATION_SQL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function getDb(env: DbEnv): Promise<DatabaseHandle> {
  if (env.DB) {
    const db = drizzleD1(env.DB, { schema });
    await db.run(sql`PRAGMA foreign_keys = ON`);
    for (const stmt of migrationStatements()) {
      await db.run(sql.raw(stmt));
    }
    return { db, save: () => {} };
  }
  const file = resolve(env.SQLITE_FILE ?? "./data/worshipflow.db");
  mkdirSync(dirname(file), { recursive: true });
  const SQL = await initSqlJs();
  const raw = existsSync(file)
    ? new SQL.Database(readFileSync(file))
    : new SQL.Database();
  raw.exec("PRAGMA foreign_keys = ON;");
  for (const stmt of migrationStatements()) {
    raw.exec(`${stmt};`);
  }
  const db = drizzleSqlJs(raw, { schema });
  return {
    db,
    save: () => {
      writeFileSync(file, Buffer.from(raw.export()));
    },
  };
}
