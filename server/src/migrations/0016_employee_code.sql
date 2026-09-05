-- Human-facing employee identifier, distinct from the internal UUID primary
-- key (used only for URLs/foreign keys). Format: UV-#### (UV = Unios
-- Vietnam), sequential, zero-padded to 4 digits — assigned once at
-- creation by the server (see nextEmployeeCode() in routes/employees.ts),
-- never reused or changed, never user-editable.
--
-- SQLite's ALTER TABLE ADD COLUMN can't carry a UNIQUE constraint inline,
-- hence the separate index below. NULL is fine pre-existing rows (SQL NULL
-- never collides with itself in a UNIQUE index) — every row from here on
-- always gets one.
ALTER TABLE employees ADD COLUMN employee_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_employee_code ON employees (employee_code);
