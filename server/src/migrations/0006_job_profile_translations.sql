-- Cached English translation of a Job Profile's free-text fields, generated
-- on demand via the Anthropic API (server/src/anthropic.ts) and re-used
-- until explicitly re-triggered — see routes/profiles.ts's /:id/translation
-- and /:id/translate. One row per profile; content_json holds the whole
-- translated shape (job_title, rank, division, function, location,
-- compensation, benefits, bonuses, responsibilities[], requirements[],
-- okrs[], competencies[]) as a single JSON blob, since it's read-only
-- derived output, never queried or filtered field-by-field.
--
-- Job Descriptions have no translation table of their own — a JD's role
-- content is always sourced live from its linked profile (see
-- routes/jobDescriptions.ts), so its English view reuses this same cache.
--
-- source_updated_at snapshots job_profiles.updated_at as of translation time,
-- so the UI can tell when a translation is stale relative to later edits.

CREATE TABLE IF NOT EXISTS job_profile_translations (
  job_profile_id TEXT PRIMARY KEY REFERENCES job_profiles(id) ON DELETE CASCADE,
  content_json TEXT NOT NULL,
  source_updated_at TEXT NOT NULL,
  translated_at TEXT NOT NULL DEFAULT (datetime('now')),
  translated_by TEXT REFERENCES users(id)
);
