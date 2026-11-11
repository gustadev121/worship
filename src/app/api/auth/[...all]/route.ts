import { getAuth } from "@/infrastructure/auth/better-auth";
import { type D1Binding, getDb } from "@/infrastructure/db/client";
import { getRequestEnv } from "@/presentation/get-request-env";

export async function GET(req: Request): Promise<Response> {
  const env = await getRequestEnv();
  const db = await getDb(env.DB as D1Binding);
  const auth = getAuth(
    db,
    env as unknown as Record<string, string | undefined>,
  );
  return auth.handler(req);
}

export async function POST(req: Request): Promise<Response> {
  const env = await getRequestEnv();
  const db = await getDb(env.DB as D1Binding);
  const auth = getAuth(
    db,
    env as unknown as Record<string, string | undefined>,
  );
  return auth.handler(req);
}
