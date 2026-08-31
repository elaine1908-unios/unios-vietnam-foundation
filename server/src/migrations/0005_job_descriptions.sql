-- Job Descriptions: a public/candidate-facing recruitment document, distinct
-- from the internal Job Profile (Performance Profile). A JD is just a Job
-- Profile + a Location — its role content (job title, responsibilities minus
-- success criteria, essential requirements, competencies) is pulled LIVE from
-- the linked profile at view/render time, not copied in. Unlike the
-- Career-Map-to-Profile link (deliberately frozen), this one is meant to
-- always show the current approved responsibilities — you wouldn't want to
-- post a job listing with a stale requirement list.
--
-- The rest of a JD's content (tagline, intro paragraph, working hours,
-- benefits list) is fixed company boilerplate, not per-record data — see
-- server/src/pdf/JobDescriptionDocument.tsx and the equivalent web page.

CREATE TABLE IF NOT EXISTS job_descriptions (
  id TEXT PRIMARY KEY,
  job_profile_id TEXT NOT NULL REFERENCES job_profiles(id),
  location TEXT NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_profile ON job_descriptions (job_profile_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_archived ON job_descriptions (is_archived);
