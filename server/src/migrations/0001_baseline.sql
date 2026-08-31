-- Baseline schema. A Job Profile is one record per position/role (e.g. "Senior
-- Site Engineer") — not per named employee — matching how Unios's existing
-- Performance Profile documents are structured: responsibilities, essential
-- requirements, OKRs, competencies and C&B policy are defined at the role
-- level, and every employee holding that role is measured against it.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  -- team_lead: can create/edit/archive job profiles and manage users.
  -- team_member: read-only — browse, view, download the watermarked PDF.
  -- Whoever signs in first (via Microsoft SSO) is bootstrapped as team_lead;
  -- every account after that starts as team_member until a team_lead
  -- promotes them (see routes/users.ts).
  role TEXT NOT NULL CHECK (role IN ('team_lead','team_member')) DEFAULT 'team_member',
  -- "Deleting" a user deactivates them rather than removing the row — job
  -- profiles and audit entries reference created_by/updated_by/changed_by,
  -- and a hard delete would break "who did this" on historical records.
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_profiles (
  id TEXT PRIMARY KEY,
  job_title TEXT NOT NULL,
  rank TEXT,
  team_department TEXT,
  location TEXT,
  -- Business-meaning "last updated" date shown on the printed profile
  -- (editable by the team lead), distinct from the system updated_at below.
  last_updated TEXT,
  compensation TEXT,
  benefits TEXT,
  bonuses TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profile_responsibilities (
  id TEXT PRIMARY KEY,
  job_profile_id TEXT NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  main_function TEXT NOT NULL,
  responsibilities TEXT NOT NULL,
  success_criteria TEXT
);

CREATE TABLE IF NOT EXISTS profile_requirements (
  id TEXT PRIMARY KEY,
  job_profile_id TEXT NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  requirement TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_okrs (
  id TEXT PRIMARY KEY,
  job_profile_id TEXT NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  objective TEXT NOT NULL,
  key_results TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_competencies (
  id TEXT PRIMARY KEY,
  job_profile_id TEXT NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  skill TEXT NOT NULL,
  level TEXT CHECK (level IN ('Basic','Intermediate','Advanced','Expert')),
  requirement TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  changed_by TEXT REFERENCES users(id),
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Every watermarked PDF download is logged — who pulled a copy of a locked
-- profile, and when. The point of the watermark is traceability; this is
-- what makes it actually traceable rather than just cosmetic.
CREATE TABLE IF NOT EXISTS pdf_downloads (
  id TEXT PRIMARY KEY,
  job_profile_id TEXT NOT NULL REFERENCES job_profiles(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  downloaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_job_profiles_title ON job_profiles (job_title);
CREATE INDEX IF NOT EXISTS idx_job_profiles_archived ON job_profiles (is_archived);
CREATE INDEX IF NOT EXISTS idx_responsibilities_profile ON profile_responsibilities (job_profile_id);
CREATE INDEX IF NOT EXISTS idx_requirements_profile ON profile_requirements (job_profile_id);
CREATE INDEX IF NOT EXISTS idx_okrs_profile ON profile_okrs (job_profile_id);
CREATE INDEX IF NOT EXISTS idx_competencies_profile ON profile_competencies (job_profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pdf_downloads_profile ON pdf_downloads (job_profile_id);
