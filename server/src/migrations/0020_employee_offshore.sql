-- Whether this employee is an off-shore hire — a plain tick, not a lifecycle
-- state like is_archived (no dedicated endpoints, just set/edited directly
-- like any other field).
ALTER TABLE employees ADD COLUMN is_offshore INTEGER NOT NULL DEFAULT 0;
