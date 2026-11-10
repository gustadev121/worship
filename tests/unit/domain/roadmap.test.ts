import { describe, expect, it } from "bun:test";
import {
  roadmapFilterSchema,
  toggleVoteSchema,
  updateMilestoneStatusSchema,
} from "../../../src/core/application/schemas";
import {
  type CapabilityItem,
  canMilestoneComplete,
  computePhaseProgress,
  detectDependencyCycles,
  type Milestone,
  type PhaseDependency,
} from "../../../src/core/domain/roadmap";

describe("Roadmap Domain: computePhaseProgress", () => {
  const makeMilestone = (
    id: string,
    status: Milestone["status"],
  ): Milestone => ({
    id,
    phaseId: "phase-1",
    title: `Milestone ${id}`,
    description: "Test description",
    status,
    sortOrder: 1,
    targetCompletionDate: null,
    releaseNotes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  const makeCapability = (
    id: string,
    milestoneId: string,
    isCompleted: boolean,
  ): CapabilityItem => ({
    id,
    milestoneId,
    title: `Cap ${id}`,
    targetPersona: "Worship Leader",
    functionalTrack: "REPERTOIRE",
    priorityTier: "P1",
    acceptanceCriteria: "Test criteria",
    isCompleted,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  it("returns 0 when milestones list is empty", () => {
    expect(computePhaseProgress([], [])).toBe(0);
  });

  it("returns 100 when all milestones are COMPLETED", () => {
    const milestones = [
      makeMilestone("m1", "COMPLETED"),
      makeMilestone("m2", "COMPLETED"),
    ];
    const capabilities = [
      makeCapability("c1", "m1", false),
      makeCapability("c2", "m2", true),
    ];
    expect(computePhaseProgress(milestones, capabilities)).toBe(100);
  });

  it("calculates progress percentage based on capabilities when capabilities exist", () => {
    const milestones = [
      makeMilestone("m1", "IN_PROGRESS"),
      makeMilestone("m2", "NOT_STARTED"),
    ];
    const capabilities = [
      makeCapability("c1", "m1", true),
      makeCapability("c2", "m1", false),
      makeCapability("c3", "m2", false),
      makeCapability("c4", "m2", false),
    ];
    // 1 of 4 completed = 25%
    expect(computePhaseProgress(milestones, capabilities)).toBe(25);
  });

  it("rounds capability progress properly (e.g. 2 of 3 = 67%)", () => {
    const milestones = [makeMilestone("m1", "IN_PROGRESS")];
    const capabilities = [
      makeCapability("c1", "m1", true),
      makeCapability("c2", "m1", true),
      makeCapability("c3", "m1", false),
    ];
    expect(computePhaseProgress(milestones, capabilities)).toBe(67);
  });

  it("calculates progress from milestones when no capabilities are provided", () => {
    const milestones = [
      makeMilestone("m1", "COMPLETED"),
      makeMilestone("m2", "IN_PROGRESS"),
    ];
    // 1 of 2 milestones = 50%
    expect(computePhaseProgress(milestones, [])).toBe(50);
  });
});

describe("Roadmap Domain: canMilestoneComplete", () => {
  const milestones: Milestone[] = [
    {
      id: "m1",
      phaseId: "phase-1",
      title: "M1",
      description: "",
      status: "COMPLETED",
      sortOrder: 1,
      targetCompletionDate: null,
      releaseNotes: null,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "m2",
      phaseId: "phase-1",
      title: "M2",
      description: "",
      status: "IN_PROGRESS",
      sortOrder: 2,
      targetCompletionDate: null,
      releaseNotes: null,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "m3",
      phaseId: "phase-1",
      title: "M3",
      description: "",
      status: "NOT_STARTED",
      sortOrder: 3,
      targetCompletionDate: null,
      releaseNotes: null,
      createdAt: "",
      updatedAt: "",
    },
  ];

  const milestonesById = new Map<string, Milestone>(
    milestones.map((m) => [m.id, m]),
  );

  it("allows completion when milestone has no dependencies", () => {
    const res = canMilestoneComplete("m2", [], milestonesById);
    expect(res.allowed).toBe(true);
    expect(res.unmetPrerequisiteIds).toEqual([]);
  });

  it("ignores non-blocking dependencies", () => {
    const deps: PhaseDependency[] = [
      {
        id: "d1",
        dependentMilestoneId: "m2",
        prerequisiteMilestoneId: "m3",
        isBlocking: false,
        createdAt: "",
      },
    ];
    const res = canMilestoneComplete("m2", deps, milestonesById);
    expect(res.allowed).toBe(true);
    expect(res.unmetPrerequisiteIds).toEqual([]);
  });

  it("allows completion when blocking prerequisite is COMPLETED", () => {
    const deps: PhaseDependency[] = [
      {
        id: "d1",
        dependentMilestoneId: "m2",
        prerequisiteMilestoneId: "m1",
        isBlocking: true,
        createdAt: "",
      },
    ];
    const res = canMilestoneComplete("m2", deps, milestonesById);
    expect(res.allowed).toBe(true);
    expect(res.unmetPrerequisiteIds).toEqual([]);
  });

  it("blocks completion when blocking prerequisite is not completed", () => {
    const deps: PhaseDependency[] = [
      {
        id: "d1",
        dependentMilestoneId: "m3",
        prerequisiteMilestoneId: "m2", // m2 is IN_PROGRESS
        isBlocking: true,
        createdAt: "",
      },
    ];
    const res = canMilestoneComplete("m3", deps, milestonesById);
    expect(res.allowed).toBe(false);
    expect(res.unmetPrerequisiteIds).toEqual(["m2"]);
  });

  it("blocks completion when prerequisite milestone does not exist in map", () => {
    const deps: PhaseDependency[] = [
      {
        id: "d1",
        dependentMilestoneId: "m3",
        prerequisiteMilestoneId: "unknown-id",
        isBlocking: true,
        createdAt: "",
      },
    ];
    const res = canMilestoneComplete("m3", deps, milestonesById);
    expect(res.allowed).toBe(false);
    expect(res.unmetPrerequisiteIds).toEqual(["unknown-id"]);
  });

  it("returns all unmet prerequisites without duplicates", () => {
    const deps: PhaseDependency[] = [
      {
        id: "d1",
        dependentMilestoneId: "m3",
        prerequisiteMilestoneId: "m2",
        isBlocking: true,
        createdAt: "",
      },
      {
        id: "d2",
        dependentMilestoneId: "m3",
        prerequisiteMilestoneId: "m2",
        isBlocking: true,
        createdAt: "",
      },
      {
        id: "d3",
        dependentMilestoneId: "m3",
        prerequisiteMilestoneId: "unknown-id",
        isBlocking: true,
        createdAt: "",
      },
    ];
    const res = canMilestoneComplete("m3", deps, milestonesById);
    expect(res.allowed).toBe(false);
    expect(res.unmetPrerequisiteIds).toEqual(["m2", "unknown-id"]);
  });
});

describe("Roadmap Domain: detectDependencyCycles", () => {
  it("returns false for an empty dependency list", () => {
    expect(detectDependencyCycles([])).toBe(false);
  });

  it("returns false for a linear DAG", () => {
    const deps: PhaseDependency[] = [
      {
        id: "1",
        dependentMilestoneId: "m2",
        prerequisiteMilestoneId: "m1",
        isBlocking: true,
        createdAt: "",
      },
      {
        id: "2",
        dependentMilestoneId: "m3",
        prerequisiteMilestoneId: "m2",
        isBlocking: true,
        createdAt: "",
      },
    ];
    expect(detectDependencyCycles(deps)).toBe(false);
  });

  it("returns false for a diamond DAG", () => {
    const deps: PhaseDependency[] = [
      {
        id: "1",
        dependentMilestoneId: "m2",
        prerequisiteMilestoneId: "m1",
        isBlocking: true,
        createdAt: "",
      },
      {
        id: "2",
        dependentMilestoneId: "m3",
        prerequisiteMilestoneId: "m1",
        isBlocking: true,
        createdAt: "",
      },
      {
        id: "3",
        dependentMilestoneId: "m4",
        prerequisiteMilestoneId: "m2",
        isBlocking: true,
        createdAt: "",
      },
      {
        id: "4",
        dependentMilestoneId: "m4",
        prerequisiteMilestoneId: "m3",
        isBlocking: true,
        createdAt: "",
      },
    ];
    expect(detectDependencyCycles(deps)).toBe(false);
  });

  it("detects a direct cycle (A -> B -> A)", () => {
    const deps: PhaseDependency[] = [
      {
        id: "1",
        dependentMilestoneId: "m1",
        prerequisiteMilestoneId: "m2",
        isBlocking: true,
        createdAt: "",
      },
      {
        id: "2",
        dependentMilestoneId: "m2",
        prerequisiteMilestoneId: "m1",
        isBlocking: true,
        createdAt: "",
      },
    ];
    expect(detectDependencyCycles(deps)).toBe(true);
  });

  it("detects a self-dependency loop (A -> A)", () => {
    const deps: PhaseDependency[] = [
      {
        id: "1",
        dependentMilestoneId: "m1",
        prerequisiteMilestoneId: "m1",
        isBlocking: true,
        createdAt: "",
      },
    ];
    expect(detectDependencyCycles(deps)).toBe(true);
  });

  it("detects a longer cycle (A -> B -> C -> A)", () => {
    const deps: PhaseDependency[] = [
      {
        id: "1",
        dependentMilestoneId: "m1",
        prerequisiteMilestoneId: "m2",
        isBlocking: true,
        createdAt: "",
      },
      {
        id: "2",
        dependentMilestoneId: "m2",
        prerequisiteMilestoneId: "m3",
        isBlocking: true,
        createdAt: "",
      },
      {
        id: "3",
        dependentMilestoneId: "m3",
        prerequisiteMilestoneId: "m1",
        isBlocking: true,
        createdAt: "",
      },
    ];
    expect(detectDependencyCycles(deps)).toBe(true);
  });
});

describe("Roadmap Application: schemas validation", () => {
  it("validates updateMilestoneStatusSchema", () => {
    const valid = updateMilestoneStatusSchema.parse({
      status: "COMPLETED",
      releaseNotes: "Ready for production release.",
    });
    expect(valid.status).toBe("COMPLETED");
    expect(valid.releaseNotes).toBe("Ready for production release.");

    const minimal = updateMilestoneStatusSchema.parse({
      status: "IN_PROGRESS",
    });
    expect(minimal.status).toBe("IN_PROGRESS");
    expect(minimal.releaseNotes).toBeUndefined();

    expect(() =>
      updateMilestoneStatusSchema.parse({
        status: "INVALID_STATUS",
      }),
    ).toThrow();
  });

  it("validates toggleVoteSchema", () => {
    const valid = toggleVoteSchema.parse({
      hasInterest: true,
      note: "  Essential for vocalists  ",
    });
    expect(valid.hasInterest).toBe(true);
    expect(valid.note).toBe("Essential for vocalists");

    const withoutNote = toggleVoteSchema.parse({
      hasInterest: false,
    });
    expect(withoutNote.hasInterest).toBe(false);

    expect(() =>
      toggleVoteSchema.parse({
        hasInterest: true,
        note: "a".repeat(281),
      }),
    ).toThrow();
  });

  it("validates roadmapFilterSchema", () => {
    const parsed = roadmapFilterSchema.parse({
      track: "REPERTOIRE",
      priority: "P1",
      phase: "2",
    });
    expect(parsed.track).toBe("REPERTOIRE");
    expect(parsed.priority).toBe("P1");
    expect(parsed.phase).toBe(2);

    const empty = roadmapFilterSchema.parse({});
    expect(empty.track).toBeUndefined();
    expect(empty.priority).toBeUndefined();
    expect(empty.phase).toBeUndefined();

    expect(() =>
      roadmapFilterSchema.parse({
        phase: 5,
      }),
    ).toThrow();
  });
});
