import type { RoadmapPrerequisiteDTO } from "@/core/application/dtos";
import type { MilestoneStatus } from "@/core/domain/roadmap";
import { Badge } from "@/presentation/components/ui/badge";

export interface MilestoneStatusBadgeProps {
  status: MilestoneStatus;
  prerequisites?: RoadmapPrerequisiteDTO[];
}

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  COMPLETED: "Completado",
  IN_PROGRESS: "En progreso",
  NOT_STARTED: "No iniciado",
  DEFERRED: "Pospuesto",
};

export function MilestoneStatusBadge({
  status,
  prerequisites = [],
}: MilestoneStatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? "No iniciado";
  const unmetBlockingPrereqs = prerequisites.filter(
    (p) => p.isBlocking && !p.isSatisfied,
  );

  let variant: "statusReady" | "default" | "secondary" | "statusPracticing" =
    "secondary";
  if (status === "COMPLETED") variant = "statusReady";
  else if (status === "IN_PROGRESS") variant = "default";
  else if (status === "DEFERRED") variant = "statusPracticing";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      <span data-status={status}>
        <Badge variant={variant} size="sm" dot>
          {label}
        </Badge>
      </span>

      {unmetBlockingPrereqs.length > 0 && (
        <span
          data-testid="unmet-prerequisites-warning"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            backgroundColor: "var(--status-practicing-bg)",
            color: "var(--status-practicing)",
            border: "1px solid var(--status-practicing-border)",
            borderRadius: "var(--radius-full)",
            padding: "0.2rem 0.65rem",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
          title={unmetBlockingPrereqs
            .map((p) => p.prerequisiteTitle)
            .join(", ")}
        >
          <span>⚠️ Prerequisitos pendientes:</span>
          <span style={{ fontWeight: 400 }}>
            {unmetBlockingPrereqs.map((p) => p.prerequisiteTitle).join(", ")}
          </span>
        </span>
      )}
    </div>
  );
}
