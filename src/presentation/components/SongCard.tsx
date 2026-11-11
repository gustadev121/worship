"use client";

import Link from "next/link";
import { SpotlightCard } from "./reactbits/spotlight-card";

export interface SongLabelItem {
  id: string;
  name: string;
  colorHex?: string;
}

export interface SongCardSong {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  practiceKey: string | null;
  bpm?: number | null;
  timeSignature?: string | null;
  labels?: SongLabelItem[];
  volunteerCount?: number;
  assignedRolesCount?: number;
}

export function SongCard({ song }: { song: SongCardSong }) {
  const volunteerTotal = song.volunteerCount ?? song.assignedRolesCount ?? 0;

  return (
    <SpotlightCard
      as="article"
      className="wf-card wf-card-interactive"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        padding: "1.25rem",
        gap: "1rem",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Card Header & Metadata */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {/* Top Pills Row: BPM & Time Signature */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              flexWrap: "wrap",
            }}
          >
            {song.bpm ? (
              <span
                className="wf-badge wf-badge-sm wf-badge-secondary"
                title="Tempo en pulsos por minuto"
              >
                ♩ {song.bpm} BPM
              </span>
            ) : null}
            {song.timeSignature ? (
              <span
                className="wf-badge wf-badge-sm wf-badge-outline"
                title="Compás musical"
              >
                {song.timeSignature}
              </span>
            ) : null}
          </div>
          {/* Volunteer Count Indicator */}
          <span
            className="wf-badge wf-badge-sm wf-badge-outline"
            style={{
              color:
                volunteerTotal > 0
                  ? "var(--role-member)"
                  : "var(--muted-foreground)",
              borderColor:
                volunteerTotal > 0
                  ? "var(--role-member-border)"
                  : "var(--border)",
            }}
          >
            👥 {volunteerTotal} {volunteerTotal === 1 ? "parte" : "partes"}
          </span>
        </div>

        {/* Title & Artist */}
        <div>
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            <Link
              href={`/songs/${song.id}`}
              style={{
                color: "var(--foreground)",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--foreground)";
              }}
            >
              {song.title}
            </Link>
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
              margin: "0.25rem 0 0 0",
            }}
          >
            {song.artist}
          </p>
        </div>

        {/* Musical Keys Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginTop: "0.25rem",
          }}
        >
          <span
            className="wf-badge wf-badge-sm wf-badge-key-original"
            title="Tono musical original"
          >
            Tono: {song.originalKey}
          </span>
          {song.practiceKey ? (
            <span
              className="wf-badge wf-badge-sm wf-badge-key-practice"
              title="Tono de ensayo adaptado"
            >
              Ensayo: {song.practiceKey}
            </span>
          ) : null}
        </div>

        {/* Repertoire Label Pills */}
        {song.labels && song.labels.length > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              flexWrap: "wrap",
              marginTop: "0.25rem",
            }}
          >
            {song.labels.map((lbl) => (
              <span
                key={lbl.id}
                className="wf-badge wf-badge-sm"
                style={{
                  backgroundColor: lbl.colorHex
                    ? `${lbl.colorHex}22`
                    : "var(--secondary)",
                  color: lbl.colorHex ?? "var(--foreground)",
                  borderColor: lbl.colorHex
                    ? `${lbl.colorHex}66`
                    : "var(--border)",
                }}
              >
                {lbl.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Card Footer: Quick Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          paddingTop: "0.75rem",
          borderTop: "1px solid var(--border-subtle)",
          marginTop: "auto",
        }}
      >
        <Link
          href={`/songs/${song.id}`}
          className="wf-btn wf-btn-ghost wf-btn-sm"
          style={{
            fontSize: "0.8125rem",
            padding: "0.35rem 0.65rem",
            color: "var(--muted-foreground)",
          }}
        >
          Ver detalles →
        </Link>
        <Link
          href={`/songs/${song.id}/practice`}
          className="wf-btn wf-btn-primary wf-btn-sm"
          style={{
            fontSize: "0.8125rem",
            padding: "0.35rem 0.75rem",
            minHeight: "36px",
          }}
          aria-label={`Iniciar ensayo de ${song.title}`}
        >
          <span>▶ Ensayo</span>
        </Link>
      </div>
    </SpotlightCard>
  );
}
