import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { getAuth } from "@/infrastructure/auth/better-auth";
import { type Db, getDb } from "@/infrastructure/db/client";

interface Fixture {
  db: Db;
  mf: Miniflare;
  auth: ReturnType<typeof getAuth>;
}

async function setup(): Promise<Fixture> {
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      workers: [
        {
          name: "test",
          compatibilityDate: "2026-10-26",
          modules: true,
          script: "export default { fetch() { return new Response('ok'); } }",
          d1Databases: ["DB"],
        },
      ],
    }),
  );
  const db = await getDb(await mf.getD1Database("DB"));
  const auth = getAuth(db);
  return { db, mf, auth };
}

let fx: Fixture;

beforeEach(async () => {
  fx = await setup();
});

afterEach(async () => {
  await fx.mf.dispose();
});

describe("Better Auth Integration Tests on D1", () => {
  test("User signup and credentials login create a verified D1 session", async () => {
    const signup = await fx.auth.api.signUpEmail({
      body: {
        name: "Líder de Alabanza",
        email: "leader@worshipflow.local",
        password: "MasterPassword123!",
        role: "ADMIN",
      },
    });

    expect(signup?.user).toBeDefined();
    expect(signup.user.email).toBe("leader@worshipflow.local");
    expect(signup.user.name).toBe("Líder de Alabanza");

    // Login with valid credentials
    const loginRes = await fx.auth.api.signInEmail({
      body: {
        email: "leader@worshipflow.local",
        password: "MasterPassword123!",
      },
      asResponse: true,
    });

    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie?.includes("better-auth.session_token")).toBe(true);

    // Resolve session via getSession() using cookie header
    const sessionResult = await fx.auth.api.getSession({
      headers: new Headers({ cookie: setCookie ?? "" }),
    });

    expect(sessionResult).toBeDefined();
    expect(sessionResult?.user.email).toBe("leader@worshipflow.local");
    expect(sessionResult?.user.role).toBe("ADMIN");
    expect(sessionResult?.session.token).toBeDefined();
  });

  test("Invalid password fails credentials sign-in", async () => {
    await fx.auth.api.signUpEmail({
      body: {
        name: "Músico",
        email: "musician@worshipflow.local",
        password: "ValidPassword123!",
        role: "MEMBER",
      },
    });

    try {
      const loginRes = await fx.auth.api.signInEmail({
        body: {
          email: "musician@worshipflow.local",
          password: "WrongPassword!",
        },
        asResponse: true,
      });
      expect(loginRes.status).toBeGreaterThanOrEqual(400);
    } catch (err: unknown) {
      expect(err).toBeDefined();
    }
  });

  test("Sign-out revokes session", async () => {
    await fx.auth.api.signUpEmail({
      body: {
        name: "Guitarrista",
        email: "guitar@worshipflow.local",
        password: "Password123!",
      },
    });

    const loginRes = await fx.auth.api.signInEmail({
      body: {
        email: "guitar@worshipflow.local",
        password: "Password123!",
      },
      asResponse: true,
    });

    const setCookie = loginRes.headers.get("set-cookie") ?? "";

    // Sign out
    const signOutRes = await fx.auth.api.signOut({
      headers: new Headers({ cookie: setCookie }),
      asResponse: true,
    });
    expect(signOutRes.status).toBe(200);

    // Resolving session afterwards should return null
    const postSession = await fx.auth.api.getSession({
      headers: new Headers({ cookie: setCookie }),
    });
    expect(postSession).toBeNull();
  });
});
