import { ValidationError } from "./errors";

export const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

// Matches watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/ URL forms.
const URL_ID_PATTERN =
  /(?:watch\?v=|youtu\.be\/|embed\/|shorts\/|live\/|(?:^|[/?&])v\/)([a-zA-Z0-9_-]{11})/;

export function normalizeYoutubeVideoId(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("El id del video de YouTube debe ser un texto");
  }
  if (YOUTUBE_VIDEO_ID_PATTERN.test(value)) {
    return value;
  }
  const match = URL_ID_PATTERN.exec(value);
  if (match?.[1]) {
    return match[1];
  }
  throw new ValidationError("Id o URL de video de YouTube inválido");
}
