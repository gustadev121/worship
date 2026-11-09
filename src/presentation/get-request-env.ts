import { env as workerEnv } from "cloudflare:workers";
import { type AppEnv, resolveEnv } from "@/infrastructure/env";

function workerVars(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(
    workerEnv as Record<string, unknown>,
  )) {
    out[key] = typeof value === "string" ? value : undefined;
  }
  return out;
}

/**
 * Request-scoped env: Worker bindings + vars when running under Cloudflare
 * Workers (`cloudflare:workers`), merged over local process/Bun env. The DB
 * binding is always D1 (local D1 en dev, D1 real en prod): una sola base.
 * The ONLY module importing `cloudflare:workers`.
 */
export async function getRequestEnv(): Promise<AppEnv> {
  let source: Record<string, string | undefined> | undefined;
  try {
    source = { ...workerVars() };
  } catch {
    source = undefined;
  }
  const base = resolveEnv(source);
  const db = (workerEnv as Record<string, unknown>).DB;
  if (db !== undefined) {
    return { ...base, DB: db };
  }
  return base;
}
