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
          <svg
            className="w-3.5 h-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Prerrequisitos pendientes:</span>
          <span style={{ fontWeight: 400 }}>
            {unmetBlockingPrereqs.map((p) => p.prerequisiteTitle).join(", ")}
          </span>
        </span>
      )}
    </div>
  );
}
