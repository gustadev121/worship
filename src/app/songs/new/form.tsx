"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
}

const EMPTY: SongFormValue = {
  title: "",
  artist: "",
  originalKey: "C major",
  practiceKey: "",
  bpm: "",
  timeSignature: "",
  lyricsAndChords: "",
  youtubeVideoId: "",
};

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
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof SongFormValue, v: string) {
    setValue((prev) => ({ ...prev, [key]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const body: Record<string, unknown> = {
      title: value.title,
      artist: value.artist,
      originalKey: value.originalKey,
    };
    if (value.practiceKey.trim()) {
      body.practiceKey = value.practiceKey.trim();
    }
    if (value.bpm.trim()) {
      body.bpm = Number(value.bpm);
    }
    if (value.timeSignature.trim()) {
      body.timeSignature = value.timeSignature.trim();
    }
    if (value.lyricsAndChords) {
      body.lyricsAndChords = value.lyricsAndChords;
    }
    if (value.youtubeVideoId.trim()) {
      body.youtubeVideoId = value.youtubeVideoId.trim();
    }
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
      setError(data?.error ?? "Error al guardar");
      return;
    }
    const data = (await res.json()) as { song: { id: string } };
    router.push(`/songs/${data.song.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <label>
        Título
        <input
          value={value.title}
          onChange={(e) => set("title", e.target.value)}
          required
        />
      </label>
      <label>
        Artista
        <input
          value={value.artist}
          onChange={(e) => set("artist", e.target.value)}
          required
        />
      </label>
      <label>
        Tono original
        <input
          value={value.originalKey}
          onChange={(e) => set("originalKey", e.target.value)}
          required
        />
      </label>
      <label>
        Tono de ensayo
        <input
          value={value.practiceKey}
          onChange={(e) => set("practiceKey", e.target.value)}
        />
      </label>
      <label>
        BPM
        <input
          value={value.bpm}
          onChange={(e) => set("bpm", e.target.value)}
          inputMode="numeric"
        />
      </label>
      <label>
        Compás
        <input
          value={value.timeSignature}
          onChange={(e) => set("timeSignature", e.target.value)}
        />
      </label>
      <label>
        Letra y acordes
        <textarea
          value={value.lyricsAndChords}
          onChange={(e) => set("lyricsAndChords", e.target.value)}
        />
      </label>
      <label>
        Video de YouTube
        <input
          value={value.youtubeVideoId}
          onChange={(e) => set("youtubeVideoId", e.target.value)}
        />
      </label>
      <button type="submit">{mode === "create" ? "Crear" : "Guardar"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
