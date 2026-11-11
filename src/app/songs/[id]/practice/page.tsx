import Link from "next/link";
import { redirect } from "next/navigation";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { PracticeStatusToggle } from "@/presentation/components/PracticeStatusToggle";
import { RehearsalPlayer } from "@/presentation/components/RehearsalPlayer";
import { getRequestEnv } from "@/presentation/get-request-env";

export default async function PracticePage({
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
  const { assignments } = await container.listSongRoles.execute({ songId: id });
  const mine = assignments.filter((a) => a.userId === session.sub);

  return (
    <div className="practice-page-container max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Rehearsal Breadcrumb & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav
            aria-label="Breadcrumb"
            className="text-xs text-muted-foreground flex items-center gap-2"
          >
            <Link href="/" className="hover:text-foreground transition-colors">
              Catálogo
            </Link>
            <span>/</span>
            <Link
              href={`/songs/${song.id}`}
              className="hover:text-foreground transition-colors truncate max-w-[200px]"
            >
              {song.title}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              Estudio de Ensayo
            </span>
          </nav>

          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <span>{song.title}</span>
            <span className="text-sm font-normal text-muted-foreground">
              — {song.artist}
            </span>
          </h1>
        </div>

        {/* User Practice Readiness Status Toggle */}
        {mine[0] ? (
          <div className="shrink-0">
            <PracticeStatusToggle
              songId={song.id}
              roleId={mine[0].id}
              initial={mine[0].practiceStatus}
            />
          </div>
        ) : (
          <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg border border-border">
            Modo observador: No tienes parte asignada.
          </div>
        )}
      </div>

      {/* Synchronized Rehearsal Studio Player */}
      <RehearsalPlayer
        songId={song.id}
        songTitle={song.title}
        songArtist={song.artist}
        originalKey={song.originalKey}
        practiceKey={song.practiceKey}
        youtubeVideoId={song.youtubeVideoId}
        sections={song.sectionTimestamps}
        lyricsAndChords={song.lyricsAndChords}
        viewerRole={
          mine[0]
            ? {
                roleType: mine[0].roleType,
                harmonyOrPartNotes: mine[0].harmonyOrPartNotes,
              }
            : null
        }
      />
    </div>
  );
}
