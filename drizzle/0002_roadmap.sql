CREATE TABLE IF NOT EXISTS roadmap_phases (
  id TEXT PRIMARY KEY,
  phase_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  target_horizon TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roadmap_milestones (
  id TEXT PRIMARY KEY,
  phase_id TEXT NOT NULL REFERENCES roadmap_phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  target_completion_date TEXT,
  release_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roadmap_capabilities (
  id TEXT PRIMARY KEY,
  milestone_id TEXT NOT NULL REFERENCES roadmap_milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_persona TEXT NOT NULL,
  functional_track TEXT NOT NULL,
  priority_tier TEXT NOT NULL,
  acceptance_criteria TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roadmap_dependencies (
  id TEXT PRIMARY KEY,
  dependent_milestone_id TEXT NOT NULL REFERENCES roadmap_milestones(id) ON DELETE CASCADE,
  prerequisite_milestone_id TEXT NOT NULL REFERENCES roadmap_milestones(id) ON DELETE CASCADE,
  is_blocking INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(dependent_milestone_id, prerequisite_milestone_id)
);

CREATE TABLE IF NOT EXISTS roadmap_capability_feedback (
  id TEXT PRIMARY KEY,
  capability_id TEXT NOT NULL REFERENCES roadmap_capabilities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  has_interest INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(capability_id, user_id)
);
