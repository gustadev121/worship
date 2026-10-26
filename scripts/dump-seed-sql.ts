/**
 * Dumps data/worshipflow.db seed tables to .wrangler/seed.sql for
 * `wrangler d1 execute worshipflow --local --file=...`.
 * Local D1 (miniflare) cannot see host-filesystem writes, so seeding must go
 * through wrangler while the data originates from `bun run seed`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
// @ts-expect-error sql.js ships without type declarations; loaded via WASM at runtime
import initSqlJs from "sql.js";

const SQL = await initSqlJs();
const db = new SQL.Database(readFileSync("data/worshipflow.db"));
const tables = ["users", "songs", "role_assignments", "labels", "song_labels"];
const quote = (v: unknown) =>
  v === null ? "NULL" : `'${String(v).replaceAll("'", "''")}'`;
let out =
  "DELETE FROM song_labels;\nDELETE FROM role_assignments;\nDELETE FROM songs;\nDELETE FROM labels;\nDELETE FROM users;\n";
for (const t of tables) {
  const cols =
    db.exec(`PRAGMA table_info(${t})`)[0]?.values.map((r: unknown[]) => r[1]) ??
    [];
  const rows = db.exec(`SELECT * FROM ${t}`)[0]?.values ?? [];
  for (const row of rows) {
    out += `INSERT INTO ${t} (${cols.join(", ")}) VALUES (${row.map(quote).join(", ")});\n`;
  }
}
mkdirSync(".wrangler", { recursive: true });
writeFileSync(".wrangler/seed.sql", out);
console.log(
  `wrote .wrangler/seed.sql (${out.split("\n").filter((l) => l.length > 0).length} rows)`,
);
