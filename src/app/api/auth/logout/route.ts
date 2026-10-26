import { CLEAR_SESSION_COOKIE } from "@/presentation/auth";

export async function POST(): Promise<Response> {
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": CLEAR_SESSION_COOKIE } },
  );
}
