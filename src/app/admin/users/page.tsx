import Link from "next/link";
import { redirect } from "next/navigation";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { UserAdmin } from "./client";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  const container = await getContainer(await getRequestEnv());
  const { users } = await container.listUsers.execute({ actor: session });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
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
          <span className="text-foreground font-medium">Usuarios</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Gestión de Usuarios
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border/80">
                <svg
                  className="w-3.5 h-3.5 opacity-70"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>
                  {users.length} {users.length === 1 ? "usuario" : "usuarios"}
                </span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Administra las cuentas de integrantes, roles de acceso y permisos.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Users Console */}
      <UserAdmin initial={users} currentUserId={session.id} />
    </div>
  );
}
