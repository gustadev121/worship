export interface AppEnv {
  JWT_SECRET: string;
  YOUTUBE_API_KEY?: string;
  SQLITE_FILE?: string;
  DB?: unknown;
}

export function resolveEnv(
  source?: Record<string, string | undefined>,
): AppEnv {
  const local: Record<string, string | undefined> =
    typeof Bun !== "undefined"
      ? { ...process.env, ...Bun.env }
      : typeof process !== "undefined"
        ? { ...process.env }
        : {};
  const env = { ...local, ...source };
  const JWT_SECRET = env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
  return {
    JWT_SECRET,
    YOUTUBE_API_KEY: env.YOUTUBE_API_KEY || undefined,
    SQLITE_FILE: env.SQLITE_FILE || undefined,
  };
}
