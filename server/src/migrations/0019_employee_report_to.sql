-- Who this employee reports to — a link to another employee row, not free
-- text (same "dropdown, not free text" reasoning as career_map_role_id in
-- 0015_employee_career_map_link.sql), so a manager is an addressable person
-- in the system rather than a typed name that can drift out of sync or be
-- misspelled.
ALTER TABLE employees ADD COLUMN report_to_employee_id TEXT REFERENCES employees(id);
CREATE INDEX IF NOT EXISTS idx_employees_report_to ON employees (report_to_employee_id);
