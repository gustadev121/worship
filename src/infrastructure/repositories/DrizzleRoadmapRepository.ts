import { and, asc, count, eq, type SQL } from "drizzle-orm";
import type { RoadmapRepository } from "@/core/application/ports";
import { ConflictError, NotFoundError } from "@/core/domain/errors";
import type {
  CapabilityFeedback,
  CapabilityItem,
  FunctionalTrack,
  Milestone,
  MilestoneStatus,
  PhaseDependency,
  PhaseStatus,
  PriorityTier,
  RoadmapPhase,
} from "@/core/domain/roadmap";
import { type Db, isUniqueViolation } from "../db/client";
import {
  roadmapCapabilities,
  roadmapCapabilityFeedback,
  roadmapDependencies,
  roadmapMilestones,
  roadmapPhases,
} from "../db/schema";

function toPhaseDomain(row: typeof roadmapPhases.$inferSelect): RoadmapPhase {
  return {
    id: row.id,
    phaseNumber: row.phaseNumber,
    name: row.name,
    description: row.description,
    status: row.status as PhaseStatus,
    targetHorizon: row.targetHorizon,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toMilestoneDomain(
  row: typeof roadmapMilestones.$inferSelect,
): Milestone {
  return {
    id: row.id,
    phaseId: row.phaseId,
    title: row.title,
    description: row.description,
    status: row.status as MilestoneStatus,
    sortOrder: row.sortOrder,
    targetCompletionDate: row.targetCompletionDate ?? null,
    releaseNotes: row.releaseNotes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toCapabilityDomain(
  row: typeof roadmapCapabilities.$inferSelect,
): CapabilityItem {
  return {
    id: row.id,
    milestoneId: row.milestoneId,
    title: row.title,
    targetPersona: row.targetPersona,
    functionalTrack: row.functionalTrack as FunctionalTrack,
    priorityTier: row.priorityTier as PriorityTier,
    acceptanceCriteria: row.acceptanceCriteria,
    isCompleted: Boolean(row.isCompleted),
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toDependencyDomain(
  row: typeof roadmapDependencies.$inferSelect,
): PhaseDependency {
  return {
    id: row.id,
    dependentMilestoneId: row.dependentMilestoneId,
    prerequisiteMilestoneId: row.prerequisiteMilestoneId,
    isBlocking: Boolean(row.isBlocking),
    createdAt: row.createdAt,
  };
}

function toFeedbackDomain(
  row: typeof roadmapCapabilityFeedback.$inferSelect,
): CapabilityFeedback {
  return {
    id: row.id,
    capabilityId: row.capabilityId,
    userId: row.userId,
    hasInterest: Boolean(row.hasInterest),
    note: row.note ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleRoadmapRepository implements RoadmapRepository {
  constructor(private readonly db: Db) {}

  async listPhases(): Promise<RoadmapPhase[]> {
    const rows = await this.db
      .select()
      .from(roadmapPhases)
      .orderBy(asc(roadmapPhases.phaseNumber));
    return rows.map(toPhaseDomain);
  }

  async getPhase(id: string): Promise<RoadmapPhase | null> {
    const rows = await this.db
      .select()
      .from(roadmapPhases)
      .where(eq(roadmapPhases.id, id));
    return rows[0] ? toPhaseDomain(rows[0]) : null;
  }

  async updatePhaseStatus(
    id: string,
    status: PhaseStatus,
  ): Promise<RoadmapPhase> {
    const existing = await this.getPhase(id);
    if (!existing) {
      throw new NotFoundError(`Phase not found: ${id}`);
    }

    const updatedAt = new Date().toISOString();
    await this.db
      .update(roadmapPhases)
      .set({
        status,
        updatedAt,
      })
      .where(eq(roadmapPhases.id, id));

    return {
      ...existing,
      status,
      updatedAt,
    };
  }

  async listMilestones(phaseId?: string): Promise<Milestone[]> {
    const query = this.db.select().from(roadmapMilestones);
    const rows = phaseId
      ? await query
          .where(eq(roadmapMilestones.phaseId, phaseId))
          .orderBy(asc(roadmapMilestones.sortOrder))
      : await query.orderBy(asc(roadmapMilestones.sortOrder));
    return rows.map(toMilestoneDomain);
  }

  async getMilestone(id: string): Promise<Milestone | null> {
    const rows = await this.db
      .select()
      .from(roadmapMilestones)
      .where(eq(roadmapMilestones.id, id));
    return rows[0] ? toMilestoneDomain(rows[0]) : null;
  }

  async updateMilestoneStatus(
    id: string,
    status: MilestoneStatus,
    releaseNotes?: string | null,
  ): Promise<Milestone> {
    const existing = await this.getMilestone(id);
    if (!existing) {
      throw new NotFoundError(`Milestone not found: ${id}`);
    }

    const updatedAt = new Date().toISOString();
    const notesToSet =
      releaseNotes !== undefined ? releaseNotes : existing.releaseNotes;

    await this.db
      .update(roadmapMilestones)
      .set({
        status,
        releaseNotes: notesToSet,
        updatedAt,
      })
      .where(eq(roadmapMilestones.id, id));

    return {
      ...existing,
      status,
      releaseNotes: notesToSet,
      updatedAt,
    };
  }

  async listCapabilities(filter?: {
    milestoneId?: string;
    functionalTrack?: FunctionalTrack;
    priorityTier?: PriorityTier;
  }): Promise<CapabilityItem[]> {
    const conditions: SQL[] = [];
    if (filter?.milestoneId) {
      conditions.push(eq(roadmapCapabilities.milestoneId, filter.milestoneId));
    }
    if (filter?.functionalTrack) {
      conditions.push(
        eq(roadmapCapabilities.functionalTrack, filter.functionalTrack),
      );
    }
    if (filter?.priorityTier) {
      conditions.push(
        eq(roadmapCapabilities.priorityTier, filter.priorityTier),
      );
    }

    const query = this.db.select().from(roadmapCapabilities);
    const rows =
      conditions.length > 0
        ? await query
            .where(and(...conditions))
            .orderBy(asc(roadmapCapabilities.sortOrder))
        : await query.orderBy(asc(roadmapCapabilities.sortOrder));

    return rows.map(toCapabilityDomain);
  }

  async getCapability(id: string): Promise<CapabilityItem | null> {
    const rows = await this.db
      .select()
      .from(roadmapCapabilities)
      .where(eq(roadmapCapabilities.id, id));
    return rows[0] ? toCapabilityDomain(rows[0]) : null;
  }

  async listDependencies(milestoneId?: string): Promise<PhaseDependency[]> {
    const query = this.db.select().from(roadmapDependencies);
    const rows = milestoneId
      ? await query.where(
          eq(roadmapDependencies.dependentMilestoneId, milestoneId),
        )
      : await query;
    return rows.map(toDependencyDomain);
  }

  async addDependency(
    dependentMilestoneId: string,
    prerequisiteMilestoneId: string,
    isBlocking = true,
  ): Promise<PhaseDependency> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const dep: PhaseDependency = {
      id,
      dependentMilestoneId,
      prerequisiteMilestoneId,
      isBlocking,
      createdAt,
    };

    try {
      await this.db.insert(roadmapDependencies).values(dep);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Dependency already exists");
      }
      throw error;
    }

    return dep;
  }

  async listFeedback(capabilityId?: string): Promise<CapabilityFeedback[]> {
    const query = this.db.select().from(roadmapCapabilityFeedback);
    const rows = capabilityId
      ? await query.where(
          eq(roadmapCapabilityFeedback.capabilityId, capabilityId),
        )
      : await query;
    return rows.map(toFeedbackDomain);
  }

  async getUserFeedback(
    capabilityId: string,
    userId: string,
  ): Promise<CapabilityFeedback | null> {
    const rows = await this.db
      .select()
      .from(roadmapCapabilityFeedback)
      .where(
        and(
          eq(roadmapCapabilityFeedback.capabilityId, capabilityId),
          eq(roadmapCapabilityFeedback.userId, userId),
        ),
      );
    return rows[0] ? toFeedbackDomain(rows[0]) : null;
  }

  async toggleVote(
    capabilityId: string,
    userId: string,
    hasInterest: boolean,
    note?: string | null,
  ): Promise<{
    feedback: CapabilityFeedback;
    totalInterestCount: number;
  }> {
    const existing = await this.getUserFeedback(capabilityId, userId);
    const now = new Date().toISOString();
    let feedback: CapabilityFeedback;

    if (existing) {
      const noteToSet =
        note !== undefined && note !== null ? note : existing.note;
      await this.db
        .update(roadmapCapabilityFeedback)
        .set({
          hasInterest,
          note: noteToSet,
          updatedAt: now,
        })
        .where(eq(roadmapCapabilityFeedback.id, existing.id));

      feedback = {
        ...existing,
        hasInterest,
        note: noteToSet,
        updatedAt: now,
      };
    } else {
      const id = crypto.randomUUID();
      feedback = {
        id,
        capabilityId,
        userId,
        hasInterest,
        note: note ?? null,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await this.db.insert(roadmapCapabilityFeedback).values(feedback);
      } catch (error) {
        if (isUniqueViolation(error)) {
          const current = await this.getUserFeedback(capabilityId, userId);
          if (current) {
            const noteToSet =
              note !== undefined && note !== null ? note : current.note;
            await this.db
              .update(roadmapCapabilityFeedback)
              .set({
                hasInterest,
                note: noteToSet,
                updatedAt: now,
              })
              .where(eq(roadmapCapabilityFeedback.id, current.id));

            feedback = {
              ...current,
              hasInterest,
              note: noteToSet,
              updatedAt: now,
            };
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    const [countResult] = await this.db
      .select({ total: count() })
      .from(roadmapCapabilityFeedback)
      .where(
        and(
          eq(roadmapCapabilityFeedback.capabilityId, capabilityId),
          eq(roadmapCapabilityFeedback.hasInterest, true),
        ),
      );

    const totalInterestCount = Number(countResult?.total ?? 0);

    return {
      feedback,
      totalInterestCount,
    };
  }

  async seedBaseline(data: {
    phases: RoadmapPhase[];
    milestones: Milestone[];
    capabilities: CapabilityItem[];
    dependencies: PhaseDependency[];
  }): Promise<void> {
    if (data.phases.length > 0) {
      await this.db.insert(roadmapPhases).values(data.phases);
    }
    if (data.milestones.length > 0) {
      await this.db.insert(roadmapMilestones).values(data.milestones);
    }
    if (data.capabilities.length > 0) {
      // Chunk insertions to safely stay well under Miniflare/D1 parameter limit (<= 100)
      const chunkSize = 5;
      for (let i = 0; i < data.capabilities.length; i += chunkSize) {
        const chunk = data.capabilities.slice(i, i + chunkSize);
        await this.db.insert(roadmapCapabilities).values(chunk);
      }
    }
    if (data.dependencies.length > 0) {
      await this.db.insert(roadmapDependencies).values(data.dependencies);
    }
  }

  async isSeeded(): Promise<boolean> {
    const rows = await this.db
      .select({ id: roadmapPhases.id })
      .from(roadmapPhases)
      .limit(1);
    return rows.length > 0;
  }
}
