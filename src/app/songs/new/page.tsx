import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/presentation/auth";
import { SongForm } from "./form";

export default async function NewSongPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div
      style={{
        maxWidth: "56rem",
        margin: "0 auto",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      {/* Breadcrumb & Header Cluster */}
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
            Catálogo
          </Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
            Nueva Canción
          </span>
        </nav>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: "var(--foreground)",
            margin: 0,
            letterSpacing: "-0.025em",
          }}
        >
          Nueva Canción
        </h1>
        <p
          style={{
            marginTop: "0.375rem",
            color: "var(--muted-foreground)",
            fontSize: "0.9375rem",
            lineHeight: 1.5,
          }}
        >
          Registra una nueva canción en el repertorio con sus metadatos
          musicales, acordes ChordPro estructurados y enlace multimedia de
          referencia.
        </p>
      </div>

      <SongForm mode="create" />
    </div>
  );
}
