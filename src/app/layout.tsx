import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { type D1Binding, getDb } from "@/infrastructure/db/client";
import { member, organization } from "@/infrastructure/db/schema";
import { getSession } from "@/presentation/auth";
import { AppShell } from "@/presentation/components/layout/app-shell";
import { getRequestEnv } from "@/presentation/get-request-env";
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
  let userOrganizations: {
    id: string;
    name: string;
    slug: string;
    role?: string;
  }[] = [];

  if (session) {
    try {
      const env = await getRequestEnv();
      const db = await getDb(env.DB as D1Binding);
      const rows = await db
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          role: member.role,
        })
        .from(organization)
        .leftJoin(member, eq(organization.id, member.organizationId))
        .where(eq(member.userId, session.sub));

      userOrganizations =
        rows.length > 0
          ? rows.map((r) => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
              role: r.role ?? undefined,
            }))
          : [
              {
                id: "worshipflow-central",
                name: "WorshipFlow Central",
                slug: "worshipflow-central",
                role: session.role === "ADMIN" ? "owner" : "member",
              },
            ];
    } catch {
      userOrganizations = [
        {
          id: "worshipflow-central",
          name: "WorshipFlow Central",
          slug: "worshipflow-central",
          role: session.role === "ADMIN" ? "owner" : "member",
        },
      ];
    }
  }

  const user = session
    ? {
        id: session.sub,
        name: session.username,
        email: session.email || session.username,
        role: session.role,
        activeOrganizationId:
          session.activeOrganizationId ??
          userOrganizations[0]?.id ??
          "worshipflow-central",
        organizations: userOrganizations,
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
