-- Full-time postings use the fixed company benefits boilerplate (see
-- JD_COPY.benefits / COPY.benefits); part-time postings have no standard
-- benefits package, so HR types their own for that posting instead.
ALTER TABLE job_descriptions ADD COLUMN employment_type TEXT NOT NULL DEFAULT 'full_time'
  CHECK (employment_type IN ('full_time', 'part_time'));
ALTER TABLE job_descriptions ADD COLUMN custom_benefits TEXT;
