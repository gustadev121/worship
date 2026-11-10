export const PHASE_STATUSES = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "PENDING_PREREQUISITES",
] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

export const MILESTONE_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DEFERRED",
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const PRIORITY_TIERS = ["P1", "P2", "P3", "P4"] as const;
export type PriorityTier = (typeof PRIORITY_TIERS)[number];

export const FUNCTIONAL_TRACKS = [
  "REPERTOIRE",
  "PLANNING",
  "ROSTERING",
  "REHEARSAL",
  "STAGE",
] as const;
export type FunctionalTrack = (typeof FUNCTIONAL_TRACKS)[number];

export interface RoadmapPhase {
  id: string;
  phaseNumber: number;
  name: string;
  description: string;
  status: PhaseStatus;
  targetHorizon: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  sortOrder: number;
  targetCompletionDate: string | null;
  releaseNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CapabilityItem {
  id: string;
  milestoneId: string;
  title: string;
  targetPersona: string;
  functionalTrack: FunctionalTrack;
  priorityTier: PriorityTier;
  acceptanceCriteria: string;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PhaseDependency {
  id: string;
  dependentMilestoneId: string;
  prerequisiteMilestoneId: string;
  isBlocking: boolean;
  createdAt: string;
}

export interface CapabilityFeedback {
  id: string;
  capabilityId: string;
  userId: string;
  hasInterest: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Computes the completion percentage (0-100) for a roadmap phase.
 * If all milestones are marked COMPLETED, returns 100.
 * If capabilities are defined, calculates the percentage of completed capabilities.
 * If no capabilities exist, calculates progress based on completed milestones.
 */
export function computePhaseProgress(
  milestones: Milestone[],
  capabilities: CapabilityItem[],
): number {
  if (milestones.length === 0) {
    return 0;
  }

  if (milestones.every((m) => m.status === "COMPLETED")) {
    return 100;
  }

  if (capabilities.length > 0) {
    const completedCapabilities = capabilities.filter(
      (c) => c.isCompleted,
    ).length;
    return Math.round((completedCapabilities / capabilities.length) * 100);
  }

  const completedMilestones = milestones.filter(
    (m) => m.status === "COMPLETED",
  ).length;
  return Math.round((completedMilestones / milestones.length) * 100);
}

/**
 * Evaluates whether a milestone can be marked COMPLETED given its upstream blocking prerequisites.
 * Returns { allowed: true, unmetPrerequisiteIds: [] } if all blocking prerequisites are COMPLETED.
 */
export function canMilestoneComplete(
  milestoneId: string,
  dependencies: PhaseDependency[],
  milestonesById: Map<string, Milestone>,
): { allowed: boolean; unmetPrerequisiteIds: string[] } {
  const unmetPrerequisiteIds: string[] = [];

  for (const dep of dependencies) {
    if (dep.dependentMilestoneId === milestoneId && dep.isBlocking) {
      const prerequisite = milestonesById.get(dep.prerequisiteMilestoneId);
      if (prerequisite?.status !== "COMPLETED") {
        if (!unmetPrerequisiteIds.includes(dep.prerequisiteMilestoneId)) {
          unmetPrerequisiteIds.push(dep.prerequisiteMilestoneId);
        }
      }
    }
  }

  return {
    allowed: unmetPrerequisiteIds.length === 0,
    unmetPrerequisiteIds,
  };
}

/**
 * Checks for directed dependency cycles using depth-first search (DFS with 3-color cycle detection).
 * Returns true if a cycle exists, false if the graph is a directed acyclic graph (DAG).
 */
export function detectDependencyCycles(
  dependencies: PhaseDependency[],
): boolean {
  const adj = new Map<string, string[]>();

  for (const dep of dependencies) {
    const from = dep.dependentMilestoneId;
    const to = dep.prerequisiteMilestoneId;
    if (!adj.has(from)) adj.set(from, []);
    if (!adj.has(to)) adj.set(to, []);
    adj.get(from)?.push(to);
  }

  // 0 = unvisited, 1 = visiting (in active recursion stack), 2 = fully visited
  const state = new Map<string, number>();

  function hasCycle(node: string): boolean {
    state.set(node, 1);

    const neighbors = adj.get(node) ?? [];
    for (const next of neighbors) {
      const nextState = state.get(next) ?? 0;
      if (nextState === 1) {
        return true;
      }
      if (nextState === 0) {
        if (hasCycle(next)) {
          return true;
        }
      }
    }

    state.set(node, 2);
    return false;
  }

  for (const node of adj.keys()) {
    if ((state.get(node) ?? 0) === 0) {
      if (hasCycle(node)) {
        return true;
      }
    }
  }

  return false;
}
