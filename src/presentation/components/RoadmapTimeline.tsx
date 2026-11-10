"use client";

import { useState } from "react";
import type { RoadmapPhaseDTO } from "@/core/application/dtos";
import type { PhaseStatus } from "@/core/domain/roadmap";
import { CapabilityCard } from "./CapabilityCard";
import { MilestoneStatusBadge } from "./MilestoneStatusBadge";

const PHASE_STATUS_LABELS: Record<
  PhaseStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  COMPLETED: {
    label: "Completada",
    bg: "#dcfce7",
    color: "#166534",
    border: "#86efac",
  },
  IN_PROGRESS: {
    label: "En Curso",
    bg: "#dbeafe",
    color: "#1e40af",
    border: "#93c5fd",
  },
  PENDING_PREREQUISITES: {
    label: "Esperando Prerequisitos",
    bg: "#fef3c7",
    color: "#92400e",
    border: "#fde68a",
  },
  PLANNED: {
    label: "Planificada",
    bg: "#f3f4f6",
    color: "#374151",
    border: "#d1d5db",
  },
};

export interface RoadmapTimelineProps {
  phases: RoadmapPhaseDTO[];
}

export function RoadmapTimeline({ phases }: RoadmapTimelineProps) {
  // Store collapsed milestone IDs (default is all expanded)
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<string>>(
    new Set(),
  );

  function toggleMilestone(milestoneId: string) {
    setCollapsedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(milestoneId)) {
        next.delete(milestoneId);
      } else {
        next.add(milestoneId);
      }
      return next;
    });
  }

  function expandAll() {
    setCollapsedMilestones(new Set());
  }

  function collapseAll() {
    const allMilestoneIds = phases.flatMap((p) =>
      p.milestones.map((m) => m.id),
    );
    setCollapsedMilestones(new Set(allMilestoneIds));
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
        }}
      >
        <button
          type="button"
          onClick={expandAll}
          style={{
            fontSize: "0.78rem",
            padding: "0.25rem 0.6rem",
            borderRadius: "4px",
            border: "1px solid #d1d5db",
            backgroundColor: "#ffffff",
            color: "#374151",
            cursor: "pointer",
          }}
        >
          Expandir todos
        </button>
        <button
          type="button"
          onClick={collapseAll}
          style={{
            fontSize: "0.78rem",
            padding: "0.25rem 0.6rem",
            borderRadius: "4px",
            border: "1px solid #d1d5db",
            backgroundColor: "#ffffff",
            color: "#374151",
            cursor: "pointer",
          }}
        >
          Colapsar todos
        </button>
      </div>

      {phases.map((phase) => {
        const statusConfig =
          PHASE_STATUS_LABELS[phase.status] ?? PHASE_STATUS_LABELS.PLANNED;

        return (
          <section
            key={phase.id}
            data-phase-id={phase.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              padding: "1.25rem",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Phase Header */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginBottom: "0.4rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      backgroundColor: "#1e293b",
                      color: "#ffffff",
                      borderRadius: "6px",
                      padding: "0.2rem 0.55rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    FASE {phase.phaseNumber}
                  </span>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {phase.name}
                  </h3>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "#4b5563",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "9999px",
                      padding: "0.2rem 0.6rem",
                      fontWeight: 500,
                    }}
                  >
                    🗓️ {phase.targetHorizon}
                  </span>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: statusConfig.bg,
                      color: statusConfig.color,
                      border: `1px solid ${statusConfig.border}`,
                      borderRadius: "9999px",
                      padding: "0.2rem 0.6rem",
                    }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              <p
                style={{
                  margin: "0.25rem 0 0.75rem 0",
                  fontSize: "0.9rem",
                  color: "#4b5563",
                  lineHeight: 1.45,
                }}
              >
                {phase.description}
              </p>

              {/* Progress Bar */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span>Progreso de Fase</span>
                  <span>{phase.completionPercentage}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={phase.completionPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{
                    height: "10px",
                    width: "100%",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "9999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${phase.completionPercentage}%`,
                      backgroundColor:
                        phase.completionPercentage === 100
                          ? "#16a34a"
                          : "#2563eb",
                      transition: "width 0.4s ease-in-out",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Milestones in this phase */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {phase.milestones.map((milestone) => {
                const isCollapsed = collapsedMilestones.has(milestone.id);

                return (
                  <div
                    key={milestone.id}
                    data-milestone-id={milestone.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      backgroundColor: "#f8fafc",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {/* Milestone Card Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "0.6rem",
                      }}
                    >
                      <div style={{ flex: "1 1 280px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "1.05rem",
                              fontWeight: 700,
                              color: "#1e293b",
                            }}
                          >
                            {milestone.title}
                          </h4>

                          <MilestoneStatusBadge
                            status={milestone.status}
                            prerequisites={milestone.prerequisites}
                          />
                        </div>

                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.85rem",
                            color: "#64748b",
                            lineHeight: 1.4,
                          }}
                        >
                          {milestone.description}
                        </p>

                        {milestone.releaseNotes && (
                          <div
                            style={{
                              marginTop: "0.4rem",
                              fontSize: "0.78rem",
                              backgroundColor: "#f1f5f9",
                              color: "#334155",
                              padding: "0.3rem 0.6rem",
                              borderRadius: "4px",
                              borderLeft: "3px solid #22c55e",
                            }}
                          >
                            <strong>Notas de versión:</strong>{" "}
                            {milestone.releaseNotes}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleMilestone(milestone.id)}
                          aria-expanded={!isCollapsed}
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            padding: "0.3rem 0.65rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            color: "#1e293b",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          <span>{isCollapsed ? "▼ Mostrar" : "▲ Ocultar"}</span>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#64748b",
                            }}
                          >
                            ({milestone.capabilities.length})
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Prerequisite Links Summary */}
                    {milestone.prerequisites.length > 0 && (
                      <div
                        style={{
                          fontSize: "0.78rem",
                          backgroundColor: "#f1f5f9",
                          borderRadius: "6px",
                          padding: "0.4rem 0.75rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.2rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            fontSize: "0.72rem",
                          }}
                        >
                          Prerrequisitos del Hito:
                        </span>
                        {milestone.prerequisites.map((prereq) => (
                          <div
                            key={prereq.prerequisiteMilestoneId}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              color: prereq.isSatisfied
                                ? "#15803d"
                                : prereq.isBlocking
                                  ? "#b45309"
                                  : "#64748b",
                            }}
                          >
                            <span>
                              {prereq.isSatisfied
                                ? "✓"
                                : prereq.isBlocking
                                  ? "⚠️"
                                  : "ℹ️"}
                            </span>
                            <span>{prereq.prerequisiteTitle}</span>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                opacity: 0.85,
                              }}
                            >
                              (
                              {prereq.isBlocking ? "Bloqueante" : "Informativo"}
                              {prereq.isSatisfied
                                ? " — Satisfecho"
                                : " — Pendiente"}
                              )
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Capabilities List */}
                    {!isCollapsed && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.6rem",
                          paddingTop: "0.4rem",
                        }}
                      >
                        {milestone.capabilities.length === 0 ? (
                          <p
                            style={{
                              margin: "0.5rem 0",
                              fontSize: "0.85rem",
                              color: "#64748b",
                              fontStyle: "italic",
                            }}
                          >
                            No hay capacidades en este hito que coincidan con
                            los filtros seleccionados.
                          </p>
                        ) : (
                          milestone.capabilities.map((capability) => (
                            <CapabilityCard
                              key={capability.id}
                              capability={capability}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
