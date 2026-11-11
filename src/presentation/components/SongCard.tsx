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
      className="rounded-xl border border-border/80 bg-card p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-border hover:shadow-xs"
    >
      {/* Top Metadata & Header */}
      <div className="space-y-3">
        {/* Metric Badges Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {song.bpm ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-muted-foreground border border-border/60"
                title="Tempo en pulsos por minuto"
              >
                <svg
                  className="w-3 h-3 opacity-70"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 2v20M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h20" />
                </svg>
                <span>{song.bpm} BPM</span>
              </span>
            ) : null}

            {song.timeSignature ? (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-muted-foreground border border-border/60"
                title="Compás musical"
              >
                {song.timeSignature}
              </span>
            ) : null}
          </div>

          {/* Volunteer Count Indicator */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border border-border/60 text-muted-foreground"
            title="Integrantes asignados a partes"
          >
            <svg
              className="w-3 h-3 opacity-70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>
              {volunteerTotal} {volunteerTotal === 1 ? "parte" : "partes"}
            </span>
          </span>
        </div>

        {/* Title & Artist */}
        <div>
          <h3 className="text-base font-bold text-foreground leading-snug group">
            <Link
              href={`/songs/${song.id}`}
              className="hover:text-primary transition-colors"
            >
              {song.title}
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            {song.artist}
          </p>
        </div>

        {/* Musical Keys Row */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-secondary text-foreground border border-border/70"
            title="Tono musical original"
          >
            Tono: {song.originalKey}
          </span>

          {song.practiceKey ? (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-chord-accent/10 text-chord-accent border border-chord-accent/30"
              title="Tono de ensayo adaptado"
            >
              Ensayo: {song.practiceKey}
            </span>
          ) : null}
        </div>

        {/* Repertoire Label Pills */}
        {song.labels && song.labels.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {song.labels.map((lbl) => (
              <span
                key={lbl.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                style={{
                  backgroundColor: lbl.colorHex
                    ? `${lbl.colorHex}18`
                    : "var(--secondary)",
                  color: lbl.colorHex ?? "var(--foreground)",
                  borderColor: lbl.colorHex
                    ? `${lbl.colorHex}40`
                    : "var(--border)",
                }}
              >
                {lbl.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Card Footer: Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60 mt-auto">
        <Link
          href={`/songs/${song.id}`}
          className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          Detalles
        </Link>

        <Link href={`/songs/${song.id}/practice`}>
          <button
            type="button"
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs transition-colors"
            aria-label={`Iniciar ensayo de ${song.title}`}
          >
            <svg
              className="w-3.5 h-3.5 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Ensayo</span>
          </button>
        </Link>
      </div>
    </SpotlightCard>
  );
}
