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
    <div
      style={{
        maxWidth: "72rem",
        margin: "0 auto",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.75rem",
      }}
    >
      {/* Header Cluster */}
      <div>
        <nav
          aria-label="Ruta de navegación"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            color: "var(--muted-foreground)",
            marginBottom: "0.75rem",
          }}
        >
          <Link
            href="/"
            style={{
              color: "var(--muted-foreground)",
              textDecoration: "none",
            }}
          >
            Inicio
          </Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
            Administración
          </span>
          <span>/</span>
          <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
            Usuarios
          </span>
        </nav>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--foreground)",
                margin: 0,
                letterSpacing: "-0.025em",
              }}
            >
              Gestión de Usuarios
            </h1>
            <p
              style={{
                marginTop: "0.375rem",
                color: "var(--muted-foreground)",
                fontSize: "0.9375rem",
                lineHeight: 1.5,
              }}
            >
              Administra las cuentas de miembros del equipo, roles de acceso y
              credenciales de ingreso a la plataforma.
            </p>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "var(--muted)",
              padding: "0.4rem 0.8rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            👥 {users.length} miembros registrados
          </div>
        </div>
      </div>

      {/* Interactive Users Console */}
      <UserAdmin initial={users} currentUserId={session.id} />
    </div>
  );
}
