-- Field-level audit detail: which field changed, and its old/new value.
-- Nullable, since older rows (and lifecycle events like "created" that don't
-- map to a single field) leave these blank — `action` still carries the
-- coarse event type for those.
ALTER TABLE audit_log ADD COLUMN field_name TEXT;
ALTER TABLE audit_log ADD COLUMN old_value TEXT;
ALTER TABLE audit_log ADD COLUMN new_value TEXT;
