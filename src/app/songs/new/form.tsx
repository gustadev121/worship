"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import { parseChordPro } from "@/core/domain/chordpro";
import { MUSICAL_KEYS } from "@/core/domain/keys";
import type { SectionTimestamp } from "@/core/domain/song";
import { normalizeYoutubeVideoId } from "@/core/domain/youtube";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Input, Textarea } from "@/presentation/components/ui/input";

export interface SongFormValue {
  id?: string;
  title: string;
  artist: string;
  originalKey: string;
  practiceKey: string;
  bpm: string;
  timeSignature: string;
  lyricsAndChords: string;
  youtubeVideoId: string;
  sectionTimestamps: SectionTimestamp[];
}

const EMPTY: SongFormValue = {
  title: "",
  artist: "",
  originalKey: "C major",
  practiceKey: "",
  bpm: "",
  timeSignature: "4/4",
  lyricsAndChords: "",
  youtubeVideoId: "",
  sectionTimestamps: [],
};

const COMMON_CHORDS = ["G", "D", "Em", "C", "A", "E", "Am", "F", "Bm", "Bb"];
const COMMON_DIRECTIVES = [
  "[Verso 1]",
  "[Verso 2]",
  "[Coro]",
  "[Puente]",
  "[Intro]",
  "[Outro]",
];
const TIME_SIGNATURE_PRESETS = ["4/4", "6/8", "3/4", "2/4", "12/8"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SongForm({
  mode,
  songId,
  initial,
}: {
  mode: "create" | "edit";
  songId?: string;
  initial?: SongFormValue;
}) {
  const router = useRouter();
  const [value, setValue] = useState<SongFormValue>(initial ?? EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ChordPro Editor Tab State: "split" | "edit" | "preview"
  const [editorTab, setEditorTab] = useState<"split" | "edit" | "preview">(
    "split",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Section Timestamps Builder Local State
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [newSectionSeconds, setNewSectionSeconds] = useState("");
  const [sectionError, setSectionError] = useState<string | null>(null);

  const originalKeySelectId = useId();
  const practiceKeySelectId = useId();
  const timeSignatureSelectId = useId();

  function setField<K extends keyof SongFormValue>(
    key: K,
    val: SongFormValue[K],
  ) {
    setValue((prev) => ({ ...prev, [key]: val }));
  }

  // Extract YouTube ID for live preview thumbnail
  const detectedVideoId = useMemo(() => {
    const raw = value.youtubeVideoId.trim();
    if (!raw) return null;
    try {
      return normalizeYoutubeVideoId(raw);
    } catch {
      if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
        return raw;
      }
      return null;
    }
  }, [value.youtubeVideoId]);

  // Real-time parsed ChordPro representation
  const parsedSheet = useMemo(() => {
    return parseChordPro(value.lyricsAndChords || "", {
      title: value.title || "Sin título",
      artist: value.artist || "Artista",
      originalKey: value.originalKey || "C major",
    });
  }, [value.lyricsAndChords, value.title, value.artist, value.originalKey]);

  // Quick insert chord or directive into textarea
  function insertToken(token: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setField(
        "lyricsAndChords",
        value.lyricsAndChords ? `${value.lyricsAndChords} ${token}` : token,
      );
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const current = textarea.value;
    const next = `${current.slice(0, start)}${token}${current.slice(end)}`;

    setField("lyricsAndChords", next);

    setTimeout(() => {
      textarea.focus();
      const nextPos = start + token.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 0);
  }

  // Add section timestamp
  function handleAddSection(e: React.FormEvent) {
    e.preventDefault();
    setSectionError(null);

    const label = newSectionLabel.trim();
    if (!label) {
      setSectionError("Ingresa el nombre de la sección (ej. Intro, Coro)");
      return;
    }

    let secs: number;
    if (newSectionSeconds.includes(":")) {
      const parts = newSectionSeconds.split(":");
      const min = Number.parseInt(parts[0], 10) || 0;
      const s = Number.parseFloat(parts[1]) || 0;
      secs = min * 60 + s;
    } else {
      secs = Number.parseFloat(newSectionSeconds);
    }

    if (Number.isNaN(secs) || secs < 0) {
      setSectionError(
        "El tiempo debe ser un número en segundos (ej. 45 o 1:30)",
      );
      return;
    }

    const nextTimestamps = [
      ...value.sectionTimestamps,
      { label, startSeconds: Math.round(secs) },
    ].sort((a, b) => a.startSeconds - b.startSeconds);

    setField("sectionTimestamps", nextTimestamps);
    setNewSectionLabel("");
    setNewSectionSeconds("");
  }

  // Remove section timestamp
  function handleRemoveSection(index: number) {
    const next = value.sectionTimestamps.filter((_, i) => i !== index);
    setField("sectionTimestamps", next);
  }

  // BPM Steppers
  function adjustBpm(delta: number) {
    const current = Number.parseInt(value.bpm, 10) || 120;
    const updated = Math.min(300, Math.max(30, current + delta));
    setField("bpm", String(updated));
  }

  // Form Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic domain validation before sending
    if (!value.title.trim()) {
      setError("El título de la canción es obligatorio");
      return;
    }
    if (!value.artist.trim()) {
      setError("El nombre del artista es obligatorio");
      return;
    }

    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        title: value.title.trim(),
        artist: value.artist.trim(),
        originalKey: value.originalKey,
      };

      if (value.practiceKey.trim()) {
        body.practiceKey = value.practiceKey.trim();
      } else {
        body.practiceKey = null;
      }

      if (value.bpm.trim()) {
        const bpmNum = Number.parseInt(value.bpm.trim(), 10);
        if (!Number.isNaN(bpmNum)) {
          body.bpm = bpmNum;
        }
      }

      if (value.timeSignature.trim()) {
        body.timeSignature = value.timeSignature.trim();
      }

      body.lyricsAndChords = value.lyricsAndChords || "";

      if (detectedVideoId) {
        body.youtubeVideoId = detectedVideoId;
      } else if (value.youtubeVideoId.trim()) {
        body.youtubeVideoId = value.youtubeVideoId.trim();
      } else {
        body.youtubeVideoId = null;
      }

      body.sectionTimestamps = value.sectionTimestamps;

      const url = mode === "create" ? "/api/songs" : `/api/songs/${songId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Error al guardar los datos de la canción");
        setIsSubmitting(false);
        return;
      }

      const data = (await res.json()) as { song: { id: string } };
      router.push(`/songs/${data.song.id}`);
      router.refresh();
    } catch {
      setError("Error de conexión al guardar la canción");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
    >
      {/* Global Error Banner */}
      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid var(--destructive)",
            color: "var(--destructive)",
            borderRadius: "var(--radius-md)",
            padding: "0.875rem 1.25rem",
            fontSize: "0.9375rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* 1. INFORMACIÓN GENERAL */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle as="h2">1. Información General</CardTitle>
          <CardDescription>
            Identificación básica de la obra y acreditación de autoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <Input
              label="Título de la Canción *"
              placeholder="ej. En Esto Creo (El Credo)"
              value={value.title}
              onChange={(e) => setField("title", e.target.value)}
              required
              maxLength={200}
            />
            <Input
              label="Artista o Agrupación *"
              placeholder="ej. Hillsong en Español"
              value={value.artist}
              onChange={(e) => setField("artist", e.target.value)}
              required
              maxLength={200}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. ATRIBUTOS MUSICALES */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle as="h2">2. Atributos Musicales</CardTitle>
          <CardDescription>
            Configuración armónica, métrica y tempo para el equipo de alabanza.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {/* Tono Original */}
            <div className="wf-form-field">
              <label htmlFor={originalKeySelectId} className="wf-label">
                Tono Original *
              </label>
              <select
                id={originalKeySelectId}
                className="wf-input"
                value={value.originalKey}
                onChange={(e) => setField("originalKey", e.target.value)}
                required
              >
                {MUSICAL_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            {/* Tono de Ensayo */}
            <div className="wf-form-field">
              <label htmlFor={practiceKeySelectId} className="wf-label">
                Tono de Ensayo (Opcional)
              </label>
              <select
                id={practiceKeySelectId}
                className="wf-input"
                value={value.practiceKey}
                onChange={(e) => setField("practiceKey", e.target.value)}
              >
                <option value="">
                  Mismo tono original ({value.originalKey})
                </option>
                {MUSICAL_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            {/* BPM with Steppers */}
            <div className="wf-form-field">
              <label htmlFor="song-form-bpm" className="wf-label">
                BPM (Tempo)
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => adjustBpm(-5)}
                  aria-label="Restar 5 BPM"
                >
                  -5
                </Button>
                <input
                  id="song-form-bpm"
                  type="number"
                  className="wf-input"
                  style={{ textAlign: "center", fontWeight: 600 }}
                  placeholder="120"
                  min={30}
                  max={300}
                  value={value.bpm}
                  onChange={(e) => setField("bpm", e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => adjustBpm(5)}
                  aria-label="Sumar 5 BPM"
                >
                  +5
                </Button>
              </div>
            </div>

            {/* Compás */}
            <div className="wf-form-field">
              <label htmlFor={timeSignatureSelectId} className="wf-label">
                Compás
              </label>
              <select
                id={timeSignatureSelectId}
                className="wf-input"
                value={value.timeSignature}
                onChange={(e) => setField("timeSignature", e.target.value)}
              >
                <option value="">Seleccionar compás...</option>
                {TIME_SIGNATURE_PRESETS.map((ts) => (
                  <option key={ts} value={ts}>
                    {ts}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. VIDEO Y MULTIMEDIA */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle as="h2">3. Video y Multimedia</CardTitle>
          <CardDescription>
            Enlace de referencia de YouTube para guiar los ensayos y sincronizar
            secciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              alignItems: "start",
            }}
          >
            <div>
              <Input
                label="URL o ID de YouTube"
                placeholder="https://www.youtube.com/watch?v=... o dQw4w9WgXcQ"
                value={value.youtubeVideoId}
                onChange={(e) => setField("youtubeVideoId", e.target.value)}
                helperText="Soporta enlaces completos, enlaces cortos youtu.be o ID de 11 caracteres."
              />
            </div>

            {/* Live Preview Card */}
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "0.375rem",
                  color: "var(--foreground)",
                }}
              >
                Vista Previa del Video
              </span>
              {detectedVideoId ? (
                <div
                  style={{
                    backgroundColor: "var(--muted)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingBottom: "56.25%",
                      backgroundColor: "#000",
                    }}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${detectedVideoId}/hqdefault.jpg`}
                      alt="Miniatura de YouTube"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Badge variant="outline" size="sm">
                        ID: {detectedVideoId}
                      </Badge>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--status-ready)",
                          fontWeight: 500,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Válido</span>
                      </span>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${detectedVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--primary)",
                        textDecoration: "underline",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <span>Abrir en YouTube</span>
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    height: "140px",
                    border: "2px dashed var(--border)",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--muted-foreground)",
                    fontSize: "0.875rem",
                    textAlign: "center",
                    padding: "1rem",
                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                    gap: "0.5rem",
                  }}
                >
                  <svg
                    className="w-6 h-6 opacity-60"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                    <polyline points="17 2 12 7 7 2" />
                  </svg>
                  <span>
                    Introduce un enlace válido de YouTube para ver la miniatura.
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. LETRAS Y ACORDES CHORDPRO */}
      <Card variant="bordered">
        <CardHeader>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div>
              <CardTitle as="h2">4. Letras y Acordes ChordPro</CardTitle>
              <CardDescription>
                Editor interactivo de acordes entre corchetes (ej. [G]) con
                previsualización en tiempo real.
              </CardDescription>
            </div>

            {/* View Mode Tabs */}
            <div
              style={{
                display: "inline-flex",
                backgroundColor: "var(--muted)",
                padding: "0.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
              }}
              role="tablist"
              aria-label="Vistas del editor de acordes"
            >
              <button
                type="button"
                role="tab"
                aria-selected={editorTab === "edit"}
                onClick={() => setEditorTab("edit")}
                style={{
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor:
                    editorTab === "edit" ? "var(--card)" : "transparent",
                  color:
                    editorTab === "edit"
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                }}
              >
                Solo Editor
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={editorTab === "split"}
                onClick={() => setEditorTab("split")}
                style={{
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor:
                    editorTab === "split" ? "var(--card)" : "transparent",
                  color:
                    editorTab === "split"
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                }}
              >
                Dividido
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={editorTab === "preview"}
                onClick={() => setEditorTab("preview")}
                style={{
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor:
                    editorTab === "preview" ? "var(--card)" : "transparent",
                  color:
                    editorTab === "preview"
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                }}
              >
                Solo Vista Previa
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Quick Insertion Toolbar */}
            {editorTab !== "preview" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.375rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--muted)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--muted-foreground)",
                    marginRight: "0.375rem",
                  }}
                >
                  Insertar:
                </span>
                {COMMON_CHORDS.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertToken(`[${c}]`)}
                    style={{
                      fontFamily: "var(--font-mono)",
                      minHeight: "32px",
                      padding: "0.15rem 0.5rem",
                      fontWeight: 600,
                      color: "var(--chord-accent)",
                    }}
                  >
                    [{c}]
                  </Button>
                ))}
                <span
                  style={{
                    width: "1px",
                    height: "1.25rem",
                    backgroundColor: "var(--border)",
                    margin: "0 0.25rem",
                  }}
                />
                {COMMON_DIRECTIVES.map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => insertToken(`\n${d}\n`)}
                    style={{
                      minHeight: "32px",
                      padding: "0.15rem 0.5rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    {d}
                  </Button>
                ))}
              </div>
            )}

            {/* Split / Edit / Preview Workspace */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  editorTab === "split"
                    ? "repeat(auto-fit, minmax(320px, 1fr))"
                    : "1fr",
                gap: "1.25rem",
                minHeight: "320px",
              }}
            >
              {/* Textarea Editor Pane */}
              {editorTab !== "preview" && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <Textarea
                    ref={textareaRef}
                    placeholder={`[Verso 1]\n[G]En tu presencia [D]hay plenitud\n[Em]En tu mirada [C]paz y quietud\n\n[Coro]\n[C]Aleluya al [G]Rey\n[D]Santo es tu [Em]nombre`}
                    value={value.lyricsAndChords}
                    onChange={(e) =>
                      setField("lyricsAndChords", e.target.value)
                    }
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.9375rem",
                      lineHeight: "1.6",
                      minHeight: "320px",
                      height: "100%",
                      whiteSpace: "pre",
                    }}
                  />
                </div>
              )}

              {/* Real-time Syllable-Aligned Preview Pane */}
              {editorTab !== "edit" && (
                <div
                  style={{
                    backgroundColor: "var(--muted)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    padding: "1.25rem",
                    overflowX: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      Previsualización en Tono: {value.originalKey}
                    </span>
                    <Badge variant="keyPractice" size="sm">
                      ChordPro Live
                    </Badge>
                  </div>

                  {parsedSheet.sections.length === 0 ? (
                    <div
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "var(--muted-foreground)",
                        fontSize: "0.875rem",
                      }}
                    >
                      Escribe letras y acordes en el editor para previsualizar
                      aquí.
                    </div>
                  ) : (
                    parsedSheet.sections.map((section) => (
                      <div
                        key={section.sectionId}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {section.title && (
                          <div
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              color: "var(--primary)",
                              borderLeft: "3px solid var(--primary)",
                              paddingLeft: "0.5rem",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {section.title}
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          {section.lines.map((line) => {
                            if (line.isComment) {
                              return (
                                <div
                                  key={`comment-${section.sectionId}-${line.lineNumber}`}
                                  style={{
                                    fontStyle: "italic",
                                    color: "var(--muted-foreground)",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  {line.commentText}
                                </div>
                              );
                            }

                            // Check if line is completely empty
                            const hasContent = line.pairs.some(
                              (p) => p.chord || p.lyrics.trim().length > 0,
                            );

                            if (!hasContent) {
                              return (
                                <div
                                  key={`empty-${section.sectionId}-${line.lineNumber}`}
                                  style={{ height: "0.75rem" }}
                                />
                              );
                            }

                            return (
                              <div
                                key={`line-${section.sectionId}-${line.lineNumber}`}
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  alignItems: "flex-end",
                                  lineHeight: 1.2,
                                }}
                              >
                                {line.pairs.map((pair) => (
                                  <div
                                    key={`${section.sectionId}-${line.lineNumber}-${pair.chord ?? "nc"}-${pair.lyrics}`}
                                    style={{
                                      display: "inline-flex",
                                      flexDirection: "column",
                                      alignItems: "flex-start",
                                    }}
                                  >
                                    <span
                                      style={{
                                        minHeight: "1.15rem",
                                        fontSize: "0.8125rem",
                                        fontWeight: 700,
                                        fontFamily: "var(--font-mono)",
                                        color: "var(--chord-accent)",
                                        whiteSpace: "pre",
                                      }}
                                    >
                                      {pair.chord ?? "\u00A0"}
                                    </span>
                                    <span
                                      style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.9375rem",
                                        color: "var(--foreground)",
                                        whiteSpace: "pre",
                                      }}
                                    >
                                      {pair.lyrics.length > 0
                                        ? pair.lyrics
                                        : "\u00A0"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. SECCIONES Y TIEMPOS (TIMESTAMP BUILDER) */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle as="h2">5. Secciones y Tiempos</CardTitle>
          <CardDescription>
            Marcadores de tiempo para navegar rápidamente entre versos y coros
            durante el ensayo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {/* Timestamp List */}
            {value.sectionTimestamps.length > 0 ? (
              <div className="wf-table-container">
                <table className="wf-table">
                  <thead>
                    <tr>
                      <th className="wf-th">Sección</th>
                      <th className="wf-th">Tiempo de Inicio</th>
                      <th className="wf-th" style={{ textAlign: "right" }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {value.sectionTimestamps.map((ts, idx) => (
                      <tr
                        key={`${ts.label}-${ts.startSeconds}`}
                        className="wf-tr"
                      >
                        <td className="wf-td" style={{ fontWeight: 600 }}>
                          {ts.label}
                        </td>
                        <td className="wf-td">
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.875rem",
                              backgroundColor: "var(--muted)",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "var(--radius-xs)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {formatTime(ts.startSeconds)} ({ts.startSeconds}s)
                          </span>
                        </td>
                        <td className="wf-td" style={{ textAlign: "right" }}>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveSection(idx)}
                            aria-label={`Eliminar sección ${ts.label}`}
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  padding: "1.5rem",
                  backgroundColor: "rgba(0,0,0,0.03)",
                  border: "1px dashed var(--border)",
                  borderRadius: "var(--radius-md)",
                  textAlign: "center",
                  color: "var(--muted-foreground)",
                  fontSize: "0.875rem",
                }}
              >
                No hay secciones de tiempo configuradas aún. Agrega marcadores
                abajo.
              </div>
            )}

            {/* Add Timestamp Row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                gap: "0.75rem",
                padding: "1rem",
                backgroundColor: "var(--muted)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ flex: "1 1 200px" }}>
                <Input
                  label="Nombre de Sección"
                  placeholder="ej. Intro, Verso 1, Coro..."
                  value={newSectionLabel}
                  onChange={(e) => setNewSectionLabel(e.target.value)}
                />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <Input
                  label="Tiempo (segundos o mm:ss)"
                  placeholder="ej. 45 o 1:15"
                  value={newSectionSeconds}
                  onChange={(e) => setNewSectionSeconds(e.target.value)}
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleAddSection}
                >
                  + Agregar Sección
                </Button>
              </div>
            </div>

            {sectionError && (
              <p
                role="alert"
                style={{
                  color: "var(--destructive)",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                {sectionError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FORM ACTIONS BAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem",
          backgroundColor: "var(--card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <Link href={mode === "edit" && songId ? `/songs/${songId}` : "/"}>
          <Button type="button" variant="ghost" size="md">
            Cancelar
          </Button>
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
        >
          {mode === "create" ? "Crear Canción" : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
