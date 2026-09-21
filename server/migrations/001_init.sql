-- Initial schema for the Personal Portfolio & Skill Gap Tracker.
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS).
--
-- Every table carries user_id even though the app is currently single-user
-- (DEFAULT_USER_ID) so multi-user support can be added later without a
-- schema change.

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  created_at TEXT NOT NULL
);

-- Case-insensitive uniqueness per user, matching the app's skill-pool dedup.
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_user_name
  ON skills (user_id, lower(name));

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  start_month TEXT,
  start_year TEXT,
  end_month TEXT,
  end_year TEXT,
  is_ongoing BOOLEAN NOT NULL DEFAULT false,
  context TEXT NOT NULL,
  my_role TEXT,
  raw_notes TEXT,
  tech_used TEXT NOT NULL DEFAULT '[]',
  outcome TEXT,
  link TEXT,
  generated_description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

CREATE TABLE IF NOT EXISTS project_skills (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  depth TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_skills_project ON project_skills(project_id);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  company TEXT,
  application_status TEXT NOT NULL DEFAULT 'Not Applied',
  applied_date TEXT,
  resume_used TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_roles_user ON roles(user_id);

CREATE TABLE IF NOT EXISTS role_required_skills (
  id SERIAL PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_role_required_skills_role ON role_required_skills(role_id);
