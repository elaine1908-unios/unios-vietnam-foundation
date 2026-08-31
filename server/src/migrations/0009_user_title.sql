-- Optional display title (e.g. "Owner"), purely cosmetic — shown instead of
-- the Team Lead/Team Member role label where set. Doesn't affect permissions;
-- those are still governed entirely by the `role` column.
ALTER TABLE users ADD COLUMN title TEXT;
