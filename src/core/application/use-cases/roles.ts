import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../domain/errors";
import {
  createHarmonyNotes,
  createInstrumentName,
  createPracticeStatus,
  createReferenceTimestamps,
  createRoleAssignment,
  type PracticeStatus,
  type RoleAssignment,
  type RoleType,
  roleUniquenessKey,
} from "../../domain/role-assignment";
import type {
  IRoleAssignmentRepository,
  ISongRepository,
  IUserRepository,
  SessionPayload,
} from "../ports";

function newId(): string {
  return crypto.randomUUID();
}

function requireAdmin(actor: SessionPayload): void {
  if (actor.role !== "ADMIN") {
    throw new ForbiddenError("ADMIN only");
  }
}

export interface RoleAssignmentInput {
  songId: string;
  userId: string;
  roleType: RoleType;
  instrumentName?: string | null;
  harmonyOrPartNotes?: string | null;
  referenceTimestamps?:
    | { label: string; startSeconds: number; endSeconds?: number }[]
    | null;
  practiceStatus?: PracticeStatus;
}

export class AssignRole {
  constructor(
    private readonly roles: IRoleAssignmentRepository,
    private readonly songs: ISongRepository,
    private readonly users: IUserRepository,
  ) {}

  async execute(
    input: { actor: SessionPayload } & RoleAssignmentInput,
  ): Promise<{
    assignment: RoleAssignment;
  }> {
    requireAdmin(input.actor);
    const song = await this.songs.findById(input.songId);
    if (!song) {
      throw new NotFoundError("Song not found");
    }
    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    // INSTRUMENT names are domain-validated; repository maps ''↔null for the
    // UNIQUE index. Detect duplicates here for a portable ConflictError.
    const candidate = createRoleAssignment({
      id: newId(),
      songId: input.songId,
      userId: input.userId,
      roleType: input.roleType,
      instrumentName: input.instrumentName,
      harmonyOrPartNotes: input.harmonyOrPartNotes,
      referenceTimestamps: input.referenceTimestamps,
      practiceStatus: input.practiceStatus,
    });
    const existing = await this.roles.listBySong(input.songId);
    if (
      existing.some(
        (a) =>
          a.userId === candidate.userId &&
          roleUniquenessKey(a) === roleUniquenessKey(candidate),
      )
    ) {
      throw new ConflictError("Duplicate role assignment");
    }
    return { assignment: await this.roles.create(candidate) };
  }
}

export class UpdateRoleAssignment {
  constructor(private readonly roles: IRoleAssignmentRepository) {}

  async execute(input: {
    actor: SessionPayload;
    id: string;
    harmonyOrPartNotes?: string | null;
    referenceTimestamps?:
      | { label: string; startSeconds: number; endSeconds?: number }[]
      | null;
    practiceStatus?: PracticeStatus;
  }): Promise<{ assignment: RoleAssignment }> {
    const existing = await this.roles.findById(input.id);
    if (!existing) {
      throw new NotFoundError("Role assignment not found");
    }
    const touchesNotes =
      input.harmonyOrPartNotes !== undefined ||
      input.referenceTimestamps !== undefined;
    if (input.actor.role === "MEMBER") {
      if (existing.userId !== input.actor.sub) {
        throw new ForbiddenError("Cannot edit another member's assignment");
      }
      if (touchesNotes) {
        throw new ForbiddenError("Members may only update practiceStatus");
      }
      if (input.practiceStatus === undefined) {
        throw new ValidationError("Nothing to update");
      }
      const patched: RoleAssignment = {
        ...existing,
        practiceStatus: createPracticeStatus(input.practiceStatus),
        updatedAt: new Date().toISOString(),
      };
      return { assignment: await this.roles.update(patched) };
    }
    const patched: RoleAssignment = {
      ...existing,
      harmonyOrPartNotes:
        input.harmonyOrPartNotes === undefined
          ? existing.harmonyOrPartNotes
          : createHarmonyNotes(input.harmonyOrPartNotes),
      referenceTimestamps:
        input.referenceTimestamps === undefined
          ? existing.referenceTimestamps
          : createReferenceTimestamps(input.referenceTimestamps),
      practiceStatus:
        input.practiceStatus === undefined
          ? existing.practiceStatus
          : createPracticeStatus(input.practiceStatus),
      updatedAt: new Date().toISOString(),
    };
    return { assignment: await this.roles.update(patched) };
  }
}

export class UpdateInstrumentName {
  constructor(private readonly roles: IRoleAssignmentRepository) {}

  async execute(input: {
    actor: SessionPayload;
    id: string;
    instrumentName: string | null;
  }): Promise<{ assignment: RoleAssignment }> {
    requireAdmin(input.actor);
    const existing = await this.roles.findById(input.id);
    if (!existing) {
      throw new NotFoundError("Role assignment not found");
    }
    const patched: RoleAssignment = {
      ...existing,
      instrumentName: createInstrumentName(
        existing.roleType,
        input.instrumentName,
      ),
      updatedAt: new Date().toISOString(),
    };
    return { assignment: await this.roles.update(patched) };
  }
}

export class DeleteRoleAssignment {
  constructor(private readonly roles: IRoleAssignmentRepository) {}

  async execute(input: { actor: SessionPayload; id: string }): Promise<void> {
    requireAdmin(input.actor);
    await this.roles.delete(input.id);
  }
}

export class ListSongRoles {
  constructor(private readonly roles: IRoleAssignmentRepository) {}

  async execute(input: {
    songId: string;
  }): Promise<{ assignments: RoleAssignment[] }> {
    return { assignments: await this.roles.listBySong(input.songId) };
  }
}

export class ListUserRoles {
  constructor(private readonly roles: IRoleAssignmentRepository) {}

  async execute(input: {
    userId: string;
  }): Promise<{ assignments: RoleAssignment[] }> {
    return { assignments: await this.roles.listByUser(input.userId) };
  }
}
