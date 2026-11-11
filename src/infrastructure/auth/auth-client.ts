import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL) ||
        "http://localhost:5173",
  plugins: [organizationClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization: organizationActions,
} = authClient;
