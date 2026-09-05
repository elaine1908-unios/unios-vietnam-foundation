-- Department, Position, and Rank are now set only by picking a Career Map
-- role (dropdown, not free text) — same traceability-link pattern as
-- job_profiles.career_map_role_id (see 0003_link_profile_to_career_map.sql):
-- the employee keeps its own snapshotted department/position/rank text so a
-- later rename on the Career Map doesn't retroactively change historical
-- records, with career_map_role_id kept only to detect that drift.
ALTER TABLE employees ADD COLUMN rank TEXT;
ALTER TABLE employees ADD COLUMN career_map_role_id TEXT REFERENCES career_map_roles(id);
