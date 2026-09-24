-- Tracks which admin/BOD user has already dismissed the "this Business
-- Trip needs hotel/transportation arranged" login reminder for which
-- request — per (request_id, user_id), not global, so each admin gets
-- reminded once independently (if Admin A is out, Admin B still sees it).
-- See GET /requests/bt-reminders and POST /requests/bt-reminders/ack.
CREATE TABLE bt_reminder_acks (
  request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  acknowledged_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (request_id, user_id)
);
