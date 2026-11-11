import { getAuth } from "@/infrastructure/auth/better-auth";
import { type D1Binding, getDb } from "@/infrastructure/db/client";
import { CLEAR_SESSION_COOKIE } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";

export async function POST(req: Request): Promise<Response> {
  try {
    const env = await getRequestEnv();
    const db = await getDb(env.DB as D1Binding);
    const auth = getAuth(
      db,
      env as unknown as Record<string, string | undefined>,
    );
    await auth.api.signOut({ headers: req.headers });
  } catch {
    // Session may already be expired or missing
  }

  const clearBetterAuth =
    "better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
  const clearSecureBetterAuth =
    "__Secure-better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure";

  const headers = new Headers();
  headers.append("Set-Cookie", CLEAR_SESSION_COOKIE);
  headers.append("Set-Cookie", clearBetterAuth);
  headers.append("Set-Cookie", clearSecureBetterAuth);

  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    headers.set("Location", "/login");
    return new Response(null, { status: 302, headers });
  }

  return Response.json({ ok: true }, { headers });
}
