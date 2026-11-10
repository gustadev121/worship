import { describe, expect, test } from "bun:test";
import type { RoadmapRepository } from "@/core/application/ports";
import {
  CANONICAL_CAPABILITIES,
  CANONICAL_DEPENDENCIES,
  CANONICAL_MILESTONES,
  CANONICAL_PHASES,
  GetRoadmap,
  SeedRoadmap,
  ToggleCapabilityVote,
  UpdateMilestoneStatus,
} from "@/core/application/use-cases/roadmap";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/domain/errors";
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

function createMockRoadmapRepo(initial?: {
  phases?: RoadmapPhase[];
  milestones?: Milestone[];
  capabilities?: CapabilityItem[];
  dependencies?: PhaseDependency[];
  feedback?: CapabilityFeedback[];
}): RoadmapRepository & {
  phases: RoadmapPhase[];
  milestones: Milestone[];
  capabilities: CapabilityItem[];
  dependencies: PhaseDependency[];
  feedback: CapabilityFeedback[];
} {
  const phases = [...(initial?.phases ?? [])];
  const milestones = [...(initial?.milestones ?? [])];
  const capabilities = [...(initial?.capabilities ?? [])];
  const dependencies = [...(initial?.dependencies ?? [])];
  const feedback = [...(initial?.feedback ?? [])];

  return {
    phases,
    milestones,
    capabilities,
    dependencies,
    feedback,

    async listPhases(): Promise<RoadmapPhase[]> {
      return [...phases].sort((a, b) => a.phaseNumber - b.phaseNumber);
    },

    async getPhase(id: string): Promise<RoadmapPhase | null> {
      return phases.find((p) => p.id === id) ?? null;
    },

    async updatePhaseStatus(
      id: string,
      status: PhaseStatus,
    ): Promise<RoadmapPhase> {
      const idx = phases.findIndex((p) => p.id === id);
      const existing = phases[idx];
      if (idx === -1 || !existing)
        throw new NotFoundError(`Phase not found: ${id}`);
      const updated: RoadmapPhase = {
        ...existing,
        status,
        updatedAt: new Date().toISOString(),
      };
      phases[idx] = updated;
      return updated;
    },

    async listMilestones(phaseId?: string): Promise<Milestone[]> {
      const filtered = phaseId
        ? milestones.filter((m) => m.phaseId === phaseId)
        : milestones;
      return [...filtered].sort((a, b) => a.sortOrder - b.sortOrder);
    },

    async getMilestone(id: string): Promise<Milestone | null> {
      return milestones.find((m) => m.id === id) ?? null;
    },

    async updateMilestoneStatus(
      id: string,
      status: MilestoneStatus,
      releaseNotes?: string | null,
    ): Promise<Milestone> {
      const idx = milestones.findIndex((m) => m.id === id);
      const existing = milestones[idx];
      if (idx === -1 || !existing)
        throw new NotFoundError(`Milestone not found: ${id}`);
      const updated: Milestone = {
        ...existing,
        status,
        releaseNotes:
          releaseNotes !== undefined ? releaseNotes : existing.releaseNotes,
        updatedAt: new Date().toISOString(),
      };
      milestones[idx] = updated;
      return updated;
    },

    async listCapabilities(filter?: {
      milestoneId?: string;
      functionalTrack?: FunctionalTrack;
      priorityTier?: PriorityTier;
    }): Promise<CapabilityItem[]> {
      let result = [...capabilities];
      if (filter?.milestoneId) {
        result = result.filter((c) => c.milestoneId === filter.milestoneId);
      }
      if (filter?.functionalTrack) {
        result = result.filter(
          (c) => c.functionalTrack === filter.functionalTrack,
        );
      }
      if (filter?.priorityTier) {
        result = result.filter((c) => c.priorityTier === filter.priorityTier);
      }
      return result.sort((a, b) => a.sortOrder - b.sortOrder);
    },

    async getCapability(id: string): Promise<CapabilityItem | null> {
      return capabilities.find((c) => c.id === id) ?? null;
    },

    async listDependencies(milestoneId?: string): Promise<PhaseDependency[]> {
      if (milestoneId) {
        return dependencies.filter(
          (d) => d.dependentMilestoneId === milestoneId,
        );
      }
      return [...dependencies];
    },

    async addDependency(
      dependentMilestoneId: string,
      prerequisiteMilestoneId: string,
      isBlocking = true,
    ): Promise<PhaseDependency> {
      const dep: PhaseDependency = {
        id: crypto.randomUUID(),
        dependentMilestoneId,
        prerequisiteMilestoneId,
        isBlocking,
        createdAt: new Date().toISOString(),
      };
      dependencies.push(dep);
      return dep;
    },

    async listFeedback(capabilityId?: string): Promise<CapabilityFeedback[]> {
      if (capabilityId) {
        return feedback.filter((f) => f.capabilityId === capabilityId);
      }
      return [...feedback];
    },

    async getUserFeedback(
      capabilityId: string,
      userId: string,
    ): Promise<CapabilityFeedback | null> {
      return (
        feedback.find(
          (f) => f.capabilityId === capabilityId && f.userId === userId,
        ) ?? null
      );
    },

    async toggleVote(
      capabilityId: string,
      userId: string,
      hasInterest: boolean,
      note?: string | null,
    ): Promise<{
      feedback: CapabilityFeedback;
      totalInterestCount: number;
    }> {
      const now = new Date().toISOString();
      const existingIdx = feedback.findIndex(
        (f) => f.capabilityId === capabilityId && f.userId === userId,
      );

      let record: CapabilityFeedback;
      const existing = existingIdx !== -1 ? feedback[existingIdx] : undefined;
      if (existing && existingIdx !== -1) {
        const noteToSet =
          note !== undefined && note !== null ? note : existing.note;
        record = {
          ...existing,
          hasInterest,
          note: noteToSet,
          updatedAt: now,
        };
        feedback[existingIdx] = record;
      } else {
        record = {
          id: crypto.randomUUID(),
          capabilityId,
          userId,
          hasInterest,
          note: note ?? null,
          createdAt: now,
          updatedAt: now,
        };
        feedback.push(record);
      }

      const totalInterestCount = feedback.filter(
        (f) => f.capabilityId === capabilityId && f.hasInterest,
      ).length;

      return {
        feedback: record,
        totalInterestCount,
      };
    },

    async seedBaseline(data: {
      phases: RoadmapPhase[];
      milestones: Milestone[];
      capabilities: CapabilityItem[];
      dependencies: PhaseDependency[];
    }): Promise<void> {
      phases.push(...data.phases);
      milestones.push(...data.milestones);
      capabilities.push(...data.capabilities);
      dependencies.push(...data.dependencies);
    },

    async isSeeded(): Promise<boolean> {
      return phases.length > 0;
    },
  };
}

describe("SeedRoadmap Use Case (T007)", () => {
  test("seeds canonical roadmap data when unseeded and is idempotent", async () => {
    const repo = createMockRoadmapRepo();
    const seed = new SeedRoadmap(repo);

    expect(await repo.isSeeded()).toBe(false);
    await seed.execute();

    expect(await repo.isSeeded()).toBe(true);
    expect(repo.phases.length).toBe(4);
    expect(repo.milestones.length).toBe(8);
    expect(repo.capabilities.length).toBe(24);
    expect(repo.dependencies.length).toBe(4);

    // Idempotent: running again does not duplicate items
    await seed.execute();
    expect(repo.phases.length).toBe(4);
    expect(repo.capabilities.length).toBe(24);
  });
});

describe("GetRoadmap Use Case (T011, T023, T024)", () => {
  const adminActor = { sub: "u-admin", role: "ADMIN" };
  const memberActor = { sub: "u-member-1", role: "MEMBER" };

  function setupSeededRepo() {
    return createMockRoadmapRepo({
      phases: CANONICAL_PHASES,
      milestones: CANONICAL_MILESTONES,
      capabilities: CANONICAL_CAPABILITIES,
      dependencies: CANONICAL_DEPENDENCIES,
    });
  }

  test("returns full roadmap hierarchy, phase progress, and overall summary", async () => {
    const repo = setupSeededRepo();
    const useCase = new GetRoadmap(repo);

    const result = await useCase.execute({ actor: memberActor });

    expect(result.phases.length).toBe(4);
    expect(result.phases[0]?.name).toBe("Repertoire & Rehearsal Foundation");
    expect(result.phases[0]?.completionPercentage).toBe(100);
    expect(result.phases[1]?.name).toBe(
      "Service Planning & Setlist Management",
    );
    expect(result.phases[1]?.completionPercentage).toBe(0);

    // Summary metrics
    expect(result.summary).toEqual({
      totalPhases: 4,
      totalMilestones: 8,
      completedMilestones: 2,
      totalCapabilities: 24,
      completedCapabilities: 6,
      overallProgress: 25,
    });

    // Check prerequisites on Phase 2 milestone ms-2-setlists
    const phase2 = result.phases[1];
    const ms2Setlists = phase2?.milestones.find(
      (m) => m.id === "ms-2-setlists",
    );
    expect(ms2Setlists).toBeDefined();
    expect(ms2Setlists?.prerequisites.length).toBe(1);
    expect(ms2Setlists?.prerequisites[0]).toEqual({
      prerequisiteMilestoneId: "ms-1-repertoire",
      isBlocking: true,
      prerequisiteTitle: "Song Repertoire & Arrangement Catalog",
      isSatisfied: true,
    });
  });

  test("maps user vote status, interestCount, and voter notes accurately", async () => {
    const repo = setupSeededRepo();
    // Pre-seed some votes
    await repo.toggleVote(
      "cap-2-1",
      "u-member-1",
      true,
      "Needed for transitions",
    );
    await repo.toggleVote("cap-2-1", "u-other-user", true, "Also need this");
    await repo.toggleVote("cap-2-2", "u-other-user", true, null);

    const useCase = new GetRoadmap(repo);

    // Query as member-1
    const result1 = await useCase.execute({ actor: memberActor });
    const cap21ForMember1 = result1.phases[1]?.milestones[0]?.capabilities.find(
      (c) => c.id === "cap-2-1",
    );
    expect(cap21ForMember1?.interestCount).toBe(2);
    expect(cap21ForMember1?.userHasVoted).toBe(true);
    expect(cap21ForMember1?.userNote).toBe("Needed for transitions");

    const cap22ForMember1 = result1.phases[1]?.milestones[0]?.capabilities.find(
      (c) => c.id === "cap-2-2",
    );
    expect(cap22ForMember1?.interestCount).toBe(1);
    expect(cap22ForMember1?.userHasVoted).toBe(false);
    expect(cap22ForMember1?.userNote).toBeNull();

    // Query as adminActor (has cast no votes)
    const resultAdmin = await useCase.execute({ actor: adminActor });
    const cap21ForAdmin =
      resultAdmin.phases[1]?.milestones[0]?.capabilities.find(
        (c) => c.id === "cap-2-1",
      );
    expect(cap21ForAdmin?.interestCount).toBe(2);
    expect(cap21ForAdmin?.userHasVoted).toBe(false);
    expect(cap21ForAdmin?.userNote).toBeNull();
  });

  test("filters by phase number (T024)", async () => {
    const repo = setupSeededRepo();
    const useCase = new GetRoadmap(repo);

    const result = await useCase.execute({
      actor: memberActor,
      query: { phase: 3 },
    });

    expect(result.phases.length).toBe(1);
    expect(result.phases[0]?.phaseNumber).toBe(3);
    expect(result.phases[0]?.name).toBe(
      "Volunteer Scheduling & Roster Management",
    );
    // Summary retains full roadmap scope
    expect(result.summary.totalPhases).toBe(4);
    expect(result.summary.totalCapabilities).toBe(24);
  });

  test("filters capabilities by functionalTrack (T023, T024)", async () => {
    const repo = setupSeededRepo();
    const useCase = new GetRoadmap(repo);

    const result = await useCase.execute({
      actor: memberActor,
      query: { track: "PLANNING" },
    });

    for (const phase of result.phases) {
      for (const milestone of phase.milestones) {
        for (const cap of milestone.capabilities) {
          expect(cap.functionalTrack).toBe("PLANNING");
        }
      }
    }

    // Milestones without PLANNING capabilities should have empty capabilities list
    const phase1Milestone1 = result.phases[0]?.milestones[0];
    expect(phase1Milestone1?.capabilities.length).toBe(0);

    const phase2Milestone1 = result.phases[1]?.milestones[0];
    expect(phase2Milestone1?.capabilities.length).toBe(3);
  });

  test("filters capabilities by priorityTier (T023, T024)", async () => {
    const repo = setupSeededRepo();
    const useCase = new GetRoadmap(repo);

    const result = await useCase.execute({
      actor: memberActor,
      query: { priority: "P1" },
    });

    for (const phase of result.phases) {
      for (const milestone of phase.milestones) {
        for (const cap of milestone.capabilities) {
          expect(cap.priorityTier).toBe("P1");
        }
      }
    }
  });

  test("filters capabilities by both functionalTrack and priorityTier", async () => {
    const repo = setupSeededRepo();
    const useCase = new GetRoadmap(repo);

    const result = await useCase.execute({
      actor: memberActor,
      query: { track: "PLANNING", priority: "P1" },
    });

    const phase2Ms1 = result.phases[1]?.milestones.find(
      (m) => m.id === "ms-2-setlists",
    );
    expect(phase2Ms1?.capabilities.length).toBe(1);
    expect(phase2Ms1?.capabilities[0]?.id).toBe("cap-2-1");
    expect(phase2Ms1?.capabilities[0]?.functionalTrack).toBe("PLANNING");
    expect(phase2Ms1?.capabilities[0]?.priorityTier).toBe("P1");
  });
});

describe("UpdateMilestoneStatus Use Case (T018, T020)", () => {
  const adminActor = { sub: "u-admin", role: "ADMIN" };
  const memberActor = { sub: "u-member", role: "MEMBER" };

  function setupRepo() {
    return createMockRoadmapRepo({
      phases: CANONICAL_PHASES,
      milestones: CANONICAL_MILESTONES,
      capabilities: CANONICAL_CAPABILITIES,
      dependencies: CANONICAL_DEPENDENCIES,
    });
  }

  test("rejects non-admin actor with ForbiddenError (T018)", async () => {
    const repo = setupRepo();
    const useCase = new UpdateMilestoneStatus(repo);

    await expect(
      useCase.execute({
        actor: memberActor,
        milestoneId: "ms-2-setlists",
        input: { status: "COMPLETED" },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("throws NotFoundError when milestone does not exist", async () => {
    const repo = setupRepo();
    const useCase = new UpdateMilestoneStatus(repo);

    await expect(
      useCase.execute({
        actor: adminActor,
        milestoneId: "ms-nonexistent",
        input: { status: "IN_PROGRESS" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  test("throws ValidationError when status value is invalid", async () => {
    const repo = setupRepo();
    const useCase = new UpdateMilestoneStatus(repo);

    await expect(
      useCase.execute({
        actor: adminActor,
        milestoneId: "ms-2-setlists",
        // @ts-expect-error test invalid enum
        input: { status: "INVALID_STATUS" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  test("allows admin to update status to IN_PROGRESS", async () => {
    const repo = setupRepo();
    const useCase = new UpdateMilestoneStatus(repo);

    const result = await useCase.execute({
      actor: adminActor,
      milestoneId: "ms-2-order-of-service",
      input: {
        status: "IN_PROGRESS",
        releaseNotes: "Starting development on liturgy items",
      },
    });

    expect(result.milestone.status).toBe("IN_PROGRESS");
    expect(result.milestone.releaseNotes).toBe(
      "Starting development on liturgy items",
    );
    expect(result.phaseStatusUpdated).toBe(false);

    const milestoneInRepo = await repo.getMilestone("ms-2-order-of-service");
    expect(milestoneInRepo?.status).toBe("IN_PROGRESS");
  });

  test("blocks marking milestone COMPLETED when upstream blocking prerequisite is incomplete (T018)", async () => {
    const repo = setupRepo();
    const useCase = new UpdateMilestoneStatus(repo);

    // ms-3-scheduling depends on ms-2-setlists (blocking).
    // ms-2-setlists is currently IN_PROGRESS in canonical seed.
    let caughtError: unknown;
    try {
      await useCase.execute({
        actor: adminActor,
        milestoneId: "ms-3-scheduling",
        input: { status: "COMPLETED" },
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(ValidationError);
    const valErr = caughtError as ValidationError;
    expect(valErr.message).toContain("Prerequisite milestone is not completed");
    expect(valErr.unmetPrerequisiteIds).toEqual(["ms-2-setlists"]);
  });

  test("allows marking COMPLETED when blocking prerequisite IS completed", async () => {
    const repo = setupRepo();
    const useCase = new UpdateMilestoneStatus(repo);

    // ms-2-setlists depends on ms-1-repertoire (blocking).
    // ms-1-repertoire is COMPLETED in canonical seed.
    const result = await useCase.execute({
      actor: adminActor,
      milestoneId: "ms-2-setlists",
      input: {
        status: "COMPLETED",
        releaseNotes: "Drag and drop setlists completed",
      },
    });

    expect(result.milestone.status).toBe("COMPLETED");
    expect(result.phaseStatusUpdated).toBe(false); // ms-2-order-of-service is still NOT_STARTED
  });

  test("updates phase status to COMPLETED when all milestones in phase complete", async () => {
    const repo = setupRepo();
    const useCase = new UpdateMilestoneStatus(repo);

    // Complete ms-2-setlists first
    await useCase.execute({
      actor: adminActor,
      milestoneId: "ms-2-setlists",
      input: { status: "COMPLETED" },
    });

    // Complete remaining milestone in Phase 2
    const result = await useCase.execute({
      actor: adminActor,
      milestoneId: "ms-2-order-of-service",
      input: { status: "COMPLETED" },
    });

    expect(result.milestone.status).toBe("COMPLETED");
    expect(result.phaseStatusUpdated).toBe(true);

    const phase2 = await repo.getPhase("phase-2-planning");
    expect(phase2?.status).toBe("COMPLETED");
  });
});

describe("ToggleCapabilityVote Use Case (T028, T029)", () => {
  const memberActor1 = { sub: "u-member-1", role: "MEMBER" };
  const memberActor2 = { sub: "u-member-2", role: "MEMBER" };

  function setupRepo() {
    return createMockRoadmapRepo({
      phases: CANONICAL_PHASES,
      milestones: CANONICAL_MILESTONES,
      capabilities: CANONICAL_CAPABILITIES,
      dependencies: CANONICAL_DEPENDENCIES,
    });
  }

  test("toggles vote on and increments total interest count (T028, T029)", async () => {
    const repo = setupRepo();
    const useCase = new ToggleCapabilityVote(repo);

    const result = await useCase.execute({
      actor: memberActor1,
      capabilityId: "cap-2-1",
      input: { hasInterest: true, note: "We need this for Sunday transitions" },
    });

    expect(result).toEqual({
      capabilityId: "cap-2-1",
      hasInterest: true,
      note: "We need this for Sunday transitions",
      newTotalInterestCount: 1,
    });
  });

  test("toggles vote off and decrements total interest count", async () => {
    const repo = setupRepo();
    const useCase = new ToggleCapabilityVote(repo);

    await useCase.execute({
      actor: memberActor1,
      capabilityId: "cap-2-1",
      input: { hasInterest: true },
    });

    const offResult = await useCase.execute({
      actor: memberActor1,
      capabilityId: "cap-2-1",
      input: { hasInterest: false },
    });

    expect(offResult.hasInterest).toBe(false);
    expect(offResult.newTotalInterestCount).toBe(0);
  });

  test("validates note maximum 280 characters constraint (T028, T029)", async () => {
    const repo = setupRepo();
    const useCase = new ToggleCapabilityVote(repo);

    const exact280 = "a".repeat(280);
    const validResult = await useCase.execute({
      actor: memberActor1,
      capabilityId: "cap-2-1",
      input: { hasInterest: true, note: exact280 },
    });
    expect(validResult.note).toBe(exact280);

    const tooLong281 = "a".repeat(281);
    await expect(
      useCase.execute({
        actor: memberActor1,
        capabilityId: "cap-2-1",
        input: { hasInterest: true, note: tooLong281 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  test("maintains voter identity isolation across multiple volunteers (T028)", async () => {
    const repo = setupRepo();
    const useCase = new ToggleCapabilityVote(repo);

    await useCase.execute({
      actor: memberActor1,
      capabilityId: "cap-2-1",
      input: { hasInterest: true, note: "User 1 note" },
    });

    const result2 = await useCase.execute({
      actor: memberActor2,
      capabilityId: "cap-2-1",
      input: { hasInterest: true, note: "User 2 note" },
    });

    expect(result2.newTotalInterestCount).toBe(2);

    const fb1 = await repo.getUserFeedback("cap-2-1", "u-member-1");
    const fb2 = await repo.getUserFeedback("cap-2-1", "u-member-2");

    expect(fb1?.note).toBe("User 1 note");
    expect(fb2?.note).toBe("User 2 note");
  });

  test("throws NotFoundError when capability does not exist", async () => {
    const repo = setupRepo();
    const useCase = new ToggleCapabilityVote(repo);

    await expect(
      useCase.execute({
        actor: memberActor1,
        capabilityId: "cap-nonexistent",
        input: { hasInterest: true },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
