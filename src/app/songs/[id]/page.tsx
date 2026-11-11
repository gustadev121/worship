import Link from "next/link";
import { redirect } from "next/navigation";
import { parseChordPro } from "@/core/domain/chordpro";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { LabelBadge } from "@/presentation/components/LabelBadge";
import { RoleMatrix } from "@/presentation/components/RoleMatrix";
import { ChordSheet } from "@/presentation/components/rehearsal/chord-sheet";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { getRequestEnv } from "@/presentation/get-request-env";

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const { id } = await params;
  const container = await getContainer(await getRequestEnv());
  const { song } = await container.getSong
    .execute({ id })
    .catch(() => redirect("/"));

  const [{ assignments }, { labelIds }, { labels }, { users }] =
    await Promise.all([
      container.listSongRoles.execute({ songId: id }),
      container.getSongLabels.execute({ songId: id }),
      container.listLabels.execute(),
      container.listUsers
        .execute({ actor: session })
        .catch(() => ({ users: [] })),
    ]);

  const songLabels = labels.filter((l) => labelIds.includes(l.id));

  const parsedSheet = parseChordPro(song.lyricsAndChords, {
    title: song.title,
    artist: song.artist,
    originalKey: song.originalKey,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-muted-foreground flex items-center gap-1.5"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          Catálogo
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-foreground font-medium truncate max-w-xs">
          {song.title}
        </span>
      </nav>

      {/* Arrangement Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                {song.title}
              </h1>
              <p className="text-base text-muted-foreground font-medium mt-1">
                {song.artist}
              </p>
            </div>

            {/* Musical Attributes Cluster */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="keyOriginal" size="md">
                Tono:{" "}
                <strong className="ml-1 text-chord-accent">
                  {song.originalKey}
                </strong>
              </Badge>

              {song.practiceKey ? (
                <Badge variant="keyPractice" size="md">
                  Ensayo:{" "}
                  <strong className="ml-1 text-primary">
                    {song.practiceKey}
                  </strong>
                </Badge>
              ) : null}

              {song.bpm ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-muted-foreground border border-border/60">
                  <svg
                    className="w-3.5 h-3.5 opacity-70"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M12 2v20M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h20" />
                  </svg>
                  <span>{song.bpm} BPM</span>
                </span>
              ) : null}

              {song.timeSignature ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-muted-foreground border border-border/60">
                  Compás {song.timeSignature}
                </span>
              ) : null}

              {songLabels.map((l) => (
                <LabelBadge key={l.id} name={l.name} colorHex={l.colorHex} />
              ))}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/songs/${song.id}/practice`}>
              <Button
                variant="primary"
                size="md"
                className="gap-2 shadow-sm font-semibold"
              >
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Abrir Ensayo</span>
              </Button>
            </Link>

            {session.role === "ADMIN" ? (
              <Link href={`/songs/${song.id}/edit`}>
                <Button
                  variant="outline"
                  size="md"
                  className="gap-1.5 font-medium"
                >
                  <svg
                    className="w-3.5 h-3.5 opacity-70"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Editar</span>
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Primary Section: Role Matrix Table (Full-Width to eliminate horizontal scrollbar) */}
      <section aria-labelledby="role-matrix-title">
        <RoleMatrix
          songId={song.id}
          roles={assignments}
          members={users}
          isAdmin={session.role === "ADMIN"}
        />
      </section>

      {/* Secondary Section: Section Markers & Quick Chord Preview (Balanced 2-Column Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Section Timestamps Card */}
        <Card variant="bordered" className="p-5 space-y-4">
          <CardHeader className="p-0 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle
                as="h2"
                className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4 text-primary opacity-80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>Marcadores de Sección</span>
              </CardTitle>
              <span className="text-xs font-medium text-muted-foreground">
                {song.sectionTimestamps?.length ?? 0} partes
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {song.sectionTimestamps && song.sectionTimestamps.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {song.sectionTimestamps.map((st) => (
                  <div
                    key={`${st.label}-${st.startSeconds}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 border border-border/70 hover:border-primary/40 transition-colors"
                  >
                    <span className="text-xs font-semibold text-foreground">
                      {st.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border/50">
                      {Math.floor(st.startSeconds / 60)}:
                      {String(Math.floor(st.startSeconds % 60)).padStart(
                        2,
                        "0",
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No hay marcadores de sección definidos para esta canción.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Chord Chart Preview Card */}
        <Card variant="bordered" className="p-5 space-y-4">
          <CardHeader className="p-0 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle
                as="h2"
                className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4 text-chord-accent opacity-80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                <span>Vista Previa de Acordes</span>
              </CardTitle>
              <Link
                href={`/songs/${song.id}/practice`}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <span>Pantalla Completa</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border/70 bg-background/60 p-3">
              <ChordSheet sheet={parsedSheet} fontSizeRem={0.9} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
