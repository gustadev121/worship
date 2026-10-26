import { ValidationError } from "./errors";

const ROOTS = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;
const MODES = ["major", "minor"] as const;

export type MusicalKeyRoot = (typeof ROOTS)[number];
export type MusicalKeyMode = (typeof MODES)[number];
export type MusicalKey = `${MusicalKeyRoot} ${MusicalKeyMode}`;

export const MUSICAL_KEYS: readonly MusicalKey[] = ROOTS.flatMap((root) =>
  MODES.map((mode) => `${root} ${mode}` as MusicalKey),
);

const KEY_SET: ReadonlySet<string> = new Set(MUSICAL_KEYS);

export function createMusicalKey(value: unknown): MusicalKey {
  if (typeof value !== "string" || !KEY_SET.has(value)) {
    throw new ValidationError(
      `Musical key must be one of: ${MUSICAL_KEYS.join(", ")}`,
    );
  }
  return value as MusicalKey;
}
