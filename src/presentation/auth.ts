import { cookies } from "next/headers";
import type { SessionPayload } from "@/core/application/ports";
import { getContainer } from "@/infrastructure/container";
import { getRequestEnv } from "./get-request-env";

export const SESSION_COOKIE = "wf_session";
export const SESSION_MAX_AGE = 604800;

/** Read the session cookie and verify it. Returns null when missing/invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  try {
    const container = await getContainer(await getRequestEnv());
    return await container.tokens.verify(token);
  } catch {
    return null;
  }
}

export function buildSessionCookie(token: string): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE}`,
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export const CLEAR_SESSION_COOKIE = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
