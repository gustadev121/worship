import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { getSession } from "@/presentation/auth";
import { AppShell } from "@/presentation/components/layout/app-shell";
import { THEME_STORAGE_KEY } from "@/presentation/theme/tokens";
import "./globals.css";

export const metadata = {
  title: "WorshipFlow",
  description: "Modern church worship team planning and rehearsal platform",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieJar = await cookies();
  const rawTheme =
    cookieJar.get(THEME_STORAGE_KEY)?.value || cookieJar.get("theme")?.value;
  const theme = rawTheme === "light" ? "light" : "dark";

  const session = await getSession();
  const user = session
    ? {
        id: session.sub,
        name: session.username,
        email: session.username,
        role: session.role,
      }
    : null;

  return (
    <html
      lang="es"
      className={theme === "light" ? "light" : undefined}
      data-theme={theme}
      style={{ colorScheme: theme }}
    >
      <body>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
