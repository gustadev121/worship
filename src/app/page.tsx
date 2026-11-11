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
      container.listLabels.execute(),
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

  // Compute Catalog Statistics
  const totalInCatalog = songs.length;
  const transposedCount = songs.filter(
    (s) => s.practiceKey && s.practiceKey !== s.originalKey,
  ).length;
  const totalAssignmentsCount = songs.reduce(
    (acc, s) => acc + (assignmentCountsMap.get(s.id) ?? 0),
    0,
  );

  const isAdmin = session.role === "ADMIN";
  const hasActiveFilter = Boolean(
    sp.q || sp.labels || sp.practiceKey || sp.roleType || sp.mine === "1",
  );

  return (
    <div
      style={{
        maxWidth: "80rem",
        margin: "0 auto",
        padding: "1.5rem 1rem 3rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <style>{`
        .wf-catalog-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .wf-catalog-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
          }
        }
        @media (min-width: 1024px) {
          .wf-catalog-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
        }
        .wf-stats-banner {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.25rem;
        }
      `}</style>

      {/* Catalog Header Section */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
              }}
            >
              <h1
                style={{
                  fontSize: "1.875rem",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: "var(--foreground)",
                  margin: 0,
                }}
              >
                Repertorio de Alabanza
              </h1>
              <span
                className="wf-badge wf-badge-secondary"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  padding: "0.25rem 0.625rem",
                }}
              >
                {totalInCatalog}{" "}
                {totalInCatalog === 1 ? "canción" : "canciones"}
              </span>
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
                margin: "0.25rem 0 0 0",
              }}
            >
              Explora, transpone y ensaya las canciones de la congregación con
              tu equipo.
            </p>
          </div>
        </div>

        {isAdmin ? (
          <Link
            href="/songs/new"
            className="wf-btn wf-btn-primary"
            style={{
              fontWeight: 600,
              padding: "0.5rem 1.25rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <span>+ Nueva Canción</span>
          </Link>
        ) : null}
      </header>

      {/* Catalog Statistics Banner */}
      <section
        className="wf-stats-banner"
        aria-label="Estadísticas del catálogo"
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Total Canciones
          </span>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--foreground)",
            }}
          >
            {totalInCatalog}
          </span>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Tonos Adaptados
          </span>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--chord-accent)",
            }}
          >
            {transposedCount}
          </span>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Partes Asignadas
          </span>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--role-member)",
            }}
          >
            {totalAssignmentsCount}
          </span>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Etiquetas Temáticas
          </span>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--role-admin)",
            }}
          >
            {labels.length}
          </span>
        </div>
      </section>

      {/* Sticky Interactive Filters */}
      <SongFilters labels={labels} />

      {/* Catalog Grid of Spotlight Song Cards */}
      {songs.length > 0 ? (
        <section
          className="wf-catalog-grid"
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
        /* Animated Empty Search State Card */
        <div
          className="wf-card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            backgroundColor: "var(--card)",
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-xl)",
            gap: "1rem",
            maxWidth: "36rem",
            margin: "2rem auto",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
            }}
            aria-hidden="true"
          >
            🎵
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--foreground)",
                margin: 0,
              }}
            >
              No encontramos canciones con esos filtros
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
                margin: 0,
                maxWidth: "28rem",
              }}
            >
              {hasActiveFilter
                ? "Prueba seleccionando otro tono o limpiando los términos de búsqueda para ver más canciones."
                : "Aún no hay canciones registradas en el catálogo de alabanza."}
            </p>
          </div>
          {hasActiveFilter ? (
            <Link
              href="/"
              className="wf-btn wf-btn-primary"
              style={{
                marginTop: "0.5rem",
                fontWeight: 600,
                padding: "0.5rem 1.25rem",
              }}
            >
              Restablecer Filtros
            </Link>
          ) : isAdmin ? (
            <Link
              href="/songs/new"
              className="wf-btn wf-btn-primary"
              style={{
                marginTop: "0.5rem",
                fontWeight: 600,
                padding: "0.5rem 1.25rem",
              }}
            >
              Crear primera canción
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
