import { eq } from "drizzle-orm";
import type { IRoleAssignmentRepository } from "@/core/application/ports";
import { ConflictError } from "@/core/domain/errors";
import type { RoleAssignment } from "@/core/domain/role-assignment";
import type { Db } from "../db/client";
import { roleAssignments } from "../db/schema";

interface RoleRow {
  id: string;
  songId: string;
  userId: string;
  roleType: string;
  instrumentName: string;
  harmonyOrPartNotes: string | null;
  referenceTimestamps: string | null;
  practiceStatus: string;
  createdAt: string;
  updatedAt: string;
}

function toDomain(row: RoleRow): RoleAssignment {
  return {
    id: row.id,
    songId: row.songId,
    userId: row.userId,
    roleType: row.roleType as RoleAssignment["roleType"],
    instrumentName: row.instrumentName === "" ? null : row.instrumentName,
    harmonyOrPartNotes: row.harmonyOrPartNotes ?? null,
    referenceTimestamps: row.referenceTimestamps
      ? (JSON.parse(
          row.referenceTimestamps,
        ) as RoleAssignment["referenceTimestamps"])
      : null,
    practiceStatus: row.practiceStatus as RoleAssignment["practiceStatus"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /UNIQUE constraint failed|unique/i.test(message);
}

export class DrizzleRoleAssignmentRepository
  implements IRoleAssignmentRepository
{
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<RoleAssignment | null> {
    const rows = await this.db
      .select()
      .from(roleAssignments)
      .where(eq(roleAssignments.id, id));
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async listBySong(songId: string): Promise<RoleAssignment[]> {
    const rows = await this.db
      .select()
      .from(roleAssignments)
      .where(eq(roleAssignments.songId, songId));
    return rows.map(toDomain);
  }

  async listByUser(userId: string): Promise<RoleAssignment[]> {
    const rows = await this.db
      .select()
      .from(roleAssignments)
      .where(eq(roleAssignments.userId, userId));
    return rows.map(toDomain);
  }

  async create(assignment: RoleAssignment): Promise<RoleAssignment> {
    try {
      await this.db.insert(roleAssignments).values({
        id: assignment.id,
        songId: assignment.songId,
        userId: assignment.userId,
        roleType: assignment.roleType,
        instrumentName: assignment.instrumentName ?? "",
        harmonyOrPartNotes: assignment.harmonyOrPartNotes,
        referenceTimestamps: assignment.referenceTimestamps
          ? JSON.stringify(assignment.referenceTimestamps)
          : null,
        practiceStatus: assignment.practiceStatus,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Duplicate role assignment");
      }
      throw error;
    }
    return assignment;
  }

  async update(assignment: RoleAssignment): Promise<RoleAssignment> {
    try {
      await this.db
        .update(roleAssignments)
        .set({
          songId: assignment.songId,
          userId: assignment.userId,
          roleType: assignment.roleType,
          instrumentName: assignment.instrumentName ?? "",
          harmonyOrPartNotes: assignment.harmonyOrPartNotes,
          referenceTimestamps: assignment.referenceTimestamps
            ? JSON.stringify(assignment.referenceTimestamps)
            : null,
          practiceStatus: assignment.practiceStatus,
          updatedAt: assignment.updatedAt,
        })
        .where(eq(roleAssignments.id, assignment.id));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Duplicate role assignment");
      }
      throw error;
    }
    return assignment;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(roleAssignments).where(eq(roleAssignments.id, id));
  }
}
