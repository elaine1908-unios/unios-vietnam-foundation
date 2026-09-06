-- Function is set only by picking a Career Map role (same as Department/
-- Position/Rank — see 0015_employee_career_map_link.sql), so it's a plain
-- snapshot column here too, not joined live: a later rename of the role's
-- function on the Career Map shouldn't retroactively rewrite history.
ALTER TABLE employees ADD COLUMN function TEXT;
