"use client";

import { useState } from "react";
import type { RoadmapCapabilityDTO } from "@/core/application/dtos";
import type { FunctionalTrack, PriorityTier } from "@/core/domain/roadmap";

const TRACK_CONFIG: Record<
  FunctionalTrack,
  { label: string; bg: string; color: string; border: string }
> = {
  REPERTOIRE: {
    label: "Repertorio",
    bg: "#ecfdf5",
    color: "#065f46",
    border: "#a7f3d0",
  },
  PLANNING: {
    label: "Planificación",
    bg: "#eef2ff",
    color: "#3730a3",
    border: "#c7d2fe",
  },
  ROSTERING: {
    label: "Roster / Turnos",
    bg: "#f5f3ff",
    color: "#5b21b6",
    border: "#ddd6fe",
  },
  REHEARSAL: {
    label: "Ensayo",
    bg: "#fffbeb",
    color: "#92400e",
    border: "#fde68a",
  },
  STAGE: {
    label: "Escenario / En Vivo",
    bg: "#fff1f2",
    color: "#9f1239",
    border: "#fecdd3",
  },
};

const PRIORITY_CONFIG: Record<
  PriorityTier,
  { label: string; bg: string; color: string; border: string }
> = {
  P1: {
    label: "P1 - Crítico",
    bg: "#fee2e2",
    color: "#991b1b",
    border: "#fca5a5",
  },
  P2: {
    label: "P2 - Alto",
    bg: "#ffedd5",
    color: "#9a3412",
    border: "#fdba74",
  },
  P3: {
    label: "P3 - Medio",
    bg: "#e0f2fe",
    color: "#075985",
    border: "#7dd3fc",
  },
  P4: {
    label: "P4 - Futuro",
    bg: "#f1f5f9",
    color: "#334155",
    border: "#cbd5e1",
  },
};

export interface VoteButtonProps {
  capabilityId: string;
  initialHasVoted: boolean;
  initialInterestCount: number;
  initialNote: string | null;
}

export function VoteButton({
  capabilityId,
  initialHasVoted,
  initialInterestCount,
  initialNote,
}: VoteButtonProps) {
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [interestCount, setInterestCount] = useState(initialInterestCount);
  const [note, setNote] = useState(initialNote ?? "");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(initialNote ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleToggleVote() {
    if (isSubmitting) return;
    const prevVoted = hasVoted;
    const prevCount = interestCount;
    const nextVoted = !hasVoted;
    const nextCount = nextVoted
      ? interestCount + 1
      : Math.max(0, interestCount - 1);

    // Optimistic UI update
    setHasVoted(nextVoted);
    setInterestCount(nextCount);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(
        `/api/roadmap/capabilities/${capabilityId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hasInterest: nextVoted,
            note: nextVoted ? (note.trim() ? note.trim() : null) : null,
          }),
        },
      );

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as {
          error?: string | { message?: string };
        } | null;
        const msg =
          typeof errorData?.error === "string"
            ? errorData.error
            : (errorData?.error?.message ?? "Error al registrar voto");
        throw new Error(msg);
      }

      const data = (await res.json()) as {
        capabilityId: string;
        hasInterest: boolean;
        note: string | null;
        newTotalInterestCount: number;
      };

      setHasVoted(data.hasInterest);
      setInterestCount(data.newTotalInterestCount);
      setNote(data.note ?? "");
    } catch (err) {
      // Revert optimistic update
      setHasVoted(prevVoted);
      setInterestCount(prevCount);
      setErrorMessage(
        err instanceof Error ? err.message : "Error al procesar voto",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveNote() {
    if (isSubmitting) return;
    if (noteDraft.length > 280) {
      setErrorMessage("La nota no puede superar los 280 caracteres");
      return;
    }

    const prevNote = note;
    const prevVoted = hasVoted;
    const prevCount = interestCount;
    const nextVoted = true;
    const nextCount = hasVoted ? interestCount : interestCount + 1;

    // Optimistic UI update
    setHasVoted(nextVoted);
    setInterestCount(nextCount);
    setNote(noteDraft.trim());
    setIsEditingNote(false);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(
        `/api/roadmap/capabilities/${capabilityId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hasInterest: true,
            note: noteDraft.trim() || null,
          }),
        },
      );

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as {
          error?: string | { message?: string };
        } | null;
        const msg =
          typeof errorData?.error === "string"
            ? errorData.error
            : (errorData?.error?.message ?? "Error al guardar nota");
        throw new Error(msg);
      }

      const data = (await res.json()) as {
        capabilityId: string;
        hasInterest: boolean;
        note: string | null;
        newTotalInterestCount: number;
      };

      setHasVoted(data.hasInterest);
      setInterestCount(data.newTotalInterestCount);
      setNote(data.note ?? "");
    } catch (err) {
      setHasVoted(prevVoted);
      setInterestCount(prevCount);
      setNote(prevNote);
      setErrorMessage(
        err instanceof Error ? err.message : "Error al guardar nota",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        alignItems: "flex-end",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleToggleVote}
          disabled={isSubmitting}
          aria-label={
            hasVoted ? "Quitar voto de interés" : "Votar interés en función"
          }
          aria-pressed={hasVoted}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.35rem 0.75rem",
            borderRadius: "9999px",
            border: hasVoted ? "2px solid #3b82f6" : "1px solid #d1d5db",
            backgroundColor: hasVoted ? "#eff6ff" : "transparent",
            color: hasVoted ? "#1d4ed8" : "inherit",
            cursor: isSubmitting ? "wait" : "pointer",
            fontWeight: hasVoted ? 600 : 500,
            fontSize: "0.85rem",
            transition: "all 0.15s ease",
          }}
        >
          <span style={{ fontSize: "1rem" }}>{hasVoted ? "★" : "☆"}</span>
          <span>Interés</span>
          <span
            style={{
              backgroundColor: hasVoted ? "#3b82f6" : "#e5e7eb",
              color: hasVoted ? "#ffffff" : "#374151",
              borderRadius: "9999px",
              padding: "0.1rem 0.45rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              minWidth: "1.25rem",
              textAlign: "center",
            }}
          >
            {interestCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setNoteDraft(note);
            setIsEditingNote(!isEditingNote);
          }}
          aria-expanded={isEditingNote}
          style={{
            fontSize: "0.78rem",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            border: "1px dashed #9ca3af",
            backgroundColor: "transparent",
            color: "inherit",
            cursor: "pointer",
            opacity: 0.85,
          }}
        >
          {note ? "📝 Editar nota" : "💬 Agregar nota"}
        </button>
      </div>

      {note && !isEditingNote && (
        <div
          style={{
            fontSize: "0.78rem",
            fontStyle: "italic",
            backgroundColor: "#f9fafb",
            color: "#4b5563",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            padding: "0.3rem 0.6rem",
            maxWidth: "280px",
            wordBreak: "break-word",
          }}
        >
          "{note}"
        </div>
      )}

      {isEditingNote && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            backgroundColor: "#f9fafb",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            padding: "0.6rem",
            width: "100%",
            maxWidth: "320px",
          }}
        >
          <label
            htmlFor={`note-input-${capabilityId}`}
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Nota de ministerio (máx. 280 caracteres):
          </label>
          <textarea
            id={`note-input-${capabilityId}`}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            maxLength={280}
            rows={2}
            placeholder="¿Por qué o cómo le serviría esto a tu equipo?"
            style={{
              fontSize: "0.8rem",
              padding: "0.35rem",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.72rem",
            }}
          >
            <span
              style={{
                color: noteDraft.length > 270 ? "#dc2626" : "#6b7280",
              }}
            >
              {noteDraft.length}/280
            </span>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button
                type="button"
                onClick={() => setIsEditingNote(false)}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={isSubmitting}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  cursor: isSubmitting ? "wait" : "pointer",
                  fontWeight: 600,
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <span
          style={{
            color: "#dc2626",
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </span>
      )}
    </div>
  );
}

export function CapabilityCard({
  capability,
}: {
  capability: RoadmapCapabilityDTO;
}) {
  const track =
    TRACK_CONFIG[capability.functionalTrack] ?? TRACK_CONFIG.REPERTOIRE;
  const priority =
    PRIORITY_CONFIG[capability.priorityTier] ?? PRIORITY_CONFIG.P1;

  return (
    <article
      data-capability-id={capability.id}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "0.9rem",
        backgroundColor: capability.isCompleted ? "#fbfdfc" : "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ flex: "1 1 240px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              flexWrap: "wrap",
              marginBottom: "0.35rem",
            }}
          >
            <span
              style={{
                backgroundColor: priority.bg,
                color: priority.color,
                border: `1px solid ${priority.border}`,
                borderRadius: "9999px",
                padding: "0.15rem 0.55rem",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {priority.label}
            </span>

            <span
              style={{
                backgroundColor: track.bg,
                color: track.color,
                border: `1px solid ${track.border}`,
                borderRadius: "9999px",
                padding: "0.15rem 0.55rem",
                fontSize: "0.72rem",
                fontWeight: 600,
              }}
            >
              {track.label}
            </span>

            <span
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
              }}
            >
              👤 {capability.targetPersona}
            </span>

            {capability.isCompleted ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  backgroundColor: "#dcfce7",
                  color: "#166534",
                  border: "1px solid #86efac",
                  borderRadius: "9999px",
                  padding: "0.15rem 0.55rem",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}
              >
                ✓ Entregado
              </span>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  borderRadius: "9999px",
                  padding: "0.15rem 0.55rem",
                  fontSize: "0.72rem",
                  fontWeight: 500,
                }}
              >
                ○ Pendiente
              </span>
            )}
          </div>

          <h4
            style={{
              margin: "0 0 0.25rem 0",
              fontSize: "0.98rem",
              fontWeight: 600,
              lineHeight: 1.35,
              color: "#111827",
            }}
          >
            {capability.title}
          </h4>

          <p
            style={{
              margin: 0,
              fontSize: "0.84rem",
              color: "#4b5563",
              lineHeight: 1.45,
            }}
          >
            <strong style={{ color: "#374151" }}>Criterio de éxito:</strong>{" "}
            {capability.acceptanceCriteria}
          </p>
        </div>

        <VoteButton
          capabilityId={capability.id}
          initialHasVoted={capability.userHasVoted}
          initialInterestCount={capability.interestCount}
          initialNote={capability.userNote}
        />
      </div>
    </article>
  );
}
