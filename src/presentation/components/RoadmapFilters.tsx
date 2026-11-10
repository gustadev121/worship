"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FunctionalTrack, PriorityTier } from "@/core/domain/roadmap";

const TRACKS: Array<{ value: FunctionalTrack; label: string }> = [
  { value: "REPERTOIRE", label: "Repertorio" },
  { value: "PLANNING", label: "Planificación" },
  { value: "ROSTERING", label: "Roster" },
  { value: "REHEARSAL", label: "Ensayo" },
  { value: "STAGE", label: "Escenario" },
];

const PRIORITIES: Array<{ value: PriorityTier; label: string }> = [
  { value: "P1", label: "P1 Crítico" },
  { value: "P2", label: "P2 Alto" },
  { value: "P3", label: "P3 Medio" },
  { value: "P4", label: "P4 Futuro" },
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
        gap: "0.75rem",
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1.5rem",
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
            fontSize: "0.85rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#4b5563",
          }}
        >
          Filtrar Capacidades del Roadmap
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            style={{
              fontSize: "0.78rem",
              color: "#dc2626",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "underline",
              padding: "0.1rem 0.3rem",
            }}
          >
            Limpiar filtros
          </button>
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
          gap: "0.4rem",
        }}
      >
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#374151",
            marginRight: "0.25rem",
          }}
        >
          Track:
        </span>
        {TRACKS.map((t) => {
          const isActive = selectedTrack === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => toggleTrack(t.value)}
              aria-pressed={isActive}
              style={{
                fontSize: "0.78rem",
                fontWeight: isActive ? 600 : 500,
                padding: "0.25rem 0.7rem",
                borderRadius: "9999px",
                border: isActive ? "1px solid #3b82f6" : "1px solid #d1d5db",
                backgroundColor: isActive ? "#2563eb" : "#ffffff",
                color: isActive ? "#ffffff" : "#374151",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </fieldset>

      {/* Priority Tiers */}
      <fieldset
        aria-label="Filtro de Prioridades"
        style={{
          border: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.4rem",
        }}
      >
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#374151",
            marginRight: "0.25rem",
          }}
        >
          Prioridad:
        </span>
        {PRIORITIES.map((p) => {
          const isActive = selectedPriority === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => togglePriority(p.value)}
              aria-pressed={isActive}
              style={{
                fontSize: "0.78rem",
                fontWeight: isActive ? 600 : 500,
                padding: "0.25rem 0.7rem",
                borderRadius: "9999px",
                border: isActive ? "1px solid #111827" : "1px solid #d1d5db",
                backgroundColor: isActive ? "#111827" : "#ffffff",
                color: isActive ? "#ffffff" : "#374151",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}
