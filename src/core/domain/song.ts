import { ValidationError } from "./errors";
import { createMusicalKey, type MusicalKey } from "./keys";
import { normalizeYoutubeVideoId } from "./youtube";

export interface SectionTimestamp {
  label: string;
  startSeconds: number;
  endSeconds?: number;
}

export function createSectionTimestamp(input: {
  label: unknown;
  startSeconds: unknown;
  endSeconds?: unknown;
}): SectionTimestamp {
  const { label, startSeconds, endSeconds } = input;
  if (
    typeof label !== "string" ||
    label.trim().length === 0 ||
    label.length > 100
  ) {
    throw new ValidationError(
      "La etiqueta de la sección debe tener 1-100 caracteres",
    );
  }
  if (
    typeof startSeconds !== "number" ||
    !Number.isFinite(startSeconds) ||
    startSeconds < 0
  ) {
    throw new ValidationError("startSeconds debe ser un número >= 0");
  }
  if (endSeconds === undefined) {
    return { label, startSeconds };
  }
  if (
    typeof endSeconds !== "number" ||
    !Number.isFinite(endSeconds) ||
    endSeconds <= startSeconds
  ) {
    throw new ValidationError("endSeconds debe ser > startSeconds");
  }
  return { label, startSeconds, endSeconds };
}

export function createSectionTimestamps(value: unknown): SectionTimestamp[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new ValidationError("sectionTimestamps debe ser un arreglo");
  }
  return value.map((entry) => {
    if (typeof entry !== "object" || entry === null) {
      throw new ValidationError(
        "Las entradas de sectionTimestamps deben ser objetos",
      );
    }
    const record = entry as {
      label: unknown;
      startSeconds: unknown;
      endSeconds?: unknown;
    };
    return createSectionTimestamp(record);
  });
}

export function createBpm(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 30 ||
    value > 300
  ) {
    throw new ValidationError("El BPM debe ser un entero 30-300");
  }
  return value;
}

export function createTimeSignature(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || !/^\d{1,2}\/\d{1,2}$/.test(value)) {
    throw new ValidationError('El compás debe tener forma "4/4"');
  }
  return value;
}

export interface Song {
  id: string;
  organizationId: string;
  title: string;
  artist: string;
  originalKey: MusicalKey;
  practiceKey: MusicalKey | null;
  bpm?: number;
  timeSignature: string | null;
  lyricsAndChords: string;
  youtubeVideoId: string | null;
  sectionTimestamps: SectionTimestamp[];
  createdAt: string;
  updatedAt: string;
}

export function createSongTitle(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > 200
  ) {
    throw new ValidationError(
      "El título de la canción debe tener 1-200 caracteres",
    );
  }
  return value;
}

export function createArtist(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > 200
  ) {
    throw new ValidationError("El artista debe tener 1-200 caracteres");
  }
  return value;
}

export function createSong(input: {
  id: unknown;
  organizationId?: unknown;
  title: unknown;
  artist: unknown;
  originalKey: unknown;
  practiceKey?: unknown;
  bpm?: unknown;
  timeSignature?: unknown;
  lyricsAndChords?: unknown;
  youtubeVideoId?: unknown;
  sectionTimestamps?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}): Song {
  if (typeof input.id !== "string" || input.id.length === 0) {
    throw new ValidationError("El id de la canción es requerido");
  }
  let organizationId = "worshipflow-central";
  if (input.organizationId !== undefined) {
    if (
      typeof input.organizationId !== "string" ||
      input.organizationId.trim().length === 0
    ) {
      throw new ValidationError("El id de la organización es requerido");
    }
    organizationId = input.organizationId.trim();
  }
  const now = new Date().toISOString();
  return {
    id: input.id,
    organizationId,
    title: createSongTitle(input.title),
    artist: createArtist(input.artist),
    originalKey: createMusicalKey(input.originalKey),
    practiceKey:
      input.practiceKey === undefined || input.practiceKey === null
        ? null
        : createMusicalKey(input.practiceKey),
    bpm: createBpm(input.bpm),
    timeSignature: createTimeSignature(input.timeSignature),
    lyricsAndChords:
      input.lyricsAndChords === undefined
        ? ""
        : requireLyrics(input.lyricsAndChords),
    youtubeVideoId:
      input.youtubeVideoId === undefined ||
      input.youtubeVideoId === null ||
      input.youtubeVideoId === ""
        ? null
        : normalizeYoutubeVideoId(input.youtubeVideoId),
    sectionTimestamps: createSectionTimestamps(input.sectionTimestamps),
    createdAt: typeof input.createdAt === "string" ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : now,
  };
}

function requireLyrics(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("lyricsAndChords debe ser un texto");
  }
  return value;
}

export interface SongPatch {
  title?: unknown;
  artist?: unknown;
  originalKey?: unknown;
  practiceKey?: unknown;
  bpm?: unknown;
  timeSignature?: unknown;
  lyricsAndChords?: unknown;
  youtubeVideoId?: unknown;
  sectionTimestamps?: unknown;
}

export function updateSong(song: Song, patch: SongPatch): Song {
  return {
    ...song,
    title:
      patch.title === undefined ? song.title : createSongTitle(patch.title),
    artist:
      patch.artist === undefined ? song.artist : createArtist(patch.artist),
    originalKey:
      patch.originalKey === undefined
        ? song.originalKey
        : createMusicalKey(patch.originalKey),
    practiceKey:
      patch.practiceKey === undefined
        ? song.practiceKey
        : patch.practiceKey === null
          ? null
          : createMusicalKey(patch.practiceKey),
    bpm:
      patch.bpm === undefined
        ? song.bpm
        : patch.bpm === null
          ? undefined
          : createBpm(patch.bpm),
    timeSignature:
      patch.timeSignature === undefined
        ? song.timeSignature
        : createTimeSignature(patch.timeSignature),
    lyricsAndChords:
      patch.lyricsAndChords === undefined
        ? song.lyricsAndChords
        : requireLyrics(patch.lyricsAndChords),
    youtubeVideoId:
      patch.youtubeVideoId === undefined
        ? song.youtubeVideoId
        : patch.youtubeVideoId === null || patch.youtubeVideoId === ""
          ? null
          : normalizeYoutubeVideoId(patch.youtubeVideoId),
    sectionTimestamps:
      patch.sectionTimestamps === undefined
        ? song.sectionTimestamps
        : createSectionTimestamps(patch.sectionTimestamps),
    updatedAt: new Date().toISOString(),
  };
}
