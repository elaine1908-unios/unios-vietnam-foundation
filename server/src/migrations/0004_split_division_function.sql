-- Splits the single team_department field into two: division and function —
-- matching the Career Map's own terminology (the auto-fill on profile
-- creation already pulls exactly these two values from a Career Map role).

ALTER TABLE job_profiles ADD COLUMN division TEXT;
ALTER TABLE job_profiles ADD COLUMN function TEXT;

-- Backfill from the old combined field: it was either "Division — Function"
-- (auto-filled from a Career Map role) or a single free-text value (typed by
-- hand, e.g. "Site Support") — the latter becomes division with no function.
UPDATE job_profiles
SET
  division = CASE
    WHEN instr(team_department, ' — ') > 0 THEN substr(team_department, 1, instr(team_department, ' — ') - 1)
    ELSE team_department
  END,
  function = CASE
    WHEN instr(team_department, ' — ') > 0 THEN substr(team_department, instr(team_department, ' — ') + 3)
    ELSE NULL
  END
WHERE team_department IS NOT NULL;

ALTER TABLE job_profiles DROP COLUMN team_department;

CREATE INDEX IF NOT EXISTS idx_job_profiles_division ON job_profiles (division);
CREATE INDEX IF NOT EXISTS idx_job_profiles_function ON job_profiles (function);
