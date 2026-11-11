import Link from "next/link";
import { redirect } from "next/navigation";
import { parseChordPro } from "@/core/domain/chordpro";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { LabelBadge } from "@/presentation/components/LabelBadge";
import { RoleMatrix } from "@/presentation/components/RoleMatrix";
import { ChordSheet } from "@/presentation/components/rehearsal/chord-sheet";
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
    <div className="song-detail-container max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-muted-foreground flex items-center gap-2"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          Catálogo de Alabanza
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">
          {song.title}
        </span>
      </nav>

      {/* Arrangement Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Arreglo de Alabanza
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                {song.title}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground font-medium mt-0.5">
                {song.artist}
              </p>
            </div>

            {/* Musical Attributes Cluster */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-foreground border border-border shadow-xs">
                Tono:{" "}
                <strong className="ml-1 text-[var(--chord-accent)]">
                  {song.originalKey}
                </strong>
              </span>

              {song.practiceKey ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30 shadow-xs">
                  Ensayo: <strong className="ml-1">{song.practiceKey}</strong>
                </span>
              ) : null}

              {song.bpm ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border">
                  ⚡ {song.bpm} BPM
                </span>
              ) : null}

              {song.timeSignature ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border">
                  Compás {song.timeSignature}
                </span>
              ) : null}

              {songLabels.map((l) => (
                <LabelBadge key={l.id} name={l.name} colorHex={l.colorHex} />
              ))}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={`/songs/${song.id}/practice`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>▶</span>
              <span>Abrir Ensayo</span>
            </Link>

            {session.role === "ADMIN" ? (
              <Link
                href={`/songs/${song.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-accent text-foreground text-sm font-semibold border border-border transition-all active:scale-95"
              >
                <span>Editar</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content Split: Role Matrix & Rehearsal Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Role Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <RoleMatrix
            songId={song.id}
            roles={assignments}
            members={users}
            isAdmin={session.role === "ADMIN"}
          />
        </div>

        {/* Right Column: Timestamps & Quick Chord Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section Timestamps Card */}
          {song.sectionTimestamps && song.sectionTimestamps.length > 0 ? (
            <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Marcadores de Sección ({song.sectionTimestamps.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {song.sectionTimestamps.map((st) => (
                  <span
                    key={`${st.label}-${st.startSeconds}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-secondary text-foreground border border-border"
                  >
                    <span>{st.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {Math.floor(st.startSeconds / 60)}:
                      {String(Math.floor(st.startSeconds % 60)).padStart(
                        2,
                        "0",
                      )}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Quick Chord Chart Preview Card */}
          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Vista Previa de Acordes
              </h3>
              <Link
                href={`/songs/${song.id}/practice`}
                className="text-xs text-primary hover:underline font-medium"
              >
                Pantalla Completa →
              </Link>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-lg border border-border/60 bg-background/50">
              <ChordSheet sheet={parsedSheet} fontSizeRem={0.95} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
