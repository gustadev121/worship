import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { type D1Binding, getDb } from "@/infrastructure/db/client";
import {
  invitation,
  member,
  organization,
  user,
} from "@/infrastructure/db/schema";
import { getSession } from "@/presentation/auth";
import { Badge } from "@/presentation/components/ui/badge";
import { getRequestEnv } from "@/presentation/get-request-env";

export default async function AdminOrganizationPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "ADMIN") {
    redirect("/");
  }

  const env = await getRequestEnv();
  const db = await getDb(env.DB as D1Binding);

  const activeOrgId = session.activeOrganizationId || "worshipflow-central";

  // Query active org, members and invitations
  const [activeOrgRows, allOrgs, membersList, invitesList] = await Promise.all([
    db.select().from(organization).where(eq(organization.id, activeOrgId)),
    db.select().from(organization),
    db
      .select({
        mem: member,
        usr: user,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, activeOrgId)),
    db
      .select()
      .from(invitation)
      .where(eq(invitation.organizationId, activeOrgId)),
  ]);

  const currentOrg = activeOrgRows[0] ?? {
    id: "worshipflow-central",
    name: "WorshipFlow Central",
    slug: "worshipflow-central",
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Cluster */}
      <div>
        <nav
          aria-label="Ruta de navegación"
          className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Inicio
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span>Administración</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-foreground font-medium">Organización</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {currentOrg.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Activa
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Slug: <code className="text-foreground">{currentOrg.slug}</code>{" "}
              &middot; ID: {currentOrg.id}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Members & Campuses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Team Members (2 cols) */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Miembros del Equipo ({membersList.length})
            </h2>
          </div>

          <div className="rounded-xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden">
            {membersList.length > 0 ? (
              membersList.map(({ mem, usr }) => (
                <div
                  key={mem.id}
                  className="p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-secondary text-foreground font-semibold flex items-center justify-center shrink-0">
                      {usr.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {usr.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {usr.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" size="sm">
                      {mem.role}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No hay miembros registrados en esta organización aún.
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {invitesList.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Invitaciones Pendientes ({invitesList.length})
              </h3>
              <div className="rounded-xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden text-xs">
                {invitesList.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium text-foreground">{inv.email}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Expira: {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Other Campuses / Orgs (1 col) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Todas las Sedes ({allOrgs.length})
            </h2>
          </div>

          <div className="rounded-xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden text-xs">
            {allOrgs.map((org) => {
              const isCurrent = org.id === activeOrgId;
              return (
                <div
                  key={org.id}
                  className={`p-3 flex items-center justify-between gap-2 ${
                    isCurrent ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p
                      className={`font-semibold truncate ${isCurrent ? "text-primary" : "text-foreground"}`}
                    >
                      {org.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {org.slug}
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-primary">
                      ✓ ACTIVA
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
