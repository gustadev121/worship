import Link from "next/link";
import { redirect } from "next/navigation";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { LabelAdmin } from "./client";

export default async function AdminLabelsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  const container = await getContainer(await getRequestEnv());
  const { labels } = await container.listLabels.execute();

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
          <span className="text-foreground font-medium">Etiquetas</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Etiquetas de Repertorio
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border/80">
                <svg
                  className="w-3 h-3 opacity-70"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span>
                  {labels.length}{" "}
                  {labels.length === 1 ? "etiqueta" : "etiquetas"}
                </span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Gestiona etiquetas temáticas y de servicio para clasificar el
              repertorio.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Labels Console */}
      <LabelAdmin initial={labels} />
    </div>
  );
}
