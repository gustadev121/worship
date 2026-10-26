/**
 * Architecture gate: core layers must stay framework-free.
 * - domain: zero external imports (not even zod).
 * - application: may import `../domain` and `zod` only.
 * Fails (exit 1) on any import of infrastructure/presentation/framework modules.
 */
import { Glob } from "bun";

const DOMAIN_GLOB = "src/core/domain/**/*.{ts,tsx}";
const APP_GLOB = "src/core/application/**/*.{ts,tsx}";

const FORBIDDEN = [
  "infrastructure",
  "presentation",
  "/app/",
  "vinext",
  "react",
  "drizzle-orm",
  "jose",
  "@cloudflare",
  "cloudflare:",
  "node:",
  "bun:",
] as const;

// Matches: import ... from "x" | import("x") | export ... from "x" | require("x")
const IMPORT_RE =
  /(?:import\s+(?:[^"']*?\sfrom\s)?|export\s+[^"']*?\sfrom\s|require\s*\(|import\s*\()\s*["']([^"']+)["']/g;

async function filesOf(pattern: string): Promise<string[]> {
  const glob = new Glob(pattern);
  const out: string[] = [];
  for await (const f of glob.scan({ cwd: process.cwd(), absolute: false }))
    out.push(f);
  return out.sort();
}

function violationsOf(source: string, allowZod: boolean): string[] {
  const hits: string[] = [];
  for (const m of source.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? "";
    if (spec.startsWith(".") || spec.startsWith("@/") || spec.startsWith("~/"))
      continue;
    if (
      spec.startsWith("../domain") ||
      spec.startsWith("./") ||
      spec === "../domain"
    )
      continue;
    if (spec === "zod") {
      if (!allowZod) hits.push(spec);
      continue;
    }
    if (FORBIDDEN.some((f) => spec === f || spec.includes(f))) hits.push(spec);
    else if (!spec.startsWith("../") && !allowZod) hits.push(spec);
    else if (!spec.startsWith("../") && allowZod) hits.push(spec);
  }
  return hits;
}

let failed = false;

for (const layer of [
  { glob: DOMAIN_GLOB, allowZod: false, name: "domain" },
  { glob: APP_GLOB, allowZod: true, name: "application" },
] as const) {
  const files = await filesOf(layer.glob);
  for (const f of files) {
    const src = await Bun.file(f).text();
    const bad = violationsOf(src, layer.allowZod);
    if (bad.length > 0) {
      failed = true;
      console.error(
        `[arch] ${layer.name} violation in ${f}: ${[...new Set(bad)].join(", ")}`,
      );
    }
  }
}

if (failed) {
  console.error("[arch] FAILED: core layer imports framework/infra code");
  process.exit(1);
}
console.log("[arch] OK: core layers are pure");
