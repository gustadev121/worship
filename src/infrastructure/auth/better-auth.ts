import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import type { Db } from "../db/client";
import {
  account,
  invitation,
  member,
  organization as organizationTable,
  session,
  user,
  verification,
} from "../db/schema";

export type AuthInstance = ReturnType<typeof createBetterAuth>;

// WeakMap cache so the Better Auth instance is created once per D1 Db instance
const authCache = new WeakMap<object, AuthInstance>();

function createBetterAuth(
  db: Db,
  env?: {
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    JWT_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
  },
) {
  const secret =
    env?.BETTER_AUTH_SECRET ||
    (typeof process !== "undefined"
      ? process.env?.BETTER_AUTH_SECRET
      : undefined) ||
    env?.JWT_SECRET ||
    (typeof process !== "undefined" ? process.env?.JWT_SECRET : undefined) ||
    "worshipflow-better-auth-secret-key-32chars";

  const baseURL =
    env?.BETTER_AUTH_URL ||
    (typeof process !== "undefined"
      ? process.env?.BETTER_AUTH_URL
      : undefined) ||
    (typeof process !== "undefined"
      ? process.env?.NEXT_PUBLIC_APP_URL
      : undefined) ||
    "http://localhost:5173";

  const googleClientId =
    env?.GOOGLE_CLIENT_ID ||
    (typeof process !== "undefined"
      ? process.env?.GOOGLE_CLIENT_ID
      : undefined);
  const googleClientSecret =
    env?.GOOGLE_CLIENT_SECRET ||
    (typeof process !== "undefined"
      ? process.env?.GOOGLE_CLIENT_SECRET
      : undefined);

  const socialProviders =
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : undefined;

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user,
        session,
        account,
        verification,
        organization: organizationTable,
        member,
        invitation,
      },
    }),
    secret,
    baseURL,
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "MEMBER",
          input: true,
        },
      },
    },
    socialProviders,
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
      }),
    ],
  });
}

export function getAuth(
  db: Db,
  env?: {
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    JWT_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
  },
): AuthInstance {
  const cached = authCache.get(db);
  if (cached) {
    return cached;
  }
  const instance = createBetterAuth(db, env);
  authCache.set(db, instance);
  return instance;
}
