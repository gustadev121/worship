"use client";

import { useState } from "react";
import type { RoadmapCapabilityDTO } from "@/core/application/dtos";
import type { FunctionalTrack, PriorityTier } from "@/core/domain/roadmap";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";

const TRACK_CONFIG: Record<FunctionalTrack, { label: string; icon: string }> = {
  REPERTOIRE: { label: "Repertorio", icon: "🎵" },
  PLANNING: { label: "Planificación", icon: "📋" },
  ROSTERING: { label: "Roster / Turnos", icon: "👥" },
  REHEARSAL: { label: "Ensayo", icon: "🎸" },
  STAGE: { label: "Escenario / En Vivo", icon: "🎤" },
};

const PRIORITY_TIER_CONFIG: Record<
  PriorityTier,
  {
    variant: "tierP1" | "tierP2" | "tierP3" | "tierP4";
    label: string;
  }
> = {
  P1: { variant: "tierP1", label: "P1 Crítico" },
  P2: { variant: "tierP2", label: "P2 Alto" },
  P3: { variant: "tierP3", label: "P3 Medio" },
  P4: { variant: "tierP4", label: "P4 Futuro" },
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
        gap: "0.5rem",
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
            gap: "0.45rem",
            padding: "0.35rem 0.75rem",
            borderRadius: "var(--radius-full)",
            border: hasVoted
              ? "1px solid var(--primary)"
              : "1px solid var(--border)",
            backgroundColor: hasVoted ? "var(--primary)" : "var(--card)",
            color: hasVoted ? "var(--primary-foreground)" : "var(--foreground)",
            cursor: isSubmitting ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: "0.8125rem",
            transition: "all 0.15s ease",
            boxShadow: hasVoted ? "var(--glow-indigo)" : "none",
          }}
        >
          <span style={{ fontSize: "0.95rem" }}>{hasVoted ? "★" : "☆"}</span>
          <span>Interesado</span>
          <span
            style={{
              backgroundColor: hasVoted
                ? "rgba(255, 255, 255, 0.25)"
                : "var(--muted)",
              color: hasVoted ? "#ffffff" : "var(--muted-foreground)",
              borderRadius: "var(--radius-full)",
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

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setNoteDraft(note);
            setIsEditingNote(!isEditingNote);
          }}
          aria-expanded={isEditingNote}
          style={{ fontSize: "0.78rem" }}
        >
          {note ? "📝 Editar nota" : "💬 Nota"}
        </Button>
      </div>

      {note && !isEditingNote && (
        <div
          style={{
            fontSize: "0.8125rem",
            fontStyle: "italic",
            backgroundColor: "var(--muted)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "0.4rem 0.75rem",
            maxWidth: "320px",
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
            gap: "0.5rem",
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem",
            width: "100%",
            maxWidth: "340px",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <label
            htmlFor={`note-input-${capabilityId}`}
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            Comentario o caso de uso (máx. 280 caracteres):
          </label>
          <textarea
            id={`note-input-${capabilityId}`}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            maxLength={280}
            rows={2}
            placeholder="¿Cómo ayudaría esta función a tu ministerio?"
            className="wf-textarea"
            style={{
              fontSize: "0.8125rem",
              padding: "0.4rem 0.5rem",
              minHeight: "60px",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.75rem",
            }}
          >
            <span
              style={{
                color:
                  noteDraft.length > 270
                    ? "var(--destructive)"
                    : "var(--muted-foreground)",
              }}
            >
              {noteDraft.length}/280
            </span>
            <div style={{ display: "flex", gap: "0.375rem" }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditingNote(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveNote}
                disabled={isSubmitting}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <span
          style={{
            color: "var(--destructive)",
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
    PRIORITY_TIER_CONFIG[capability.priorityTier] ?? PRIORITY_TIER_CONFIG.P1;

  return (
    <article
      data-capability-id={capability.id}
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "1rem",
        backgroundColor: capability.isCompleted
          ? "rgba(16, 185, 129, 0.04)"
          : "var(--card)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        boxShadow: "var(--shadow-sm)",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ flex: "1 1 260px" }}>
          {/* Badges Cluster */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "0.4rem",
            }}
          >
            {/* Priority Tier Badge */}
            <Badge variant={priority.variant} size="sm">
              {priority.label}
            </Badge>

            {/* Functional Track Pill */}
            <Badge variant="secondary" size="sm">
              <span>{track.icon}</span>
              <span>{track.label}</span>
            </Badge>

            {/* Target Persona */}
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--muted-foreground)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              👤 {capability.targetPersona}
            </span>

            {/* Completion Status */}
            {capability.isCompleted ? (
              <Badge variant="statusReady" size="sm" dot>
                Entregado
              </Badge>
            ) : (
              <Badge variant="secondary" size="sm">
                ○ Planificado
              </Badge>
            )}
          </div>

          {/* Title */}
          <h4
            style={{
              margin: "0 0 0.35rem 0",
              fontSize: "1rem",
              fontWeight: 700,
              lineHeight: 1.35,
              color: "var(--foreground)",
            }}
          >
            {capability.title}
          </h4>

          {/* Acceptance Criteria */}
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "var(--foreground)" }}>
              Criterio de éxito:
            </strong>{" "}
            {capability.acceptanceCriteria}
          </p>
        </div>

        {/* Volunteer Voting Action */}
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
