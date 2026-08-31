-- Links a Job Profile to the Career Map role it was created from. Nullable:
-- a profile created via the "Other (type manually)" fallback has no link.
--
-- Deliberately NOT a live mirror — job_title/rank/team_department on
-- job_profiles stay exactly as saved even if the linked career_map_roles row
-- is later renamed. This column is for traceability ("what role does this
-- profile trace back to, and does that role still exist / is it archived"),
-- not for keeping the profile's own fields in sync.
ALTER TABLE job_profiles ADD COLUMN career_map_role_id TEXT REFERENCES career_map_roles(id);

CREATE INDEX IF NOT EXISTS idx_job_profiles_career_map_role ON job_profiles (career_map_role_id);
