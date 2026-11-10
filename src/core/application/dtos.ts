import type { z } from "zod";
import type {
  FunctionalTrack,
  MilestoneStatus,
  PhaseStatus,
  PriorityTier,
} from "../domain/roadmap";
import type { User, UserRole } from "../domain/user";
import type {
  roadmapFilterSchema,
  toggleVoteSchema,
  updateMilestoneStatusSchema,
} from "./schemas";

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/** Strip the password hash at the boundary; never `delete` it at call sites. */
export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Roadmap DTOs
// ---------------------------------------------------------------------------

export type UpdateMilestoneStatusInput = z.infer<
  typeof updateMilestoneStatusSchema
>;

export type ToggleVoteInput = z.infer<typeof toggleVoteSchema>;

export type RoadmapFilterInput = z.infer<typeof roadmapFilterSchema>;

export interface RoadmapCapabilityDTO {
  id: string;
  milestoneId: string;
  title: string;
  targetPersona: string;
  functionalTrack: FunctionalTrack;
  priorityTier: PriorityTier;
  acceptanceCriteria: string;
  isCompleted: boolean;
  sortOrder: number;
  interestCount: number;
  userHasVoted: boolean;
  userNote: string | null;
}

export interface RoadmapPrerequisiteDTO {
  prerequisiteMilestoneId: string;
  isBlocking: boolean;
  prerequisiteTitle: string;
  isSatisfied: boolean;
}

export interface RoadmapMilestoneDTO {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  sortOrder: number;
  targetCompletionDate: string | null;
  releaseNotes: string | null;
  capabilities: RoadmapCapabilityDTO[];
  prerequisites: RoadmapPrerequisiteDTO[];
}

export interface RoadmapPhaseDTO {
  id: string;
  phaseNumber: number;
  name: string;
  description: string;
  status: PhaseStatus;
  targetHorizon: string;
  completionPercentage: number;
  milestones: RoadmapMilestoneDTO[];
}

export interface RoadmapSummaryDTO {
  totalPhases: number;
  totalMilestones: number;
  completedMilestones: number;
  totalCapabilities: number;
  completedCapabilities: number;
  overallProgress: number;
}

export interface RoadmapResponseDTO {
  phases: RoadmapPhaseDTO[];
  summary: RoadmapSummaryDTO;
}

export interface UpdateMilestoneStatusResponseDTO {
  milestone: {
    id: string;
    status: MilestoneStatus;
    releaseNotes: string | null;
    updatedAt: string;
  };
  phaseStatusUpdated: boolean;
}

export interface ToggleVoteResponseDTO {
  capabilityId: string;
  hasInterest: boolean;
  note: string | null;
  newTotalInterestCount: number;
}
