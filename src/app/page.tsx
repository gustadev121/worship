import Link from "next/link";
import { redirect } from "next/navigation";
import type { SongFilter } from "@/core/application/ports";
import { getContainer } from "@/infrastructure/container";
import { roleAssignments, songLabels } from "@/infrastructure/db/schema";
import { getSession } from "@/presentation/auth";
import {
  SongCard,
  type SongCardSong,
  type SongLabelItem,
} from "@/presentation/components/SongCard";
import { SongFilters } from "@/presentation/components/SongFilters";
import { getRequestEnv } from "@/presentation/get-request-env";

const KNOWN_ROLES = [
  "FIRST_VOICE",
  "SECOND_VOICE",
  "THIRD_VOICE",
  "BACKING_VOCAL",
  "INSTRUMENT",
] as const;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const sp = await searchParams;
  const container = await getContainer(await getRequestEnv());

  const filter: SongFilter = {};
  if (session.activeOrganizationId) {
    filter.organizationId = session.activeOrganizationId;
  }
  if (sp.q) {
    filter.query = sp.q;
  }
  const labelParam = sp.labels;
  const labelIds =
    labelParam === undefined
      ? []
      : labelParam
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
  if (labelIds.length > 0) {
    filter.labelIds = labelIds;
  }
  if (sp.practiceKey) {
    filter.practiceKey = sp.practiceKey;
  }
  if (sp.mine === "1") {
    filter.memberId = session.sub;
  }
  const roleType = sp.roleType;
  if (
    roleType !== undefined &&
    (KNOWN_ROLES as readonly string[]).includes(roleType)
  ) {
    filter.roleType = roleType as SongFilter["roleType"];
  }

  // Fetch filtered songs, label dictionary, and relation associations in parallel
  const [{ songs }, { labels }, allSongLabels, allAssignments] =
    await Promise.all([
      container.listSongs.execute({ filter }),
      container.listLabels.execute({
        organizationId: session.activeOrganizationId ?? undefined,
      }),
      container.db.select().from(songLabels),
      container.db.select().from(roleAssignments),
    ]);

  // Map label dictionary
  const labelDict = new Map<
    string,
    { id: string; name: string; colorHex: string }
  >(labels.map((l) => [l.id, l]));

  // Group labels by song
  const songLabelsMap = new Map<string, SongLabelItem[]>();
  for (const sl of allSongLabels) {
    const matchedLabel = labelDict.get(sl.labelId);
    if (matchedLabel) {
      const existing = songLabelsMap.get(sl.songId) ?? [];
      existing.push({
        id: matchedLabel.id,
        name: matchedLabel.name,
        colorHex: matchedLabel.colorHex,
      });
      songLabelsMap.set(sl.songId, existing);
    }
  }

  // Group assignment counts by song
  const assignmentCountsMap = new Map<string, number>();
  for (const ra of allAssignments) {
    const current = assignmentCountsMap.get(ra.songId) ?? 0;
    assignmentCountsMap.set(ra.songId, current + 1);
  }

  const isAdmin = session.role === "ADMIN";
  const hasActiveFilter = Boolean(
    sp.q || sp.labels || sp.practiceKey || sp.roleType || sp.mine === "1",
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Catalog Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Repertorio
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border/80">
              {songs.length} {songs.length === 1 ? "canción" : "canciones"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Consulta, transpone y ensaya las canciones con el equipo.
          </p>
        </div>

        {isAdmin ? (
          <Link href="/songs/new">
            <button
              type="button"
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs transition-colors shrink-0"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Nueva Canción</span>
            </button>
          </Link>
        ) : null}
      </header>

      {/* Interactive Filters */}
      <SongFilters labels={labels} />

      {/* Catalog Grid */}
      {songs.length > 0 ? (
        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          aria-label="Listado de canciones del catálogo"
        >
          {songs.map((song) => {
            const enrichedSong: SongCardSong = {
              id: song.id,
              title: song.title,
              artist: song.artist,
              originalKey: song.originalKey,
              practiceKey: song.practiceKey,
              bpm: song.bpm,
              timeSignature: song.timeSignature,
              labels: songLabelsMap.get(song.id) ?? [],
              volunteerCount: assignmentCountsMap.get(song.id) ?? 0,
            };

            return <SongCard key={song.id} song={enrichedSong} />;
          })}
        </section>
      ) : (
        /* Clean Empty State */
        <div className="rounded-xl border border-dashed border-border/80 bg-card/40 p-10 text-center flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              No se encontraron canciones
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasActiveFilter
                ? "Prueba cambiando los filtros o la búsqueda."
                : "No hay canciones registradas en el catálogo."}
            </p>
          </div>
          {hasActiveFilter ? (
            <Link
              href="/"
              className="mt-1 h-8 px-3 inline-flex items-center text-xs font-semibold rounded-lg bg-secondary text-foreground hover:bg-secondary-hover border border-border/80 transition-colors"
            >
              Restablecer Filtros
            </Link>
          ) : isAdmin ? (
            <Link
              href="/songs/new"
              className="mt-1 h-8 px-3 inline-flex items-center text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs transition-colors"
            >
              Crear primera canción
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
