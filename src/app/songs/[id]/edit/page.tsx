import Link from "next/link";
import { redirect } from "next/navigation";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { SongForm } from "../../new/form";

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  const { id } = await params;
  const container = await getContainer(await getRequestEnv());
  const { song } = await container.getSong
    .execute({ id })
    .catch(() => redirect("/"));

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
          <Link
            href={`/songs/${song.id}`}
            style={{
              color: "var(--muted-foreground)",
              textDecoration: "none",
            }}
          >
            {song.title}
          </Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
            Editar
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
          Editar: {song.title}
        </h1>
        <p
          style={{
            marginTop: "0.375rem",
            color: "var(--muted-foreground)",
            fontSize: "0.9375rem",
            lineHeight: 1.5,
          }}
        >
          {song.artist} · Tono original:{" "}
          <strong style={{ color: "var(--foreground)" }}>
            {song.originalKey}
          </strong>
          {song.practiceKey && (
            <span>
              {" "}
              · Tono de ensayo:{" "}
              <strong style={{ color: "var(--chord-accent)" }}>
                {song.practiceKey}
              </strong>
            </span>
          )}
        </p>
      </div>

      <SongForm
        mode="edit"
        songId={song.id}
        initial={{
          title: song.title,
          artist: song.artist,
          originalKey: song.originalKey,
          practiceKey: song.practiceKey ?? "",
          bpm:
            song.bpm === undefined || song.bpm === null ? "" : String(song.bpm),
          timeSignature: song.timeSignature ?? "",
          lyricsAndChords: song.lyricsAndChords ?? "",
          youtubeVideoId: song.youtubeVideoId ?? "",
          sectionTimestamps: song.sectionTimestamps ?? [],
        }}
      />
    </div>
  );
}
