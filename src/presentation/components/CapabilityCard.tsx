"use client";

import { useState } from "react";
import type { RoadmapCapabilityDTO } from "@/core/application/dtos";
import type { FunctionalTrack, PriorityTier } from "@/core/domain/roadmap";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";

const TRACK_CONFIG: Record<FunctionalTrack, { label: string }> = {
  REPERTOIRE: { label: "Repertorio" },
  PLANNING: { label: "Planificación" },
  ROSTERING: { label: "Roster / Turnos" },
  REHEARSAL: { label: "Ensayo" },
  STAGE: { label: "Escenario / En Vivo" },
};

function TrackIcon({ track }: { track: FunctionalTrack }) {
  switch (track) {
    case "REPERTOIRE":
      return (
        <svg
          className="w-3 h-3 opacity-80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case "PLANNING":
      return (
        <svg
          className="w-3 h-3 opacity-80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      );
    case "ROSTERING":
      return (
        <svg
          className="w-3 h-3 opacity-80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      );
    case "REHEARSAL":
      return (
        <svg
          className="w-3 h-3 opacity-80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      );
    case "STAGE":
      return (
        <svg
          className="w-3 h-3 opacity-80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        </svg>
      );
  }
}

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
          <svg
            className={`w-3.5 h-3.5 ${hasVoted ? "fill-current" : "stroke-current fill-none"}`}
            viewBox="0 0 24 24"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
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
          {note ? "Editar nota" : "Nota"}
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
            <Badge
              variant="secondary"
              size="sm"
              className="gap-1.5 inline-flex items-center"
            >
              <TrackIcon track={capability.functionalTrack} />
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
              <svg
                className="w-3 h-3 opacity-70"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{capability.targetPersona}</span>
            </span>

            {/* Completion Status */}
            {capability.isCompleted ? (
              <Badge variant="statusReady" size="sm" dot>
                Entregado
              </Badge>
            ) : (
              <Badge variant="secondary" size="sm" dot>
                Planificado
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
