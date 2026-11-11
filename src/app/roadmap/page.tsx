import { redirect } from "next/navigation";
import type { RoadmapFilterInput } from "@/core/application/dtos";
import { roadmapFilterSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { RoadmapFilters } from "@/presentation/components/RoadmapFilters";
import { RoadmapTimeline } from "@/presentation/components/RoadmapTimeline";
import { Badge } from "@/presentation/components/ui/badge";
import { Card, CardContent } from "@/presentation/components/ui/card";
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
    <div
      style={{
        maxWidth: "72rem",
        margin: "0 auto",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
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
            gap: "0.75rem",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <span style={{ fontSize: "2rem" }}>🗺️</span>
            <h1
              style={{
                margin: 0,
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: "-0.025em",
              }}
            >
              Roadmap Estratégico de WorshipFlow
            </h1>
          </div>

          <Badge
            variant={session.role === "ADMIN" ? "roleAdmin" : "roleMember"}
          >
            {session.username} ({session.role})
          </Badge>
        </div>

        <p
          style={{
            margin: "0.5rem 0 0 0",
            fontSize: "1rem",
            color: "var(--muted-foreground)",
            lineHeight: 1.6,
            maxWidth: "52rem",
          }}
        >
          Visualiza el progreso de las 4 fases de desarrollo y vota por las
          herramientas prioritarias para tu ministerio de alabanza.
        </p>
      </div>

      {/* Summary Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Card 1: Phases */}
        <Card variant="bordered">
          <CardContent style={{ padding: "1.25rem" }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Fases Secuenciales
            </div>
            <div
              style={{
                fontSize: "1.875rem",
                fontWeight: 800,
                color: "var(--foreground)",
                marginTop: "0.25rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              {roadmap.summary.totalPhases}
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                color: "var(--status-ready)",
                fontWeight: 600,
                marginTop: "0.25rem",
              }}
            >
              Fase 1 entregada (v0.1)
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Milestones */}
        <Card variant="bordered">
          <CardContent style={{ padding: "1.25rem" }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Hitos Completados
            </div>
            <div
              style={{
                fontSize: "1.875rem",
                fontWeight: 800,
                color: "var(--foreground)",
                marginTop: "0.25rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              {roadmap.summary.completedMilestones} /{" "}
              {roadmap.summary.totalMilestones}
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                color: "var(--muted-foreground)",
                marginTop: "0.25rem",
              }}
            >
              {Math.round(
                (roadmap.summary.completedMilestones /
                  Math.max(1, roadmap.summary.totalMilestones)) *
                  100,
              )}
              % completado
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Capabilities */}
        <Card variant="bordered">
          <CardContent style={{ padding: "1.25rem" }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Capacidades
            </div>
            <div
              style={{
                fontSize: "1.875rem",
                fontWeight: 800,
                color: "var(--foreground)",
                marginTop: "0.25rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              {roadmap.summary.completedCapabilities} /{" "}
              {roadmap.summary.totalCapabilities}
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                color: "var(--muted-foreground)",
                marginTop: "0.25rem",
              }}
            >
              Entregadas a producción
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Global Progress */}
        <Card variant="bordered">
          <CardContent style={{ padding: "1.25rem" }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Progreso Global
            </div>
            <div
              style={{
                fontSize: "1.875rem",
                fontWeight: 800,
                color: "var(--primary)",
                marginTop: "0.25rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              {roadmap.summary.overallProgress}%
            </div>
            <div
              role="progressbar"
              aria-valuenow={roadmap.summary.overallProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso global del roadmap: ${roadmap.summary.overallProgress}%`}
              style={{
                height: "6px",
                width: "100%",
                backgroundColor: "var(--muted)",
                borderRadius: "var(--radius-full)",
                marginTop: "0.4rem",
                overflow: "hidden",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${roadmap.summary.overallProgress}%`,
                  backgroundColor: "var(--primary)",
                  borderRadius: "var(--radius-full)",
                  transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Filters */}
      <RoadmapFilters
        currentTrack={filterQuery?.track}
        currentPriority={filterQuery?.priority}
      />

      {/* Sequential Phases Timeline */}
      <RoadmapTimeline phases={roadmap.phases} />
    </div>
  );
}
