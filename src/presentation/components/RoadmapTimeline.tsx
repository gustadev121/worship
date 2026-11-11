"use client";

import { useEffect, useState } from "react";
import type { RoadmapPhaseDTO } from "@/core/application/dtos";
import type { PhaseStatus } from "@/core/domain/roadmap";
import { CapabilityCard } from "./CapabilityCard";
import { MilestoneStatusBadge } from "./MilestoneStatusBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";

const PHASE_STATUS_MAP: Record<
  PhaseStatus,
  {
    label: string;
    variant: "statusReady" | "default" | "statusPracticing" | "secondary";
  }
> = {
  COMPLETED: { label: "Completada", variant: "statusReady" },
  IN_PROGRESS: { label: "En Curso", variant: "default" },
  PENDING_PREREQUISITES: {
    label: "Esperando Prerequisitos",
    variant: "statusPracticing",
  },
  PLANNED: { label: "Planificada", variant: "secondary" },
};

export interface RoadmapTimelineProps {
  phases: RoadmapPhaseDTO[];
}

export function RoadmapTimeline({ phases }: RoadmapTimelineProps) {
  // Store collapsed milestone IDs (default is all expanded)
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<string>>(
    new Set(),
  );

  // Trigger smooth progress animation on mount
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
      {/* Controls row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.875rem",
            color: "var(--muted-foreground)",
            fontWeight: 500,
          }}
        >
          Visualizando 4 fases secuenciales de desarrollo ministerial
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={expandAll}
            style={{ fontSize: "0.8125rem", minHeight: "34px" }}
          >
            Expandir todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={collapseAll}
            style={{ fontSize: "0.8125rem", minHeight: "34px" }}
          >
            Colapsar todos
          </Button>
        </div>
      </div>

      {phases.map((phase) => {
        const statusMeta =
          PHASE_STATUS_MAP[phase.status] ?? PHASE_STATUS_MAP.PLANNED;
        const targetPercent = phase.completionPercentage;
        const currentPercent = isMounted ? targetPercent : 0;

        return (
          <Card
            key={phase.id}
            data-phase-id={phase.id}
            variant="bordered"
            style={{
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Top phase indicator stripe */}
            <div
              style={{
                height: "4px",
                width: "100%",
                backgroundColor:
                  phase.status === "COMPLETED"
                    ? "var(--status-ready)"
                    : phase.status === "IN_PROGRESS"
                      ? "var(--primary)"
                      : "transparent",
              }}
            />

            <CardHeader style={{ paddingBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <Badge variant="default" size="md">
                    FASE {phase.phaseNumber}
                  </Badge>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.375rem",
                      fontWeight: 800,
                      color: "var(--foreground)",
                      letterSpacing: "-0.015em",
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
                      fontSize: "0.8125rem",
                      color: "var(--muted-foreground)",
                      backgroundColor: "var(--muted)",
                      borderRadius: "var(--radius-full)",
                      padding: "0.25rem 0.75rem",
                      fontWeight: 500,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <svg
                      className="w-3.5 h-3.5 opacity-70"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{phase.targetHorizon}</span>
                  </span>

                  <Badge variant={statusMeta.variant} size="md" dot>
                    {statusMeta.label}
                  </Badge>
                </div>
              </div>

              <p
                style={{
                  margin: "0.25rem 0 1rem 0",
                  fontSize: "0.9375rem",
                  color: "var(--muted-foreground)",
                  lineHeight: 1.5,
                }}
              >
                {phase.description}
              </p>

              {/* 4-Phase Animated Progress Bar */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    marginBottom: "0.375rem",
                  }}
                >
                  <span>Progreso de Fase</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {targetPercent}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={targetPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progreso de Fase ${phase.phaseNumber}: ${targetPercent}%`}
                  style={{
                    height: "10px",
                    width: "100%",
                    backgroundColor: "var(--muted)",
                    borderRadius: "var(--radius-full)",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${currentPercent}%`,
                      backgroundColor:
                        targetPercent === 100
                          ? "var(--status-ready)"
                          : "var(--primary)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow:
                        phase.status === "IN_PROGRESS"
                          ? "var(--glow-indigo)"
                          : "none",
                    }}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Milestones Accordions */}
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
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "var(--card-elevated)",
                        padding: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.875rem",
                        boxShadow: "var(--shadow-sm)",
                        transition: "border-color 0.15s ease",
                      }}
                    >
                      {/* Milestone Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: "0.75rem",
                        }}
                      >
                        <div style={{ flex: "1 1 280px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              flexWrap: "wrap",
                              marginBottom: "0.35rem",
                            }}
                          >
                            <h4
                              style={{
                                margin: 0,
                                fontSize: "1.1rem",
                                fontWeight: 700,
                                color: "var(--foreground)",
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
                              fontSize: "0.875rem",
                              color: "var(--muted-foreground)",
                              lineHeight: 1.45,
                            }}
                          >
                            {milestone.description}
                          </p>

                          {milestone.releaseNotes && (
                            <div
                              style={{
                                marginTop: "0.5rem",
                                fontSize: "0.8125rem",
                                backgroundColor: "var(--status-ready-bg)",
                                color: "var(--foreground)",
                                padding: "0.4rem 0.75rem",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--status-ready-border)",
                              }}
                            >
                              <strong>Notas de versión:</strong>{" "}
                              {milestone.releaseNotes}
                            </div>
                          )}
                        </div>

                        {/* Accordion Expand/Collapse Toggle */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => toggleMilestone(milestone.id)}
                            aria-expanded={!isCollapsed}
                            aria-controls={`milestone-content-${milestone.id}`}
                            style={{
                              fontSize: "0.8125rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              minHeight: "34px",
                            }}
                          >
                            <span>
                              {milestone.capabilities.length} capacidades
                            </span>
                            <svg
                              className="w-3.5 h-3.5 transition-transform duration-200"
                              style={{
                                transform: isCollapsed
                                  ? "rotate(-90deg)"
                                  : "rotate(0deg)",
                              }}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              aria-hidden="true"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </Button>
                        </div>
                      </div>

                      {/* Capabilities List inside Accordion */}
                      {!isCollapsed && (
                        <div
                          id={`milestone-content-${milestone.id}`}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                            marginTop: "0.25rem",
                            paddingTop: "0.75rem",
                            borderTop: "1px solid var(--border)",
                          }}
                        >
                          {milestone.capabilities.length === 0 ? (
                            <p
                              style={{
                                margin: 0,
                                fontSize: "0.85rem",
                                color: "var(--muted-foreground)",
                                fontStyle: "italic",
                              }}
                            >
                              No hay capacidades asociadas con los filtros
                              actuales.
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
