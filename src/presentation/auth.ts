import { cookies } from "next/headers";
import type { SessionPayload } from "@/core/application/ports";
import { getAuth } from "@/infrastructure/auth/better-auth";
import { getContainer } from "@/infrastructure/container";
import { type D1Binding, getDb } from "@/infrastructure/db/client";
import { getRequestEnv } from "./get-request-env";

export const SESSION_COOKIE = "better-auth.session_token";
export const LEGACY_SESSION_COOKIE = "wf_session";
export const SESSION_MAX_AGE = 604800;

/** Read the session cookie and verify it via Better Auth (with fallback to legacy JWT). */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const betterAuthToken =
    jar.get("better-auth.session_token")?.value ??
    jar.get("__Secure-better-auth.session_token")?.value;

  if (betterAuthToken) {
    try {
      const env = await getRequestEnv();
      const db = await getDb(env.DB as D1Binding);
      const auth = getAuth(
        db,
        env as unknown as Record<string, string | undefined>,
      );

      const reqHeaders = new Headers();
      reqHeaders.set("cookie", jar.toString());

      const sessionResult = await auth.api.getSession({
        headers: reqHeaders,
      });

      if (sessionResult) {
        const activeOrgId =
          (sessionResult.session as { activeOrganizationId?: string | null })
            .activeOrganizationId ?? null;

        return {
          sub: sessionResult.user.id,
          username: sessionResult.user.name,
          email: sessionResult.user.email,
          role: (sessionResult.user.role as "ADMIN" | "MEMBER") || "MEMBER",
          activeOrganizationId: activeOrgId,
          organizationRole: null,
        };
      }
    } catch {
      // Fall through to legacy token check
    }
  }

  // Legacy session check for backwards compatibility
  const legacyToken = jar.get(LEGACY_SESSION_COOKIE)?.value;
  if (legacyToken) {
    try {
      const container = await getContainer(await getRequestEnv());
      return await container.tokens.verify(legacyToken);
    } catch {
      return null;
    }
  }

  return null;
}

export function buildSessionCookie(token: string): string {
  const parts = [
    `${LEGACY_SESSION_COOKIE}=${token}`,
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

export const CLEAR_SESSION_COOKIE = `${LEGACY_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
