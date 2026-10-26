import { ValidationError } from "./errors";
import { createSectionTimestamp, type SectionTimestamp } from "./song";

export const ROLE_TYPES = [
  "FIRST_VOICE",
  "SECOND_VOICE",
  "THIRD_VOICE",
  "BACKING_VOCAL",
  "INSTRUMENT",
] as const;
export type RoleType = (typeof ROLE_TYPES)[number];

export const PRACTICE_STATUSES = ["PENDING", "PRACTICING", "READY"] as const;
export type PracticeStatus = (typeof PRACTICE_STATUSES)[number];

export interface RoleAssignment {
  id: string;
  songId: string;
  userId: string;
  roleType: RoleType;
  instrumentName: string | null;
  harmonyOrPartNotes: string | null;
  referenceTimestamps: SectionTimestamp[] | null;
  practiceStatus: PracticeStatus;
  createdAt: string;
  updatedAt: string;
}

export function createRoleType(value: unknown): RoleType {
  if (!ROLE_TYPES.includes(value as RoleType)) {
    throw new ValidationError(
      `roleType must be one of: ${ROLE_TYPES.join(", ")}`,
    );
  }
  return value as RoleType;
}

export function createPracticeStatus(value: unknown): PracticeStatus {
  if (!PRACTICE_STATUSES.includes(value as PracticeStatus)) {
    throw new ValidationError(
      `practiceStatus must be one of: ${PRACTICE_STATUSES.join(", ")}`,
    );
  }
  return value as PracticeStatus;
}

export function createInstrumentName(
  roleType: RoleType,
  value: unknown,
): string | null {
  if (roleType === "INSTRUMENT") {
    if (
      typeof value !== "string" ||
      value.trim().length < 2 ||
      value.length > 50
    ) {
      throw new ValidationError(
        "INSTRUMENT roles require instrumentName 2-50 chars",
      );
    }
    return value;
  }
  if (value !== null && value !== undefined) {
    throw new ValidationError("Vocal roles require instrumentName to be null");
  }
  return null;
}

export function createHarmonyNotes(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || value.length > 5000) {
    throw new ValidationError(
      "harmonyOrPartNotes must be a string up to 5000 chars",
    );
  }
  return value;
}

export function createReferenceTimestamps(
  value: unknown,
): SectionTimestamp[] | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!Array.isArray(value)) {
    throw new ValidationError("referenceTimestamps must be an array or null");
  }
  return value.map((entry) => {
    if (typeof entry !== "object" || entry === null) {
      throw new ValidationError("referenceTimestamps entries must be objects");
    }
    const record = entry as {
      label: unknown;
      startSeconds: unknown;
      endSeconds?: unknown;
    };
    return createSectionTimestamp(record);
  });
}

export function createRoleAssignment(input: {
  id: unknown;
  songId: unknown;
  userId: unknown;
  roleType: unknown;
  instrumentName?: unknown;
  harmonyOrPartNotes?: unknown;
  referenceTimestamps?: unknown;
  practiceStatus?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}): RoleAssignment {
  if (typeof input.id !== "string" || input.id.length === 0) {
    throw new ValidationError("Role assignment id is required");
  }
  if (typeof input.songId !== "string" || input.songId.length === 0) {
    throw new ValidationError("songId is required");
  }
  if (typeof input.userId !== "string" || input.userId.length === 0) {
    throw new ValidationError("userId is required");
  }
  const roleType = createRoleType(input.roleType);
  const now = new Date().toISOString();
  return {
    id: input.id,
    songId: input.songId,
    userId: input.userId,
    roleType,
    instrumentName: createInstrumentName(roleType, input.instrumentName),
    harmonyOrPartNotes: createHarmonyNotes(input.harmonyOrPartNotes),
    referenceTimestamps: createReferenceTimestamps(input.referenceTimestamps),
    practiceStatus:
      input.practiceStatus === undefined
        ? "PENDING"
        : createPracticeStatus(input.practiceStatus),
    createdAt: typeof input.createdAt === "string" ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : now,
  };
}

export function roleUniquenessKey(a: {
  songId: string;
  userId: string;
  roleType: RoleType;
  instrumentName: string | null;
}): string {
  return [a.songId, a.userId, a.roleType, a.instrumentName ?? ""].join("|");
}
