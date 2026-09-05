-- Emergency Contact Address wasn't needed either — same reasoning as
-- 0017_drop_employee_issued_at.sql.
ALTER TABLE employees DROP COLUMN contact_address;
