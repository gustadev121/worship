import type { RoadmapPrerequisiteDTO } from "@/core/application/dtos";
import type { MilestoneStatus } from "@/core/domain/roadmap";

export interface MilestoneStatusBadgeProps {
  status: MilestoneStatus;
  prerequisites?: RoadmapPrerequisiteDTO[];
}

const STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  COMPLETED: {
    label: "Completado",
    bg: "#dcfce7",
    color: "#166534",
    border: "#86efac",
  },
  IN_PROGRESS: {
    label: "En progreso",
    bg: "#dbeafe",
    color: "#1e40af",
    border: "#93c5fd",
  },
  NOT_STARTED: {
    label: "No iniciado",
    bg: "#f3f4f6",
    color: "#374151",
    border: "#d1d5db",
  },
  DEFERRED: {
    label: "Pospuesto",
    bg: "#fef3c7",
    color: "#92400e",
    border: "#fde68a",
  },
};

export function MilestoneStatusBadge({
  status,
  prerequisites = [],
}: MilestoneStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.NOT_STARTED;
  const unmetBlockingPrereqs = prerequisites.filter(
    (p) => p.isBlocking && !p.isSatisfied,
  );

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      <span
        data-status={status}
        style={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          borderRadius: "9999px",
          padding: "0.2rem 0.65rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.025em",
          textTransform: "uppercase",
        }}
      >
        {config.label}
      </span>

      {unmetBlockingPrereqs.length > 0 && (
        <span
          data-testid="unmet-prerequisites-warning"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            backgroundColor: "#fffbeb",
            color: "#92400e",
            border: "1px solid #fcd34d",
            borderRadius: "9999px",
            padding: "0.2rem 0.65rem",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
          title={unmetBlockingPrereqs
            .map((p) => p.prerequisiteTitle)
            .join(", ")}
        >
          <span>⚠️ Pending Upstream Prerequisites:</span>
          <span style={{ fontWeight: 400 }}>
            {unmetBlockingPrereqs.map((p) => p.prerequisiteTitle).join(", ")}
          </span>
        </span>
      )}
    </div>
  );
}
