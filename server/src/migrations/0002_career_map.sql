-- Master Career Map (Unios Vietnam) — the pre-approved list of role/job
-- titles a Job Profile's "Job title" field can be created from, so profiles
-- stay tied to an actual position on the org's career ladder instead of
-- free text drifting from it over time. Seeded once from "Career Map_Draft.pdf"
-- (a division x function x rank matrix); editable afterwards via
-- /api/career-map (Team Lead only) — new rows just insert into this table,
-- no new migration required for routine additions.
--
-- rank is one of the four Career Rank Definition tiers from the source
-- document: core, specialists, leadership, divisional (see CAREER_RANK_LABELS
-- in server/src/types.ts for the full display label of each).
--
-- function is nullable: each division has exactly one "Head of X" role that
-- sits at the divisional-leadership tier for the division as a whole, not
-- under any one function.

CREATE TABLE IF NOT EXISTS career_map_roles (
  id TEXT PRIMARY KEY,
  division TEXT NOT NULL,
  function TEXT,
  rank TEXT NOT NULL CHECK (rank IN ('core','specialists','leadership','divisional')),
  role_name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_career_map_division ON career_map_roles (division);
CREATE INDEX IF NOT EXISTS idx_career_map_archived ON career_map_roles (is_archived);

-- Business Development
INSERT INTO career_map_roles (id, division, function, rank, role_name, sort_order) VALUES
  (lower(hex(randomblob(16))), 'Business Development', 'Business Development', 'specialists', 'Business Development Associate', 10),
  (lower(hex(randomblob(16))), 'Business Development', 'Business Development', 'leadership', 'Business Development Team Lead', 20),
  (lower(hex(randomblob(16))), 'Business Development', 'Sales', 'specialists', 'Account Associate', 30),
  (lower(hex(randomblob(16))), 'Business Development', 'Sales', 'leadership', 'Commercial Sales Team Lead', 40),
  (lower(hex(randomblob(16))), 'Business Development', 'Sales', 'leadership', 'Residential Sales Team Lead', 50),
  (lower(hex(randomblob(16))), 'Business Development', 'Customer Success', 'core', 'Account Coordinator', 60),
  (lower(hex(randomblob(16))), 'Business Development', 'Customer Success', 'specialists', 'Account Representative', 70),
  (lower(hex(randomblob(16))), 'Business Development', 'Customer Success', 'leadership', 'Customer Success Team Lead', 80),
  (lower(hex(randomblob(16))), 'Business Development', 'Customer Success', 'leadership', 'Account Executive', 90),
  (lower(hex(randomblob(16))), 'Business Development', NULL, 'divisional', 'Head of Sales', 100);

-- Operations
INSERT INTO career_map_roles (id, division, function, rank, role_name, sort_order) VALUES
  (lower(hex(randomblob(16))), 'Operations', 'Operations', 'core', 'Operations Coordinator', 110),
  (lower(hex(randomblob(16))), 'Operations', 'Operations', 'specialists', 'Operations Specialist', 120),
  (lower(hex(randomblob(16))), 'Operations', 'Operations', 'leadership', 'Operations Team Lead', 130),
  (lower(hex(randomblob(16))), 'Operations', 'IT', 'core', 'IT Help Desk Officer', 140),
  (lower(hex(randomblob(16))), 'Operations', 'IT', 'specialists', 'IT Technician / Specialist', 150),
  (lower(hex(randomblob(16))), 'Operations', 'IT', 'leadership', 'IT Team Lead', 160),
  (lower(hex(randomblob(16))), 'Operations', 'Supply Chain', 'core', 'Supply Chain Coordinator', 170),
  (lower(hex(randomblob(16))), 'Operations', 'Supply Chain', 'core', 'Custom Coordinator', 180),
  (lower(hex(randomblob(16))), 'Operations', 'Supply Chain', 'core', 'Sourcing Coordinator', 190),
  (lower(hex(randomblob(16))), 'Operations', 'Supply Chain', 'specialists', 'Supply Chain Specialist', 200),
  (lower(hex(randomblob(16))), 'Operations', 'Supply Chain', 'leadership', 'Supply Chain Team Lead', 210),
  (lower(hex(randomblob(16))), 'Operations', 'Distribution', 'core', 'Distribution Coordinator', 220),
  (lower(hex(randomblob(16))), 'Operations', 'Distribution', 'specialists', 'Distribution Specialist', 230),
  (lower(hex(randomblob(16))), 'Operations', 'Distribution', 'leadership', 'Warehouse Manager', 240),
  (lower(hex(randomblob(16))), 'Operations', NULL, 'divisional', 'Head of Operations', 250);

-- Engineering
INSERT INTO career_map_roles (id, division, function, rank, role_name, sort_order) VALUES
  (lower(hex(randomblob(16))), 'Engineering', 'Product Development', 'leadership', 'Product Manager', 260),
  (lower(hex(randomblob(16))), 'Engineering', 'Lighting Design', 'specialists', 'Lighting Designer', 270),
  (lower(hex(randomblob(16))), 'Engineering', 'Lighting Design', 'leadership', 'Senior Lighting Designer', 280),
  (lower(hex(randomblob(16))), 'Engineering', 'Technical Services', 'core', 'Junior Technical Engineer', 290),
  (lower(hex(randomblob(16))), 'Engineering', 'Technical Services', 'specialists', 'Technical Engineer', 300),
  (lower(hex(randomblob(16))), 'Engineering', 'Technical Services', 'leadership', 'Commercial Lead Engineer', 310),
  (lower(hex(randomblob(16))), 'Engineering', 'Technical Services', 'leadership', 'Residential Lead Engineer', 320),
  (lower(hex(randomblob(16))), 'Engineering', 'Technical Services', 'leadership', 'Senior Technical Engineer', 330),
  (lower(hex(randomblob(16))), 'Engineering', 'Site Services', 'specialists', 'Site Engineer', 340),
  (lower(hex(randomblob(16))), 'Engineering', 'Site Services', 'leadership', 'Project Manager', 350),
  (lower(hex(randomblob(16))), 'Engineering', 'Site Services', 'leadership', 'Senior Site Engineer', 360),
  (lower(hex(randomblob(16))), 'Engineering', NULL, 'divisional', 'Head of Engineering', 370);

-- Finance
INSERT INTO career_map_roles (id, division, function, rank, role_name, sort_order) VALUES
  (lower(hex(randomblob(16))), 'Finance', 'AR&AP', 'core', 'AR&AP Accountant', 380),
  (lower(hex(randomblob(16))), 'Finance', 'AR&AP', 'specialists', 'AR&AP Senior Accountant', 390),
  (lower(hex(randomblob(16))), 'Finance', 'AR&AP', 'leadership', 'AR&AP Team Lead', 400),
  (lower(hex(randomblob(16))), 'Finance', 'Management / FP&A', 'core', 'Financial Associate', 410),
  (lower(hex(randomblob(16))), 'Finance', 'Management / FP&A', 'specialists', 'Financial Specialist', 420),
  (lower(hex(randomblob(16))), 'Finance', 'Management / FP&A', 'leadership', 'Management Accountant', 430),
  (lower(hex(randomblob(16))), 'Finance', 'Tax & Compliance', 'core', 'T&C Associate', 440),
  (lower(hex(randomblob(16))), 'Finance', 'Tax & Compliance', 'specialists', 'Tax Accountant', 450),
  (lower(hex(randomblob(16))), 'Finance', 'Tax & Compliance', 'specialists', 'Compliance Specialist', 460),
  (lower(hex(randomblob(16))), 'Finance', 'Tax & Compliance', 'leadership', 'T&C Lead Accountant', 470),
  (lower(hex(randomblob(16))), 'Finance', NULL, 'divisional', 'Head of Finance', 480);

-- People & Culture
INSERT INTO career_map_roles (id, division, function, rank, role_name, sort_order) VALUES
  (lower(hex(randomblob(16))), 'People & Culture', 'Talent Acquisition', 'core', 'Talent Acquisition Assistant', 490),
  (lower(hex(randomblob(16))), 'People & Culture', 'Talent Acquisition', 'specialists', 'Talent Acquisition Specialist', 500),
  (lower(hex(randomblob(16))), 'People & Culture', 'Talent Acquisition', 'leadership', 'Talent Acquisition Team Lead', 510),
  (lower(hex(randomblob(16))), 'People & Culture', 'Learning & Development', 'core', 'Learning & Development Assistant', 520),
  (lower(hex(randomblob(16))), 'People & Culture', 'Learning & Development', 'specialists', 'Learning & Development Specialist', 530),
  (lower(hex(randomblob(16))), 'People & Culture', 'Learning & Development', 'leadership', 'Learning & Development Team Lead', 540),
  (lower(hex(randomblob(16))), 'People & Culture', 'People Operations', 'core', 'People Operations Assistant', 550),
  (lower(hex(randomblob(16))), 'People & Culture', 'People Operations', 'specialists', 'People Operations Specialist', 560),
  (lower(hex(randomblob(16))), 'People & Culture', 'People Operations', 'leadership', 'People Operations Team Lead', 570),
  (lower(hex(randomblob(16))), 'People & Culture', NULL, 'divisional', 'Head of People & Culture', 580);

-- Brand & Marketing
INSERT INTO career_map_roles (id, division, function, rank, role_name, sort_order) VALUES
  (lower(hex(randomblob(16))), 'Brand & Marketing', 'Brand', 'specialists', 'Brand Designer', 590),
  (lower(hex(randomblob(16))), 'Brand & Marketing', 'Brand', 'leadership', 'Brand Designer Team Lead', 600),
  (lower(hex(randomblob(16))), 'Brand & Marketing', 'Digital Products', 'specialists', 'Front-end Developer', 610),
  (lower(hex(randomblob(16))), 'Brand & Marketing', 'Digital Products', 'specialists', 'Back-end Developer', 620),
  (lower(hex(randomblob(16))), 'Brand & Marketing', 'Digital Products', 'specialists', 'UI Designer', 630),
  (lower(hex(randomblob(16))), 'Brand & Marketing', 'Digital Products', 'leadership', 'Digital Product Team Lead', 640),
  (lower(hex(randomblob(16))), 'Brand & Marketing', 'Marketing', 'core', 'Marketing Coordinator', 650),
  (lower(hex(randomblob(16))), 'Brand & Marketing', 'Marketing', 'core', 'Event Coordinator', 660),
  (lower(hex(randomblob(16))), 'Brand & Marketing', 'Marketing', 'specialists', 'Marketing Specialist', 670),
  (lower(hex(randomblob(16))), 'Brand & Marketing', 'Marketing', 'specialists', 'Showroom & Event Specialist', 680),
  (lower(hex(randomblob(16))), 'Brand & Marketing', 'Marketing', 'leadership', 'Marketing Manager', 690),
  (lower(hex(randomblob(16))), 'Brand & Marketing', NULL, 'divisional', 'Head of Brand & Marketing', 700);
