-- Employee Master: one row per person, distinct from job_profiles (which
-- are per-ROLE, not per-employee — see 0001_baseline.sql). Holds sensitive
-- personal data (tax/bank/ID/passport numbers, addresses, health
-- insurance), so it's gated Owner-only for now (see capabilities.ts) rather
-- than shared at any of the tiers job_profiles/career_map_roles are.
--
-- Same "never hard-delete" rule as everything else: is_archived is the
-- record's status (on-going vs archived), not a deletion.
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  work_email TEXT,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  first_name TEXT NOT NULL,
  english_name TEXT,
  department TEXT,
  position TEXT,
  office_location TEXT,
  commencement_date TEXT,
  phone_no TEXT,
  personal_tax_no TEXT,
  bank_account_no TEXT,
  bank_name TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  gender TEXT,
  marital_status TEXT,
  birthday TEXT,
  id_no TEXT,
  issued_date TEXT,
  issued_at TEXT,
  passport_no TEXT,
  nationality TEXT,
  permanent_address TEXT,
  temporary_address TEXT,
  emergency_contact TEXT,
  relationship TEXT,
  contact_phone_no TEXT,
  contact_address TEXT,
  health_insurance TEXT,
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_employees_archived ON employees (is_archived);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees (department);
