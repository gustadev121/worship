import { ForbiddenError, NotFoundError } from "../../domain/errors";
import {
  createSong,
  type Song,
  type SongPatch,
  updateSong,
} from "../../domain/song";
import type {
  ILabelRepository,
  ISongRepository,
  SessionPayload,
  SongFilter,
} from "../ports";

function newId(): string {
  return crypto.randomUUID();
}

function requireAdmin(actor: SessionPayload): void {
  if (actor.role !== "ADMIN") {
    throw new ForbiddenError("ADMIN only");
  }
}

export class GetSong {
  constructor(private readonly songs: ISongRepository) {}

  async execute(input: { id: string }): Promise<{ song: Song }> {
    const song = await this.songs.findById(input.id);
    if (!song) {
      throw new NotFoundError("Song not found");
    }
    return { song };
  }
}

export class ListSongs {
  constructor(private readonly songs: ISongRepository) {}

  async execute(input: { filter?: SongFilter }): Promise<{ songs: Song[] }> {
    return { songs: await this.songs.list(input.filter ?? {}) };
  }
}

export class CreateSong {
  constructor(private readonly songs: ISongRepository) {}

  async execute(input: {
    actor: SessionPayload;
    title: string;
    artist: string;
    originalKey: string;
    practiceKey?: string | null;
    bpm?: number;
    timeSignature?: string | null;
    lyricsAndChords?: string;
    youtubeVideoId?: string | null;
    sectionTimestamps?: {
      label: string;
      startSeconds: number;
      endSeconds?: number;
    }[];
  }): Promise<{ song: Song }> {
    requireAdmin(input.actor);
    const now = new Date().toISOString();
    const song = createSong({
      id: newId(),
      title: input.title,
      artist: input.artist,
      originalKey: input.originalKey,
      practiceKey: input.practiceKey,
      bpm: input.bpm,
      timeSignature: input.timeSignature,
      lyricsAndChords: input.lyricsAndChords,
      youtubeVideoId: input.youtubeVideoId,
      sectionTimestamps: input.sectionTimestamps,
      createdAt: now,
      updatedAt: now,
    });
    return { song: await this.songs.create(song) };
  }
}

export class UpdateSong {
  constructor(private readonly songs: ISongRepository) {}

  async execute(input: {
    actor: SessionPayload;
    id: string;
    patch: SongPatch;
  }): Promise<{ song: Song }> {
    requireAdmin(input.actor);
    const existing = await this.songs.findById(input.id);
    if (!existing) {
      throw new NotFoundError("Song not found");
    }
    return { song: await this.songs.update(updateSong(existing, input.patch)) };
  }
}

export class DeleteSong {
  constructor(private readonly songs: ISongRepository) {}

  async execute(input: { actor: SessionPayload; id: string }): Promise<void> {
    requireAdmin(input.actor);
    await this.songs.delete(input.id);
  }
}

export class GetSongLabels {
  constructor(private readonly labels: ILabelRepository) {}

  async execute(input: { songId: string }): Promise<{ labelIds: string[] }> {
    return { labelIds: await this.labels.getSongLabelIds(input.songId) };
  }
}

export class SetSongLabels {
  constructor(private readonly labels: ILabelRepository) {}

  async execute(input: {
    actor: SessionPayload;
    songId: string;
    labelIds: string[];
  }): Promise<void> {
    requireAdmin(input.actor);
    await this.labels.setSongLabels(input.songId, input.labelIds);
  }
}
