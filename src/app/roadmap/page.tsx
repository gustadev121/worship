import { redirect } from "next/navigation";
import type { RoadmapFilterInput } from "@/core/application/dtos";
import { roadmapFilterSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { RoadmapFilters } from "@/presentation/components/RoadmapFilters";
import { RoadmapTimeline } from "@/presentation/components/RoadmapTimeline";
import { getRequestEnv } from "@/presentation/get-request-env";

export default async function RoadmapPage({
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

  // Ensure baseline canonical roadmap data is seeded
  await container.seedRoadmap.execute();

  const queryInput: Record<string, unknown> = {};
  if (sp.track) queryInput.track = sp.track;
  if (sp.priority) queryInput.priority = sp.priority;
  if (sp.phase) queryInput.phase = sp.phase;

  const parsedFilter = roadmapFilterSchema.safeParse(queryInput);
  const filterQuery: RoadmapFilterInput | undefined = parsedFilter.success
    ? parsedFilter.data
    : undefined;

  const roadmap = await container.getRoadmap.execute({
    actor: session,
    query: filterQuery,
  });

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        width: "100%",
        maxWidth: "960px",
        margin: "0 auto",
      }}
    >
      {/* Page Header */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            🗺️ Roadmap de Producto WorshipFlow
          </h1>

          <span
            style={{
              fontSize: "0.82rem",
              color: "#4b5563",
              backgroundColor: "#f3f4f6",
              borderRadius: "9999px",
              padding: "0.25rem 0.75rem",
              fontWeight: 500,
            }}
          >
            Sesión: {session.username} ({session.role})
          </span>
        </div>

        <p
          style={{
            margin: "0.5rem 0 0 0",
            fontSize: "0.95rem",
            color: "#475569",
            lineHeight: 1.5,
          }}
        >
          Evolución estratégica de la plataforma a través de 4 fases
          secuenciales. Revisa las metas de cada hito, sus prerequisitos y vota
          por las funciones de mayor prioridad para tu ministerio de alabanza.
        </p>
      </div>

      {/* Summary Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "1rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Fases Secuenciales
          </div>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#0f172a",
              marginTop: "0.2rem",
            }}
          >
            {roadmap.summary.totalPhases}
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "#16a34a",
              fontWeight: 600,
              marginTop: "0.2rem",
            }}
          >
            Fase 1 entregada (v0.1)
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "1rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Hitos Completados
          </div>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#0f172a",
              marginTop: "0.2rem",
            }}
          >
            {roadmap.summary.completedMilestones} /{" "}
            {roadmap.summary.totalMilestones}
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "#64748b",
              marginTop: "0.2rem",
            }}
          >
            {Math.round(
              (roadmap.summary.completedMilestones /
                Math.max(1, roadmap.summary.totalMilestones)) *
                100,
            )}
            % completado
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "1rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Capacidades
          </div>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#0f172a",
              marginTop: "0.2rem",
            }}
          >
            {roadmap.summary.completedCapabilities} /{" "}
            {roadmap.summary.totalCapabilities}
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "#64748b",
              marginTop: "0.2rem",
            }}
          >
            Entregadas a producción
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "1rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Progreso Global
          </div>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#2563eb",
              marginTop: "0.2rem",
            }}
          >
            {roadmap.summary.overallProgress}%
          </div>
          <div
            role="progressbar"
            aria-valuenow={roadmap.summary.overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: "6px",
              width: "100%",
              backgroundColor: "#e2e8f0",
              borderRadius: "9999px",
              marginTop: "0.4rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${roadmap.summary.overallProgress}%`,
                backgroundColor: "#2563eb",
              }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Filters */}
      <RoadmapFilters
        currentTrack={filterQuery?.track}
        currentPriority={filterQuery?.priority}
      />

      {/* Sequential Phases Timeline */}
      <RoadmapTimeline phases={roadmap.phases} />
    </section>
  );
}
