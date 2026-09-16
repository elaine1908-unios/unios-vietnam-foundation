-- Self-service AL/OT/BT requests. One shared `requests` table carries the
-- workflow (status, approver, decision) common to all three types; each
-- type's own fields live in its own detail table keyed by request_id, same
-- normalized-columns style as the rest of this schema (no JSON blobs).
ALTER TABLE employees ADD COLUMN annual_leave_entitlement_days REAL NOT NULL DEFAULT 12;

CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  -- "AL-2026-0001" — set only on submit (see routes/requests.ts), so a
  -- draft that's never submitted never consumes a sequence number.
  request_code TEXT,
  type TEXT NOT NULL CHECK (type IN ('AL','OT','BT')),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  -- Snapshot of the requester's report_to_employee_id at submit time, not a
  -- live lookup — so a later manager change doesn't rewrite who actually
  -- approved (or should have approved) a past request.
  approver_id TEXT REFERENCES employees(id),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','rejected',
                       'needs_changes','cancellation_requested','cancelled')),
  submitted_at TEXT,
  decided_by TEXT REFERENCES users(id),
  decided_at TEXT,
  decision_comment TEXT,
  cancellation_reason TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_requests_code ON requests(request_code) WHERE request_code IS NOT NULL;
CREATE INDEX idx_requests_employee ON requests(employee_id);
CREATE INDEX idx_requests_approver ON requests(approver_id);
CREATE INDEX idx_requests_status ON requests(status);

CREATE TABLE al_details (
  request_id TEXT PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  reason TEXT,
  start_date TEXT NOT NULL,
  return_to_work_date TEXT NOT NULL,
  duration TEXT NOT NULL,
  days_requested REAL NOT NULL
);

CREATE TABLE ot_details (
  request_id TEXT PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
  ot_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  total_hours REAL NOT NULL,
  reason TEXT NOT NULL,
  project_department TEXT,
  location TEXT NOT NULL
);

CREATE TABLE bt_details (
  request_id TEXT PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  purpose TEXT NOT NULL,
  departure_at TEXT NOT NULL,
  return_at TEXT NOT NULL,
  days_requested REAL NOT NULL,
  project_client TEXT,
  transportation_required INTEGER NOT NULL DEFAULT 0,
  hotel_required INTEGER NOT NULL DEFAULT 0,
  advance_payment_required INTEGER NOT NULL DEFAULT 0,
  advance_amount REAL,
  advance_currency TEXT,
  advance_notes TEXT,
  additional_notes TEXT
);
