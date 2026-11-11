"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FunctionalTrack, PriorityTier } from "@/core/domain/roadmap";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";

const TRACKS: Array<{ value: FunctionalTrack; label: string }> = [
  { value: "REPERTOIRE", label: "Repertorio" },
  { value: "PLANNING", label: "Planificación" },
  { value: "ROSTERING", label: "Roster" },
  { value: "REHEARSAL", label: "Ensayo" },
  { value: "STAGE", label: "Escenario" },
];

const PRIORITIES: Array<{
  value: PriorityTier;
  label: string;
  variant: "tierP1" | "tierP2" | "tierP3" | "tierP4";
}> = [
  { value: "P1", label: "P1 Crítico", variant: "tierP1" },
  { value: "P2", label: "P2 Alto", variant: "tierP2" },
  { value: "P3", label: "P3 Medio", variant: "tierP3" },
  { value: "P4", label: "P4 Futuro", variant: "tierP4" },
];

export interface RoadmapFiltersProps {
  currentTrack?: string;
  currentPriority?: string;
  onFilterChange?: (filters: { track?: string; priority?: string }) => void;
}

export function RoadmapFilters({
  currentTrack: propTrack,
  currentPriority: propPriority,
  onFilterChange,
}: RoadmapFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedTrack =
    propTrack !== undefined ? propTrack : (searchParams.get("track") ?? "");
  const selectedPriority =
    propPriority !== undefined
      ? propPriority
      : (searchParams.get("priority") ?? "");

  function applyFilter(track: string, priority: string) {
    if (onFilterChange) {
      onFilterChange({
        track: track || undefined,
        priority: priority || undefined,
      });
    }

    const next = new URLSearchParams(searchParams.toString());
    if (track) {
      next.set("track", track);
    } else {
      next.delete("track");
    }

    if (priority) {
      next.set("priority", priority);
    } else {
      next.delete("priority");
    }

    const qs = next.toString();
    router.push(qs ? `/roadmap?${qs}` : "/roadmap");
  }

  function toggleTrack(track: FunctionalTrack) {
    const nextTrack = selectedTrack === track ? "" : track;
    applyFilter(nextTrack, selectedPriority);
  }

  function togglePriority(priority: PriorityTier) {
    const nextPriority = selectedPriority === priority ? "" : priority;
    applyFilter(selectedTrack, nextPriority);
  }

  function clearAll() {
    applyFilter("", "");
  }

  const hasActiveFilters = Boolean(selectedTrack || selectedPriority);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem",
        boxShadow: "var(--shadow-sm)",
      }}
    >
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
            fontSize: "0.8125rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--muted-foreground)",
          }}
        >
          Filtros del Roadmap
        </span>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            style={{
              color: "var(--destructive)",
              fontSize: "0.8125rem",
              padding: "0.15rem 0.5rem",
              minHeight: "32px",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <span>Limpiar filtros</span>
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        )}
      </div>

      {/* Functional Tracks */}
      <fieldset
        aria-label="Filtro de Tracks Funcionales"
        style={{
          border: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--foreground)",
            marginRight: "0.25rem",
          }}
        >
          Track:
        </span>
        {TRACKS.map((t) => {
          const isSelected = selectedTrack === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => toggleTrack(t.value)}
              aria-pressed={isSelected}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-full)",
                border: isSelected
                  ? "1px solid var(--primary)"
                  : "1px solid var(--border)",
                backgroundColor: isSelected ? "var(--primary)" : "var(--muted)",
                color: isSelected
                  ? "var(--primary-foreground)"
                  : "var(--foreground)",
                fontSize: "0.8125rem",
                fontWeight: isSelected ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
              {isSelected && (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          );
        })}
      </fieldset>

      {/* Priority Tiers */}
      <fieldset
        aria-label="Filtro de Prioridad"
        style={{
          border: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--foreground)",
            marginRight: "0.25rem",
          }}
        >
          Prioridad:
        </span>
        {PRIORITIES.map((p) => {
          const isSelected = selectedPriority === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => togglePriority(p.value)}
              aria-pressed={isSelected}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "var(--radius-full)",
                border: isSelected
                  ? "2px solid var(--ring)"
                  : "1px solid var(--border)",
                backgroundColor: isSelected ? "var(--muted)" : "transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Badge variant={p.variant} size="sm">
                {p.label}
              </Badge>
              {isSelected && (
                <svg
                  className="w-3 h-3 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}
