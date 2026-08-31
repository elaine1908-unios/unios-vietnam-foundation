-- "Now Hiring" flags a Job Description as visible on the public, unauthenticated
-- careers page (see routes/public.ts) — the only place external, logged-out
-- visitors can reach. Everything else in this app requires Microsoft sign-in.
-- Off by default: a newly created JD isn't public until a team lead opts it in.
ALTER TABLE job_descriptions ADD COLUMN is_now_hiring INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_job_descriptions_now_hiring ON job_descriptions (is_now_hiring);
