-- Formal role-based access control: four access levels (team_member,
-- team_lead, head_of_department, owner) replace the old two-value `role`
-- column. `role` is left in place unused rather than dropped — SQLite can't
-- cheaply change a CHECK constraint's allowed values in place, and there's
-- no benefit to a risky table rebuild just to remove a dead column.
ALTER TABLE users ADD COLUMN access_level TEXT NOT NULL DEFAULT 'team_member';

-- Forced on account creation and on an Owner-issued password reset — the
-- holder must replace a password someone else chose before doing anything
-- else. Not set on first-run setup (see routes/auth.ts POST /setup), since
-- that person chose their own password.
ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;

-- Backfill from the old role/title columns: the account already flagged
-- "Owner" (a cosmetic title added before this migration) becomes a real
-- access_level of 'owner'; other team_leads become 'team_lead'.
UPDATE users SET access_level = CASE
  WHEN role = 'team_lead' AND title = 'Owner' THEN 'owner'
  WHEN role = 'team_lead' THEN 'team_lead'
  ELSE 'team_member'
END;
