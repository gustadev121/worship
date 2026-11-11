import { redirect } from "next/navigation";
import type { RoadmapFilterInput } from "@/core/application/dtos";
import { roadmapFilterSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { RoadmapFilters } from "@/presentation/components/RoadmapFilters";
import { RoadmapTimeline } from "@/presentation/components/RoadmapTimeline";
import { Badge } from "@/presentation/components/ui/badge";
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

  const progressPct = Math.round(
    (roadmap.summary.completedMilestones /
      Math.max(1, roadmap.summary.totalMilestones)) *
      100,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Roadmap Estratégico
            </h1>
            <Badge
              variant={session.role === "ADMIN" ? "roleAdmin" : "roleMember"}
              size="sm"
            >
              {session.username} ({session.role})
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
            Progreso de las 4 fases de desarrollo y votación de capacidades
            prioritarias para el ministerio.
          </p>
        </div>

        {/* Compact Progress Indicator */}
        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 bg-card p-3 rounded-xl border border-border/80">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Progreso general:</span>
            <span className="font-mono font-bold text-foreground">
              {progressPct}%
            </span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span className="text-muted-foreground">
              {roadmap.summary.completedMilestones}/
              {roadmap.summary.totalMilestones} hitos
            </span>
          </div>
          <div className="w-48 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {/* Interactive Filter Bar */}
      <RoadmapFilters />

      {/* Main Roadmap Timeline */}
      <main>
        <RoadmapTimeline
          phases={roadmap.phases}
          userVotes={roadmap.userVotes}
          summary={roadmap.summary}
          isAdmin={session.role === "ADMIN"}
        />
      </main>
    </div>
  );
}
